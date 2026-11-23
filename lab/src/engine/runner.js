// Page side of the program runner: starts the worker, guards against programs that hang, and replays frames.

const STUCK_MS = 8000; // a program that computes this long without the clock moving is stopped

export class Runner {
  constructor({ pyBase, onPython }) {
    this.pyBase = pyBase;
    this.onPython = onPython ?? (() => {});
    this.worker = null;
    this.pending = null;
    this.pyReady = false;
  }

  spawn() {
    this.worker = new Worker(new URL('./runner.worker.js', import.meta.url), { type: 'module' });
    this.worker.onmessage = (ev) => this.onMessage(ev.data);
    this.worker.onerror = (e) => this.finish({ fatal: String(e.message || e) });
  }

  preloadPython() {
    if (this.pyReady) return;
    if (!this.worker) this.spawn();
    this.worker.postMessage({ type: 'preload', pyBase: this.pyBase });
  }

  onMessage(m) {
    if (m.type === 'py') {
      if (m.state === 'ready') this.pyReady = true;
      this.onPython(m.state);
    } else if (m.type === 'started') {
      clearTimeout(this.watchdog);
      this.watchdog = setTimeout(() => this.kill('stuck'), STUCK_MS);
    } else if (m.type === 'done') {
      this.finish(m);
    }
  }

  finish(res) {
    clearTimeout(this.watchdog);
    const p = this.pending;
    this.pending = null;
    if (p) p(res);
  }

  /** Stops whatever runs: the worker is thrown away (a new one is made for the next run). */
  kill(reason = 'stopped') {
    clearTimeout(this.watchdog);
    if (this.worker) this.worker.terminate();
    this.worker = null;
    this.pyReady = false;
    this.finish({ killed: reason });
  }

  /** @returns {Promise<{runs?: object[], show?: number, killed?: string, fatal?: string}>} */
  run({ lang, code, fields, show = 0, timeLimit }) {
    if (this.pending) this.kill('stopped');
    if (!this.worker) this.spawn();
    return new Promise((resolve) => {
      this.pending = resolve;
      this.worker.postMessage({ type: 'run', lang, code, fields, show, timeLimit, pyBase: this.pyBase });
    });
  }
}

const lerp = (a, b, k) => a + (b - a) * k;
function lerpAngle(a, b, k) {
  let d = b - a;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return a + d * k;
}

/** Plays recorded frames back in real time (times a speed factor). */
export class Player {
  constructor() { this.raf = 0; this.playing = false; }

  play(frames, events, { speed = 1, onFrame, onEvent, onEnd }) {
    this.stop();
    this.playing = true;
    const end = frames[frames.length - 1].t;
    let i = 0, ev = 0, simT = 0, last = performance.now();
    const tick = (now) => {
      if (!this.playing) return;
      simT += (Math.min(100, now - last) / 1000) * this.speed;
      last = now;
      while (i + 1 < frames.length && frames[i + 1].t <= simT) i++;
      while (ev < events.length && events[ev].t <= simT) onEvent(events[ev++]);
      const a = frames[i], b = frames[Math.min(i + 1, frames.length - 1)];
      const k = b.t > a.t ? Math.min(1, Math.max(0, (simT - a.t) / (b.t - a.t))) : 0;
      onFrame({
        ...a,
        x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), a: lerpAngle(a.a, b.a, k),
        o: a.o.map((p, j) => [lerp(p[0], b.o[j][0], k), lerp(p[1], b.o[j][1], k)]),
        t: simT,
      });
      if (simT >= end) {
        while (ev < events.length) onEvent(events[ev++]);
        onFrame({ ...frames[frames.length - 1] });
        this.playing = false;
        onEnd();
        return;
      }
      this.raf = requestAnimationFrame(tick);
    };
    this.speed = speed;
    this.raf = requestAnimationFrame(tick);
  }

  setSpeed(s) { this.speed = s; }

  stop() {
    this.playing = false;
    cancelAnimationFrame(this.raf);
  }
}

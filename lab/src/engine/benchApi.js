// The SPIKE Essential API a student's program calls (Blocks or Python). Same idea as robotApi.js: every call runs
// the bench synchronously, frames are recorded and replayed afterwards.

import { Bench, BENCH_DT, IMAGES, MATRIX_COLORS, pos360 } from './bench.js';
import { TimeUp, FRAME_EVERY } from './robotApi.js';

const PORTS = ['A', 'B'];

export class BenchProgram {
  constructor(setup, opts = {}) {
    this.world = new Bench(setup);
    this.timeLimit = opts.timeLimit ?? 60;
    this.frames = [this.frame()];
    this.events = [];
    this.block = null;
    this.steps = 0;
    this.calls = 0;
  }

  frame() {
    const s = this.world.snapshot();
    s.b = this.block;
    return s;
  }

  checkTime() {
    if (this.timeUp || this.world.t >= this.timeLimit - 1e-9) { this.timeUp = true; throw new TimeUp(); }
  }

  tick() {
    this.checkTime();
    this.world.step(BENCH_DT);
    this.steps++;
    if (this.steps % FRAME_EVERY === 0) this.frames.push(this.frame());
  }

  pushFrame() {
    const f = this.frame();
    const last = this.frames[this.frames.length - 1];
    if (!last || last.t !== f.t || last.b !== f.b) this.frames.push(f);
  }

  // ---------- helpers ----------

  motor(port) {
    port = String(port).toUpperCase();
    const m = this.world.motors[port];
    if (!m) {
      const what = this.world.setup.ports[port]?.type;
      throw new Error(PORTS.includes(port)
        ? `Port ${port}: ${what ?? 'nothing'} is connected, not a motor`
        : `Port ${port} does not exist (SPIKE Essential has ports A and B)`);
    }
    return m;
  }

  needs(type) {
    const p = this.world.port(type);
    if (!p) throw new Error(`No ${type === 'matrix' ? 'light matrix' : 'color sensor'} is connected`);
    return p;
  }

  // ---------- motors ----------

  setSpeed(port, percent) {
    this.motor(port).speed = Math.max(5, Math.min(100, Math.abs(Number(percent) || 0)));
  }

  /** Run `amount` rotations / degrees / seconds; a negative amount turns anticlockwise. Waits until done. */
  runFor(port, amount, unit = 'rotations') {
    const m = this.motor(port);
    amount = Number(amount) || 0;
    if (unit === 'seconds') {
      m.mode = 'run';
      m.dir = Math.sign(amount) || 1;
      const t0 = this.world.t;
      while (this.world.t - t0 < Math.abs(amount) - 1e-9) this.tick();
      m.mode = 'idle';
    } else {
      const deg = unit === 'degrees' ? amount : amount * 360;
      m.mode = 'to';
      m.target = m.angle + deg;
      while (m.mode === 'to') this.tick();
    }
    this.pushFrame();
  }

  start(port, direction = 1) {
    const m = this.motor(port);
    m.mode = 'run';
    m.dir = Number(direction) < 0 ? -1 : 1;
    this.tick();
  }

  stopMotor(port) {
    this.motor(port).mode = 'idle';
    this.tick();
  }

  /** Go to a position 0…359 by the shortest way (negative numbers work too: −45 is 315). */
  goTo(port, position) {
    const m = this.motor(port);
    const want = pos360(Number(position) || 0);
    let d = want - pos360(m.angle);
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    m.mode = 'to';
    m.target = m.angle + d;
    while (m.mode === 'to') this.tick();
    this.pushFrame();
  }

  position(port) { this.tick(); return this.world.position(String(port).toUpperCase()); }

  // ---------- light matrix ----------

  color3(c) { return MATRIX_COLORS.includes(c) ? c : 'white'; }

  showImage(name, color = 'white') {
    this.needs('matrix');
    const img = IMAGES[name] ?? IMAGES.dot;
    const c = this.color3(color);
    this.world.setMatrix([...img].map((ch) => (ch === '1' ? c : null)));
    this.tick();
  }

  fill(color) {
    this.needs('matrix');
    this.world.setMatrix(Array(9).fill(color === 'off' ? null : this.color3(color)));
    this.tick();
  }

  /** x and y are 1…3, (1,1) is top left. */
  pixel(x, y, color) {
    this.needs('matrix');
    x = Math.round(Number(x)); y = Math.round(Number(y));
    if (!(x >= 1 && x <= 3 && y >= 1 && y <= 3)) throw new Error('Pixel x and y must be 1, 2 or 3');
    const cells = this.world.matrix.slice();
    cells[(y - 1) * 3 + (x - 1)] = color === 'off' ? null : this.color3(color);
    this.world.setMatrix(cells);
    this.tick();
  }

  clear() { this.fill('off'); }

  // ---------- sensor, hub ----------

  color() { this.needs('color'); this.tick(); return this.world.sensorColor(); }
  timer() { this.tick(); return Math.round(this.world.t * 100) / 100; }

  wait(sec) {
    sec = Math.max(0, Number(sec) || 0);
    const t0 = this.world.t;
    while (this.world.t - t0 < sec - 1e-9) this.tick();
    this.pushFrame();
  }

  hubLight(color) {
    this.world.hubLight = color === 'off' ? null : color;
    this.tick();
  }

  say(text) { this.events.push({ t: this.world.t, kind: 'say', text: String(text) }); }
  beep() { this.events.push({ t: this.world.t, kind: 'beep' }); }

  at(blockId) {
    this.block = blockId;
    if (++this.calls > 2_000_000) { this.timeUp = true; throw new TimeUp(); }
  }
}

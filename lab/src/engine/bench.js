// A LEGO SPIKE Essential style workbench: a small hub with ports A and B and one model built on it.
// Devices: small motor, 3×3 colour light matrix, colour sensor. Models give the motor something to turn
// (a carousel on a gear, a barrier, a sorting flap) and give the sensor things to see (tickets, bricks).
// Like world.js it has no graphics, so the same code runs in the worker, on the page and in Node.

export const BENCH_DT = 0.01;
export const MOTOR_MAX = 1000; // deg/s at 100 % (a small SPIKE motor is about 185 rpm ≈ 1100 °/s)
export const MATRIX_COLORS = ['red', 'orange', 'yellow', 'green', 'azure', 'blue', 'violet', 'white'];
export const SENSOR_COLORS = ['red', 'yellow', 'green', 'blue', 'white', 'black'];

/** 3×3 pictures: 1 = lit. */
export const IMAGES = {
  smile: '101000111',
  sad: '101000010',
  heart: '101111010',
  check: '001101010',
  cross: '101010101',
  arrow_up: '010111010',
  square: '111101111',
  dot: '000010000',
  full: '111111111',
};

const norm180 = (a) => ((((a + 180) % 360) + 360) % 360) - 180;
export const pos360 = (a) => ((Math.round(a) % 360) + 360) % 360;

/**
 * setup = {
 *   ports: { A: { type: 'motor', model: 'carousel' | 'barrier' | 'flap' | 'wheel', gear: 1 }, B: { type: 'matrix' | 'color' } },
 *   items: [{ color, at, dur }]   // what comes in front of the colour sensor and when
 * }
 */
export class Bench {
  constructor(setup) {
    this.setup = setup;
    this.t = 0;
    this.motors = {};
    for (const [port, d] of Object.entries(setup.ports)) {
      if (d.type === 'motor') this.motors[port] = { angle: d.start ?? 0, vel: 0, speed: 50, mode: 'idle', target: 0, dir: 1, travel: 0 };
    }
    this.matrix = Array(9).fill(null);
    this.matrixLog = [{ t: 0, m: this.matrixString() }];
    this.hubLight = null;
    this.items = (setup.items ?? []).map((it) => ({ ...it, opened: null, bin: null, wrongOpen: false }));
  }

  port(type) {
    return Object.keys(this.setup.ports).find((p) => this.setup.ports[p].type === type);
  }

  matrixString() {
    return this.matrix.map((c) => (c ? c[0] + (c === 'azure' ? 'z' : '') : '.')).join('');
  }

  setMatrix(cells) {
    this.matrix = cells;
    const m = this.matrixString();
    if (this.matrixLog[this.matrixLog.length - 1].m !== m) this.matrixLog.push({ t: this.t, m, cells: [...cells] });
  }

  /** The item in front of the colour sensor now, or null. */
  activeItem() {
    return this.items.find((it) => this.t >= it.at && this.t < it.at + it.dur) ?? null;
  }

  sensorColor() {
    return this.activeItem()?.color ?? 'none';
  }

  /** Motor position 0…359 like the SPIKE app shows it. */
  position(port) { return pos360(this.motors[port].angle); }

  step(dt = BENCH_DT) {
    for (const [port, m] of Object.entries(this.motors)) {
      const v = (m.speed / 100) * MOTOR_MAX;
      if (m.mode === 'run') {
        m.vel = v * m.dir;
      } else if (m.mode === 'to') {
        const left = m.target - m.angle;
        if (Math.abs(left) <= v * dt) { m.vel = 0; m.angle = m.target; m.mode = 'idle'; } else m.vel = Math.sign(left) * v;
      } else m.vel = 0;
      // Models with end stops: a barrier arm only moves between 0 and 90 degrees.
      const d = this.setup.ports[port];
      m.angle += m.vel * dt;
      m.travel += Math.abs(m.vel * dt);
      if (d.limits) {
        const [lo, hi] = d.limits;
        // The arm hits its stop: the motor stalls and the command ends, as on a real hub.
        if (m.angle < lo || m.angle > hi) {
          m.angle = Math.max(lo, Math.min(hi, m.angle));
          if (m.mode === 'to') m.mode = 'idle';
        }
      }
    }
    this.t += dt;
    this.trackItems();
  }

  trackItems() {
    const it = this.activeItem();
    const A = this.motors.A;
    const model = this.setup.ports.A?.model;
    if (it && model === 'barrier' && A) {
      const open = A.angle >= 70;
      if (open && it.opened == null) it.opened = this.t;
      if (open && it.color !== 'green') it.wrongOpen = true;
    }
    // Sorting: a brick drops through the flap when its time at the sensor ends.
    if (model === 'flap' && A) {
      for (const b of this.items) {
        if (b.bin == null && this.t >= b.at + b.dur) {
          const p = norm180(A.angle);
          b.bin = p <= -25 ? 'left' : p >= 25 ? 'right' : 'jam';
          b.dropT = this.t;
        }
      }
    }
  }

  snapshot() {
    const s = { t: Math.round(this.t * 1000) / 1000, m: this.matrix.slice(), hl: this.hubLight, sc: this.sensorColor() };
    for (const [p, m] of Object.entries(this.motors)) s[p] = m.angle;
    const ai = this.activeItem();
    s.ai = ai ? this.items.indexOf(ai) : -1;
    if (this.setup.ports.A?.model === 'flap') s.bins = this.items.map((b) => b.bin);
    return s;
  }

  final() {
    const motors = {};
    for (const [p, m] of Object.entries(this.motors)) motors[p] = { angle: m.angle, position: this.position(p), travel: m.travel };
    return {
      t: this.t,
      motors,
      matrix: this.matrix.slice(),
      matrixLog: this.matrixLog,
      hubLight: this.hubLight,
      items: this.items.map(({ color, at, dur, opened, bin, wrongOpen }) => ({ color, at, dur, opened, bin, wrongOpen })),
    };
  }
}

export { norm180 };

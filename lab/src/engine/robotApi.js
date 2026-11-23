// The robot API a student's program calls, from Blocks (JavaScript) or Python. Every call runs the world
// synchronously and records frames, so a program of any length runs in a blink and is then replayed in real time.
//
// Moving commands advance the clock until they finish; reading a sensor advances it by one tick, as on a real
// hub where a loop that reads a sensor takes a few milliseconds. That way `while True: if distance() < 10: ...`
// moves through time and a program that never ends still hits the time limit.

import { World, DT, ROBOT, COLORS, rad, clamp } from './world.js';

export class TimeUp extends Error {
  constructor() { super('TIME_UP'); this.name = 'TimeUp'; }
}

export const FRAME_EVERY = 3; // physics steps per recorded frame (≈33 fps)

export class RobotProgram {
  /** @param {object} field  @param {{timeLimit?: number}} opts */
  constructor(field, opts = {}) {
    this.world = new World(field);
    this.timeLimit = opts.timeLimit ?? 60;
    this.speed = 50; // % of max for forward/turn commands
    this.frames = [this.frame()];
    this.events = []; // { t, kind: 'say'|'beep'|'light'|'error', text }
    this.block = null; // id of the block running now (for highlighting)
    this.steps = 0;
    this.calls = 0;
  }

  frame() {
    const s = this.world.snapshot();
    s.b = this.block;
    s.c = this.world.color();
    s.d = this.world.distance();
    return s;
  }

  checkTime() {
    if (this.timeUp || this.world.t >= this.timeLimit - 1e-9) { this.timeUp = true; throw new TimeUp(); }
  }

  tick() {
    this.checkTime();
    this.world.step(DT);
    this.steps++;
    if (this.steps % FRAME_EVERY === 0) this.frames.push(this.frame());
  }

  /** Runs the clock until `done()` or `maxTime` seconds pass. */
  runUntil(done, maxTime = Infinity) {
    const t0 = this.world.t;
    while (!done() && this.world.t - t0 < maxTime - 1e-9) this.tick();
  }

  pushFrame() {
    const f = this.frame();
    const last = this.frames[this.frames.length - 1];
    if (!last || last.t !== f.t || last.b !== f.b) this.frames.push(f);
  }

  // ---------------- movement ----------------

  /** Drive straight `cm` (negative = backwards), then stop. */
  forward(cm) {
    cm = Number(cm) || 0;
    const r = this.world.robot;
    const v = (this.speed / 100) * ROBOT.maxSpeed * Math.sign(cm);
    const start = (r.encL + r.encR) / 2;
    const goal = Math.abs(cm);
    this.world.setWheels(v, v);
    // Whole steps, then one short step so the robot stops exactly at the distance.
    for (;;) {
      const left = goal - Math.abs((r.encL + r.encR) / 2 - start);
      if (left <= 1e-6) break;
      if (left < Math.abs(v) * DT) {
        this.checkTime();
        this.world.step(left / Math.abs(v));
        break;
      }
      this.tick();
    }
    this.world.setWheels(0, 0);
    this.pushFrame();
  }

  backward(cm) { this.forward(-(Number(cm) || 0)); }

  /** Turn on the spot `deg` degrees clockwise (negative = anticlockwise), using the gyro. */
  turn(degrees) {
    degrees = Number(degrees) || 0;
    const r = this.world.robot;
    const v = (this.speed / 100) * ROBOT.maxSpeed * 0.6; // turning is gentler, like a real driving base
    const dir = Math.sign(degrees); // +1 clockwise = right
    const target = r.a - rad(degrees);
    const w = (2 * v) / ROBOT.track; // rad/s
    this.world.setWheels(v * dir, -v * dir);
    for (;;) {
      const left = (r.a - target) * dir; // radians still to turn
      if (left <= 1e-9) break;
      if (left < w * DT) {
        this.checkTime();
        this.world.step(left / w);
        break;
      }
      this.tick();
    }
    r.a = target; // the gyro stops exactly on target
    this.world.setWheels(0, 0);
    this.pushFrame();
  }

  turnRight(d) { this.turn(Number(d) || 0); }
  turnLeft(d) { this.turn(-(Number(d) || 0)); }

  setSpeed(p) { this.speed = clamp(Number(p) || 0, 5, 100); }

  /** Start both motors at a power each (−100…100) and carry on with the program. */
  drive(left, right) {
    const k = ROBOT.maxSpeed / 100;
    this.world.setWheels(clamp(Number(left) || 0, -100, 100) * k, clamp(Number(right) || 0, -100, 100) * k);
    this.tick();
  }

  stop() {
    this.world.setWheels(0, 0);
    this.tick();
  }

  wait(sec) {
    sec = Math.max(0, Number(sec) || 0);
    this.runUntil(() => false, sec);
    this.pushFrame();
  }

  // ---------------- sensors ----------------

  color() { this.tick(); return this.world.color(); }
  reflection() { this.tick(); return this.world.reflection(); }
  distance() { this.tick(); return this.world.distance(); }
  heading() { this.tick(); return this.world.heading(); }
  timer() { this.tick(); return Math.round(this.world.t * 100) / 100; }

  // ---------------- hub ----------------

  say(text) { this.events.push({ t: this.world.t, kind: 'say', text: String(text) }); }
  beep() { this.events.push({ t: this.world.t, kind: 'beep' }); }
  light(color) {
    this.world.robot.light = COLORS[color] ? color : null;
    this.events.push({ t: this.world.t, kind: 'light', text: String(color) });
    this.pushFrame();
  }

  /** Called by Blocks before every statement: remember which block runs, for highlighting. */
  at(blockId) {
    this.block = blockId;
    if (++this.calls > 2_000_000) { this.timeUp = true; throw new TimeUp(); }
  }
}

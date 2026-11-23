// A small 2D world for lessons: a table seen from above, a two-wheeled robot, walls, pushable game pieces,
// a coloured floor (zones and lines) and the robot's sensors. No graphics and no DOM: the same code runs the
// program in a worker, drives the robot live from the keyboard and is tested in Node.
//
// Units: centimetres, seconds. The table is `size[0]` × `size[1]` cm with x to the right and y up.
// Inside, angles are radians counter-clockwise from +x; in lesson data and the robot API they are degrees.

export const DT = 0.01; // physics step, s

/** Floor colours the colour sensor can tell apart: name → [rgb for drawing, reflected light %]. */
export const COLORS = {
  white: ['#f4f6f8', 100],
  black: ['#1d2128', 6],
  red: ['#e5484d', 42],
  green: ['#30a46c', 34],
  blue: ['#3e63dd', 28],
  yellow: ['#f5c542', 86],
};
const DEFAULT_FLOOR = 'white';

/** The lesson robot: like a small FLL driving base. */
export const ROBOT = {
  length: 18, // along the heading
  width: 15,
  track: 12, // distance between the wheels
  radius: 10, // for collisions
  maxSpeed: 40, // cm/s at 100 %
  sensorAhead: 7, // colour sensor, cm ahead of the centre, looking down
  eyeAhead: 9, // distance sensor at the front edge
  eyeRange: 200,
};

const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function pointInFloorItem(it, x, y) {
  if (it.type === 'rect') return x >= it.x && x <= it.x + it.w && y >= it.y && y <= it.y + it.h;
  if (it.type === 'circle') return (x - it.x) ** 2 + (y - it.y) ** 2 <= it.r * it.r;
  if (it.type === 'line') {
    const hw = (it.width ?? 2) / 2;
    const p = it.pts;
    for (let i = 0; i + 1 < p.length; i++) {
      if (distToSegment(x, y, p[i][0], p[i][1], p[i + 1][0], p[i + 1][1]) <= hw) return true;
    }
    if (it.closed && p.length > 2) {
      const a = p[p.length - 1], b = p[0];
      if (distToSegment(x, y, a[0], a[1], b[0], b[1]) <= hw) return true;
    }
    return false;
  }
  return false;
}

export function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const l2 = dx * dx + dy * dy;
  let t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0;
  t = clamp(t, 0, 1);
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** Push a circle out of an axis-aligned box. Returns the push or null. */
function circleOutOfBox(cx, cy, r, b) {
  const nx = clamp(cx, b.x, b.x + b.w), ny = clamp(cy, b.y, b.y + b.h);
  let dx = cx - nx, dy = cy - ny;
  const d2 = dx * dx + dy * dy;
  if (d2 >= r * r) return null;
  if (d2 > 1e-9) {
    const d = Math.sqrt(d2);
    return [(dx / d) * (r - d), (dy / d) * (r - d)];
  }
  // Centre inside the box: leave by the nearest side.
  const opts = [
    [b.x - r - cx, 0], [b.x + b.w + r - cx, 0], [0, b.y - r - cy], [0, b.y + b.h + r - cy],
  ];
  opts.sort((p, q) => Math.abs(p[0] + p[1]) - Math.abs(q[0] + q[1]));
  return opts[0];
}

/** Ray from (x,y) along angle a against a box; distance or Infinity. */
function rayBox(x, y, dx, dy, b) {
  let t0 = -Infinity, t1 = Infinity;
  for (const [o, d, lo, hi] of [[x, dx, b.x, b.x + b.w], [y, dy, b.y, b.y + b.h]]) {
    if (Math.abs(d) < 1e-12) { if (o < lo || o > hi) return Infinity; continue; }
    let a = (lo - o) / d, c = (hi - o) / d;
    if (a > c) [a, c] = [c, a];
    t0 = Math.max(t0, a); t1 = Math.min(t1, c);
  }
  if (t1 < Math.max(t0, 0)) return Infinity;
  return t0 >= 0 ? t0 : 0;
}

function rayCircle(x, y, dx, dy, cx, cy, r) {
  const ox = x - cx, oy = y - cy;
  const b = ox * dx + oy * dy;
  const c = ox * ox + oy * oy - r * r;
  const disc = b * b - c;
  if (disc < 0) return Infinity;
  const t = -b - Math.sqrt(disc);
  return t >= 0 ? t : (c <= 0 ? 0 : Infinity);
}

export class World {
  /** @param {object} field lesson field: { size, floor, walls, objects, robot: {x, y, dir} } */
  constructor(field) {
    this.field = field;
    this.W = field.size[0];
    this.H = field.size[1];
    this.floor = field.floor ?? [];
    this.walls = (field.walls ?? []).map((w) => ({ ...w }));
    // The table border is four walls 5 cm thick just outside the table.
    const T = 5;
    this.border = [
      { x: -T, y: -T, w: this.W + 2 * T, h: T },
      { x: -T, y: this.H, w: this.W + 2 * T, h: T },
      { x: -T, y: 0, w: T, h: this.H },
      { x: this.W, y: 0, w: T, h: this.H },
    ];
    this.objects = (field.objects ?? []).map((o) => ({ r: 4, ...o, x0: o.x, y0: o.y }));
    const r = field.robot ?? { x: 20, y: 20, dir: 0 };
    this.robot = {
      x: r.x, y: r.y, a: rad(r.dir ?? 0), a0: rad(r.dir ?? 0),
      vl: 0, vr: 0, // wheel speeds, cm/s
      encL: 0, encR: 0, // wheel travel, cm
      light: null,
    };
    this.t = 0;
    this.stats = { wallHits: 0, touching: false, path: 0, zonesVisited: new Map() };
  }

  // ---------- floor and sensors ----------

  /** Floor colour name under a point: the last floor item drawn on top wins. */
  floorAt(x, y) {
    for (let i = this.floor.length - 1; i >= 0; i--) {
      const it = this.floor[i];
      if (it.color && pointInFloorItem(it, x, y)) return it.color;
    }
    return DEFAULT_FLOOR;
  }

  sensorPoint() {
    const { x, y, a } = this.robot;
    return [x + Math.cos(a) * ROBOT.sensorAhead, y + Math.sin(a) * ROBOT.sensorAhead];
  }

  /** Colour name the colour sensor sees. */
  color() {
    const [sx, sy] = this.sensorPoint();
    return this.floorAt(sx, sy);
  }

  /** Reflected light 0–100, averaged over the sensor's 1.2 cm spot so it changes smoothly across a line edge. */
  reflection() {
    const [sx, sy] = this.sensorPoint();
    const R = 1.2;
    let sum = 0, n = 0;
    for (let i = -2; i <= 2; i++) {
      for (let j = -2; j <= 2; j++) {
        const ox = (i / 2) * R, oy = (j / 2) * R;
        if (ox * ox + oy * oy > R * R + 1e-9) continue;
        sum += COLORS[this.floorAt(sx + ox, sy + oy)][1];
        n++;
      }
    }
    return Math.round(sum / n);
  }

  /** Distance from the front of the robot to the nearest wall or game piece, cm (ROBOT.eyeRange if nothing). */
  distance() {
    const { x, y, a } = this.robot;
    const dx = Math.cos(a), dy = Math.sin(a);
    const ox = x + dx * ROBOT.eyeAhead, oy = y + dy * ROBOT.eyeAhead;
    let best = ROBOT.eyeRange;
    for (const b of this.border) best = Math.min(best, rayBox(ox, oy, dx, dy, b));
    for (const b of this.walls) best = Math.min(best, rayBox(ox, oy, dx, dy, b));
    for (const o of this.objects) best = Math.min(best, rayCircle(ox, oy, dx, dy, o.x, o.y, o.r));
    return Math.round(Math.min(best, ROBOT.eyeRange) * 10) / 10;
  }

  /** Heading like a gyro: degrees turned clockwise since the start. */
  heading() {
    return Math.round(deg(this.robot.a0 - this.robot.a) * 10) / 10;
  }

  // ---------- physics ----------

  setWheels(vl, vr) {
    this.robot.vl = vl;
    this.robot.vr = vr;
  }

  step(dt = DT) {
    const r = this.robot;
    const v = (r.vl + r.vr) / 2;
    const w = (r.vr - r.vl) / ROBOT.track;
    // Exact arc integration so long turns stay accurate.
    const px = r.x, py = r.y;
    if (Math.abs(w) < 1e-9) {
      r.x += v * Math.cos(r.a) * dt;
      r.y += v * Math.sin(r.a) * dt;
    } else {
      const a1 = r.a + w * dt;
      r.x += (v / w) * (Math.sin(a1) - Math.sin(r.a));
      r.y -= (v / w) * (Math.cos(a1) - Math.cos(r.a));
      r.a = a1;
    }
    r.encL += r.vl * dt;
    r.encR += r.vr * dt;
    this.collide();
    this.stats.path += Math.hypot(r.x - px, r.y - py);
    this.t += dt;
    this.trackZones();
  }

  collide() {
    const r = this.robot;
    const solids = [...this.border, ...this.walls];
    let touching = false;
    for (let it = 0; it < 4; it++) {
      // Robot pushes game pieces.
      for (const o of this.objects) {
        const dx = o.x - r.x, dy = o.y - r.y;
        const d = Math.hypot(dx, dy), min = ROBOT.radius + o.r;
        if (d < min && d > 1e-9) {
          o.x += (dx / d) * (min - d);
          o.y += (dy / d) * (min - d);
        }
      }
      // Pieces push each other.
      for (let i = 0; i < this.objects.length; i++) {
        for (let j = i + 1; j < this.objects.length; j++) {
          const p = this.objects[i], q = this.objects[j];
          const dx = q.x - p.x, dy = q.y - p.y;
          const d = Math.hypot(dx, dy), min = p.r + q.r;
          if (d < min && d > 1e-9) {
            const k = (min - d) / 2;
            p.x -= (dx / d) * k; p.y -= (dy / d) * k;
            q.x += (dx / d) * k; q.y += (dy / d) * k;
          }
        }
      }
      // Pieces stop at walls; a piece stuck at a wall pushes the robot back.
      for (const o of this.objects) {
        for (const b of solids) {
          const push = circleOutOfBox(o.x, o.y, o.r, b);
          if (push) { o.x += push[0]; o.y += push[1]; }
        }
        const dx = r.x - o.x, dy = r.y - o.y;
        const d = Math.hypot(dx, dy), min = ROBOT.radius + o.r;
        if (d < min && d > 1e-9) { r.x += (dx / d) * (min - d); r.y += (dy / d) * (min - d); touching = true; }
      }
      // Robot stops at walls.
      for (const b of solids) {
        const push = circleOutOfBox(r.x, r.y, ROBOT.radius, b);
        if (push) { r.x += push[0]; r.y += push[1]; touching = true; }
      }
    }
    if (touching && !this.stats.touching) this.stats.wallHits++;
    this.stats.touching = touching;
  }

  /** Remembers when the robot's centre first entered each named floor zone. */
  trackZones() {
    for (const it of this.floor) {
      if (!it.id) continue;
      if (!this.stats.zonesVisited.has(it.id) && pointInFloorItem(it, this.robot.x, this.robot.y)) {
        this.stats.zonesVisited.set(it.id, this.t);
      }
    }
  }

  // ---------- questions lessons ask ----------

  zone(id) {
    return this.floor.find((f) => f.id === id);
  }

  /** Is a point inside the named zone? `margin` > 0 asks for it to be that far inside a rect. */
  inZone(id, x, y, margin = 0) {
    const z = this.zone(id);
    if (!z) return false;
    if (z.type === 'rect') return x >= z.x + margin && x <= z.x + z.w - margin && y >= z.y + margin && y <= z.y + z.h - margin;
    if (z.type === 'circle') return Math.hypot(x - z.x, y - z.y) <= z.r - margin;
    return pointInFloorItem(z, x, y);
  }

  robotInZone(id, margin = 0) {
    return this.inZone(id, this.robot.x, this.robot.y, margin);
  }

  objectsInZone(id) {
    return this.objects.filter((o) => this.inZone(id, o.x, o.y));
  }

  /** Snapshot for drawing. */
  snapshot() {
    const r = this.robot;
    return {
      t: Math.round(this.t * 1000) / 1000,
      x: r.x, y: r.y, a: r.a,
      vl: r.vl, vr: r.vr,
      light: r.light,
      o: this.objects.map((o) => [o.x, o.y]),
    };
  }
}

export { rad, deg, clamp };

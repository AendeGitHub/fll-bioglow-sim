// Draws the table from above on a <canvas>: mat, zones, lines, walls, game pieces, the robot and its path.

import { COLORS, ROBOT } from './world.js';

const LIGHT_RGB = { red: '#ff4d4f', green: '#3ddc84', blue: '#4c8dff', yellow: '#ffd43b', white: '#ffffff' };

export class FieldView {
  /** @param {HTMLCanvasElement} canvas  @param {object} field */
  constructor(canvas, field) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.field = field;
    this.trail = [];
    this.showRay = false;
    this.labels = (z) => z.label; // overridden by the page to translate zone labels
    this.resize();
  }

  setField(field) {
    this.field = field;
    this.trail = [];
    this.resize();
  }

  resize() {
    const c = this.canvas;
    const rect = c.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(200, rect.width), h = Math.max(150, rect.height);
    c.width = Math.round(w * dpr);
    c.height = Math.round(h * dpr);
    const [W, H] = this.field.size;
    const pad = 14;
    this.scale = Math.min((w - 2 * pad) / W, (h - 2 * pad) / H);
    this.ox = (w - W * this.scale) / 2;
    this.oy = (h - H * this.scale) / 2;
    this.dpr = dpr;
    this.cssW = w; this.cssH = h;
  }

  // table cm → css px
  px(x) { return this.ox + x * this.scale; }
  py(y) { return this.oy + (this.field.size[1] - y) * this.scale; }

  clearTrail() { this.trail = []; }

  /** @param {{x,y,a,o,light,vl,vr,c,d}} s  a frame or a world snapshot */
  draw(s) {
    const { ctx } = this;
    const k = this.scale;
    const [W, H] = this.field.size;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.cssW, this.cssH);

    // Table edge (wooden border) and the mat.
    ctx.fillStyle = '#7a5532';
    roundRect(ctx, this.px(0) - 10, this.py(H) - 10, W * k + 20, H * k + 20, 10);
    ctx.fill();
    ctx.fillStyle = COLORS.white[0];
    ctx.fillRect(this.px(0), this.py(H), W * k, H * k);

    // 10 cm grid, a little stronger every 50 cm: students can measure distances by eye.
    ctx.lineWidth = 1;
    for (let x = 10; x < W; x += 10) {
      ctx.strokeStyle = x % 50 ? 'rgba(30,40,60,0.06)' : 'rgba(30,40,60,0.14)';
      ctx.beginPath(); ctx.moveTo(this.px(x), this.py(0)); ctx.lineTo(this.px(x), this.py(H)); ctx.stroke();
    }
    for (let y = 10; y < H; y += 10) {
      ctx.strokeStyle = y % 50 ? 'rgba(30,40,60,0.06)' : 'rgba(30,40,60,0.14)';
      ctx.beginPath(); ctx.moveTo(this.px(0), this.py(y)); ctx.lineTo(this.px(W), this.py(y)); ctx.stroke();
    }

    for (const it of this.field.floor ?? []) this.drawFloorItem(it);
    for (const w of this.field.walls ?? []) {
      ctx.fillStyle = '#5b6573';
      ctx.fillRect(this.px(w.x), this.py(w.y + w.h), w.w * k, w.h * k);
      ctx.fillStyle = '#7d8898';
      ctx.fillRect(this.px(w.x) + 2, this.py(w.y + w.h) + 2, Math.max(0, w.w * k - 4), Math.max(0, w.h * k - 4));
    }

    // Path the robot drove.
    if (this.trail.length > 1) {
      ctx.strokeStyle = 'rgba(76,151,255,0.55)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(this.px(this.trail[0][0]), this.py(this.trail[0][1]));
      for (const p of this.trail) ctx.lineTo(this.px(p[0]), this.py(p[1]));
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Game pieces.
    const objs = this.field.objects ?? [];
    objs.forEach((o, i) => {
      const [x, y] = s.o?.[i] ?? [o.x, o.y];
      const r = (o.r ?? 4) * k;
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      roundRect(ctx, this.px(x) - r + 2, this.py(y) - r + 3, 2 * r, 2 * r, r * 0.35); ctx.fill();
      ctx.fillStyle = o.fill ?? '#ff8c1a';
      roundRect(ctx, this.px(x) - r, this.py(y) - r, 2 * r, 2 * r, r * 0.35); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      roundRect(ctx, this.px(x) - r * 0.6, this.py(y) - r * 0.6, r * 0.7, r * 0.5, r * 0.2); ctx.fill();
    });

    if (s) {
      if (this.trail.length === 0 || Math.hypot(this.trail[this.trail.length - 1][0] - s.x, this.trail[this.trail.length - 1][1] - s.y) > 0.8) {
        this.trail.push([s.x, s.y]);
      }
      if (this.showRay && s.d != null) this.drawRay(s);
      this.drawRobot(s);
    }
  }

  drawFloorItem(it) {
    const { ctx } = this;
    const k = this.scale;
    const col = COLORS[it.color]?.[0] ?? it.color;
    if (it.type === 'rect') {
      ctx.fillStyle = col;
      ctx.globalAlpha = it.color === 'black' ? 1 : 0.9;
      ctx.fillRect(this.px(it.x), this.py(it.y + it.h), it.w * k, it.h * k);
      ctx.globalAlpha = 1;
    } else if (it.type === 'circle') {
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(this.px(it.x), this.py(it.y), it.r * k, 0, Math.PI * 2); ctx.fill();
    } else if (it.type === 'line') {
      ctx.strokeStyle = col;
      ctx.lineWidth = (it.width ?? 2) * k;
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.beginPath();
      it.pts.forEach((p, i) => (i ? ctx.lineTo(this.px(p[0]), this.py(p[1])) : ctx.moveTo(this.px(p[0]), this.py(p[1]))));
      if (it.closed) ctx.closePath();
      ctx.stroke();
    }
    const label = this.labels(it);
    if (label) {
      const [cx, cy] = it.type === 'rect' ? [it.x + it.w / 2, it.y + it.h / 2] : it.type === 'circle' ? [it.x, it.y] : it.pts[0];
      ctx.font = `700 ${Math.max(10, Math.min(15, 4 * k))}px system-ui, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = it.color === 'yellow' || it.color === 'white' ? 'rgba(40,30,0,0.75)' : 'rgba(255,255,255,0.95)';
      ctx.fillText(label, this.px(cx), this.py(cy));
    }
  }

  drawRay(s) {
    const { ctx } = this;
    const dx = Math.cos(s.a), dy = Math.sin(s.a);
    const x0 = s.x + dx * ROBOT.eyeAhead, y0 = s.y + dy * ROBOT.eyeAhead;
    const x1 = x0 + dx * s.d, y1 = y0 + dy * s.d;
    ctx.strokeStyle = 'rgba(229,72,77,0.6)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 4]);
    ctx.beginPath(); ctx.moveTo(this.px(x0), this.py(y0)); ctx.lineTo(this.px(x1), this.py(y1)); ctx.stroke();
    ctx.setLineDash([]);
    if (s.d < ROBOT.eyeRange) {
      ctx.fillStyle = 'rgba(229,72,77,0.85)';
      ctx.beginPath(); ctx.arc(this.px(x1), this.py(y1), 3, 0, Math.PI * 2); ctx.fill();
    }
  }

  drawRobot(s) {
    const { ctx } = this;
    const k = this.scale;
    ctx.save();
    ctx.translate(this.px(s.x), this.py(s.y));
    ctx.rotate(-s.a); // y is flipped on screen
    // Now +x is the robot's front.
    const L = ROBOT.length * k, Wd = ROBOT.width * k;
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    roundRect(ctx, -L / 2 + 2, -Wd / 2 + 3, L, Wd, 4 * k * 0.4); ctx.fill();
    // Wheels
    ctx.fillStyle = '#23272f';
    const wl = 6 * k, ww = 2.4 * k, wy = (ROBOT.track / 2) * k;
    roundRect(ctx, -wl / 2 - 1.5 * k, -wy - ww / 2, wl, ww, ww / 3); ctx.fill();
    roundRect(ctx, -wl / 2 - 1.5 * k, wy - ww / 2, wl, ww, ww / 3); ctx.fill();
    // Body: white hub with yellow frame, like a SPIKE driving base
    ctx.fillStyle = '#ffd43b';
    roundRect(ctx, -L / 2, -Wd / 2 + ww * 0.55, L, Wd - ww * 1.1, 2 * k); ctx.fill();
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, -L / 2 + 2 * k, -Wd / 2 + 2.6 * k, L * 0.62, Wd - 5.2 * k, 1.6 * k); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1; ctx.stroke();
    // Hub light
    const lc = LIGHT_RGB[s.light];
    ctx.fillStyle = lc ?? '#d5dae1';
    ctx.beginPath(); ctx.arc(-L / 2 + 2 * k + L * 0.31, 0, 1.6 * k, 0, Math.PI * 2); ctx.fill();
    if (lc) {
      ctx.strokeStyle = lc; ctx.globalAlpha = 0.45; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(-L / 2 + 2 * k + L * 0.31, 0, 2.6 * k, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    // Distance sensor "eyes" at the front
    ctx.fillStyle = '#2b2f36';
    roundRect(ctx, L / 2 - 1.6 * k, -3.2 * k, 1.8 * k, 6.4 * k, 0.8 * k); ctx.fill();
    ctx.fillStyle = '#7fd1ff';
    ctx.beginPath(); ctx.arc(L / 2 - 0.6 * k, -1.6 * k, 0.8 * k, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(L / 2 - 0.6 * k, 1.6 * k, 0.8 * k, 0, Math.PI * 2); ctx.fill();
    // Colour sensor spot on the floor
    ctx.strokeStyle = '#e5484d'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc((ROBOT.sensorAhead) * k, 0, 1.2 * k, 0, Math.PI * 2); ctx.stroke();
    // Direction arrow
    ctx.fillStyle = 'rgba(30,40,60,0.7)';
    ctx.beginPath();
    ctx.moveTo(L * 0.22, 0); ctx.lineTo(L * 0.08, -1.8 * k); ctx.lineTo(L * 0.08, 1.8 * k); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}

function roundRect(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

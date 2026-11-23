// Draws the SPIKE Essential bench: the hub with ports A and B, cables, and the model (carousel on gears,
// barrier with a ticket reader, sorting flap, 3×3 light matrix).

import { norm180 } from './bench.js';

export const LIGHT = {
  red: '#ff4d4f', orange: '#ff8c1a', yellow: '#ffd43b', green: '#3ddc84', azure: '#5ad1ff',
  blue: '#4c6fff', violet: '#a66bff', white: '#ffffff', black: '#22262e',
};
const DIM = '#2a2f3a';

export class BenchView {
  constructor(canvas, setup) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.setup = setup;
    this.text = (v) => (typeof v === 'string' ? v : v?.en ?? ''); // the page swaps in its translator
    this.resize();
  }

  setField(setup) { this.setup = setup; this.targets = null; this.resize(); }
  clearTrail() {}

  resize() {
    const c = this.canvas;
    const r = c.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = Math.max(200, r.width); this.h = Math.max(150, r.height);
    c.width = Math.round(this.w * dpr); c.height = Math.round(this.h * dpr);
    this.dpr = dpr;
    // Everything is laid out on a 1000 × 640 board and scaled to fit.
    this.k = Math.min(this.w / 1000, this.h / 640);
    this.ox = (this.w - 1000 * this.k) / 2;
    this.oy = (this.h - 640 * this.k) / 2;
  }

  draw(s) {
    // Cables go under the models, so the model is drawn once to learn where its ports are, then again on top.
    if (!this.targets) { this.paint(s, null); }
    this.paint(s, this.targets);
  }

  paint(s, cables) {
    const { ctx, k } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = '#e9eef5';
    ctx.fillRect(0, 0, this.w, this.h);
    ctx.setTransform(this.dpr * k, 0, 0, this.dpr * k, this.dpr * this.ox, this.dpr * this.oy);
    // Baseplate with studs.
    ctx.fillStyle = '#c9e7c1';
    rr(ctx, 10, 10, 980, 620, 22); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (let x = 40; x < 990; x += 40) for (let y = 40; y < 630; y += 40) { ctx.beginPath(); ctx.arc(x, y, 9, 0, 7); ctx.fill(); }

    const hub = { x: 60, y: 230, w: 190, h: 180 };
    if (cables) {
      for (const [p, i] of [['A', 0], ['B', 1]]) {
        const tgt = cables[p];
        if (!tgt) continue;
        const px = hub.x + hub.w, py = hub.y + 60 + i * 70;
        ctx.strokeStyle = '#30343c'; ctx.lineWidth = 7; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(px, py);
        ctx.bezierCurveTo(px + 120, py, tgt[0] - 120, tgt[1], tgt[0], tgt[1]);
        ctx.stroke();
      }
    }

    const ports = this.setup.ports;
    const A = ports.A, B = ports.B;
    const targets = {};
    this.sensorAt = null;
    if (A?.model === 'carousel') targets.A = this.drawCarousel(s, A, B?.type === 'matrix');
    else if (A?.model === 'barrier') targets.A = this.drawBarrier(s);
    else if (A?.model === 'flap') targets.A = this.drawFlap(s);
    if (B?.type === 'matrix') targets.B = this.drawMatrix(s, A ? { x: 760, y: 170, size: 200 } : { x: 470, y: 120, size: 400 });
    if (B?.type === 'color') targets.B = this.sensorAt ?? [600, 520];
    this.targets = targets;
    this.drawHub(s, hub);
  }

  drawHub(s, { x, y, w, h }) {
    const { ctx } = this;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; rr(ctx, x + 6, y + 8, w, h, 26); ctx.fill();
    ctx.fillStyle = '#7cc142'; rr(ctx, x, y, w, h, 26); ctx.fill();
    ctx.fillStyle = '#ffffff'; rr(ctx, x + 14, y + 14, w - 28, h - 28, 18); ctx.fill();
    // Button with the status light around it
    const c = LIGHT[s.hl];
    ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, 34, 0, 7);
    ctx.fillStyle = c ?? '#dfe4ea'; ctx.fill();
    if (c) { ctx.strokeStyle = c; ctx.globalAlpha = 0.35; ctx.lineWidth = 14; ctx.stroke(); ctx.globalAlpha = 1; }
    ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, 22, 0, 7); ctx.fillStyle = '#f5f7fa'; ctx.fill();
    // Ports
    for (const [p, i] of [['A', 0], ['B', 1]]) {
      const py = y + 60 + i * 70;
      ctx.fillStyle = '#30343c'; rr(ctx, x + w - 12, py - 14, 22, 28, 5); ctx.fill();
      ctx.fillStyle = '#1f2937'; ctx.font = '800 22px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(p, x + w + 24, py - 26);
    }
    ctx.fillStyle = '#1f2937'; ctx.font = '700 18px system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('SPIKE Essential', x + w / 2, y + h + 26);
  }

  motorBox(x, y, angle, label) {
    const { ctx } = this;
    ctx.fillStyle = '#ffffff'; rr(ctx, x - 46, y - 46, 92, 92, 16); ctx.fill();
    ctx.strokeStyle = '#d0d7e2'; ctx.lineWidth = 3; ctx.stroke();
    // Axle hole with a turning marker
    ctx.save(); ctx.translate(x, y); ctx.rotate((angle * Math.PI) / 180);
    ctx.fillStyle = '#7cc142'; ctx.beginPath(); ctx.arc(0, 0, 26, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(-4, -22, 8, 44); ctx.fillRect(-22, -4, 44, 8);
    ctx.fillStyle = '#e5484d'; ctx.beginPath(); ctx.arc(0, -17, 4, 0, 7); ctx.fill();
    ctx.restore();
    if (label) {
      ctx.fillStyle = '#334155'; ctx.font = '700 17px system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(label, x, y + 68);
    }
  }

  drawCarousel(s, d, withMatrix) {
    const { ctx } = this;
    const g = d.gear ?? 1;
    const motorDeg = s.A ?? 0;
    const cx = withMatrix ? 520 : 590, cy = 320, R = 190;
    let motorAt;
    if (g > 1) {
      // Small gear on the motor turns the big gear under the carousel: the carousel turns g times slower.
      const rSmall = 46, rBig = rSmall * g;
      const mx = cx - Math.min(R, rBig) - rSmall + 4, my = cy + 150;
      gear(ctx, cx, cy, rBig, 8 * g, -motorDeg / g, '#9aa5b5');
      gear(ctx, mx, my, rSmall, 8, motorDeg + 22.5, '#5d6b82');
      ctx.fillStyle = '#334155'; ctx.font = '700 16px system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(`8 → ${8 * g}`, mx, my + rSmall + 24);
      motorAt = [mx - 70, my];
      this.motorBox(mx - 70, my, motorDeg, null);
    }
    const ca = g > 1 ? -motorDeg / g : motorDeg; // a meshing gear turns the other way
    // Disc
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.arc(cx + 6, cy + 8, R, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill();
    ctx.strokeStyle = '#ffd43b'; ctx.lineWidth = 14; ctx.stroke();
    const seats = d.seats ?? ['red', 'blue', 'green', 'yellow'];
    ctx.save(); ctx.translate(cx, cy); ctx.rotate((ca * Math.PI) / 180);
    seats.forEach((c, i) => {
      ctx.save(); ctx.rotate((i * 2 * Math.PI) / seats.length);
      ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -R + 50); ctx.stroke();
      ctx.fillStyle = LIGHT[c]; rr(ctx, -32, -R + 18, 64, 56, 12); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
    });
    ctx.fillStyle = '#7cc142'; ctx.beginPath(); ctx.arc(0, 0, 30, 0, 7); ctx.fill();
    ctx.restore();
    // Gate at the top
    ctx.fillStyle = '#0f172a';
    ctx.beginPath(); ctx.moveTo(cx, cy - R - 8); ctx.lineTo(cx - 20, cy - R - 40); ctx.lineTo(cx + 20, cy - R - 40); ctx.closePath(); ctx.fill();
    ctx.font = '800 18px system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(this.text(d.gateLabel ?? 'Gate'), cx, cy - R - 52);
    if (g === 1) {
      motorAt = [cx, cy];
    }
    // Readout
    ctx.fillStyle = 'rgba(15,23,42,0.8)'; rr(ctx, cx + R - 30, cy + R - 30, 200, 64, 12); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '700 17px system-ui, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(`A: ${((Math.round(motorDeg) % 360) + 360) % 360}°`, cx + R - 18, cy + R - 6);
    ctx.fillText(`${this.text(d.discLabel ?? 'disc')}: ${Math.round(Math.abs(g > 1 ? motorDeg / g : motorDeg))}°`, cx + R - 18, cy + R + 20);
    return motorAt;
  }

  drawBarrier(s) {
    const { ctx } = this;
    const px = 420, py = 470;
    // Road
    ctx.fillStyle = '#9aa5b5'; ctx.fillRect(300, py + 40, 680, 70);
    ctx.fillStyle = '#fff'; for (let x = 320; x < 980; x += 70) ctx.fillRect(x, py + 72, 36, 6);
    // Post and motor
    ctx.fillStyle = '#5d6b82'; rr(ctx, px - 22, py - 120, 44, 160, 10); ctx.fill();
    this.motorBox(px, py - 120, s.A ?? 0, null);
    // Arm: 0 = closed (horizontal, pointing right), 90 = open (up)
    const a = ((s.A ?? 0) * Math.PI) / 180;
    ctx.save(); ctx.translate(px, py - 120); ctx.rotate(-a);
    for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? '#ffffff' : '#e5484d'; ctx.fillRect(30 + i * 40, -10, 40, 20); }
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 2; ctx.strokeRect(30, -10, 320, 20);
    ctx.restore();
    // Ticket reader (colour sensor) and the visitor
    const sx = 820, sy = 340;
    this.sensor(sx, sy, s.sc);
    const items = this.setup.items ?? [];
    if (s.ai >= 0) {
      const it = items[s.ai];
      ctx.font = '90px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('🧍', sx + 90, py + 30);
      ctx.save(); ctx.translate(sx + 40, sy); ctx.rotate(-0.15);
      ctx.fillStyle = LIGHT[it.color]; rr(ctx, -10, -30, 54, 70, 8); ctx.fill();
      ctx.strokeStyle = '#1f2937'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.font = '700 14px system-ui'; ctx.fillText('🎟', 17, 10);
      ctx.restore();
    }
    // Queue counter
    const done = items.filter((it) => it.at + it.dur <= s.t).length;
    ctx.fillStyle = '#334155'; ctx.font = '700 18px system-ui, sans-serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillText(`🧍 ${Math.min(done + (s.ai >= 0 ? 1 : 0), items.length)} / ${items.length}`, 970, 40);
    return [px - 46, py - 120];
  }

  drawFlap(s) {
    const { ctx } = this;
    const cx = 600, sy = 140, fy = 330;
    const items = this.setup.items ?? [];
    // Chute
    ctx.fillStyle = '#cbd5e1'; rr(ctx, cx - 60, 40, 120, 200, 12); ctx.fill();
    // Brick waiting at the sensor
    if (s.ai >= 0) {
      ctx.fillStyle = LIGHT[items[s.ai].color]; rr(ctx, cx - 36, sy - 30, 72, 60, 10); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.arc(cx - 12, sy - 4, 9, 0, 7); ctx.arc(cx + 14, sy - 4, 9, 0, 7); ctx.fill();
      // Countdown bar till it drops
      const it = items[s.ai];
      const left = Math.max(0, Math.min(1, (it.at + it.dur - s.t) / it.dur));
      ctx.fillStyle = '#334155'; ctx.fillRect(cx - 50, sy + 42, 100 * left, 6);
    }
    this.sensor(cx + 120, sy, s.sc);
    // Flap on motor A
    const p = norm180(s.A ?? 0);
    ctx.save(); ctx.translate(cx, fy); ctx.rotate((p * Math.PI) / 180);
    ctx.fillStyle = '#ffd43b'; rr(ctx, -10, -110, 20, 120, 8); ctx.fill();
    ctx.restore();
    this.motorBox(cx, fy, s.A ?? 0, null);
    // Bins
    const bins = this.setup.bins ?? { left: 'red', right: 'blue' };
    const drawBin = (x, side) => {
      ctx.fillStyle = '#ffffff'; rr(ctx, x - 110, 450, 220, 150, 16); ctx.fill();
      ctx.strokeStyle = LIGHT[bins[side]] ?? '#94a3b8'; ctx.lineWidth = 8; ctx.stroke();
      const inBin = items.filter((_, i) => s.bins?.[i] === side);
      inBin.forEach((it, j) => { ctx.fillStyle = LIGHT[it.color]; rr(ctx, x - 90 + (j % 4) * 46, 560 - Math.floor(j / 4) * 36, 40, 30, 6); ctx.fill(); });
    };
    drawBin(cx - 230, 'left');
    drawBin(cx + 230, 'right');
    const jam = items.filter((_, i) => s.bins?.[i] === 'jam');
    jam.forEach((it, j) => { ctx.fillStyle = LIGHT[it.color]; rr(ctx, cx - 40 + j * 22, 560 - j * 8, 40, 30, 6); ctx.fill(); });
    if (jam.length) { ctx.font = '40px system-ui'; ctx.textAlign = 'center'; ctx.fillText('⚠️', cx, 520); }
    return [cx - 46, fy];
  }

  sensor(x, y, color) {
    const { ctx } = this;
    this.sensorAt = [x - 34, y];
    ctx.fillStyle = '#ffffff'; rr(ctx, x - 34, y - 40, 68, 80, 14); ctx.fill();
    ctx.strokeStyle = '#d0d7e2'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#1f2937'; ctx.beginPath(); ctx.arc(x, y, 18, 0, 7); ctx.fill();
    const c = LIGHT[color];
    ctx.fillStyle = c ?? '#475569'; ctx.beginPath(); ctx.arc(x, y, 10, 0, 7); ctx.fill();
  }

  drawMatrix(s, { x, y, size }) {
    const { ctx } = this;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; rr(ctx, x + 8, y + 10, size, size, size * 0.1); ctx.fill();
    ctx.fillStyle = '#ffffff'; rr(ctx, x, y, size, size, size * 0.1); ctx.fill();
    const pad = size * 0.09, cell = (size - pad * 2) / 3;
    for (let i = 0; i < 9; i++) {
      const c = s.m?.[i];
      const cx = x + pad + (i % 3) * cell, cy = y + pad + Math.floor(i / 3) * cell;
      ctx.fillStyle = c ? LIGHT[c] : DIM;
      rr(ctx, cx + cell * 0.08, cy + cell * 0.08, cell * 0.84, cell * 0.84, cell * 0.16); ctx.fill();
      if (c) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; rr(ctx, cx + cell * 0.18, cy + cell * 0.16, cell * 0.3, cell * 0.16, cell * 0.08); ctx.fill(); }
    }
    return [x, y + size / 2];
  }
}

function gear(ctx, x, y, r, teeth, deg, color) {
  ctx.save(); ctx.translate(x, y); ctx.rotate((deg * Math.PI) / 180);
  ctx.fillStyle = color;
  ctx.beginPath();
  const tooth = Math.min(10, r * 0.18);
  for (let i = 0; i < teeth * 2; i++) {
    const a0 = (i / (teeth * 2)) * Math.PI * 2, a1 = ((i + 1) / (teeth * 2)) * Math.PI * 2;
    const rr0 = i % 2 ? r - tooth : r;
    ctx.lineTo(Math.cos(a0) * rr0, Math.sin(a0) * rr0);
    ctx.lineTo(Math.cos(a1) * rr0, Math.sin(a1) * rr0);
  }
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(0, 0, r * 0.25, 0, 7); ctx.fill();
  ctx.fillStyle = '#e5484d'; ctx.beginPath(); ctx.arc(0, -r * 0.6, Math.max(4, r * 0.08), 0, 7); ctx.fill();
  ctx.restore();
}

function rr(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

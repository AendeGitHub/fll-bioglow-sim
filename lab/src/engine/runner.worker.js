// Runs a student's program off the main thread: Blocks as generated JavaScript, Python through Pyodide.
// The program drives a RobotProgram synchronously; the worker sends back every frame and the final state,
// and the page replays them in real time.

import { RobotProgram, TimeUp } from './robotApi.js';
import { BenchProgram } from './benchApi.js';
import ROBOT_PY from '../python/robot.py?raw';
import ESSENTIAL_PY from '../python/essential.py?raw';

let pyodide = null;
let pyLoading = null;
let prog = null; // the program running now (Python's `robot` module calls into it)
let out = []; // Python print() lines waiting for the clock

const post = (m) => postMessage(m);

/** What Python's `import robot` talks to. Names are snake_case like the Python API. */
const simApi = {
  forward: (cm) => prog.forward(cm),
  backward: (cm) => prog.backward(cm),
  turn_right: (d) => prog.turnRight(d),
  turn_left: (d) => prog.turnLeft(d),
  set_speed: (p) => prog.setSpeed(p),
  drive: (l, r) => prog.drive(l, r),
  stop: () => prog.stop(),
  wait: (s) => prog.wait(s),
  color: () => prog.color(),
  reflection: () => prog.reflection(),
  distance: () => prog.distance(),
  heading: () => prog.heading(),
  timer: () => prog.timer(),
  say: (t) => prog.say(t),
  beep: () => prog.beep(),
  light: (c) => prog.light(c),
};

/** What Python's `import essential` (SPIKE Essential) talks to. */
const benchApi = {
  run_for: (p, a, u) => prog.runFor(p, a, u),
  start: (p, d) => prog.start(p, d),
  stop_motor: (p) => prog.stopMotor(p),
  set_speed: (p, s) => prog.setSpeed(p, s),
  go_to: (p, x) => prog.goTo(p, x),
  position: (p) => prog.position(p),
  show_image: (n, c) => prog.showImage(n, c),
  pixel: (x, y, c) => prog.pixel(x, y, c),
  fill: (c) => prog.fill(c),
  clear: () => prog.clear(),
  color: () => prog.color(),
  hub_light: (c) => prog.hubLight(c),
  beep: () => prog.beep(),
  wait: (s) => prog.wait(s),
  timer: () => prog.timer(),
  say: (t) => prog.say(t),
};

const PROGRAMS = { robot: RobotProgram, bench: BenchProgram };

async function ensurePython(pyBase) {
  if (pyodide) return pyodide;
  if (!pyLoading) {
    pyLoading = (async () => {
      post({ type: 'py', state: 'loading' });
      const mod = await import(/* @vite-ignore */ pyBase + 'pyodide.mjs');
      const py = await mod.loadPyodide({
        indexURL: pyBase,
        stdout: (s) => prog && prog.say(s),
        stderr: (s) => prog && prog.events.push({ t: prog.world.t, kind: 'error', text: s }),
      });
      py.FS.mkdirTree('/lab');
      py.FS.writeFile('/lab/robot.py', ROBOT_PY);
      py.FS.writeFile('/lab/essential.py', ESSENTIAL_PY);
      py.runPython("import sys\nsys.path.insert(0, '/lab')");
      py.registerJsModule('_sim', simApi);
      py.registerJsModule('_bench', benchApi);
      pyodide = py;
      post({ type: 'py', state: 'ready' });
      return py;
    })().catch((e) => { pyLoading = null; throw e; });
  }
  return pyLoading;
}

/** Makes a Python traceback short and readable: only the lines about the student's own file. */
function cleanPythonError(msg) {
  const lines = String(msg).split('\n');
  const keep = [];
  let mine = false;
  for (const l of lines) {
    if (l.startsWith('Traceback')) continue;
    if (/^\s+File "/.test(l)) { mine = l.includes('"main.py"'); if (mine) keep.push(l.trim().replace('File "main.py", ', '')); continue; }
    if (/^\s/.test(l)) { if (mine) keep.push('    ' + l.trim()); continue; }
    if (l.trim()) keep.push(l.trim());
  }
  return keep.join('\n');
}

function result(status, error) {
  const w = prog.world;
  prog.pushFrame();
  const base = { status, error: error || null, frames: prog.frames, events: prog.events };
  if (prog instanceof BenchProgram) return { ...base, final: w.final() };
  return {
    ...base,
    final: {
      t: w.t,
      robot: { x: w.robot.x, y: w.robot.y, a: w.robot.a },
      heading: w.heading(),
      objects: w.objects.map((o) => ({ id: o.id, x: o.x, y: o.y })),
      wallHits: w.stats.wallHits,
      path: w.stats.path,
      zonesVisited: Object.fromEntries(w.stats.zonesVisited),
    },
  };
}

/** Runs the program once on one field. Returns the result (status, frames, final state). */
async function runOnce({ lang, code, field, timeLimit, pyBase, sim = 'robot' }) {
  prog = new PROGRAMS[sim](field, { timeLimit });
  try {
    if (lang === 'python') {
      const py = await ensurePython(pyBase);
      post({ type: 'started' });
      // A fresh namespace and a fresh `robot` module for every run.
      py.runPython("import sys\nsys.modules.pop('robot', None)\nsys.modules.pop('essential', None)");
      const g = py.globals.get('dict')();
      g.set('__name__', '__main__');
      try {
        py.runPython(code, { globals: g, filename: 'main.py' });
      } finally {
        g.destroy();
      }
    } else {
      post({ type: 'started' });
      // eslint-disable-next-line no-new-func
      const fn = new Function('robot', '"use strict";\n' + code);
      fn(prog);
    }
    return result('ok');
  } catch (e) {
    const msg = String(e && (e.message || e));
    if (e instanceof TimeUp || msg.includes('TIME_UP')) return result('timeup');
    return result('error', lang === 'python' ? cleanPythonError(msg) : msg);
  }
}

/**
 * Runs the program on every field variant (a mission can move a wall between runs so that only a program
 * that uses its sensors passes). Frames are sent only for the variant the page shows.
 */
async function run(m) {
  const runs = [];
  for (let i = 0; i < m.fields.length; i++) {
    const r = await runOnce({ ...m, field: m.fields[i] });
    if (i !== m.show) { r.frames = null; r.events = null; }
    runs.push(r);
    if (r.status === 'error') break;
  }
  post({ type: 'done', runs, show: m.show });
}

onmessage = async (ev) => {
  const m = ev.data;
  if (m.type === 'run') await run(m);
  else if (m.type === 'preload') ensurePython(m.pyBase).catch(() => {});
};

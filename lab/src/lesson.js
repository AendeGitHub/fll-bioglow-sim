// The lesson page: a list of steps (theory, quiz, driving, missions) with progress saved in the browser.
// A mission has the task, the table with the robot, and a code panel with Blocks and Python.

import { EditorView, basicSetup } from 'codemirror';
import { keymap } from '@codemirror/view';
import { indentWithTab } from '@codemirror/commands';
import { python } from '@codemirror/lang-python';
import { Blockly, defineBlocks, applyBlockLanguage, makeToolbox, blocksToJs, blocksToPython, hasProgram } from './engine/blocks.js';
import { World, DT, ROBOT, COLORS } from './engine/world.js';
import { FieldView } from './engine/render.js';
import { Runner, Player } from './engine/runner.js';
import { lang, LANGS, LANG_NAMES, setLang, onLang, t, tr } from './i18n.js';

const KIND_ICON = { theory: '📖', quiz: '❓', drive: '🎮', mission: '🤖' };

// ---------------- progress ----------------

function store(courseId) {
  const key = 'ustem-lab:' + courseId;
  let data = { done: {}, code: {}, current: 0 };
  try { data = { ...data, ...JSON.parse(localStorage.getItem(key) || '{}') }; } catch { /* ignore */ }
  return {
    data,
    save() { try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* ignore */ } },
  };
}

function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return el;
}

const stars = (n) => '⭐'.repeat(n || 0);

// ---------------- page ----------------

export function mountLesson(root, lesson, { home = '../', logo, pyBase, media }) {
  const st = store(lesson.id);
  const P = st.data;
  let index = Math.min(P.current || 0, lesson.steps.length - 1);
  let cleanup = null; // tears down the current step

  const runner = new Runner({ pyBase, onPython: (s) => pyListeners.forEach((f) => f(s)) });
  const pyListeners = new Set();

  defineBlocks();

  const header = h('header', { class: 'lab-top' });
  const side = h('aside', { class: 'lab-steps' });
  const stage = h('main', { class: 'lab-stage' });
  root.replaceChildren(header, h('div', { class: 'lab-body' }, side, stage));

  function renderHeader() {
    header.replaceChildren(
      h('a', { class: 'brand', href: home }, logo ? h('img', { src: logo, alt: '' }) : null, h('span', {}, 'USTEM Lab')),
      h('div', { class: 'course' }, h('span', { class: 'course-icon' }, lesson.icon), h('span', {}, tr(lesson.title))),
      h('div', { class: 'langs' }, LANGS.map((l) => h('button', {
        class: l === lang ? 'on' : '', title: LANG_NAMES[l], onclick: () => setLang(l),
      }, l === 'kk' ? 'ҚАЗ' : l.toUpperCase()))),
    );
  }

  function doneCount() { return lesson.steps.filter((s) => P.done[s.id]).length; }

  function renderSide() {
    const total = lesson.steps.length, done = doneCount();
    side.replaceChildren(
      h('div', { class: 'prog' },
        h('div', { class: 'prog-text' }, t('step.progress', { done, total })),
        h('div', { class: 'prog-bar' }, h('i', { style: `width:${(100 * done) / total}%` }))),
      h('ol', {}, lesson.steps.map((s, i) => h('li', {
        class: [i === index ? 'on' : '', P.done[s.id] ? 'done' : ''].join(' '),
        onclick: () => go(i),
      },
      h('span', { class: 'n' }, P.done[s.id] ? '✓' : String(i + 1)),
      h('span', { class: 'k' }, KIND_ICON[s.kind]),
      h('span', { class: 'tt' }, tr(s.title)),
      s.kind === 'mission' && P.done[s.id] ? h('span', { class: 'st' }, stars(P.done[s.id])) : null))),
      h('a', { class: 'all', href: home }, '← ' + t('lab.allCourses')),
    );
  }

  function markDone(step, value = 1) {
    const prev = P.done[step.id] || 0;
    P.done[step.id] = Math.max(prev === true ? 1 : prev, value);
    st.save();
    renderSide();
  }

  function navButtons(step, { canNext = true } = {}) {
    const i = lesson.steps.indexOf(step);
    return h('div', { class: 'nav' },
      i > 0 ? h('button', { class: 'ghost', onclick: () => go(i - 1) }, t('step.prev')) : h('span'),
      i < lesson.steps.length - 1
        ? h('button', { class: 'primary next' + (canNext ? '' : ' dim'), onclick: () => go(i + 1) }, t('step.next'))
        : h('a', { class: 'primary next', href: home }, t('lab.allCourses') + ' →'));
  }

  function go(i) {
    if (cleanup) { cleanup(); cleanup = null; }
    index = Math.max(0, Math.min(lesson.steps.length - 1, i));
    P.current = index;
    st.save();
    renderSide();
    const step = lesson.steps[index];
    stage.scrollTop = 0;
    window.scrollTo(0, 0);
    const view = { theory: theoryStep, quiz: quizStep, drive: driveStep, mission: missionStep }[step.kind];
    cleanup = view(step) || null;
  }

  // ---------------- theory ----------------

  function theoryStep(step) {
    markDone(step);
    stage.replaceChildren(h('article', { class: 'card theory' + (step.final ? ' final' : '') },
      h('div', { class: 'kicker' }, KIND_ICON.theory + ' ' + t('step.theory')),
      h('h1', {}, tr(step.title)),
      h('div', { class: 'content', html: tr(step.html) }),
      step.final ? h('div', { class: 'summary' }, lesson.steps.filter((s) => s.kind === 'mission').map((s) => h('div', { class: P.done[s.id] ? 'ok' : '' },
        h('span', {}, tr(s.title)), h('span', {}, P.done[s.id] ? stars(P.done[s.id]) : '—')))) : null,
      navButtons(step)));
  }

  // ---------------- quiz ----------------

  function quizStep(step) {
    const answers = new Map(); // question index → chosen option
    const card = h('article', { class: 'card quiz' });
    const render = () => {
      const allRight = step.questions.every((q, i) => answers.get(i) === q.answer);
      if (allRight && !P.done[step.id]) markDone(step);
      card.replaceChildren(
        h('div', { class: 'kicker' }, KIND_ICON.quiz + ' ' + t('step.quiz')),
        h('h1', {}, tr(step.title)),
        ...step.questions.map((q, qi) => {
          const chosen = answers.get(qi);
          return h('div', { class: 'q' },
            h('p', { class: 'qq' }, `${qi + 1}. ${tr(q.q)}`),
            h('div', { class: 'opts' }, q.options.map((o, oi) => h('button', {
              class: 'opt' + (chosen === oi ? (oi === q.answer ? ' right' : ' wrong') : ''),
              onclick: () => { answers.set(qi, oi); render(); },
            }, tr(o)))),
            chosen != null ? h('p', { class: 'fb ' + (chosen === q.answer ? 'right' : 'wrong') },
              chosen === q.answer ? `✅ ${t('quiz.right')} ${tr(q.explain)}` : `❌ ${t('quiz.wrong')}`) : null);
        }),
        allRight ? h('div', { class: 'callout ok' }, '🎉 ' + t('quiz.allRight')) : null,
        navButtons(step, { canNext: allRight || !!P.done[step.id] }));
    };
    if (P.done[step.id]) step.questions.forEach((q, i) => answers.set(i, q.answer));
    render();
    stage.replaceChildren(card);
  }

  // ---------------- driving ----------------

  function driveStep(step) {
    const world = new World(step.field);
    const canvas = h('canvas', { class: 'field' });
    const banner = h('div', { class: 'banner' });
    const keys = new Set();
    let won = false;
    const pad = (k, label) => h('button', {
      class: 'pad', 'data-k': k,
      onpointerdown: (e) => { e.preventDefault(); keys.add(k); },
      onpointerup: () => keys.delete(k), onpointerleave: () => keys.delete(k), onpointercancel: () => keys.delete(k),
    }, label);
    const reset = () => { Object.assign(world, new World(step.field)); view.clearTrail(); won = false; banner.className = 'banner'; };
    stage.replaceChildren(h('article', { class: 'card drive' },
      h('div', { class: 'kicker' }, KIND_ICON.drive + ' ' + t('step.drive')),
      h('h1', {}, tr(step.title)),
      h('div', { class: 'content', html: tr(step.html) }),
      h('p', { class: 'muted' }, t('drive.keys')),
      h('div', { class: 'field-wrap drive-field' }, canvas, banner),
      h('div', { class: 'pads' },
        h('div', {}, pad('up', '▲')),
        h('div', {}, pad('left', '◀'), pad('down', '▼'), pad('right', '▶')),
        h('button', { class: 'ghost', onclick: reset }, t('code.reset'))),
      navButtons(step, { canNext: !!P.done[step.id] })));
    const view = new FieldView(canvas, step.field);
    view.labels = (z) => tr(z.label);
    const KEYMAP = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' };
    const kd = (e) => { const k = KEYMAP[e.code]; if (k) { keys.add(k); e.preventDefault(); } };
    const ku = (e) => { const k = KEYMAP[e.code]; if (k) keys.delete(k); };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    const onResize = () => view.resize();
    window.addEventListener('resize', onResize);
    let raf = 0, last = performance.now(), acc = 0;
    const loop = (now) => {
      acc += Math.min(0.1, (now - last) / 1000);
      last = now;
      const v = ROBOT.maxSpeed * 0.6;
      const f = (keys.has('up') ? 1 : 0) - (keys.has('down') ? 1 : 0);
      const turn = (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0);
      const tv = f ? 0.45 : 0.6;
      world.setWheels(v * (f + turn * tv), v * (f - turn * tv));
      while (acc >= DT) { world.step(DT); acc -= DT; }
      view.draw(world.snapshot());
      if (!won && step.goal(world)) {
        won = true;
        markDone(step);
        banner.className = 'banner show ok';
        banner.replaceChildren(h('b', {}, '🏁 ' + t('run.success')), h('p', {}, tr(step.after)));
        stage.querySelector('.next')?.classList.remove('dim');
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      window.removeEventListener('resize', onResize);
    };
  }

  // ---------------- missions ----------------

  function missionStep(step) {
    const saved = P.code[step.id] ?? {};
    let mode = saved.mode ?? 'blocks';
    let fails = 0;
    let hintN = 0;
    const fields = step.fields ?? [step.field];
    const shown = fields[0];

    // --- task card
    const hintBox = h('div', { class: 'hints' });
    const solBox = h('div', { class: 'solution' });
    const learned = h('div', { class: 'learned' + (P.done[step.id] ? ' show' : ''), html: '🧠 ' + tr(step.learned) });
    const hintBtn = h('button', { class: 'ghost small', onclick: () => {
      if (hintN < step.hints.length) hintBox.append(h('p', {}, tr(step.hints[hintN++])));
      if (hintN >= step.hints.length) hintBtn.disabled = true;
    } }, t('code.hint'));
    const solBtn = h('button', { class: 'ghost small', disabled: !P.done[step.id], onclick: () => {
      solBox.replaceChildren(h('pre', {}, step.solution),
        h('button', { class: 'ghost small', onclick: () => { setMode('python'); setPython(step.solution); } }, t('code.toPython')));
    } }, t('code.solution'));
    const task = h('section', { class: 'task' },
      h('div', { class: 'kicker' }, KIND_ICON.mission + ' ' + t('step.mission') + (P.done[step.id] ? ' · ' + stars(P.done[step.id]) : '')),
      h('h1', {}, tr(step.title)),
      h('div', { class: 'content', html: tr(step.task) }),
      h('div', { class: 'task-tools' }, hintBtn, solBtn),
      hintBox, solBox, learned);

    // --- field
    const canvas = h('canvas', { class: 'field' });
    const hud = h('div', { class: 'hud' });
    const banner = h('div', { class: 'banner' });
    const fieldWrap = h('section', { class: 'field-wrap' }, canvas, hud, banner);

    // --- code panel
    const tabB = h('button', { class: 'tab', onclick: () => setMode('blocks') }, '🧩 ' + t('code.blocks'));
    const tabP = h('button', { class: 'tab', onclick: () => setMode('python') }, '🐍 ' + t('code.python'));
    const restore = h('button', { class: 'ghost small right', onclick: () => {
      if (!confirm(t('code.restoreAsk'))) return;
      if (mode === 'blocks') loadBlocks(step.starter.blocks); else setPython(step.starter.python);
      saveCode();
    } }, t('code.restore'));
    const blocklyHost = h('div', { class: 'blockly-host' });
    const pyHost = h('div', { class: 'py-host' });
    const preview = h('pre', { class: 'py-preview-code' });
    const previewBox = h('details', { class: 'py-preview' },
      h('summary', {}, '🐍 ' + t('code.asPython')),
      preview,
      h('button', { class: 'ghost small', onclick: () => { setPython(blocksToPython(ws)); setMode('python'); saveCode(); } }, t('code.toPython')));
    const runBtn = h('button', { class: 'primary run', onclick: () => run() }, t('code.run'));
    const stopBtn = h('button', { class: 'ghost', onclick: () => stopAll(), disabled: true }, t('code.stop'));
    const resetBtn = h('button', { class: 'ghost', onclick: () => { stopAll(); showStart(); } }, t('code.reset'));
    let speed = saved.speed ?? 1;
    const speedSel = h('select', { class: 'speed', title: t('code.speed'), onchange: (e) => { speed = Number(e.target.value); player.setSpeed(speed); P.code[step.id] = { ...P.code[step.id], speed }; st.save(); } },
      [1, 2, 4].map((s) => h('option', { value: s, selected: s === speed }, '×' + s)));
    const consoleEl = h('div', { class: 'console' });
    const code = h('section', { class: 'code' },
      h('div', { class: 'tabs' }, tabB, tabP, restore),
      h('div', { class: 'editor' }, blocklyHost, pyHost),
      previewBox,
      h('div', { class: 'runbar' }, runBtn, stopBtn, resetBtn, h('span', { class: 'grow' }), h('label', { class: 'muted' }, '⏩ ', speedSel)),
      consoleEl);

    const next = navButtons(step, { canNext: !!P.done[step.id] });
    stage.replaceChildren(h('div', { class: 'mission' }, h('div', { class: 'left' }, task, fieldWrap), code), next);

    // --- field view
    const view = new FieldView(canvas, shown);
    view.labels = (z) => tr(z.label);
    view.showRay = !!step.showRay;
    const showStart = () => {
      view.clearTrail();
      const w = new World(shown);
      const s = w.snapshot(); s.c = w.color(); s.d = w.distance();
      view.draw(s);
      setHud(s);
      banner.className = 'banner';
    };
    const setHud = (s) => {
      const c = s.c ? h('span', { class: 'sw', style: `background:${COLORS[s.c][0]}` }) : null;
      hud.replaceChildren(
        h('span', {}, '⏱ ', (s.t ?? 0).toFixed(1), ' s'),
        h('span', {}, c, ' ', t('color.' + s.c)),
        h('span', {}, '📏 ', s.d >= ROBOT.eyeRange ? '—' : (s.d ?? 0).toFixed(0) + ' cm'));
    };

    // --- Blockly
    const ws = Blockly.inject(blocklyHost, {
      toolbox: makeToolbox(step.blocks),
      renderer: 'zelos',
      theme: Blockly.Themes.Zelos ?? undefined,
      trashcan: true,
      zoom: { controls: true, wheel: false, startScale: 0.75, maxScale: 1.6, minScale: 0.4 },
      move: { scrollbars: true, drag: true, wheel: true },
      grid: { spacing: 24, length: 2, colour: '#e3e8ef', snap: false },
      sounds: false,
      media,
    });
    const loadBlocks = (json) => {
      Blockly.Events.disable();
      try { ws.clear(); Blockly.serialization.workspaces.load(json, ws); } finally { Blockly.Events.enable(); }
      if (!ws.getTopBlocks(false).some((b) => b.type === 'ul_start')) {
        Blockly.serialization.workspaces.load({ blocks: { languageVersion: 0, blocks: [{ type: 'ul_start', x: 24, y: 24 }] } }, ws);
      }
      updatePreview();
    };
    const updatePreview = () => { preview.textContent = blocksToPython(ws); };
    let saveTimer = 0;
    ws.addChangeListener((e) => {
      if (e.isUiEvent) return;
      updatePreview();
      clearTimeout(saveTimer);
      saveTimer = setTimeout(saveCode, 400);
    });
    try { loadBlocks(saved.blocks ?? step.starter.blocks); } catch { loadBlocks(step.starter.blocks); }

    // --- Python editor
    const editor = new EditorView({
      doc: saved.python ?? step.starter.python,
      parent: pyHost,
      extensions: [
        basicSetup, python(),
        keymap.of([indentWithTab, { key: 'Mod-Enter', run: () => { run(); return true; } }]),
        EditorView.updateListener.of((u) => { if (u.docChanged) { clearTimeout(saveTimer); saveTimer = setTimeout(saveCode, 400); } }),
      ],
    });
    function setPython(text) { editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: text } }); }

    function saveCode() {
      P.code[step.id] = {
        ...P.code[step.id], mode,
        blocks: Blockly.serialization.workspaces.save(ws),
        python: editor.state.doc.toString(),
      };
      st.save();
    }

    function setMode(m) {
      mode = m;
      tabB.classList.toggle('on', m === 'blocks');
      tabP.classList.toggle('on', m === 'python');
      blocklyHost.style.display = m === 'blocks' ? '' : 'none';
      previewBox.style.display = m === 'blocks' ? '' : 'none';
      pyHost.style.display = m === 'python' ? '' : 'none';
      if (m === 'blocks') Blockly.svgResize(ws);
      else runner.preloadPython();
      saveCode();
    }

    // --- console
    const log = (text, cls = '') => {
      consoleEl.append(h('div', { class: 'line ' + cls }, text));
      consoleEl.scrollTop = consoleEl.scrollHeight;
    };
    const pyState = (s) => {
      if (s === 'loading') log(t('code.loadingPython'), 'info');
    };
    pyListeners.add(pyState);

    // --- running
    const player = new Player();
    let busy = false;
    const setBusy = (b) => { busy = b; runBtn.disabled = b; stopBtn.disabled = !b; };

    function stopAll() {
      player.stop();
      if (runner.pending) runner.kill('stopped'); // only a program still computing; a replay just stops
      ws.highlightBlock(null);
      setBusy(false);
    }

    async function run() {
      if (busy) return;
      saveCode();
      let src;
      if (mode === 'blocks') {
        if (!hasProgram(ws)) { consoleEl.replaceChildren(); log(t('code.empty'), 'err'); return; }
        src = blocksToJs(ws);
      } else {
        src = editor.state.doc.toString();
      }
      consoleEl.replaceChildren();
      banner.className = 'banner';
      setBusy(true);
      log(t('code.running'), 'info');
      const res = await runner.run({ lang: mode === 'blocks' ? 'js' : 'python', code: src, fields, show: 0, timeLimit: step.timeLimit });
      if (res.killed) {
        if (res.killed === 'stuck') log(t('code.stuck'), 'err');
        setBusy(false);
        return;
      }
      if (res.fatal) { log(t('code.pythonFailed') + res.fatal, 'err'); setBusy(false); return; }
      const shownRun = res.runs[0];
      view.clearTrail();
      player.play(shownRun.frames, shownRun.events, {
        speed,
        onFrame: (f) => {
          view.draw(f);
          setHud(f);
          if (mode === 'blocks') ws.highlightBlock(f.b || null);
        },
        onEvent: (e) => {
          if (e.kind === 'say') log('💬 ' + e.text, 'say');
          else if (e.kind === 'beep') log('🔔 beep', 'say');
          else if (e.kind === 'error') log(e.text, 'err');
        },
        onEnd: () => {
          setBusy(false);
          if (shownRun.status === 'error') {
            // Leave the block that failed highlighted.
            log(t('run.error'), 'err');
            log(shownRun.error, 'err code');
            fail(null);
            return;
          }
          ws.highlightBlock(null);
          evaluate(res.runs, src);
        },
      });
    }

    function worldAt(field, final) {
      const w = new World(field);
      Object.assign(w.robot, final.robot);
      final.objects.forEach((o, i) => { w.objects[i].x = o.x; w.objects[i].y = o.y; });
      return w;
    }

    function evaluate(runs, src) {
      const r0 = runs[0];
      if (r0.status === 'timeup') log(t('run.timeup', { s: step.timeLimit }), 'info');
      else log(t('run.done', { s: r0.final.t.toFixed(1) }), 'info');
      let best = 3, msg = null;
      for (let i = 0; i < runs.length; i++) {
        const r = runs[i];
        if (r.status === 'error') { log(t('run.error') + ' ' + r.error, 'err'); return fail(null); }
        const res = step.check.call(step, { final: r.final, world: worldAt(fields[i], r.final), mode, code: src, run: r });
        if (!res.ok) {
          const prefix = runs.length > 1 ? `${tr({ kk: 'Сынақ', ru: 'Тест', en: 'Test' })} ${i + 1}/${runs.length}: ` : '';
          return fail(prefix + tr(res.text));
        }
        best = Math.min(best, res.stars ?? 3);
        if (res.text) msg = tr(res.text);
      }
      succeed(best, msg);
    }

    function succeed(n, msg) {
      markDone(step, n);
      solBtn.disabled = false;
      learned.classList.add('show');
      banner.className = 'banner show ok';
      banner.replaceChildren(...[h('b', {}, '🏁 ' + t('run.success') + ' ' + stars(n)), msg ? h('p', { html: msg }) : null].filter(Boolean));
      log('✅ ' + t('run.success') + ' ' + stars(n), 'ok');
      task.querySelector('.kicker').textContent = KIND_ICON.mission + ' ' + t('step.mission') + ' · ' + stars(P.done[step.id]);
      stage.querySelector('.next')?.classList.remove('dim');
    }

    function fail(msg) {
      fails++;
      if (fails >= 2) solBtn.disabled = false;
      banner.className = 'banner show bad';
      banner.replaceChildren(h('b', {}, '🔧 ' + t('run.fail')), h('p', { html: msg ?? t('run.tryAgain') }));
      if (msg) log('❌ ' + msg.replace(/<[^>]+>/g, ''), 'err');
    }

    setMode(mode);
    showStart();
    const onResize = () => { view.resize(); showStart(); Blockly.svgResize(ws); };
    window.addEventListener('resize', onResize);
    requestAnimationFrame(() => { view.resize(); showStart(); Blockly.svgResize(ws); });

    return () => {
      saveCode();
      stopAll();
      pyListeners.delete(pyState);
      window.removeEventListener('resize', onResize);
      ws.dispose();
      editor.destroy();
    };
  }

  // ---------------- language ----------------

  onLang(() => {
    applyBlockLanguage();
    renderHeader();
    go(index);
  });

  renderHeader();
  go(index);
}

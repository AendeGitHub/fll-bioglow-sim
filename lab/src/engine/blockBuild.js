// Short helpers to write starter programs for Blocks in lesson files instead of raw Blockly JSON.
//   program(fwd(20), right(90), repeat(4, [fwd(10)]))

const n = (v) => ({ shadow: { type: 'math_number', fields: { NUM: v } } });

const st = (type, inputs = {}, fields) => ({ type, ...(Object.keys(inputs).length ? { inputs } : {}), ...(fields ? { fields } : {}) });

function chain(list) {
  let head = null;
  for (let i = list.length - 1; i >= 0; i--) {
    const b = { ...list[i] };
    if (head) b.next = { block: head };
    head = b;
  }
  return head;
}

const body = (list) => (list && list.length ? { block: chain(list) } : undefined);
const withBody = (b, name, list) => {
  const c = body(list);
  if (c) b.inputs = { ...(b.inputs ?? {}), [name]: c };
  return b;
};

export const fwd = (cm) => st('ul_forward', { CM: n(cm) });
export const back = (cm) => st('ul_backward', { CM: n(cm) });
export const right = (d) => st('ul_turn_right', { DEG: n(d) });
export const left = (d) => st('ul_turn_left', { DEG: n(d) });
export const speed = (p) => st('ul_set_speed', { P: n(p) });
export const drive = (l, r) => st('ul_drive', { L: n(l), R: n(r) });
export const stop = () => st('ul_stop');
export const wait = (s) => st('ul_wait', { S: n(s) });
export const say = (text) => st('ul_say', { T: { shadow: { type: 'text', fields: { TEXT: text } } } });
export const light = (c) => st('ul_light', {}, { COL: c });
export const beep = () => st('ul_beep');

export const repeat = (times, list) => withBody(st('ul_repeat', { N: n(times) }), 'DO', list);
export const forever = (list) => withBody(st('ul_forever'), 'DO', list);
export const ifThen = (cond, list) => withBody(st('ul_if', cond ? { C: { block: cond } } : {}), 'DO', list);
export const ifElse = (cond, a, b) => withBody(withBody(st('ul_if_else', cond ? { C: { block: cond } } : {}), 'DO', a), 'ELSE', b);
export const waitUntil = (cond) => st('ul_wait_until', cond ? { C: { block: cond } } : {});
export const repeatUntil = (cond, list) => withBody(st('ul_repeat_until', cond ? { C: { block: cond } } : {}), 'DO', list);

export const colorIs = (c) => st('ul_color_is', {}, { COL: c });
export const distance = () => st('ul_distance');
export const reflection = () => st('ul_reflection');
const OPS = { '<': 'LT', '>': 'GT', '=': 'EQ' };
/** compare(distance(), '<', 10) — a side can be a block or a number */
export const compare = (a, op, b) => st('ul_compare', {
  A: typeof a === 'number' ? n(a) : { ...n(0), block: a },
  B: typeof b === 'number' ? n(b) : { ...n(0), block: b },
}, { OP: OPS[op] });

/** A whole workspace: "when started" with these blocks under it. Extra loose stacks can follow. */
export function program(...list) {
  const start = { type: 'ul_start', x: 24, y: 24, deletable: false };
  const c = body(list);
  if (c) start.next = c;
  return { blocks: { languageVersion: 0, blocks: [start] } };
}

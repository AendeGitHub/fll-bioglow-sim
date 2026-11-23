// Scratch-style blocks for the lesson robot (Blockly with the Zelos renderer), in Kazakh, Russian and English.
// Each block turns into JavaScript to run and into Python to read, so students see what their blocks mean in code.

import * as Blockly from 'blockly/core';
import 'blockly/blocks';
import { javascriptGenerator, Order as JsOrder } from 'blockly/javascript';
import { pythonGenerator, Order as PyOrder } from 'blockly/python';
import * as BlocklyRu from 'blockly/msg/ru';
import * as BlocklyEn from 'blockly/msg/en';
import { lang, tr } from '../i18n.js';

export { Blockly };

const C = {
  motion: '#4C97FF',
  control: '#FFAB19',
  sensing: '#5CB1D6',
  operators: '#59C059',
  looks: '#9966FF',
  events: '#FFBF00',
};

// ---------- block texts: { key: { kk, ru, en } } ----------
const M = {
  START: { kk: '▶ басталғанда', ru: '▶ при запуске', en: '▶ when started' },
  FORWARD: { kk: 'алға жүру %1 см', ru: 'вперёд на %1 см', en: 'move forward %1 cm' },
  BACKWARD: { kk: 'артқа жүру %1 см', ru: 'назад на %1 см', en: 'move backward %1 cm' },
  TURN_RIGHT: { kk: 'оңға бұрылу ↻ %1 °', ru: 'повернуть направо ↻ на %1 °', en: 'turn right ↻ %1 °' },
  TURN_LEFT: { kk: 'солға бұрылу ↺ %1 °', ru: 'повернуть налево ↺ на %1 °', en: 'turn left ↺ %1 °' },
  SET_SPEED: { kk: 'жылдамдық %1 %%', ru: 'скорость %1 %%', en: 'set speed %1 %%' },
  DRIVE: { kk: 'моторларды қосу: сол %1 оң %2', ru: 'включить моторы: левый %1 правый %2', en: 'start motors left %1 right %2' },
  STOP: { kk: 'тоқтау', ru: 'остановиться', en: 'stop' },
  WAIT: { kk: 'күту %1 с', ru: 'ждать %1 с', en: 'wait %1 s' },
  REPEAT: { kk: '%1 рет қайталау', ru: 'повторить %1 раз', en: 'repeat %1 times' },
  FOREVER: { kk: 'үнемі қайталау', ru: 'повторять всегда', en: 'forever' },
  IF: { kk: 'егер %1 болса', ru: 'если %1 то', en: 'if %1 then' },
  ELSE: { kk: 'әйтпесе', ru: 'иначе', en: 'else' },
  WAIT_UNTIL: { kk: '%1 болғанша күту', ru: 'ждать до %1', en: 'wait until %1' },
  REPEAT_UNTIL: { kk: '%1 болғанша қайталау', ru: 'повторять пока не %1', en: 'repeat until %1' },
  COLOR_IS: { kk: 'түс %1 ме?', ru: 'цвет %1 ?', en: 'color is %1 ?' },
  DISTANCE: { kk: 'қашықтық (см)', ru: 'расстояние (см)', en: 'distance (cm)' },
  REFLECTION: { kk: 'шағылысқан жарық (%%)', ru: 'отражённый свет (%%)', en: 'reflected light (%%)' },
  HEADING: { kk: 'бағыт (°)', ru: 'поворот гироскопа (°)', en: 'heading (°)' },
  TIMER: { kk: 'таймер (с)', ru: 'таймер (с)', en: 'timer (s)' },
  AND: { kk: '%1 және %2', ru: '%1 и %2', en: '%1 and %2' },
  OR: { kk: '%1 немесе %2', ru: '%1 или %2', en: '%1 or %2' },
  NOT: { kk: '%1 емес', ru: 'не %1', en: 'not %1' },
  SAY: { kk: 'айту %1', ru: 'сказать %1', en: 'say %1' },
  LIGHT: { kk: 'шам %1', ru: 'свет %1', en: 'light %1' },
  BEEP: { kk: 'дыбыс шығару', ru: 'бип', en: 'beep' },
  OFF: { kk: 'сөндіру', ru: 'выключить', en: 'off' },
  C_WHITE: { kk: 'ақ', ru: 'белый', en: 'white' },
  C_BLACK: { kk: 'қара', ru: 'чёрный', en: 'black' },
  C_RED: { kk: 'қызыл', ru: 'красный', en: 'red' },
  C_GREEN: { kk: 'жасыл', ru: 'зелёный', en: 'green' },
  C_BLUE: { kk: 'көк', ru: 'синий', en: 'blue' },
  C_YELLOW: { kk: 'сары', ru: 'жёлтый', en: 'yellow' },
  CAT_MOTION: { kk: 'Қозғалыс', ru: 'Движение', en: 'Motion' },
  CAT_CONTROL: { kk: 'Басқару', ru: 'Управление', en: 'Control' },
  CAT_SENSING: { kk: 'Датчиктер', ru: 'Датчики', en: 'Sensors' },
  CAT_OPERATORS: { kk: 'Операторлар', ru: 'Операторы', en: 'Operators' },
  CAT_LOOKS: { kk: 'Хаб', ru: 'Хаб', en: 'Hub' },
};

/** Blockly's own interface strings that Kazakh needs (the rest falls back to Russian). */
const KK_CORE = {
  DELETE_BLOCK: 'Блокты жою',
  DELETE_X_BLOCKS: '%1 блокты жою',
  DELETE_ALL_BLOCKS: 'Барлық %1 блокты жою керек пе?',
  DUPLICATE_BLOCK: 'Көшірме жасау',
  ADD_COMMENT: 'Түсініктеме қосу',
  REMOVE_COMMENT: 'Түсініктемені жою',
  CLEAN_UP: 'Блоктарды реттеу',
  UNDO: 'Болдырмау',
  REDO: 'Қайталау',
  COLLAPSE_BLOCK: 'Блокты жиыру',
  EXPAND_BLOCK: 'Блокты жазу',
  COLLAPSE_ALL: 'Блоктарды жиыру',
  EXPAND_ALL: 'Блоктарды жазу',
  DISABLE_BLOCK: 'Блокты өшіру',
  ENABLE_BLOCK: 'Блокты қосу',
  HELP: 'Анықтама',
  INLINE_INPUTS: 'Бір жолға',
  EXTERNAL_INPUTS: 'Сыртқы кірістер',
};

export function applyBlockLanguage() {
  Blockly.setLocale(lang === 'en' ? BlocklyEn : BlocklyRu);
  if (lang === 'kk') Object.assign(Blockly.Msg, KK_CORE);
  for (const [k, v] of Object.entries(M)) Blockly.Msg['UL_' + k] = tr(v);
}

const COLOR_OPTIONS = [
  ['%{BKY_UL_C_BLACK}', 'black'], ['%{BKY_UL_C_WHITE}', 'white'], ['%{BKY_UL_C_RED}', 'red'],
  ['%{BKY_UL_C_GREEN}', 'green'], ['%{BKY_UL_C_BLUE}', 'blue'], ['%{BKY_UL_C_YELLOW}', 'yellow'],
];

const num = (name) => ({ type: 'input_value', name, check: 'Number' });
const bool = (name) => ({ type: 'input_value', name, check: 'Boolean' });
const stmt = { previousStatement: null, nextStatement: null };

const DEFS = [
  { type: 'ul_start', message0: '%{BKY_UL_START}', nextStatement: null, colour: C.events, hat: 'cap', deletable: false },
  { type: 'ul_forward', message0: '%{BKY_UL_FORWARD}', args0: [num('CM')], ...stmt, colour: C.motion },
  { type: 'ul_backward', message0: '%{BKY_UL_BACKWARD}', args0: [num('CM')], ...stmt, colour: C.motion },
  { type: 'ul_turn_right', message0: '%{BKY_UL_TURN_RIGHT}', args0: [num('DEG')], ...stmt, colour: C.motion },
  { type: 'ul_turn_left', message0: '%{BKY_UL_TURN_LEFT}', args0: [num('DEG')], ...stmt, colour: C.motion },
  { type: 'ul_set_speed', message0: '%{BKY_UL_SET_SPEED}', args0: [num('P')], ...stmt, colour: C.motion },
  { type: 'ul_drive', message0: '%{BKY_UL_DRIVE}', args0: [num('L'), num('R')], inputsInline: true, ...stmt, colour: C.motion },
  { type: 'ul_stop', message0: '%{BKY_UL_STOP}', ...stmt, colour: C.motion },

  { type: 'ul_wait', message0: '%{BKY_UL_WAIT}', args0: [num('S')], ...stmt, colour: C.control },
  { type: 'ul_repeat', message0: '%{BKY_UL_REPEAT}', args0: [num('N')], message1: '%1', args1: [{ type: 'input_statement', name: 'DO' }], ...stmt, colour: C.control },
  { type: 'ul_forever', message0: '%{BKY_UL_FOREVER}', message1: '%1', args1: [{ type: 'input_statement', name: 'DO' }], previousStatement: null, colour: C.control },
  { type: 'ul_if', message0: '%{BKY_UL_IF}', args0: [bool('C')], message1: '%1', args1: [{ type: 'input_statement', name: 'DO' }], ...stmt, colour: C.control },
  {
    type: 'ul_if_else', message0: '%{BKY_UL_IF}', args0: [bool('C')], message1: '%1', args1: [{ type: 'input_statement', name: 'DO' }],
    message2: '%{BKY_UL_ELSE}', message3: '%1', args3: [{ type: 'input_statement', name: 'ELSE' }], ...stmt, colour: C.control,
  },
  { type: 'ul_wait_until', message0: '%{BKY_UL_WAIT_UNTIL}', args0: [bool('C')], ...stmt, colour: C.control },
  { type: 'ul_repeat_until', message0: '%{BKY_UL_REPEAT_UNTIL}', args0: [bool('C')], message1: '%1', args1: [{ type: 'input_statement', name: 'DO' }], ...stmt, colour: C.control },

  { type: 'ul_color_is', message0: '%{BKY_UL_COLOR_IS}', args0: [{ type: 'field_dropdown', name: 'COL', options: COLOR_OPTIONS }], output: 'Boolean', colour: C.sensing },
  { type: 'ul_distance', message0: '%{BKY_UL_DISTANCE}', output: 'Number', colour: C.sensing },
  { type: 'ul_reflection', message0: '%{BKY_UL_REFLECTION}', output: 'Number', colour: C.sensing },
  { type: 'ul_heading', message0: '%{BKY_UL_HEADING}', output: 'Number', colour: C.sensing },
  { type: 'ul_timer', message0: '%{BKY_UL_TIMER}', output: 'Number', colour: C.sensing },

  {
    type: 'ul_compare', message0: '%1 %2 %3',
    args0: [num('A'), { type: 'field_dropdown', name: 'OP', options: [['<', 'LT'], ['>', 'GT'], ['=', 'EQ']] }, num('B')],
    inputsInline: true, output: 'Boolean', colour: C.operators,
  },
  {
    type: 'ul_arith', message0: '%1 %2 %3',
    args0: [num('A'), { type: 'field_dropdown', name: 'OP', options: [['+', 'ADD'], ['−', 'SUB'], ['×', 'MUL'], ['÷', 'DIV']] }, num('B')],
    inputsInline: true, output: 'Number', colour: C.operators,
  },
  { type: 'ul_and', message0: '%{BKY_UL_AND}', args0: [bool('A'), bool('B')], inputsInline: true, output: 'Boolean', colour: C.operators },
  { type: 'ul_or', message0: '%{BKY_UL_OR}', args0: [bool('A'), bool('B')], inputsInline: true, output: 'Boolean', colour: C.operators },
  { type: 'ul_not', message0: '%{BKY_UL_NOT}', args0: [bool('A')], output: 'Boolean', colour: C.operators },

  { type: 'ul_say', message0: '%{BKY_UL_SAY}', args0: [{ type: 'input_value', name: 'T' }], ...stmt, colour: C.looks },
  {
    type: 'ul_light', message0: '%{BKY_UL_LIGHT}',
    args0: [{ type: 'field_dropdown', name: 'COL', options: [...COLOR_OPTIONS.filter((o) => o[1] !== 'black'), ['%{BKY_UL_OFF}', 'off']] }],
    ...stmt, colour: C.looks,
  },
  { type: 'ul_beep', message0: '%{BKY_UL_BEEP}', ...stmt, colour: C.looks },
];

let defined = false;
export function defineBlocks() {
  applyBlockLanguage();
  if (defined) return;
  defined = true;
  Blockly.common.defineBlocksWithJsonArray(DEFS);
  defineGenerators();
}

// ---------- generators ----------

function defineGenerators() {
  const js = javascriptGenerator;
  const py = pythonGenerator;
  // Every statement tells the robot which block runs, so the replay can highlight it.
  js.STATEMENT_PREFIX = 'robot.at(%1);\n';
  // A loop that never moves the robot still moves the clock (and hits the time limit).
  js.INFINITE_LOOP_TRAP = 'robot.tick();\n';
  js.addReservedWords('robot');

  const jv = (b, n, d = '0') => js.valueToCode(b, n, JsOrder.NONE) || d;
  const pv = (b, n, d = '0') => py.valueToCode(b, n, PyOrder.NONE) || d;
  const jb = (b, n) => js.valueToCode(b, n, JsOrder.NONE) || 'false';
  const pb = (b, n) => py.valueToCode(b, n, PyOrder.NONE) || 'False';
  const jBody = (b, n) => js.statementToCode(b, n);
  const pBody = (b, n) => py.statementToCode(b, n) || py.INDENT + 'pass\n';

  const simple = {
    ul_forward: ['forward', 'CM'], ul_backward: ['backward', 'CM'],
    ul_turn_right: ['turnRight', 'DEG', 'turn_right'], ul_turn_left: ['turnLeft', 'DEG', 'turn_left'],
    ul_set_speed: ['setSpeed', 'P', 'set_speed'], ul_wait: ['wait', 'S'],
  };
  for (const [type, [jsName, input, pyName]] of Object.entries(simple)) {
    js.forBlock[type] = (b) => `robot.${jsName}(${jv(b, input)});\n`;
    py.forBlock[type] = (b) => `${pyName ?? jsName}(${pv(b, input)})\n`;
  }
  js.forBlock.ul_start = () => '';
  py.forBlock.ul_start = () => '';
  js.forBlock.ul_drive = (b) => `robot.drive(${jv(b, 'L')}, ${jv(b, 'R')});\n`;
  py.forBlock.ul_drive = (b) => `drive(${pv(b, 'L')}, ${pv(b, 'R')})\n`;
  js.forBlock.ul_stop = () => 'robot.stop();\n';
  py.forBlock.ul_stop = () => 'stop()\n';

  js.forBlock.ul_repeat = (b) => {
    const n = jv(b, 'N');
    const i = js.nameDB_.getDistinctName('i', Blockly.Names.NameType.VARIABLE);
    return `for (let ${i} = 0; ${i} < ${n}; ${i}++) {\n${jBody(b, 'DO')}${js.INDENT}robot.tick();\n}\n`;
  };
  py.forBlock.ul_repeat = (b) => `for _ in range(int(${pv(b, 'N')})):\n${pBody(b, 'DO')}`;
  js.forBlock.ul_forever = (b) => `while (true) {\n${jBody(b, 'DO')}${js.INDENT}robot.tick();\n}\n`;
  py.forBlock.ul_forever = (b) => `while True:\n${pBody(b, 'DO')}`;
  js.forBlock.ul_if = (b) => `if (${jb(b, 'C')}) {\n${jBody(b, 'DO')}}\n`;
  py.forBlock.ul_if = (b) => `if ${pb(b, 'C')}:\n${pBody(b, 'DO')}`;
  js.forBlock.ul_if_else = (b) => `if (${jb(b, 'C')}) {\n${jBody(b, 'DO')}} else {\n${jBody(b, 'ELSE')}}\n`;
  py.forBlock.ul_if_else = (b) => `if ${pb(b, 'C')}:\n${pBody(b, 'DO')}else:\n${pBody(b, 'ELSE')}`;
  js.forBlock.ul_wait_until = (b) => `while (!(${jb(b, 'C')})) {\n${js.INDENT}robot.tick();\n}\n`;
  py.forBlock.ul_wait_until = (b) => `while not (${pb(b, 'C')}):\n${py.INDENT}pass\n`;
  js.forBlock.ul_repeat_until = (b) => `while (!(${jb(b, 'C')})) {\n${jBody(b, 'DO')}${js.INDENT}robot.tick();\n}\n`;
  py.forBlock.ul_repeat_until = (b) => `while not (${pb(b, 'C')}):\n${pBody(b, 'DO')}`;

  js.forBlock.ul_color_is = (b) => [`(robot.color() === '${b.getFieldValue('COL')}')`, JsOrder.EQUALITY];
  py.forBlock.ul_color_is = (b) => [`color() == '${b.getFieldValue('COL')}'`, PyOrder.RELATIONAL];
  for (const [type, fn] of [['ul_distance', 'distance'], ['ul_reflection', 'reflection'], ['ul_heading', 'heading'], ['ul_timer', 'timer']]) {
    js.forBlock[type] = () => [`robot.${fn}()`, JsOrder.FUNCTION_CALL];
    py.forBlock[type] = () => [`${fn}()`, PyOrder.FUNCTION_CALL];
  }

  const CMP = { LT: '<', GT: '>', EQ: '==' };
  js.forBlock.ul_compare = (b) => {
    const op = b.getFieldValue('OP');
    const a = js.valueToCode(b, 'A', JsOrder.RELATIONAL) || '0', c = js.valueToCode(b, 'B', JsOrder.RELATIONAL) || '0';
    return op === 'EQ' ? [`(${a} === ${c})`, JsOrder.EQUALITY] : [`${a} ${CMP[op]} ${c}`, JsOrder.RELATIONAL];
  };
  py.forBlock.ul_compare = (b) => {
    const a = py.valueToCode(b, 'A', PyOrder.RELATIONAL) || '0', c = py.valueToCode(b, 'B', PyOrder.RELATIONAL) || '0';
    return [`${a} ${CMP[b.getFieldValue('OP')]} ${c}`, PyOrder.RELATIONAL];
  };
  const AR = { ADD: ['+', JsOrder.ADDITION, PyOrder.ADDITIVE], SUB: ['-', JsOrder.SUBTRACTION, PyOrder.ADDITIVE], MUL: ['*', JsOrder.MULTIPLICATION, PyOrder.MULTIPLICATIVE], DIV: ['/', JsOrder.DIVISION, PyOrder.MULTIPLICATIVE] };
  js.forBlock.ul_arith = (b) => {
    const [op, o] = AR[b.getFieldValue('OP')];
    return [`${js.valueToCode(b, 'A', o) || '0'} ${op} ${js.valueToCode(b, 'B', o) || '0'}`, o];
  };
  py.forBlock.ul_arith = (b) => {
    const [op, , o] = AR[b.getFieldValue('OP')];
    return [`${py.valueToCode(b, 'A', o) || '0'} ${op} ${py.valueToCode(b, 'B', o) || '0'}`, o];
  };
  js.forBlock.ul_and = (b) => [`${js.valueToCode(b, 'A', JsOrder.LOGICAL_AND) || 'false'} && ${js.valueToCode(b, 'B', JsOrder.LOGICAL_AND) || 'false'}`, JsOrder.LOGICAL_AND];
  py.forBlock.ul_and = (b) => [`${py.valueToCode(b, 'A', PyOrder.LOGICAL_AND) || 'False'} and ${py.valueToCode(b, 'B', PyOrder.LOGICAL_AND) || 'False'}`, PyOrder.LOGICAL_AND];
  js.forBlock.ul_or = (b) => [`${js.valueToCode(b, 'A', JsOrder.LOGICAL_OR) || 'false'} || ${js.valueToCode(b, 'B', JsOrder.LOGICAL_OR) || 'false'}`, JsOrder.LOGICAL_OR];
  py.forBlock.ul_or = (b) => [`${py.valueToCode(b, 'A', PyOrder.LOGICAL_OR) || 'False'} or ${py.valueToCode(b, 'B', PyOrder.LOGICAL_OR) || 'False'}`, PyOrder.LOGICAL_OR];
  js.forBlock.ul_not = (b) => [`!${js.valueToCode(b, 'A', JsOrder.LOGICAL_NOT) || 'false'}`, JsOrder.LOGICAL_NOT];
  py.forBlock.ul_not = (b) => [`not ${py.valueToCode(b, 'A', PyOrder.LOGICAL_NOT) || 'False'}`, PyOrder.LOGICAL_NOT];

  js.forBlock.ul_say = (b) => `robot.say(${js.valueToCode(b, 'T', JsOrder.NONE) || "''"});\n`;
  py.forBlock.ul_say = (b) => `say(${py.valueToCode(b, 'T', PyOrder.NONE) || "''"})\n`;
  js.forBlock.ul_light = (b) => `robot.light('${b.getFieldValue('COL')}');\n`;
  py.forBlock.ul_light = (b) => `light('${b.getFieldValue('COL')}')\n`;
  js.forBlock.ul_beep = () => 'robot.beep();\n';
  py.forBlock.ul_beep = () => 'beep()\n';
}

// ---------- toolbox ----------

const shadowNum = (n) => ({ shadow: { type: 'math_number', fields: { NUM: n } } });
const ALL_BLOCKS = {
  motion: [
    { kind: 'block', type: 'ul_forward', inputs: { CM: shadowNum(20) } },
    { kind: 'block', type: 'ul_backward', inputs: { CM: shadowNum(20) } },
    { kind: 'block', type: 'ul_turn_right', inputs: { DEG: shadowNum(90) } },
    { kind: 'block', type: 'ul_turn_left', inputs: { DEG: shadowNum(90) } },
    { kind: 'block', type: 'ul_set_speed', inputs: { P: shadowNum(50) } },
    { kind: 'block', type: 'ul_drive', inputs: { L: shadowNum(50), R: shadowNum(50) } },
    { kind: 'block', type: 'ul_stop' },
  ],
  control: [
    { kind: 'block', type: 'ul_wait', inputs: { S: shadowNum(1) } },
    { kind: 'block', type: 'ul_repeat', inputs: { N: shadowNum(4) } },
    { kind: 'block', type: 'ul_forever' },
    { kind: 'block', type: 'ul_if' },
    { kind: 'block', type: 'ul_if_else' },
    { kind: 'block', type: 'ul_wait_until' },
    { kind: 'block', type: 'ul_repeat_until' },
  ],
  sensing: [
    { kind: 'block', type: 'ul_color_is' },
    { kind: 'block', type: 'ul_distance' },
    { kind: 'block', type: 'ul_reflection' },
    { kind: 'block', type: 'ul_heading' },
    { kind: 'block', type: 'ul_timer' },
  ],
  operators: [
    { kind: 'block', type: 'ul_compare', inputs: { A: shadowNum(0), B: shadowNum(10) } },
    { kind: 'block', type: 'ul_arith', inputs: { A: shadowNum(0), B: shadowNum(0) } },
    { kind: 'block', type: 'ul_and' },
    { kind: 'block', type: 'ul_or' },
    { kind: 'block', type: 'ul_not' },
  ],
  looks: [
    { kind: 'block', type: 'ul_say', inputs: { T: { shadow: { type: 'text', fields: { TEXT: 'Hello!' } } } } },
    { kind: 'block', type: 'ul_light' },
    { kind: 'block', type: 'ul_beep' },
  ],
};
const CAT_NAMES = { motion: 'CAT_MOTION', control: 'CAT_CONTROL', sensing: 'CAT_SENSING', operators: 'CAT_OPERATORS', looks: 'CAT_LOOKS' };

/** A toolbox with only the blocks a mission allows (all if `allowed` is empty). */
export function makeToolbox(allowed) {
  const ok = (type) => !allowed || !allowed.length || allowed.includes(type);
  const contents = [];
  for (const [cat, blocks] of Object.entries(ALL_BLOCKS)) {
    const list = blocks.filter((b) => ok(b.type));
    if (!list.length) continue;
    contents.push({ kind: 'category', name: tr(M[CAT_NAMES[cat]]), colour: C[cat], contents: list });
  }
  return { kind: 'categoryToolbox', contents };
}

export function blocksToJs(ws) {
  javascriptGenerator.init(ws);
  const start = ws.getTopBlocks(false).find((b) => b.type === 'ul_start');
  if (!start) return '';
  // Only blocks under "when started" run; loose blocks are ignored like in Scratch.
  const code = javascriptGenerator.blockToCode(start);
  return javascriptGenerator.finish(typeof code === 'string' ? code : '');
}

export function blocksToPython(ws) {
  pythonGenerator.init(ws);
  const start = ws.getTopBlocks(false).find((b) => b.type === 'ul_start');
  let body = '';
  if (start) {
    const code = pythonGenerator.blockToCode(start);
    body = typeof code === 'string' ? code : '';
  }
  // finish() adds imports for variables Blockly made; we don't use any.
  body = pythonGenerator.finish(body).replace(/^\s+/, '');
  return 'from robot import *\n\n' + (body || '# …\n');
}

export function hasProgram(ws) {
  const start = ws.getTopBlocks(false).find((b) => b.type === 'ul_start');
  return !!(start && start.getNextBlock());
}

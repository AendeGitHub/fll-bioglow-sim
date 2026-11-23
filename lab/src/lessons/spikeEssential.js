// Course 2: LEGO SPIKE Essential. The small hub with ports A and B, a motor, the 3×3 light matrix and the colour
// sensor, used in amusement-park models: a carousel (rotations, degrees, gears), a traffic light (sequence and
// timing), a ticket barrier (sensor + condition) and a sorting machine (sensor + condition + loop).

import * as B from '../engine/blockBuild.js';
import { norm180 } from '../engine/bench.js';

const say = (kk, ru, en) => ({ kk, ru, en });

const GATE = say('Кіреберіс', 'Вход', 'Gate');
const DISC = say('карусель', 'карусель', 'carousel');

const CAROUSEL_DIRECT = { ports: { A: { type: 'motor', model: 'carousel', gear: 1, gateLabel: GATE, discLabel: DISC } } };
const CAROUSEL_GEARED = { ports: { A: { type: 'motor', model: 'carousel', gear: 3, gateLabel: GATE, discLabel: DISC } } };
const TRAFFIC = { ports: { B: { type: 'matrix' } } };

const visitors = (colors) => ({
  ports: { A: { type: 'motor', model: 'barrier', limits: [0, 90] }, B: { type: 'color' } },
  items: colors.map((color, i) => ({ color, at: 1 + i * 5, dur: 3 })),
});
const GATE_RUNS = [['green', 'red', 'green', 'green'], ['red', 'green', 'red', 'green'], ['green', 'green', 'red', 'red']];

const bricks = (colors) => ({
  ports: { A: { type: 'motor', model: 'flap' }, B: { type: 'color' } },
  bins: { left: 'red', right: 'blue' },
  items: colors.map((color, i) => ({ color, at: 1 + i * 2.5, dur: 2.5 })),
});
const SORT_RUNS = [
  ['red', 'blue', 'blue', 'red', 'blue', 'red'],
  ['blue', 'red', 'red', 'red', 'blue', 'blue'],
  ['red', 'red', 'blue', 'blue', 'red', 'blue'],
];

/** Carousel angle (clockwise on screen) from the motor angle: a meshing gear turns the other way, g times slower. */
const discAngle = (final, gear) => (gear > 1 ? -final.motors.A.angle / gear : final.motors.A.angle);
const seatAtGate = (deg) => ['red', 'blue', 'green', 'yellow'][((Math.round(-deg / 90) % 4) + 4) % 4];

/** Light matrix history as segments [{ c, d }]: the colour lit (or null) and how long it stayed. */
function matrixSegments(final) {
  const log = final.matrixLog;
  const segs = [];
  for (let i = 0; i < log.length; i++) {
    const end = i + 1 < log.length ? log[i + 1].t : final.t;
    const cells = log[i].cells ?? [];
    const c = cells.find(Boolean) ?? null;
    const last = segs[segs.length - 1];
    if (last && last.c === c) last.d += end - log[i].t;
    else segs.push({ c, d: end - log[i].t });
  }
  return segs.filter((s) => s.d > 0.15 || s.c);
}

const cmd = (x) => `<code>${x}</code>`;

export default {
  id: 'spike-essential',
  icon: '🧱',
  title: { kk: 'LEGO SPIKE Essential', ru: 'LEGO SPIKE Essential', en: 'LEGO SPIKE Essential' },
  steps: [
    // 1 ─────────────────────────────────────────────
    {
      id: 'what', kind: 'theory',
      title: say('SPIKE Essential деген не?', 'Что такое SPIKE Essential?', 'What is SPIKE Essential?'),
      html: {
        kk: `<p class="lead"><b>LEGO Education SPIKE Essential</b> — бастауыш сынып оқушыларына (шамамен 6–10 жас) арналған робототехника жинағы. Онымен FIRST LEGO League Explore командалары модель жасайды.</p>
<div class="parts">
<div><span class="pi hub"></span><b>Кішкентай хаб</b><p>Бағдарлама осында орындалады. <b>A</b> және <b>B</b> екі порты, жарық шамы, батареясы бар.</p></div>
<div><span class="pi motor"></span><b>Кішкентай мотор</b><p>Бұрышты өлшейді: қанша градусқа бұрылғанын біледі. Жинақта — 2 мотор.</p></div>
<div><span class="pi matrix"></span><b>3×3 жарық матрицасы</b><p>9 түрлі түсті пиксель: сурет, белгі, бағдаршам.</p></div>
<div><span class="pi sensor"></span><b>Түс датчигі</b><p>Алдындағы заттың түсін таниды.</p></div>
</div>
<p>Хабта тек <b>екі порт</b> бар. Сондықтан әр модельде ойлану керек: A-ға не, B-ға не қосамыз?</p>
<h3>Сөз блоктары</h3><p>SPIKE қосымшасында белгішелі блоктар мен сөз блоктары бар. Біз <b>сөз блоктарымен</b> (Scratch сияқты) және <b>Python</b>-мен жұмыс істейміз. Әр блокта порт әрпі тұрады: <code>A мотор ↻ 1 айналым</code>.</p>
<div class="callout">🎡 Бұл курста біз шағын ойын-сауық паркін жасаймыз: карусель, бағдаршам, билет тексеретін шлагбаум және сұрыптау машинасы.</div>`,
        ru: `<p class="lead"><b>LEGO Education SPIKE Essential</b> — набор по робототехнике для начальной школы (примерно 6–10 лет). На нём собирают модели команды FIRST LEGO League Explore.</p>
<div class="parts">
<div><span class="pi hub"></span><b>Маленький хаб</b><p>Здесь выполняется программа. Два порта <b>A</b> и <b>B</b>, световой индикатор, аккумулятор.</p></div>
<div><span class="pi motor"></span><b>Маленький мотор</b><p>Измеряет угол: знает, на сколько градусов повернулся. В наборе — 2 мотора.</p></div>
<div><span class="pi matrix"></span><b>Световая матрица 3×3</b><p>9 цветных пикселей: картинка, знак, светофор.</p></div>
<div><span class="pi sensor"></span><b>Датчик цвета</b><p>Узнаёт цвет предмета перед ним.</p></div>
</div>
<p>У хаба только <b>два порта</b>. Поэтому в каждой модели приходится думать: что подключить к A, а что к B?</p>
<h3>Словесные блоки</h3><p>В приложении SPIKE есть блоки-иконки и словесные блоки. Мы работаем <b>словесными блоками</b> (как в Scratch) и на <b>Python</b>. В каждом блоке указана буква порта: <code>A мотор ↻ на 1 оборотов</code>.</p>
<div class="callout">🎡 В этом курсе мы построим маленький парк развлечений: карусель, светофор, шлагбаум с проверкой билетов и машину-сортировщик.</div>`,
        en: `<p class="lead"><b>LEGO Education SPIKE Essential</b> is a robotics set for primary school (about ages 6–10). FIRST LEGO League Explore teams build their models with it.</p>
<div class="parts">
<div><span class="pi hub"></span><b>Small hub</b><p>Runs your program. Two ports, <b>A</b> and <b>B</b>, a status light and a battery.</p></div>
<div><span class="pi motor"></span><b>Small motor</b><p>Measures its angle: it knows how many degrees it turned. The set has 2.</p></div>
<div><span class="pi matrix"></span><b>3×3 light matrix</b><p>9 colour pixels: pictures, signs, a traffic light.</p></div>
<div><span class="pi sensor"></span><b>Colour sensor</b><p>Recognises the colour of what is in front of it.</p></div>
</div>
<p>The hub has only <b>two ports</b>, so for every model you decide: what goes on A and what on B?</p>
<h3>Word blocks</h3><p>The SPIKE app has icon blocks and word blocks. We use <b>word blocks</b> (like Scratch) and <b>Python</b>. Every block names its port: <code>A run ↻ for 1 rotations</code>.</p>
<div class="callout">🎡 In this course we build a small amusement park: a carousel, a traffic light, a ticket barrier and a sorting machine.</div>`,
      },
    },
    // 2 ─────────────────────────────────────────────
    {
      id: 'quiz1', kind: 'quiz',
      title: say('Тест: жинақ', 'Тест: набор', 'Quiz: the set'),
      questions: [
        {
          q: say('SPIKE Essential хабында қанша порт бар?', 'Сколько портов у хаба SPIKE Essential?', 'How many ports does the SPIKE Essential hub have?'),
          options: ['2', '4', '6'],
          answer: 0,
          explain: say('A және B. (SPIKE Prime хабында — 6.)', 'A и B. (У хаба SPIKE Prime их 6.)', 'A and B. (The SPIKE Prime hub has 6.)'),
        },
        {
          q: say('Матрицада неше пиксель бар?', 'Сколько пикселей в световой матрице?', 'How many pixels does the light matrix have?'),
          options: ['3', '9', '25'],
          answer: 1,
          explain: say('3 × 3 = 9.', '3 × 3 = 9.', '3 × 3 = 9.'),
        },
        {
          q: say('Мотор бір толық айналым жасады. Бұл неше градус?', 'Мотор сделал один полный оборот. Сколько это градусов?', 'A motor made one full rotation. How many degrees is that?'),
          options: ['90°', '180°', '360°'],
          answer: 2,
          explain: say('Толық шеңбер — 360°. Жарты айналым — 180°, ширек — 90°.', 'Полный круг — 360°. Пол-оборота — 180°, четверть — 90°.', 'A full circle is 360°. Half a turn is 180°, a quarter is 90°.'),
        },
      ],
    },
    // 3 ─────────────────────────────────────────────
    {
      id: 'e1', kind: 'mission', sim: 'bench',
      title: say('1-миссия: Карусель', 'Миссия 1: Карусель', 'Mission 1: Carousel'),
      task: {
        kk: `<p>Карусель тікелей A моторына бекітілген. Оны <b>сағат тілімен дәл 2 толық айналым</b> айналдыр — қызыл орындық қайтадан кіреберіске тоқтайды.</p><p>Блоктағы санды және бірлікті (айналым / градус / секунд) өзгерте аласың.</p>`,
        ru: `<p>Карусель стоит прямо на моторе A. Прокрути её <b>ровно на 2 полных оборота по часовой стрелке</b> — красное сиденье снова остановится у входа.</p><p>В блоке можно менять число и единицы: обороты, градусы или секунды.</p>`,
        en: `<p>The carousel sits right on motor A. Spin it <b>exactly 2 full rotations clockwise</b>, so the red seat stops at the gate again.</p><p>In the block you can change the number and the unit: rotations, degrees or seconds.</p>`,
      },
      field: CAROUSEL_DIRECT,
      timeLimit: 20,
      blocks: ['es_run_for', 'es_speed', 'ul_wait'],
      starter: { blocks: B.program(B.esRun('A', 1, 1, 'rotations')), python: "from essential import *\n\nmotor_run('A', 1)\n" },
      hints: [
        say('1 айналым = 360°. Бізге 2 айналым керек.', '1 оборот = 360°. Нам нужно 2 оборота.', '1 rotation = 360°. We need 2.'),
        say('«секунд» бірлігі дәл емес: жылдамдыққа байланысты. Айналым немесе градус таңда.', 'Единица «секунд» неточная: зависит от скорости. Лучше обороты или градусы.', '“seconds” is not exact: it depends on the speed. Use rotations or degrees.'),
      ],
      solution: "from essential import *\n\nmotor_run('A', 2)          # or: motor_run('A', 720, 'degrees')\n",
      check(ctx) {
        const a = ctx.final.motors.A.angle;
        if (Math.abs(a - 720) <= 4) return { ok: true };
        if (a < 0) return { ok: false, text: say('Карусель сағат тіліне қарсы айналды. Бағытты ↻ қой.', 'Карусель крутилась против часовой. Выбери направление ↻.', 'It turned anticlockwise. Choose ↻.') };
        return { ok: false, text: say(`Карусель ${Math.round(a)}° айналды, ал керегі — 720° (2 айналым).`, `Карусель повернулась на ${Math.round(a)}°, а нужно 720° (2 оборота).`, `The carousel turned ${Math.round(a)}°, but 2 rotations is 720°.`) };
      },
      learned: say('Мотор <b>айналыммен</b>, <b>градуспен</b> немесе <b>секундпен</b> айнала алады. Дәлдік керек болса — градус.', 'Мотор крутится на заданное число <b>оборотов</b>, <b>градусов</b> или <b>секунд</b>. Для точности — градусы.', 'A motor can run for <b>rotations</b>, <b>degrees</b> or <b>seconds</b>. For precision use degrees.'),
    },
    // 4 ─────────────────────────────────────────────
    {
      id: 'gears', kind: 'theory',
      title: say('Тісті доңғалақтар', 'Шестерёнки', 'Gears'),
      html: {
        kk: `<p class="lead">Карусель ауыр, сондықтан оны мотор тікелей емес, <b>тісті доңғалақтар</b> арқылы айналдырады.</p>
<div class="gearfig"><div><b>8</b><span>тіс · мотор</span></div><i>→</i><div class="big"><b>24</b><span>тіс · карусель</span></div></div>
<ul><li>Кіші доңғалақ (8 тіс) бір айналғанда, үлкені (24 тіс) тек <b>8 тісті</b> алға жылжиды — бұл айналымның <b>үштен бірі</b>. Беріліс саны: <b>24 : 8 = 3</b>.</li>
<li>Демек карусельді 90°-қа бұру үшін мотор <b>90 × 3 = 270°</b> бұрылуы керек.</li>
<li>Тістескен доңғалақтар <b>қарама-қарсы</b> бағытта айналады: мотор ↻ — карусель ↺.</li>
<li>Баяу, бірақ <b>күштірек</b>: инженерлер ауыр жүкті осылай көтереді.</li></ul>`,
        ru: `<p class="lead">Карусель тяжёлая, поэтому мотор крутит её не напрямую, а через <b>шестерёнки</b>.</p>
<div class="gearfig"><div><b>8</b><span>зубьев · мотор</span></div><i>→</i><div class="big"><b>24</b><span>зуба · карусель</span></div></div>
<ul><li>Когда маленькая шестерёнка (8 зубьев) делает оборот, большая (24 зуба) сдвигается только на <b>8 зубьев</b> — это <b>треть</b> оборота. Передаточное число: <b>24 : 8 = 3</b>.</li>
<li>Значит, чтобы повернуть карусель на 90°, мотор должен повернуться на <b>90 × 3 = 270°</b>.</li>
<li>Сцепленные шестерёнки крутятся в <b>разные стороны</b>: мотор ↻ — карусель ↺.</li>
<li>Медленнее, но <b>сильнее</b>: так инженеры поднимают тяжёлые грузы.</li></ul>`,
        en: `<p class="lead">The carousel is heavy, so the motor turns it through <b>gears</b> instead of directly.</p>
<div class="gearfig"><div><b>8</b><span>teeth · motor</span></div><i>→</i><div class="big"><b>24</b><span>teeth · carousel</span></div></div>
<ul><li>When the small gear (8 teeth) makes one turn, the big gear (24 teeth) moves only <b>8 teeth</b> — a <b>third</b> of a turn. The gear ratio is <b>24 : 8 = 3</b>.</li>
<li>So to turn the carousel 90°, the motor turns <b>90 × 3 = 270°</b>.</li>
<li>Meshing gears turn in <b>opposite directions</b>: motor ↻, carousel ↺.</li>
<li>Slower but <b>stronger</b>: that is how engineers lift heavy loads.</li></ul>`,
      },
    },
    // 5 ─────────────────────────────────────────────
    {
      id: 'e2', kind: 'mission', sim: 'bench',
      title: say('2-миссия: Сары орындық', 'Миссия 2: Жёлтое сиденье', 'Mission 2: The yellow seat'),
      task: {
        kk: '<p>Енді карусель 8 → 24 тісті доңғалақ арқылы айналады. <b>Сары орындықты</b> кіреберіске (жоғарыға) әкел. Бұл үшін карусель <b>сағат тілімен 90°</b> бұрылуы керек.</p><p>Мотор неше градусқа және қай бағытқа бұрылуы керек?</p>',
        ru: '<p>Теперь карусель крутится через шестерёнки 8 → 24. Подвези к входу (наверх) <b>жёлтое сиденье</b>. Для этого карусель должна повернуться на <b>90° по часовой стрелке</b>.</p><p>На сколько градусов и в какую сторону должен повернуться мотор?</p>',
        en: '<p>Now the carousel turns through 8 → 24 gears. Bring the <b>yellow seat</b> to the gate (top). The carousel must turn <b>90° clockwise</b>.</p><p>How many degrees, and which way, must the motor turn?</p>',
      },
      field: CAROUSEL_GEARED,
      timeLimit: 20,
      blocks: ['es_run_for', 'es_speed', 'ul_wait'],
      starter: { blocks: B.program(B.esRun('A', 1, 90, 'degrees')), python: "from essential import *\n\nmotor_run('A', 90, 'degrees')\n" },
      hints: [
        say('Беріліс саны 3: мотор карусельден 3 есе көп бұрылады.', 'Передаточное число 3: мотор поворачивается в 3 раза больше карусели.', 'The ratio is 3: the motor turns 3 times as far as the carousel.'),
        say('Тістескен доңғалақтар қарама-қарсы айналады: карусель ↻ болуы үшін мотор ↺ айналуы керек.', 'Шестерёнки крутятся в разные стороны: чтобы карусель шла ↻, мотор должен крутиться ↺.', 'Gears turn opposite ways: for the carousel to go ↻, the motor must go ↺.'),
      ],
      solution: "from essential import *\n\nmotor_run('A', -270, 'degrees')   # 90° × 3, anticlockwise\n",
      check(ctx) {
        const d = discAngle(ctx.final, 3);
        const seat = seatAtGate(d);
        const off = Math.abs(norm180(d - 90));
        if (off <= 6) return { ok: true, stars: Math.abs(ctx.final.motors.A.travel - 270) <= 10 ? 3 : 2, text: Math.abs(ctx.final.motors.A.travel - 270) <= 10 ? null : say('Дұрыс! Бірақ ең қысқа жол — 270°.', 'Получилось! Но самый короткий путь — 270°.', 'Done! But the shortest way is 270°.') };
        const r = ((d % 90) + 90) % 90;
        if (r > 6 && r < 84) return { ok: false, text: say(`Карусель ${Math.round(d)}°-қа бұрылды — орындық кіреберіске дәл тоқтаған жоқ. Беріліс санын есепте.`, `Карусель повернулась на ${Math.round(d)}° — сиденье не остановилось точно у входа. Посчитай с передаточным числом.`, `The carousel turned ${Math.round(d)}°, so no seat is exactly at the gate. Use the gear ratio.`) };
        const n = { red: say('қызыл', 'красное', 'red'), blue: say('көк', 'синее', 'blue'), green: say('жасыл', 'зелёное', 'green'), yellow: say('сары', 'жёлтое', 'yellow') }[seat];
        return { ok: false, text: say(`Кіреберісте — ${n.kk} орындық. Бағыт пен градусты тексер.`, `У входа ${n.ru} сиденье. Проверь направление и градусы.`, `The ${n.en} seat is at the gate. Check the direction and degrees.`) };
      },
      learned: say('<b>Беріліс саны</b> = үлкен доңғалақтың тістері : кішісінің тістері. Тістескен доңғалақтар бағытты өзгертеді.', '<b>Передаточное число</b> = зубья большой : зубья маленькой. Сцепленные шестерёнки меняют направление.', 'The <b>gear ratio</b> is big gear teeth : small gear teeth. Meshing gears reverse the direction.'),
    },
    // 6 ─────────────────────────────────────────────
    {
      id: 'e3', kind: 'mission', sim: 'bench',
      title: say('3-миссия: Бағдаршам', 'Миссия 3: Светофор', 'Mission 3: Traffic light'),
      task: {
        kk: '<p>Парк кіреберісіндегі бағдаршамды бағдарламала (матрица B портында):</p><p>🔴 қызыл — <b>3 с</b> → 🟡 сары — <b>1 с</b> → 🟢 жасыл — <b>3 с</b></p><p>Бұл циклды <b>2 рет</b> қайтала.</p>',
        ru: '<p>Запрограммируй светофор у входа в парк (матрица на порту B):</p><p>🔴 красный — <b>3 с</b> → 🟡 жёлтый — <b>1 с</b> → 🟢 зелёный — <b>3 с</b></p><p>Повтори этот цикл <b>2 раза</b>.</p>',
        en: '<p>Program the traffic light at the park entrance (matrix on port B):</p><p>🔴 red — <b>3 s</b> → 🟡 yellow — <b>1 s</b> → 🟢 green — <b>3 s</b></p><p>Repeat the cycle <b>2 times</b>.</p>',
      },
      field: TRAFFIC,
      timeLimit: 30,
      blocks: ['es_show', 'es_fill', 'es_pixel', 'es_clear', 'ul_wait', 'ul_repeat', 'es_hub_light', 'ul_beep'],
      starter: { blocks: B.program(B.esFill('red'), B.wait(3)), python: "from essential import *\n\nfill('red')\nwait(3)\n" },
      hints: [
        say('«күту» блогынсыз түс бірден ауысып кетеді — оны көре алмайсың.', 'Без блока «ждать» цвет сменится мгновенно — ты его даже не увидишь.', 'Without “wait” the colour changes instantly — you won’t even see it.'),
        say('Үш түс пен үш күтуді «2 рет қайталау» ішіне сал.', 'Положи три цвета и три ожидания внутрь «повторить 2 раз».', 'Put the three colours and waits inside “repeat 2 times”.'),
      ],
      solution: "from essential import *\n\nfor i in range(2):\n    fill('red')\n    wait(3)\n    fill('yellow')\n    wait(1)\n    fill('green')\n    wait(3)\nclear()\n",
      check(ctx) {
        const segs = matrixSegments(ctx.final).filter((s) => s.c);
        const want = [['red', 3], ['yellow', 1], ['green', 3]];
        let i = 0, cycles = 0;
        for (const s of segs) {
          const [c, d] = want[i];
          if (s.c === c && s.d >= d - 0.25 && s.d <= d + 0.6) {
            i++;
            if (i === 3) { cycles++; i = 0; }
          } else if (s.c === 'red' && s.d >= 2.75 && s.d <= 3.6) {
            i = 1;
          } else i = 0;
        }
        if (cycles >= 2) {
          return usesLoop(ctx) ? { ok: true } : { ok: true, stars: 2, text: say('Жұмыс істейді! «Қайталау» блогымен қысқарақ жаз — ⭐⭐⭐.', 'Работает! Сделай короче через «повторить» — ⭐⭐⭐.', 'Works! Make it shorter with repeat for ⭐⭐⭐.') };
        }
        const seen = segs.map((s) => `${{ red: '🔴', yellow: '🟡', green: '🟢' }[s.c] ?? '⚪'} ${s.d.toFixed(1)}`).join(' → ') || '—';
        return { ok: false, text: say(`Толық цикл саны: ${cycles} / 2. Бағдаршам көрсеткені: ${seen}`, `Полных циклов: ${cycles} из 2. Светофор показал: ${seen}`, `Full cycles: ${cycles} of 2. The light showed: ${seen}`) };
      },
      learned: say('<b>Тізбек</b> пен <b>уақыт</b>: әр күй «күту» блогының арқасында ғана көрінеді.', '<b>Последовательность</b> и <b>время</b>: каждое состояние видно только благодаря «ждать».', '<b>Sequence</b> and <b>timing</b>: each state is visible only thanks to wait.'),
    },
    // 7 ─────────────────────────────────────────────
    {
      id: 'e4', kind: 'mission', sim: 'bench', endless: true,
      title: say('4-миссия: Билет тексеру', 'Миссия 4: Проверка билетов', 'Mission 4: Ticket check'),
      task: {
        kk: '<p>Келушілер билетін түс датчигіне (B) көрсетеді. <b>Жасыл</b> билет — шлагбаумды (A мотор) <b>90° позициясына</b> көтеріп, 2 с күтіп, <b>0°-қа</b> түсір. <b>Қызыл</b> билет — шлагбаум жабық қалады.</p><p>Бағдарламаны <b>3 түрлі кезекпен</b> тексереміз.</p>',
        ru: '<p>Посетители показывают билет датчику цвета (B). <b>Зелёный</b> билет — подними шлагбаум (мотор A) в <b>позицию 90°</b>, подожди 2 с и опусти в <b>0°</b>. <b>Красный</b> — шлагбаум остаётся закрытым.</p><p>Программу проверим на <b>3 разных очередях</b>.</p>',
        en: '<p>Visitors show their ticket to the colour sensor (B). <b>Green</b> ticket: raise the barrier (motor A) to <b>position 90°</b>, wait 2 s, lower it to <b>0°</b>. <b>Red</b> ticket: the barrier stays closed.</p><p>We test the program on <b>3 different queues</b>.</p>',
      },
      fields: GATE_RUNS.map(visitors),
      timeLimit: 22,
      blocks: ['es_go_to', 'es_run_for', 'es_speed', 'es_color_is', 'ul_wait', 'ul_wait_until', 'ul_forever', 'ul_if', 'ul_if_else', 'es_hub_light', 'ul_beep', 'ul_say'],
      starter: { blocks: B.program(B.forever([B.ifThen(B.esColorIs('green'), [])])), python: "from essential import *\n\nwhile True:\n    if color() == 'green':\n        pass  # open, wait, close\n" },
      hints: [
        say('«егер» ішіне: A → 90 позициясы, 2 с күту, A → 0 позициясы.', 'Внутрь «если»: A → позиция 90, ждать 2 с, A → позиция 0.', 'Inside “if”: A go to 90, wait 2 s, A go to 0.'),
        say('Бонус: қызыл билетке хаб шамын қызыл ет.', 'Бонус: при красном билете зажги свет хаба красным.', 'Bonus: light the hub red for a red ticket.'),
      ],
      solution: "from essential import *\n\nwhile True:\n    if color() == 'green':\n        hub_light('green')\n        motor_go_to('A', 90)\n        wait(2)\n        motor_go_to('A', 0)\n    elif color() == 'red':\n        hub_light('red')\n    else:\n        hub_light('off')\n",
      check(ctx) {
        for (const it of ctx.final.items) {
          if (it.wrongOpen) return { ok: false, text: say('Шлагбаум қызыл билетпен ашылды!', 'Шлагбаум открылся с красным билетом!', 'The barrier opened for a red ticket!') };
          if (it.color === 'green' && (it.opened == null || it.opened - it.at > 1.5)) return { ok: false, text: say(`Жасыл билетпен келген келуші (${it.at} с) өте алмады.`, `Посетитель с зелёным билетом (${it.at} с) не смог пройти.`, `The visitor with a green ticket (${it.at} s) could not get in.`) };
        }
        return { ok: true };
      },
      learned: say('<b>Шарт</b> («егер») мен <b>шексіз цикл</b>: робот үнемі датчикке қарап, жағдайға қарай әрекет етеді.', '<b>Условие</b> («если») в <b>бесконечном цикле</b>: модель всё время смотрит на датчик и реагирует.', 'A <b>condition</b> inside a <b>forever loop</b>: the model keeps watching the sensor and reacts.'),
    },
    // 8 ─────────────────────────────────────────────
    {
      id: 'e5', kind: 'mission', sim: 'bench', endless: true,
      title: say('5-миссия: Сұрыптау машинасы', 'Миссия 5: Сортировщик', 'Mission 5: Sorting machine'),
      task: {
        kk: '<p>Кірпіштер науамен бір-бірлеп келіп, датчиктің (B) алдында 2,5 с тұрады, содан кейін қақпақтың (A) үстіне түседі.</p><p>🔴 <b>Қызыл</b> — сол жақ себетке: A → <b>−45</b> (= 315) позициясы<br>🔵 <b>Көк</b> — оң жақ себетке: A → <b>45</b> позициясы</p><p>Барлық 6 кірпішті дұрыс сұрыпта. 3 түрлі ретпен тексереміз.</p>',
        ru: '<p>Кубики по одному приезжают по жёлобу, 2,5 с стоят перед датчиком (B), потом падают на заслонку (A).</p><p>🔴 <b>Красные</b> — в левую корзину: A → позиция <b>−45</b> (= 315)<br>🔵 <b>Синие</b> — в правую: A → позиция <b>45</b></p><p>Рассортируй все 6 кубиков. Проверим на 3 разных порядках.</p>',
        en: '<p>Bricks come down the chute one by one, wait 2.5 s in front of the sensor (B), then drop onto the flap (A).</p><p>🔴 <b>Red</b> to the left bin: A go to <b>−45</b> (= 315)<br>🔵 <b>Blue</b> to the right bin: A go to <b>45</b></p><p>Sort all 6 bricks. We test 3 different orders.</p>',
      },
      fields: SORT_RUNS.map(bricks),
      timeLimit: 17,
      blocks: ['es_go_to', 'es_run_for', 'es_speed', 'es_position', 'es_color_is', 'ul_wait', 'ul_wait_until', 'ul_forever', 'ul_if', 'ul_if_else', 'es_show', 'es_hub_light', 'ul_beep', 'ul_say', 'ul_and', 'ul_or', 'ul_not'],
      starter: { blocks: B.program(B.forever([B.ifThen(B.esColorIs('red'), [B.esGoTo('A', 0)])])), python: "from essential import *\n\nwhile True:\n    if color() == 'red':\n        motor_go_to('A', 0)\n" },
      hints: [
        say('Қызылға: A → −45. Көкке тағы бір «егер» блогы керек: A → 45.', 'Для красного: A → −45. Для синего нужен ещё один «если»: A → 45.', 'Red: A go to −45. For blue add another “if”: A go to 45.'),
      ],
      solution: "from essential import *\n\nwhile True:\n    if color() == 'red':\n        motor_go_to('A', -45)\n    elif color() == 'blue':\n        motor_go_to('A', 45)\n",
      check(ctx) {
        const items = ctx.final.items;
        const wrong = items.filter((b) => b.bin !== (b.color === 'red' ? 'left' : 'right'));
        if (!wrong.length) return { ok: true };
        const b = wrong[0];
        const where = { left: say('сол жаққа', 'в левую корзину', 'into the left bin'), right: say('оң жаққа', 'в правую корзину', 'into the right bin'), jam: say('ортаға (қақпақ тік тұрды)', 'посередине (заслонка стояла прямо)', 'in the middle (the flap was straight)') }[b.bin] ?? say('— (уақыт бітті)', '— (время вышло)', '— (time ran out)');
        const cn = b.color === 'red' ? say('Қызыл', 'Красный', 'A red') : say('Көк', 'Синий', 'A blue');
        return { ok: false, text: say(`${cn.kk} кірпіш ${where.kk} түсті. Қате: ${wrong.length} / ${items.length}.`, `${cn.ru} кубик упал ${where.ru}. Ошибок: ${wrong.length} из ${items.length}.`, `${cn.en} brick fell ${where.en}. Wrong: ${wrong.length} of ${items.length}.`) };
      },
      learned: say('Нағыз зауыттағы сұрыптау машиналары дәл осылай жұмыс істейді: <b>датчик → шешім → механизм</b>.', 'Так работают сортировщики на настоящих заводах: <b>датчик → решение → механизм</b>.', 'Real factory sorters work just like this: <b>sensor → decision → mechanism</b>.'),
    },
    // 9 ─────────────────────────────────────────────
    {
      id: 'next', kind: 'theory', final: true,
      title: say('Құттықтаймыз!', 'Поздравляем!', 'Congratulations!'),
      html: {
        kk: `<p class="lead">🎡 Сенің ойын-сауық паркің дайын!</p><ul><li>Мотор: айналым, градус, секунд, позиция</li><li>Тісті доңғалақтар және беріліс саны</li><li>Жарық матрицасы, тізбек және уақыт</li><li>Түс датчигі, шарт және шексіз цикл</li></ul>
<div class="callout">💡 Нағыз SPIKE Essential жинағымен осы модельдерді құрастырып, дәл осы бағдарламаларды SPIKE қосымшасында жазып көр. Python-да ${cmd('motor_run')} орнына ${cmd('motor.run_for_degrees(port.A, 360, 500)')} сияқты ресми SPIKE функциялары қолданылады — идеясы бірдей.</div>
<div class="callout">➡️ Келесі курс: <b>LEGO SPIKE Prime</b> — 6 портты хаб, үлкен моторлар, көп датчик және FLL Challenge-ке дайындық.</div>`,
        ru: `<p class="lead">🎡 Твой парк развлечений готов!</p><ul><li>Мотор: обороты, градусы, секунды, позиция</li><li>Шестерёнки и передаточное число</li><li>Световая матрица, последовательность и время</li><li>Датчик цвета, условие и бесконечный цикл</li></ul>
<div class="callout">💡 Собери эти модели из настоящего набора SPIKE Essential и напиши те же программы в приложении SPIKE. В официальном Python SPIKE вместо ${cmd('motor_run')} пишут, например, ${cmd('motor.run_for_degrees(port.A, 360, 500)')} — идея та же.</div>
<div class="callout">➡️ Следующий курс: <b>LEGO SPIKE Prime</b> — хаб с 6 портами, большие моторы, больше датчиков и подготовка к FLL Challenge.</div>`,
        en: `<p class="lead">🎡 Your amusement park is ready!</p><ul><li>Motors: rotations, degrees, seconds, position</li><li>Gears and gear ratio</li><li>The light matrix, sequence and timing</li><li>The colour sensor, conditions and forever loops</li></ul>
<div class="callout">💡 Build these models with a real SPIKE Essential set and write the same programs in the SPIKE app. Official SPIKE Python uses calls like ${cmd('motor.run_for_degrees(port.A, 360, 500)')} instead of ${cmd('motor_run')} — same idea.</div>
<div class="callout">➡️ Next course: <b>LEGO SPIKE Prime</b> — a 6-port hub, bigger motors, more sensors, and getting ready for FLL Challenge.</div>`,
      },
    },
  ],
};

function usesLoop(ctx) {
  return ctx.mode === 'python' ? /\b(for|while)\b/.test(ctx.code) : /\b(for|while)\s*\(/.test(ctx.code);
}

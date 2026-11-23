// Course 1 of the USTEM Lab list: FIRST. What FIRST is, its programs and values, how a robot senses, thinks and
// acts, and then the robot's first autonomous programs, from one straight drive to a 30-second mini match.

import * as B from '../engine/blockBuild.js';
import { ROBOT } from '../engine/world.js';

const SIZE = [200, 120];

const PROGRAMS = [
  { name: 'FIRST LEGO League Discover', age: '4–6', color: '#ff7b9c', what: { kk: 'Үлкен LEGO DUPLO бөлшектерінен модель құрастыру, ойын арқылы зерттеу.', ru: 'Модели из крупных деталей LEGO DUPLO, исследование через игру.', en: 'Models from big LEGO DUPLO bricks, learning through play.' } },
  { name: 'FIRST LEGO League Explore', age: '6–10', color: '#47b5ff', what: { kk: 'LEGO Education моделі мен оның қозғалатын бөлігі, команда плакаты.', ru: 'Модель из LEGO Education с движущейся частью и командный плакат.', en: 'A LEGO Education model with a moving part, and a team poster.' } },
  { name: 'FIRST LEGO League Challenge', age: '9–16', color: '#ef4444', what: { kk: 'LEGO роботы 2:30 минутта үстелдегі миссияларды өзі орындайды + ғылыми жоба.', ru: 'Робот LEGO сам выполняет миссии на столе за 2:30 + инновационный проект.', en: 'A LEGO robot runs missions on a table by itself in 2:30, plus an innovation project.' } },
  { name: 'FIRST Tech Challenge', age: '12–18', color: '#f59e0b', what: { kk: 'Металл және пластик бөлшектерден робот, Java немесе блоктар, 2 команда альянсы.', ru: 'Робот из металла и пластика, Java или блоки, альянсы по 2 команды.', en: 'Metal and plastic robots, Java or Blocks, alliances of 2 teams.' } },
  { name: 'FIRST Robotics Competition', age: '14–18', color: '#3b82f6', what: { kk: 'Үлкен роботтар (~55 кг), 6 аптада жасалады, 3 команда альянсы.', ru: 'Большие роботы (~55 кг), строятся за 6 недель, альянсы по 3 команды.', en: 'Big robots (~55 kg) built in about 6 weeks, alliances of 3 teams.' } },
];

function programsLadder() {
  return PROGRAMS.map((p, i) => ({
    kk: `<div class="ladder-step" style="--c:${p.color};--i:${i}"><b>${p.name}</b><span class="age">${p.age} жас</span><p>${p.what.kk}</p></div>`,
    ru: `<div class="ladder-step" style="--c:${p.color};--i:${i}"><b>${p.name}</b><span class="age">${p.age} лет</span><p>${p.what.ru}</p></div>`,
    en: `<div class="ladder-step" style="--c:${p.color};--i:${i}"><b>${p.name}</b><span class="age">ages ${p.age}</span><p>${p.what.en}</p></div>`,
  })).reduce((acc, s) => ({ kk: acc.kk + s.kk, ru: acc.ru + s.ru, en: acc.en + s.en }), { kk: '', ru: '', en: '' });
}
const LADDER = programsLadder();

const ROBOT_SVG = `
<svg class="robot-figure" viewBox="0 0 470 230" role="img">
  <defs><marker id="ar" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#64748b"/></marker></defs>
  <rect x="140" y="62" width="150" height="16" rx="5" fill="#23272f"/>
  <rect x="140" y="152" width="150" height="16" rx="5" fill="#23272f"/>
  <rect x="120" y="74" width="190" height="82" rx="14" fill="#ffd43b"/>
  <rect x="136" y="86" width="120" height="58" rx="10" fill="#fff" stroke="#cbd5e1"/>
  <circle cx="196" cy="115" r="12" fill="#3ddc84"/>
  <rect x="296" y="90" width="16" height="50" rx="5" fill="#2b2f36"/>
  <circle cx="304" cy="103" r="5" fill="#7fd1ff"/><circle cx="304" cy="127" r="5" fill="#7fd1ff"/>
  <circle cx="276" cy="115" r="8" fill="none" stroke="#e5484d" stroke-width="3"/>
  <path d="M330 115 h70" stroke="#e5484d" stroke-dasharray="5 5" stroke-width="2"/>
  <path d="M60 30 L170 66" stroke="#64748b" marker-end="url(#ar)"/>
  <path d="M60 200 L170 166" stroke="#64748b" marker-end="url(#ar)"/>
  <path d="M120 112 L184 114" stroke="#64748b" marker-end="url(#ar)"/>
  <path d="M352 40 L310 88" stroke="#64748b" marker-end="url(#ar)"/>
  <path d="M260 200 L274 126" stroke="#64748b" marker-end="url(#ar)"/>
  <text x="8" y="24" class="lbl" data-k="motorL">motor</text>
  <text x="8" y="218" class="lbl" data-k="motorR">motor</text>
  <text x="8" y="110" class="lbl" data-k="hub">hub</text>
  <text x="318" y="30" class="lbl" data-k="dist">distance</text>
  <text x="200" y="222" class="lbl" data-k="color">color</text>
</svg>`;

const robotFigure = (labels) => {
  let s = ROBOT_SVG;
  for (const [k, v] of Object.entries(labels)) s = s.replace(new RegExp(`data-k="${k}">[^<]*<`), `data-k="${k}">${v}<`);
  return s;
};

// ---------------- fields ----------------

const FIELD_DRIVE = {
  size: SIZE,
  floor: [
    { id: 'home', type: 'rect', x: 0, y: 40, w: 36, h: 40, color: 'blue', label: 'HOME' },
    { id: 'cubezone', type: 'rect', x: 120, y: 88, w: 40, h: 32, color: 'yellow', label: { kk: 'Текше', ru: 'Кубик', en: 'Cube' } },
    { id: 'park', type: 'rect', x: 160, y: 10, w: 34, h: 34, color: 'green', label: { kk: 'Тұрақ', ru: 'Парковка', en: 'Park' } },
  ],
  walls: [{ x: 85, y: 0, w: 8, h: 55 }],
  objects: [{ id: 'cube', x: 70, y: 95, r: 4 }],
  robot: { x: 18, y: 60, dir: 0 },
};

const FIELD_M1 = {
  size: SIZE,
  floor: [
    { id: 'home', type: 'rect', x: 5, y: 45, w: 30, h: 30, color: 'blue', label: 'START' },
    { id: 'goal', type: 'rect', x: 123, y: 45, w: 24, h: 30, color: 'green', label: { kk: 'Мақсат', ru: 'Цель', en: 'Goal' } },
  ],
  robot: { x: 25, y: 60, dir: 0 },
};

const FIELD_M2 = {
  size: SIZE,
  floor: [
    { id: 'home', type: 'rect', x: 8, y: 5, w: 34, h: 30, color: 'blue', label: 'START' },
    { id: 'goal', type: 'rect', x: 137, y: 10, w: 26, h: 30, color: 'green', label: { kk: 'Мақсат', ru: 'Цель', en: 'Goal' } },
  ],
  walls: [{ x: 50, y: 0, w: 10, h: 85 }],
  robot: { x: 25, y: 20, dir: 90 },
};

const FIELD_M3 = {
  size: SIZE,
  floor: [
    { id: 'start', type: 'circle', x: 65, y: 25, r: 9, color: 'blue', label: 'S' },
    { id: 'p1', type: 'circle', x: 65, y: 95, r: 7, color: 'yellow', label: '1' },
    { id: 'p2', type: 'circle', x: 135, y: 95, r: 7, color: 'yellow', label: '2' },
    { id: 'p3', type: 'circle', x: 135, y: 25, r: 7, color: 'yellow', label: '3' },
  ],
  walls: [{ x: 82, y: 42, w: 36, h: 36 }],
  robot: { x: 65, y: 25, dir: 90 },
};

const M4_WALLS = [150, 95, 125]; // the wall moves between test runs; the first one is shown
const fieldM4 = (X) => ({
  size: SIZE,
  floor: [
    { id: 'home', type: 'rect', x: 5, y: 45, w: 30, h: 30, color: 'blue', label: 'START' },
    // Robot centre here ⇔ the front sensor is 4…15 cm from the wall.
    { id: 'park', type: 'rect', x: X - ROBOT.eyeAhead - 15, y: 40, w: 11, h: 40, color: 'yellow' },
  ],
  walls: [{ x: X, y: 15, w: 8, h: 90 }],
  robot: { x: 20, y: 60, dir: 0 },
});

const LINE_PTS = [[12, 30], [60, 30], [85, 40], [100, 65], [120, 85], [150, 90], [175, 80], [185, 60]];
const FIELD_M5 = {
  size: SIZE,
  floor: [
    { id: 'home', type: 'rect', x: 0, y: 18, w: 22, h: 24, color: 'blue' },
    { type: 'line', pts: LINE_PTS, width: 2.5, color: 'black' },
    { id: 'finish', type: 'circle', x: 185, y: 50, r: 9, color: 'red' },
  ],
  robot: { x: 14, y: 30, dir: 0 },
};

const FIELD_M6 = {
  size: SIZE,
  floor: [
    { id: 'home', type: 'rect', x: 0, y: 40, w: 40, h: 40, color: 'blue', label: 'HOME' },
    { id: 'goal', type: 'rect', x: 160, y: 0, w: 40, h: 120, color: 'green', label: { kk: '10 ұпай', ru: '10 очков', en: '10 pts' } },
  ],
  objects: [{ id: 'a', x: 60, y: 60 }, { id: 'b', x: 100, y: 95 }, { id: 'c', x: 100, y: 25 }],
  robot: { x: 20, y: 60, dir: 0 },
};

// ---------------- checks ----------------

const say = (kk, ru, en) => ({ kk, ru, en });

function usesLoop(ctx) {
  return ctx.mode === 'python' ? /\b(for|while)\b/.test(ctx.code) : /\b(for|while)\s*\(/.test(ctx.code);
}

export default {
  id: 'first',
  icon: '🏆',
  title: { kk: 'FIRST әлемі', ru: 'Мир FIRST', en: 'The world of FIRST' },
  subtitle: {
    kk: 'FIRST деген не, оның бағдарламалары мен құндылықтары — және роботқа алғашқы автономды бағдарлама.',
    ru: 'Что такое FIRST, его программы и ценности — и первые автономные программы для робота.',
    en: 'What FIRST is, its programs and values — and your robot’s first autonomous programs.',
  },
  steps: [
    // 1 ─────────────────────────────────────────────
    {
      id: 'what', kind: 'theory',
      title: { kk: 'FIRST деген не?', ru: 'Что такое FIRST?', en: 'What is FIRST?' },
      html: {
        kk: `<p class="lead"><b>FIRST</b> — <i>For Inspiration and Recognition of Science and Technology</i>, яғни «ғылым мен технологияны шабыттандыру және мойындау». Бұл — балалар мен жасөспірімдерге арналған әлемдегі ең ірі робототехника жарыстарының бірі.</p>
<p>FIRST-ті 1989 жылы АҚШ-та өнертапқыш <b>Дин Кеймен</b> құрды. Оның идеясы: ғылым мен инженерия спорт сияқты қызықты болуы керек — командалар, жанкүйерлер, жарыс, мерекелік атмосфера. Қазір FIRST жарыстары 100-ден астам елде өтеді, оның ішінде Қазақстанда да.</p>
<h3>Бағдарламалар баспалдағы</h3><p>Әр жасқа өз бағдарламасы бар. Бала бір баспалдақтан келесісіне көтеріледі:</p>
<div class="ladder">${LADDER.kk}</div>
<div class="callout">💡 Біздің курстар осы баспалдақпен жүреді: LEGO SPIKE → FLL → FTC. Бұл бірінші сабақта робот бағдарламалаудың негізін үйренесің — ол барлық FIRST бағдарламасында керек.</div>`,
        ru: `<p class="lead"><b>FIRST</b> — <i>For Inspiration and Recognition of Science and Technology</i>, «вдохновение и признание науки и технологий». Это одно из крупнейших в мире движений робототехнических соревнований для детей и подростков.</p>
<p>FIRST основал в 1989 году в США изобретатель <b>Дин Кеймен</b>. Его идея: наука и инженерия должны быть такими же захватывающими, как спорт — команды, болельщики, соревнования, праздник. Сейчас соревнования FIRST проходят более чем в 100 странах, в том числе в Казахстане.</p>
<h3>Лестница программ</h3><p>У каждого возраста своя программа. Ребёнок поднимается со ступеньки на ступеньку:</p>
<div class="ladder">${LADDER.ru}</div>
<div class="callout">💡 Наши курсы идут по этой лестнице: LEGO SPIKE → FLL → FTC. В этом первом уроке ты освоишь основу программирования роботов — она нужна во всех программах FIRST.</div>`,
        en: `<p class="lead"><b>FIRST</b> stands for <i>For Inspiration and Recognition of Science and Technology</i>. It is one of the world’s largest robotics competition movements for kids and teens.</p>
<p>FIRST was founded in 1989 in the USA by inventor <b>Dean Kamen</b>. His idea: science and engineering should be as exciting as sports — teams, fans, competitions, celebration. Today FIRST events run in more than 100 countries, Kazakhstan included.</p>
<h3>The ladder of programs</h3><p>Every age has its own program, and students climb from one step to the next:</p>
<div class="ladder">${LADDER.en}</div>
<div class="callout">💡 Our courses follow this ladder: LEGO SPIKE → FLL → FTC. In this first lesson you learn the basics of programming a robot — you need them in every FIRST program.</div>`,
      },
    },
    // 2 ─────────────────────────────────────────────
    {
      id: 'quiz1', kind: 'quiz',
      title: { kk: 'Тест: бағдарламалар', ru: 'Тест: программы', en: 'Quiz: programs' },
      questions: [
        {
          q: say('Айгерімге 7 жас. Ол қай бағдарламаға қатыса алады?', 'Айгерим 7 лет. В какой программе она может участвовать?', 'Aigerim is 7. Which program can she join?'),
          options: ['FIRST LEGO League Explore', 'FIRST Tech Challenge', 'FIRST Robotics Competition'],
          answer: 0,
          explain: say('Explore — 6–10 жасқа арналған.', 'Explore — для 6–10 лет.', 'Explore is for ages 6–10.'),
        },
        {
          q: say('FLL Challenge матчы қанша уақытқа созылады?', 'Сколько длится матч FLL Challenge?', 'How long is an FLL Challenge match?'),
          options: ['30 s', '2:30', '10:00'],
          answer: 1,
          explain: say('2 минут 30 секунд, робот миссияларды өзі орындайды.', '2 минуты 30 секунд, робот выполняет миссии сам.', '2 minutes 30 seconds, and the robot runs the missions by itself.'),
        },
        {
          q: say('FTC-де роботтар неден жасалады?', 'Из чего строят роботов в FTC?', 'What are FTC robots built from?'),
          options: [
            say('Тек LEGO-дан', 'Только из LEGO', 'Only LEGO'),
            say('Металл және пластик бөлшектерден (REV, goBILDA, TETRIX)', 'Из металлических и пластиковых деталей (REV, goBILDA, TETRIX)', 'Metal and plastic parts (REV, goBILDA, TETRIX)'),
            say('Картоннан', 'Из картона', 'Cardboard'),
          ],
          answer: 1,
          explain: say('FTC-де металл конструкторлар, моторлар мен контроллерлер қолданылады — ол туралы REV, Tetrix, goBILDA курстарында.', 'В FTC используют металлические конструкторы, моторы и контроллеры — об этом будут курсы REV, Tetrix, goBILDA.', 'FTC uses metal building systems, motors and controllers — see the REV, Tetrix and goBILDA courses.'),
        },
      ],
    },
    // 3 ─────────────────────────────────────────────
    {
      id: 'values', kind: 'theory',
      title: { kk: 'Құндылықтар және Gracious Professionalism', ru: 'Ценности и Gracious Professionalism', en: 'Core Values and Gracious Professionalism' },
      html: {
        kk: `<p class="lead">FIRST-те тек робот емес, <b>команда қалай жұмыс істейтіні</b> де бағаланады. FLL-де төрешілер командалардың негізгі құндылықтарын бағалайды.</p>
<div class="values">
<div><span>🔍</span><b>Discovery</b><p>Жаңа нәрсені зерттейміз</p></div>
<div><span>💡</span><b>Innovation</b><p>Шығармашылықпен шешім табамыз</p></div>
<div><span>🌍</span><b>Impact</b><p>Үйренгенімізді әлемді жақсартуға қолданамыз</p></div>
<div><span>🤝</span><b>Inclusion</b><p>Бір-бірімізді құрметтейміз, айырмашылықты бағалаймыз</p></div>
<div><span>👥</span><b>Teamwork</b><p>Бірге күштіміз</p></div>
<div><span>🎉</span><b>Fun</b><p>Жасаған ісімізден қуанамыз</p></div>
</div>
<h3>Gracious Professionalism® және Coopertition®</h3>
<p>Бұл терминдерді MIT профессоры <b>Вуди Флауэрс</b> ұсынған. <b>Gracious Professionalism</b> — қатты жарыса отырып, қарсыласты құрметтеу және сапалы жұмыс істеу. <b>Coopertition</b> — <i>cooperation + competition</i>: жарыста да басқа командаға көмектесу. Мысалы, көрші команданың роботы сынса, оларға бөлшек немесе кеңес беру — FIRST-те бұл қалыпты жағдай.</p>
<h3>Инженерлік цикл</h3>
<div class="cycle"><span>❓ Сұрақ</span><span>💭 Идея</span><span>📝 Жоспар</span><span>🔧 Жасау</span><span>🧪 Сынау</span><span>⬆️ Жақсарту</span></div>
<p>Әр миссияда осылай жұмыс істейміз: код жаздық → іске қостық → не болғанын көрдік → түзеттік. Қате — жеңілу емес, ақпарат!</p>`,
        ru: `<p class="lead">В FIRST оценивают не только робота, но и <b>то, как работает команда</b>. В FLL судьи оценивают базовые ценности команды.</p>
<div class="values">
<div><span>🔍</span><b>Discovery</b><p>Исследуем новое</p></div>
<div><span>💡</span><b>Innovation</b><p>Находим творческие решения</p></div>
<div><span>🌍</span><b>Impact</b><p>Применяем знания, чтобы сделать мир лучше</p></div>
<div><span>🤝</span><b>Inclusion</b><p>Уважаем друг друга и ценим различия</p></div>
<div><span>👥</span><b>Teamwork</b><p>Вместе мы сильнее</p></div>
<div><span>🎉</span><b>Fun</b><p>Радуемся тому, что делаем</p></div>
</div>
<h3>Gracious Professionalism® и Coopertition®</h3>
<p>Эти слова придумал профессор MIT <b>Вуди Флауэрс</b>. <b>Gracious Professionalism</b> — соревноваться изо всех сил, но уважать соперников и делать работу качественно. <b>Coopertition</b> — <i>cooperation + competition</i>: помогать другим командам даже во время соревнования. Например, если у соседней команды сломался робот — дать им деталь или совет. В FIRST это нормально.</p>
<h3>Инженерный цикл</h3>
<div class="cycle"><span>❓ Вопрос</span><span>💭 Идея</span><span>📝 План</span><span>🔧 Создание</span><span>🧪 Тест</span><span>⬆️ Улучшение</span></div>
<p>Так мы будем работать в каждой миссии: написали код → запустили → посмотрели, что вышло → исправили. Ошибка — это не провал, а информация!</p>`,
        en: `<p class="lead">In FIRST it is not only the robot that matters, but also <b>how the team works</b>. In FLL, judges look at a team’s Core Values.</p>
<div class="values">
<div><span>🔍</span><b>Discovery</b><p>We explore new things</p></div>
<div><span>💡</span><b>Innovation</b><p>We find creative solutions</p></div>
<div><span>🌍</span><b>Impact</b><p>We use what we learn to improve our world</p></div>
<div><span>🤝</span><b>Inclusion</b><p>We respect each other and embrace our differences</p></div>
<div><span>👥</span><b>Teamwork</b><p>We are stronger when we work together</p></div>
<div><span>🎉</span><b>Fun</b><p>We enjoy and celebrate what we do</p></div>
</div>
<h3>Gracious Professionalism® and Coopertition®</h3>
<p>MIT professor <b>Woodie Flowers</b> coined these words. <b>Gracious Professionalism</b> means competing hard while respecting others and doing high-quality work. <b>Coopertition</b> is <i>cooperation + competition</i>: helping other teams even while you compete. If a neighbouring team’s robot breaks, you lend them a part or some advice — that is normal in FIRST.</p>
<h3>The engineering design cycle</h3>
<div class="cycle"><span>❓ Ask</span><span>💭 Imagine</span><span>📝 Plan</span><span>🔧 Create</span><span>🧪 Test</span><span>⬆️ Improve</span></div>
<p>That is how we will work in every mission: write code → run it → look at what happened → fix it. A mistake is not a failure, it is information!</p>`,
      },
    },
    // 4 ─────────────────────────────────────────────
    {
      id: 'quiz2', kind: 'quiz',
      title: { kk: 'Тест: команда рухы', ru: 'Тест: дух команды', en: 'Quiz: team spirit' },
      questions: [
        {
          q: say('Жарыста көрші команданың роботындағы мотор сынды. Сенде қосалқы мотор бар. Не істейсің?', 'На соревновании у соседней команды сломался мотор. У вас есть запасной. Что вы сделаете?', 'At a competition another team’s motor breaks. You have a spare. What do you do?'),
          options: [
            say('Ештеңе — олар біздің қарсыласымыз', 'Ничего — они же наши соперники', 'Nothing — they are our rivals'),
            say('Моторды береміз: бұл — Coopertition', 'Дадим мотор: это Coopertition', 'Lend them the motor: that is Coopertition'),
            say('Төрешіге шағымданамыз', 'Пожалуемся судье', 'Complain to the referee'),
          ],
          answer: 1,
          explain: say('FIRST-те жақсы роботпен ғана емес, құрметпен де жеңеді.', 'В FIRST побеждают не только хорошим роботом, но и уважением.', 'In FIRST you win with respect, not only with a good robot.'),
        },
        {
          q: say('Робот миссияны орындамады. Инженерлік циклдегі келесі қадам қандай?', 'Робот не выполнил миссию. Какой следующий шаг инженерного цикла?', 'The robot failed a mission. What is the next step in the design cycle?'),
          options: [
            say('Бәрін тастап, басқа іспен айналысу', 'Всё бросить', 'Give up'),
            say('Не болғанын қарап, кодты жақсарту және қайта сынау', 'Посмотреть, что случилось, улучшить код и снова протестировать', 'Look at what happened, improve the code and test again'),
            say('Роботты кінәлау', 'Обвинить робота', 'Blame the robot'),
          ],
          answer: 1,
          explain: say('Сынау → жақсарту → қайта сынау. Әр инженер осылай жұмыс істейді.', 'Тест → улучшение → снова тест. Так работает каждый инженер.', 'Test → improve → test again. That is how every engineer works.'),
        },
        {
          q: say('Gracious Professionalism терминін кім ұсынды?', 'Кто придумал выражение Gracious Professionalism?', 'Who coined Gracious Professionalism?'),
          options: ['Woodie Flowers', 'Elon Musk', 'Dean Kamen'],
          answer: 0,
          explain: say('Вуди Флауэрс — MIT профессоры, FIRST-тің ұлы тәлімгері.', 'Вуди Флауэрс — профессор MIT, великий наставник FIRST.', 'Woodie Flowers, MIT professor and legendary FIRST mentor.'),
        },
      ],
    },
    // 5 ─────────────────────────────────────────────
    {
      id: 'robot', kind: 'theory',
      title: { kk: 'Робот қалай жұмыс істейді', ru: 'Как устроен робот', en: 'How a robot works' },
      html: {
        kk: `<p class="lead">Кез келген робот үш нәрсені қайталайды: <b>сезу → ойлау → әрекет ету</b>.</p>
<div class="sta"><div>👀<b>Сезу</b><p>Датчиктер әлем туралы ақпарат жинайды</p></div><div>🧠<b>Ойлау</b><p>Бағдарлама шешім қабылдайды</p></div><div>⚙️<b>Әрекет</b><p>Моторлар роботты қозғалтады</p></div></div>
<h3>Біздің робот</h3>
${robotFigure({ motorL: 'Сол мотор', motorR: 'Оң мотор', hub: 'Хаб (ми)', dist: 'Қашықтық датчигі', color: 'Түс датчигі' })}
<ul><li><b>Екі мотор мен екі дөңгелек</b>: екеуі алға — робот тура жүреді; біреуі алға, біреуі артқа — орнында бұрылады.</li>
<li><b>Түс датчигі</b> төмен қарайды: еденнің түсін және шағылысқан жарықты (0 — қара, 100 — ақ) өлшейді.</li>
<li><b>Қашықтық датчигі</b> алға қарайды: алдындағы кедергіге дейінгі қашықтықты см-мен көрсетеді.</li></ul>
<h3>Матч кезеңдері</h3><p>FTC матчында алдымен <b>автономды кезең</b> (30 с) — робот тек бағдарлама бойынша жүреді. Содан кейін <b>операторлық кезең</b> (2 мин) — роботты жүргізушілер пульттен басқарады. FLL Challenge-де бүкіл матч автономды.</p>
<p>Келесі қадамда роботты өзің басқарасың, содан кейін — бағдарламалайсың.</p>`,
        ru: `<p class="lead">Любой робот повторяет три действия: <b>чувствует → думает → действует</b>.</p>
<div class="sta"><div>👀<b>Чувствует</b><p>Датчики собирают информацию о мире</p></div><div>🧠<b>Думает</b><p>Программа принимает решение</p></div><div>⚙️<b>Действует</b><p>Моторы двигают робота</p></div></div>
<h3>Наш робот</h3>
${robotFigure({ motorL: 'Левый мотор', motorR: 'Правый мотор', hub: 'Хаб (мозг)', dist: 'Датчик расстояния', color: 'Датчик цвета' })}
<ul><li><b>Два мотора и два колеса</b>: оба вперёд — робот едет прямо; один вперёд, другой назад — поворачивает на месте.</li>
<li><b>Датчик цвета</b> смотрит вниз: определяет цвет пола и отражённый свет (0 — чёрный, 100 — белый).</li>
<li><b>Датчик расстояния</b> смотрит вперёд: показывает расстояние до препятствия в сантиметрах.</li></ul>
<h3>Периоды матча</h3><p>В матче FTC сначала идёт <b>автономный период</b> (30 с) — робот едет только по программе. Потом <b>управляемый период</b> (2 мин) — водители управляют роботом с геймпада. В FLL Challenge весь матч автономный.</p>
<p>На следующем шаге ты сам поуправляешь роботом, а потом — запрограммируешь его.</p>`,
        en: `<p class="lead">Every robot repeats three things: <b>sense → think → act</b>.</p>
<div class="sta"><div>👀<b>Sense</b><p>Sensors collect information about the world</p></div><div>🧠<b>Think</b><p>The program makes a decision</p></div><div>⚙️<b>Act</b><p>Motors move the robot</p></div></div>
<h3>Our robot</h3>
${robotFigure({ motorL: 'Left motor', motorR: 'Right motor', hub: 'Hub (brain)', dist: 'Distance sensor', color: 'Color sensor' })}
<ul><li><b>Two motors and two wheels</b>: both forward — the robot drives straight; one forward, one back — it turns on the spot.</li>
<li>The <b>color sensor</b> looks down: it reads the floor colour and reflected light (0 black, 100 white).</li>
<li>The <b>distance sensor</b> looks ahead: it tells how many centimetres to the obstacle in front.</li></ul>
<h3>Match periods</h3><p>An FTC match starts with the <b>autonomous period</b> (30 s), when the robot follows its program only. Then comes the <b>driver-controlled period</b> (2 min), when drivers use gamepads. In FLL Challenge the whole match is autonomous.</p>
<p>In the next step you will drive the robot yourself, and then you will program it.</p>`,
      },
    },
    // 6 ─────────────────────────────────────────────
    {
      id: 'drive', kind: 'drive',
      title: { kk: 'Операторлық кезең', ru: 'Управляемый период', en: 'Driver-controlled period' },
      html: {
        kk: '<p>Сен — жүргізушісің! Қызғылт сары текшені <b>сары аймаққа</b> итер, содан кейін роботты <b>жасыл тұраққа</b> қой.</p>',
        ru: '<p>Ты — водитель! Затолкай оранжевый кубик в <b>жёлтую зону</b>, а потом поставь робота на <b>зелёную парковку</b>.</p>',
        en: '<p>You are the driver! Push the orange cube into the <b>yellow zone</b>, then park the robot in the <b>green zone</b>.</p>',
      },
      after: {
        kk: 'Тамаша! Байқадың ба: қолмен басқару оңай, бірақ әр жолы сәл басқаша шығады. Енді роботқа бағдарлама жазамыз — ол әр жолы бірдей жүреді.',
        ru: 'Отлично! Заметил? Вручную управлять просто, но каждый раз выходит немного по-разному. Теперь напишем роботу программу — она каждый раз сработает одинаково.',
        en: 'Great! Did you notice? Driving by hand is easy, but it comes out a little different every time. Now let’s write a program — it runs the same way every time.',
      },
      field: FIELD_DRIVE,
      goal: (w) => w.objectsInZone('cubezone').length > 0 && w.robotInZone('park'),
    },
    // 7 ─────────────────────────────────────────────
    {
      id: 'm1', kind: 'mission',
      title: { kk: '1-миссия: Алға!', ru: 'Миссия 1: Вперёд!', en: 'Mission 1: Forward!' },
      task: {
        kk: `<p>Роботты <b>жасыл аймаққа</b> апар. Тордағы әр шаршы — <b>10 см</b>.</p><p>Бағдарлама <code>▶ басталғанда</code> блогынан басталады. «алға жүру» блогындағы санды өзгерт де, <b>Іске қосу</b> батырмасын бас.</p>`,
        ru: `<p>Доведи робота до <b>зелёной зоны</b>. Каждая клетка сетки — <b>10 см</b>.</p><p>Программа начинается с блока <code>▶ при запуске</code>. Поменяй число в блоке «вперёд на» и нажми <b>Запуск</b>.</p>`,
        en: `<p>Drive the robot into the <b>green zone</b>. Each grid square is <b>10 cm</b>.</p><p>The program starts at the <code>▶ when started</code> block. Change the number in “move forward” and press <b>Run</b>.</p>`,
      },
      field: FIELD_M1,
      timeLimit: 20,
      blocks: ['ul_forward', 'ul_backward'],
      starter: { blocks: B.program(B.fwd(20)), python: 'from robot import *\n\nforward(20)\n' },
      hints: [
        say('Робот ортасынан жасыл аймақтың ортасына дейін қанша тор бар? Санап көр.', 'Посчитай клетки от центра робота до середины зелёной зоны.', 'Count the squares from the centre of the robot to the middle of the green zone.'),
        say('Робот ортасы x = 25 см-де, жасыл аймақтың ортасы x = 135 см-де.', 'Центр робота на x = 25 см, середина зелёной зоны — на x = 135 см.', 'The robot centre is at x = 25 cm, the middle of the green zone at x = 135 cm.'),
      ],
      solution: 'from robot import *\n\nforward(110)\n',
      check(ctx) {
        if (ctx.world.robotInZone('goal')) return { ok: true };
        const x = ctx.final.robot.x;
        return x < 123
          ? { ok: false, text: say('Робот жетпей тұр — санды үлкейт.', 'Робот не доехал — увеличь число.', 'Not far enough — use a bigger number.') }
          : { ok: false, text: say('Робот асып кетті — санды азайт.', 'Робот проехал дальше — уменьши число.', 'Too far — use a smaller number.') };
      },
      learned: say('Робот <b>тізбекпен</b> жұмыс істейді: блоктарды жоғарыдан төмен қарай бір-бірден орындайды.', 'Робот выполняет блоки <b>по порядку</b>: сверху вниз, по одному.', 'The robot runs blocks <b>in sequence</b>: top to bottom, one at a time.'),
    },
    // 8 ─────────────────────────────────────────────
    {
      id: 'm2', kind: 'mission',
      title: { kk: '2-миссия: Бұрылыстар', ru: 'Миссия 2: Повороты', en: 'Mission 2: Turns' },
      task: {
        kk: '<p>Қабырғаны айналып өтіп, <b>жасыл аймаққа</b> жет. Қабырғаға тиюге болмайды!</p><p>Жоспар: жоғары → оңға бұрылу → оңға жүру → төмен.</p>',
        ru: '<p>Объедь стену и доберись до <b>зелёной зоны</b>. Стену задевать нельзя!</p><p>План: вверх → поворот направо → вправо → вниз.</p>',
        en: '<p>Get around the wall to the <b>green zone</b> without touching the wall!</p><p>Plan: up → turn right → right → down.</p>',
      },
      field: FIELD_M2,
      timeLimit: 40,
      blocks: ['ul_forward', 'ul_backward', 'ul_turn_right', 'ul_turn_left'],
      starter: { blocks: B.program(B.fwd(80), B.right(90)), python: 'from robot import *\n\nforward(80)\nturn_right(90)\n' },
      hints: [
        say('Қабырғаның үстіңгі шеті y = 85 см. Оның үстінен өту үшін робот y = 100 см-ге көтерілуі керек.', 'Верх стены на y = 85 см. Чтобы проехать над ней, робот поднимается до y = 100 см.', 'The top of the wall is at y = 85 cm, so drive up to y = 100 cm to pass above it.'),
        say('Бұрылғаннан кейін x = 25-тен x = 150-ге дейін: 125 см. Содан кейін тағы оңға бұрылып, төмен 75 см.', 'После поворота от x = 25 до x = 150 — это 125 см. Потом снова направо и вниз на 75 см.', 'After the turn, from x = 25 to x = 150 is 125 cm. Then turn right again and go down 75 cm.'),
      ],
      solution: 'from robot import *\n\nforward(80)\nturn_right(90)\nforward(125)\nturn_right(90)\nforward(75)\n',
      check(ctx) {
        if (ctx.final.wallHits > 0) return { ok: false, text: say('Робот қабырғаға тиді. Жолды басқаша жоспарла.', 'Робот задел стену. Спланируй путь иначе.', 'The robot touched the wall. Plan another path.') };
        if (!ctx.world.robotInZone('goal')) return { ok: false, text: say('Робот жасыл аймаққа жетпеді.', 'Робот не в зелёной зоне.', 'The robot is not in the green zone.') };
        return { ok: true };
      },
      learned: say('<b>Бұрылыс</b> — бір дөңгелек алға, екіншісі артқа. 90° — тік бұрыш.', '<b>Поворот на месте</b> — одно колесо вперёд, другое назад. 90° — прямой угол.', 'A <b>spin turn</b> is one wheel forward and the other back. 90° is a right angle.'),
    },
    // 9 ─────────────────────────────────────────────
    {
      id: 'm3', kind: 'mission',
      title: { kk: '3-миссия: Цикл', ru: 'Миссия 3: Цикл', en: 'Mission 3: Loops' },
      task: {
        kk: '<p>Кедергіні <b>шаршы бойымен</b> айналып шық: 1 → 2 → 3 нүктелері арқылы өтіп, <b>S</b> бастапқы нүктесіне орал. Шаршы қабырғасы — 70 см.</p><p>Бір әрекетті 4 рет қайталау керек. Оны 8 блокпен жазбай, <b>«қайталау»</b> блогын қолдан!</p>',
        ru: '<p>Объедь препятствие <b>по квадрату</b>: через точки 1 → 2 → 3 и обратно в <b>S</b>. Сторона квадрата — 70 см.</p><p>Одно и то же действие надо сделать 4 раза. Не пиши 8 блоков — используй блок <b>«повторить»</b>!</p>',
        en: '<p>Drive <b>around the block in a square</b>: through points 1 → 2 → 3 and back to <b>S</b>. Each side is 70 cm.</p><p>The same action repeats 4 times. Instead of 8 blocks, use the <b>repeat</b> block!</p>',
      },
      field: FIELD_M3,
      timeLimit: 60,
      blocks: ['ul_forward', 'ul_backward', 'ul_turn_right', 'ul_turn_left', 'ul_repeat'],
      starter: { blocks: B.program(B.repeat(1, [B.fwd(70)])), python: 'from robot import *\n\nfor i in range(1):\n    forward(70)\n' },
      hints: [
        say('Шаршының бір қабырғасы: «алға 70», содан кейін «оңға 90°».', 'Одна сторона квадрата: «вперёд 70», потом «направо 90°».', 'One side of the square: forward 70, then turn right 90°.'),
        say('Осы екі блокты «4 рет қайталау» ішіне сал.', 'Положи эти два блока внутрь «повторить 4 раз».', 'Put both blocks inside “repeat 4 times”.'),
      ],
      solution: 'from robot import *\n\nfor i in range(4):\n    forward(70)\n    turn_right(90)\n',
      check(ctx) {
        const v = ctx.final.zonesVisited;
        const miss = ['p1', 'p2', 'p3'].filter((z) => v[z] == null);
        if (ctx.final.wallHits > 0) return { ok: false, text: say('Робот кедергіге тиді.', 'Робот задел препятствие.', 'The robot hit the block.') };
        if (miss.length) return { ok: false, text: say(`Робот ${miss.map((m) => m[1]).join(', ')} нүктесіне жетпеді.`, `Робот не проехал через точку ${miss.map((m) => m[1]).join(', ')}.`, `The robot missed point ${miss.map((m) => m[1]).join(', ')}.`) };
        if (!(v.p1 < v.p2 && v.p2 < v.p3)) return { ok: false, text: say('Нүктелер ретімен емес: 1 → 2 → 3.', 'Точки не по порядку: нужно 1 → 2 → 3.', 'Points out of order: it must be 1 → 2 → 3.') };
        if (!ctx.world.robotInZone('start')) return { ok: false, text: say('Соңында робот S нүктесіне оралуы керек.', 'В конце робот должен вернуться в S.', 'At the end the robot must be back at S.') };
        if (!usesLoop(ctx)) return { ok: true, stars: 2, text: say('Жұмыс істейді! Ал енді «қайталау» блогымен қысқарақ жазып көр — ⭐⭐⭐ үшін.', 'Работает! А теперь запиши короче через «повторить» — для ⭐⭐⭐.', 'It works! Now write it shorter with repeat for ⭐⭐⭐.') };
        return { ok: true };
      },
      learned: say('<b>Цикл</b> бір әрекетті бірнеше рет қайталайды. Код қысқа болады, қате азаяды.', '<b>Цикл</b> повторяет действия несколько раз. Код короче — ошибок меньше.', 'A <b>loop</b> repeats actions. Shorter code means fewer mistakes.'),
    },
    // 10 ─────────────────────────────────────────────
    {
      id: 'm4', kind: 'mission',
      title: { kk: '4-миссия: Қашықтық датчигі', ru: 'Миссия 4: Датчик расстояния', en: 'Mission 4: Distance sensor' },
      task: {
        kk: '<p>Робот қабырғаға қарай жүріп, оған <b>соқтықпай</b>, <b>сары жолақта</b> тоқтауы керек (қабырғаға дейін 4–15 см).</p><p>⚠️ Қиындығы: бағдарламаңды <b>3 рет</b> тексереміз, әр жолы қабырға басқа жерде тұрады! Сондықтан «алға 100 см» жарамайды — <b>датчикті</b> қолдан.</p>',
        ru: '<p>Робот должен подъехать к стене и остановиться <b>на жёлтой полосе</b> (4–15 см до стены), <b>не врезавшись</b>.</p><p>⚠️ Подвох: программу проверяем <b>3 раза</b>, и каждый раз стена стоит в другом месте! Поэтому «вперёд на 100» не подойдёт — используй <b>датчик</b>.</p>',
        en: '<p>Drive up to the wall and stop <b>on the yellow strip</b> (4–15 cm from the wall) <b>without crashing</b>.</p><p>⚠️ The catch: your program runs <b>3 times</b> and the wall is somewhere else each time! So “forward 100” won’t do — use the <b>sensor</b>.</p>',
      },
      fields: M4_WALLS.map(fieldM4),
      showRay: true,
      timeLimit: 30,
      blocks: ['ul_forward', 'ul_drive', 'ul_stop', 'ul_wait_until', 'ul_repeat_until', 'ul_compare', 'ul_distance', 'ul_wait', 'ul_say'],
      starter: { blocks: B.program(B.drive(50, 50), B.waitUntil(null), B.stop()), python: 'from robot import *\n\ndrive(50, 50)\n# wait until the wall is close…\n\nstop()\n' },
      hints: [
        say('«моторларды қосу» робот жүре береді, ал бағдарлама келесі блокқа өтеді.', '«включить моторы» запускает робота, а программа сразу идёт к следующему блоку.', '“start motors” sets the robot moving and the program goes on to the next block.'),
        say('«… болғанша күту» ішіне «қашықтық < 10» салыңыз.', 'Вставь в «ждать до …» условие «расстояние < 10».', 'Put “distance < 10” into “wait until …”.'),
        say('Python: while distance() > 10:\n    pass', 'Python: while distance() > 10:\n    pass', 'Python: while distance() > 10:\n    pass'),
      ],
      solution: 'from robot import *\n\ndrive(50, 50)\nwhile distance() > 10:\n    pass\nstop()\n',
      check(ctx) {
        if (ctx.final.wallHits > 0) return { ok: false, text: say('Робот қабырғаға соқтығысты!', 'Робот врезался в стену!', 'The robot crashed into the wall!') };
        if (!ctx.world.robotInZone('park')) return { ok: false, text: say('Робот сары жолақта тоқтаған жоқ.', 'Робот остановился не на жёлтой полосе.', 'The robot did not stop on the yellow strip.') };
        return { ok: true };
      },
      learned: say('<b>Датчик</b> роботқа әлемді «көруге» көмектеседі: бағдарлама жағдай өзгерсе де жұмыс істейді.', '<b>Датчик</b> позволяет роботу «видеть»: программа работает, даже когда обстановка меняется.', 'A <b>sensor</b> lets the robot “see”, so the program works even when the field changes.'),
    },
    // 11 ─────────────────────────────────────────────
    {
      id: 'm5', kind: 'mission',
      title: { kk: '5-миссия: Сызық бойымен', ru: 'Миссия 5: По линии', en: 'Mission 5: Line follower' },
      task: {
        kk: '<p>Қара сызық бойымен <b>қызыл мәреге</b> дейін жүр. Бұл — FLL-дегі ең танымал тапсырмалардың бірі!</p><p>Идея: датчик <b>сызықтың шетін</b> бақылайды. Қара көрсе — бір жаққа бұрылады, ақ көрсе — екінші жаққа. Робот шет бойымен «жыланша» жүреді.</p>',
        ru: '<p>Проедь по чёрной линии до <b>красного финиша</b>. Это одна из самых известных задач FLL!</p><p>Идея: датчик следит за <b>краем линии</b>. Видит чёрное — подворачивает в одну сторону, белое — в другую. Робот едет вдоль края «змейкой».</p>',
        en: '<p>Follow the black line to the <b>red finish</b>. It is one of the most famous FLL tasks!</p><p>Idea: the sensor tracks the <b>edge of the line</b>. On black, steer one way; on white, the other. The robot wiggles along the edge.</p>',
      },
      field: FIELD_M5,
      timeLimit: 60,
      blocks: ['ul_drive', 'ul_stop', 'ul_forever', 'ul_if_else', 'ul_if', 'ul_repeat_until', 'ul_color_is', 'ul_reflection', 'ul_compare', 'ul_arith', 'ul_say', 'ul_beep', 'ul_light'],
      starter: {
        blocks: B.program(B.repeatUntil(B.colorIs('red'), [B.ifElse(B.colorIs('black'), [B.drive(50, 50)], [B.drive(50, 50)])]), B.stop()),
        python: "from robot import *\n\nwhile color() != 'red':\n    if color() == 'black':\n        drive(50, 50)\n    else:\n        drive(50, 50)\nstop()\n",
      },
      hints: [
        say('Қазір екі тармақта да бірдей жылдамдық — робот бұрылмайды. Бір тармақта сол мотор жылдамырақ болсын, екіншісінде — оң мотор.', 'Сейчас в обеих ветках одинаковые скорости — робот не поворачивает. В одной ветке пусть быстрее левый мотор, в другой — правый.', 'Both branches have the same speeds, so the robot never turns. Make the left motor faster in one branch and the right one in the other.'),
        say('Байқап көр: қара → (50, 15), ақ → (15, 50).', 'Попробуй: чёрный → (50, 15), белый → (15, 50).', 'Try: black → (50, 15), white → (15, 50).'),
      ],
      solution: "from robot import *\n\nwhile color() != 'red':\n    if color() == 'black':\n        drive(50, 15)\n    else:\n        drive(15, 50)\nstop()\n\n# Pro: proportional control with reflected light\n# while color() != 'red':\n#     error = reflection() - 50\n#     drive(30 + error * 0.4, 30 - error * 0.4)\n",
      check(ctx) {
        const f = ctx.world.zone('finish');
        const r = ctx.final.robot;
        const near = Math.hypot(r.x - f.x, r.y - f.y) <= f.r + ROBOT.sensorAhead + 2;
        if (!near) return { ok: false, text: say('Робот мәреге жетпеді. Ол сызықтан шығып кетпеді ме? Жолын қара.', 'Робот не доехал до финиша. Не съехал ли он с линии? Посмотри на его след.', 'The robot did not reach the finish. Did it leave the line? Look at its path.') };
        if (ctx.final.t > 45) return { ok: true, stars: 2, text: say('Мәреге жеттің! Жылдамырақ бола ма? (45 секундтан аз — ⭐⭐⭐)', 'Финиш! А можно быстрее? (меньше 45 секунд — ⭐⭐⭐)', 'Finished! Can you go faster? (under 45 s for ⭐⭐⭐)') };
        return { ok: true };
      },
      learned: say('<b>Шарт (егер/әйтпесе)</b> мен <b>цикл</b> бірге — робот әр сәтте датчикке қарап шешім қабылдайды.', '<b>Условие (если/иначе)</b> внутри <b>цикла</b> — робот каждый миг смотрит на датчик и решает, что делать.', 'An <b>if/else</b> inside a <b>loop</b>: every moment the robot checks its sensor and decides.'),
    },
    // 12 ─────────────────────────────────────────────
    {
      id: 'm6', kind: 'mission',
      title: { kk: '6-миссия: Мини-матч', ru: 'Миссия 6: Мини-матч', en: 'Mission 6: Mini match' },
      task: {
        kk: '<p>Нағыз FIRST сияқты <b>30 секундтық автономды кезең</b>!</p><ul><li>Әр текше жасыл аймақта — <b>10 ұпай</b></li><li>Соңында робот HOME базасында — <b>20 ұпай</b></li></ul><p>Миссия үшін кемінде <b>30 ұпай</b> керек. Максимум — 50. Уақыт аз — <b>жылдамдықты</b> ойлан!</p>',
        ru: '<p>Как в настоящем FIRST: <b>автономный период 30 секунд</b>!</p><ul><li>Каждый кубик в зелёной зоне — <b>10 очков</b></li><li>Робот в конце на базе HOME — <b>20 очков</b></li></ul><p>Для миссии нужно хотя бы <b>30 очков</b>. Максимум — 50. Времени мало — подумай о <b>скорости</b>!</p>',
        en: '<p>Just like real FIRST: a <b>30-second autonomous period</b>!</p><ul><li>Each cube in the green zone — <b>10 points</b></li><li>Robot back in HOME at the end — <b>20 points</b></li></ul><p>You need at least <b>30 points</b>. The maximum is 50. Time is short — think about <b>speed</b>!</p>',
      },
      field: FIELD_M6,
      timeLimit: 30,
      blocks: null,
      starter: { blocks: B.program(B.speed(50), B.fwd(140)), python: 'from robot import *\n\nset_speed(50)\nforward(140)\n' },
      hints: [
        say('Бірінші текше дәл алдыңда: «алға 140» оны жасыл аймаққа итереді.', 'Первый кубик прямо перед тобой: «вперёд 140» затолкает его в зелёную зону.', 'The first cube is straight ahead: forward 140 pushes it into the green zone.'),
        say('Екінші текшеге: артқа 80, солға 90°, алға 35, оңға 90°, алға 80.', 'Ко второму кубику: назад 80, налево 90°, вперёд 35, направо 90°, вперёд 80.', 'For the second cube: back 80, left 90°, forward 35, right 90°, forward 80.'),
        say('50 % жылдамдықпен уақыт жетпейді. «жылдамдық 100 %» қолдан.', 'На скорости 50 % времени не хватит. Поставь «скорость 100 %».', 'At 50 % speed there is not enough time. Set the speed to 100 %.'),
      ],
      solution: 'from robot import *\n\nset_speed(100)\nforward(140)       # cube 1\nbackward(80)\nturn_left(90)\nforward(35)\nturn_right(90)\nforward(80)        # cube 2\nbackward(80)\nturn_right(90)\nforward(70)\nturn_left(90)\nforward(80)        # cube 3\nbackward(140)\nturn_left(90)\nforward(35)        # home\n',
      score(world) {
        const cubes = world.objectsInZone('goal').length;
        const home = world.robotInZone('home');
        return { cubes, home, total: cubes * 10 + (home ? 20 : 0) };
      },
      check(ctx) {
        const s = this.score(ctx.world);
        const line = say(
          `Текшелер: ${s.cubes} × 10 = ${s.cubes * 10} · База: ${s.home ? 20 : 0} · <b>Барлығы: ${s.total}</b>`,
          `Кубики: ${s.cubes} × 10 = ${s.cubes * 10} · База: ${s.home ? 20 : 0} · <b>Итого: ${s.total}</b>`,
          `Cubes: ${s.cubes} × 10 = ${s.cubes * 10} · Home: ${s.home ? 20 : 0} · <b>Total: ${s.total}</b>`,
        );
        if (s.total < 30) return { ok: false, text: line };
        return { ok: true, stars: s.total >= 50 ? 3 : s.total >= 40 ? 2 : 1, text: line };
      },
      learned: say('Сен нағыз матч стратегиясын құрдың: ұпай, уақыт және тәуекел арасындағы таңдау.', 'Ты построил настоящую стратегию матча: выбор между очками, временем и риском.', 'You built a real match strategy: balancing points, time and risk.'),
    },
    // 13 ─────────────────────────────────────────────
    {
      id: 'next', kind: 'theory', final: true,
      title: { kk: 'Құттықтаймыз!', ru: 'Поздравляем!', en: 'Congratulations!' },
      html: {
        kk: `<p class="lead">🎉 Сен FIRST әлеміне алғашқы қадам жасадың!</p>
<p>Сен үйрендің:</p><ul><li>FIRST деген не және оның бағдарламалары қандай</li><li>Core Values, Gracious Professionalism және Coopertition</li><li>Робот қалай <b>сезеді, ойлайды және әрекет етеді</b></li><li>Тізбек, бұрылыс, цикл, датчиктер, шарт — блоктармен де, Python-мен де</li><li>Матч стратегиясы: ұпай мен уақыт</li></ul>
<div class="callout">➡️ Келесі курс: <b>LEGO SPIKE Essential</b> — нағыз LEGO моделін құрастыру және бағдарламалау.</div>
<p>Python-ды да байқап көр: әр миссияда «Python» қойындысы бар. Блоктарың Python-да қалай көрінетінін «Бұл блоктар Python-да» батырмасынан көре аласың.</p>`,
        ru: `<p class="lead">🎉 Ты сделал первый шаг в мир FIRST!</p>
<p>Ты научился:</p><ul><li>что такое FIRST и какие у него программы</li><li>Core Values, Gracious Professionalism и Coopertition</li><li>как робот <b>чувствует, думает и действует</b></li><li>последовательность, повороты, циклы, датчики, условия — и в блоках, и на Python</li><li>стратегия матча: очки и время</li></ul>
<div class="callout">➡️ Следующий курс: <b>LEGO SPIKE Essential</b> — сборка и программирование настоящей модели LEGO.</div>
<p>Попробуй и Python: в каждой миссии есть вкладка «Python». Как твои блоки выглядят на Python, покажет кнопка «Эти блоки на Python».</p>`,
        en: `<p class="lead">🎉 You took your first step into the world of FIRST!</p>
<p>You learned:</p><ul><li>what FIRST is and its programs</li><li>Core Values, Gracious Professionalism and Coopertition</li><li>how a robot <b>senses, thinks and acts</b></li><li>sequence, turns, loops, sensors and conditions — in Blocks and in Python</li><li>match strategy: points versus time</li></ul>
<div class="callout">➡️ Next course: <b>LEGO SPIKE Essential</b> — building and programming a real LEGO model.</div>
<p>Try Python too: every mission has a “Python” tab, and “These blocks in Python” shows what your blocks look like as code.</p>`,
      },
    },
  ],
};

// The USTEM Lab home: every course on the list, ready ones first in their place, the rest marked "soon".

import { GROUPS } from './catalog.js';
import { lang, LANGS, LANG_NAMES, setLang, onLang, t, tr } from './i18n.js';

function progressOf(id) {
  try {
    const d = JSON.parse(localStorage.getItem('ustem-lab:' + id) || '{}');
    return Object.keys(d.done || {}).length;
  } catch { return 0; }
}

function render() {
  const app = document.getElementById('app');
  const langs = LANGS.map((l) => `<button class="${l === lang ? 'on' : ''}" data-l="${l}" title="${LANG_NAMES[l]}">${l === 'kk' ? 'ҚАЗ' : l.toUpperCase()}</button>`).join('');
  const groups = GROUPS.map((g) => `
    <section class="group">
      <h2>${tr(g.title)}</h2>
      <div class="grid">${g.courses.map((c, i) => {
        const ready = !!c.href;
        const done = ready ? progressOf(c.id) : 0;
        const tag = ready ? `<a class="course-card ready" href="${c.href}">` : '<div class="course-card">';
        const end = ready ? '</a>' : '</div>';
        return `${tag}
          <span class="num">${g.id === 'robotics' ? i + 1 : ''}</span>
          <span class="ic">${c.icon}</span>
          <b>${tr(c.title)}</b>
          <p>${tr(c.about)}</p>
          <span class="badge ${ready ? 'ok' : ''}">${ready ? (done ? '✓ ' + done : t('lab.open') + ' →') : t('lab.soon')}</span>
        ${end}`;
      }).join('')}</div>
    </section>`).join('');
  app.innerHTML = `
    <header class="lab-top">
      <a class="brand" href="./"><img src="../deck/img/ustem-logo.png" alt=""><span>USTEM Lab</span></a>
      <div class="course">${t('lab.subtitle')}</div>
      <div class="langs">${langs}</div>
    </header>
    <main class="catalog">
      <div class="hero">
        <h1>${tr({ kk: 'Робототехниканы ойнап үйрен', ru: 'Учись робототехнике, играя', en: 'Learn robotics by playing' })}</h1>
        <p>${tr({
          kk: 'Әр курс — интерактивті сабақ: теория, тест және симулятордағы миссиялар. Бағдарламаны блоктармен (Scratch сияқты) немесе Python-мен жаз. Қазақша, орысша, ағылшынша.',
          ru: 'Каждый курс — интерактивный урок: теория, тесты и миссии в симуляторе. Программируй блоками (как в Scratch) или на Python. На казахском, русском и английском.',
          en: 'Every course is an interactive lesson: theory, quizzes and missions in a simulator. Program with Blocks (like Scratch) or Python. In Kazakh, Russian and English.',
        })}</p>
      </div>
      ${groups}
    </main>`;
  app.querySelectorAll('.langs button').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.l)));
}

onLang(render);
render();

// Three languages for the whole lab: Kazakh, Russian, English. The choice is remembered and shared by every page.
// Interface strings live in UI below; lesson content is written inline as { kk, ru, en } objects and read with tr().

export const LANGS = ['kk', 'ru', 'en'];
export const LANG_NAMES = { kk: 'Қазақша', ru: 'Русский', en: 'English' };
const KEY = 'ustem-lab-lang';

function initial() {
  try {
    const q = new URLSearchParams(location.search).get('lang');
    if (LANGS.includes(q)) return q;
    const s = localStorage.getItem(KEY);
    if (LANGS.includes(s)) return s;
  } catch { /* private mode */ }
  const nav = (globalThis.navigator?.language || '').slice(0, 2);
  if (nav === 'kk') return 'kk';
  if (nav === 'en') return 'en';
  return 'ru';
}

export let lang = initial();
const listeners = new Set();

export function setLang(l) {
  if (!LANGS.includes(l) || l === lang) return;
  lang = l;
  try { localStorage.setItem(KEY, l); } catch { /* ignore */ }
  document.documentElement.lang = l;
  for (const f of listeners) f(l);
}

export function onLang(f) { listeners.add(f); return () => listeners.delete(f); }

/** Text in the current language from a { kk, ru, en } object (or a plain string). */
export function tr(v, vars) {
  let s = v == null ? '' : typeof v === 'string' ? v : (v[lang] ?? v.ru ?? v.en ?? '');
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
  return s;
}

const UI = {
  'lab.title': { kk: 'USTEM Lab', ru: 'USTEM Lab', en: 'USTEM Lab' },
  'lab.subtitle': { kk: 'Робототехника симуляторлары', ru: 'Симуляторы по робототехнике', en: 'Robotics simulators' },
  'lab.allCourses': { kk: 'Барлық курстар', ru: 'Все курсы', en: 'All courses' },
  'lab.soon': { kk: 'Жақында', ru: 'Скоро', en: 'Soon' },
  'lab.open': { kk: 'Ашу', ru: 'Открыть', en: 'Open' },
  'lab.ready': { kk: 'Дайын', ru: 'Готово', en: 'Ready' },

  'step.theory': { kk: 'Теория', ru: 'Теория', en: 'Theory' },
  'step.quiz': { kk: 'Тест', ru: 'Тест', en: 'Quiz' },
  'step.drive': { kk: 'Басқару', ru: 'Управление', en: 'Driving' },
  'step.mission': { kk: 'Миссия', ru: 'Миссия', en: 'Mission' },
  'step.next': { kk: 'Келесі →', ru: 'Дальше →', en: 'Next →' },
  'step.prev': { kk: '← Артқа', ru: '← Назад', en: '← Back' },
  'step.progress': { kk: '{done} / {total} қадам', ru: '{done} из {total} шагов', en: '{done} of {total} steps' },

  'quiz.check': { kk: 'Тексеру', ru: 'Проверить', en: 'Check' },
  'quiz.right': { kk: 'Дұрыс!', ru: 'Верно!', en: 'Correct!' },
  'quiz.wrong': { kk: 'Қайта ойланып көр.', ru: 'Подумай ещё раз.', en: 'Think again.' },
  'quiz.allRight': { kk: 'Барлық жауап дұрыс — келесі қадамға өт!', ru: 'Все ответы верны — переходи дальше!', en: 'All answers correct — go on!' },

  'code.blocks': { kk: 'Блоктар', ru: 'Блоки', en: 'Blocks' },
  'code.python': { kk: 'Python', ru: 'Python', en: 'Python' },
  'code.asPython': { kk: 'Бұл блоктар Python-да', ru: 'Эти блоки на Python', en: 'These blocks in Python' },
  'code.toPython': { kk: 'Python-ға көшіру', ru: 'Перенести в Python', en: 'Copy to Python' },
  'code.run': { kk: '▶ Іске қосу', ru: '▶ Запуск', en: '▶ Run' },
  'code.stop': { kk: '■ Тоқтату', ru: '■ Стоп', en: '■ Stop' },
  'code.reset': { kk: '↺ Басына', ru: '↺ Сброс', en: '↺ Reset' },
  'code.restore': { kk: 'Бастапқы код', ru: 'Начальный код', en: 'Starter code' },
  'code.restoreAsk': { kk: 'Кодты бастапқы күйге қайтару керек пе?', ru: 'Вернуть начальный код? Твой код пропадёт.', en: 'Restore the starter code? Your code will be lost.' },
  'code.hint': { kk: '💡 Кеңес', ru: '💡 Подсказка', en: '💡 Hint' },
  'code.solution': { kk: 'Шешімін көрсету', ru: 'Показать решение', en: 'Show solution' },
  'code.speed': { kk: 'Жылдамдық', ru: 'Скорость', en: 'Speed' },
  'code.loadingPython': { kk: 'Python жүктелуде… (бірінші рет 5–15 секунд)', ru: 'Загружается Python… (первый раз 5–15 секунд)', en: 'Loading Python… (5–15 seconds the first time)' },
  'code.pythonFailed': { kk: 'Python жүктелмеді: ', ru: 'Не удалось загрузить Python: ', en: 'Could not load Python: ' },
  'code.running': { kk: 'Бағдарлама орындалуда…', ru: 'Программа выполняется…', en: 'Program running…' },
  'code.stuck': { kk: 'Бағдарлама тым ұзақ ойланып тұр (робот қозғалмайтын шексіз цикл?). Тоқтатылды.', ru: 'Программа слишком долго думает (бесконечный цикл, в котором робот не двигается?). Остановлено.', en: 'The program is thinking too long (an endless loop where the robot does not move?). Stopped.' },
  'code.empty': { kk: 'Бағдарлама бос. Блоктарды «басталғанда» блогына тірке.', ru: 'Программа пустая. Прицепи блоки к блоку «при запуске».', en: 'The program is empty. Attach blocks under “when started”.' },

  'run.console': { kk: 'Хабарлар', ru: 'Сообщения', en: 'Messages' },
  'run.timeup': { kk: '⏱ Уақыт бітті ({s} с).', ru: '⏱ Время вышло ({s} с).', en: '⏱ Time is up ({s} s).' },
  'run.error': { kk: 'Бағдарламада қате:', ru: 'Ошибка в программе:', en: 'Error in the program:' },
  'run.done': { kk: 'Бағдарлама аяқталды: {s} с.', ru: 'Программа закончилась: {s} с.', en: 'Program finished: {s} s.' },
  'run.success': { kk: 'Миссия орындалды!', ru: 'Миссия выполнена!', en: 'Mission complete!' },
  'run.fail': { kk: 'Әлі емес', ru: 'Пока нет', en: 'Not yet' },
  'run.tryAgain': { kk: 'Кодты түзетіп, қайта іске қос.', ru: 'Исправь код и запусти ещё раз.', en: 'Fix the code and run again.' },

  'hud.color': { kk: 'Түс', ru: 'Цвет', en: 'Color' },
  'hud.distance': { kk: 'Қашықтық', ru: 'Расстояние', en: 'Distance' },
  'hud.time': { kk: 'Уақыт', ru: 'Время', en: 'Time' },

  'drive.keys': { kk: 'Пернелер: ↑ ↓ ← → немесе W A S D. Телефонда — төмендегі батырмалар.', ru: 'Клавиши: ↑ ↓ ← → или W A S D. На телефоне — кнопки ниже.', en: 'Keys: ↑ ↓ ← → or W A S D. On a phone use the buttons below.' },

  'color.white': { kk: 'ақ', ru: 'белый', en: 'white' },
  'color.black': { kk: 'қара', ru: 'чёрный', en: 'black' },
  'color.red': { kk: 'қызыл', ru: 'красный', en: 'red' },
  'color.green': { kk: 'жасыл', ru: 'зелёный', en: 'green' },
  'color.blue': { kk: 'көк', ru: 'синий', en: 'blue' },
  'color.yellow': { kk: 'сары', ru: 'жёлтый', en: 'yellow' },
};

export function t(key, vars) {
  return tr(UI[key] ?? key, vars);
}

if (typeof document !== 'undefined') document.documentElement.lang = lang;

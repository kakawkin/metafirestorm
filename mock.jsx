// Mock data — used when FastAPI is unavailable, so the design works standalone.
// Mirrors the API's expected JSON shape so swapping in the real endpoint is a no-op.

const MOCK_ADDONS = [
  { name:'Details! Damage Meter',  description:'Подробный счётчик урона и исцеления — основа любого рейдового интерфейса.' },
  { name:'BigWigs Bossmods',       description:'Лёгкие предупреждения о механиках боссов с минимальной нагрузкой на FPS.' },
  { name:'WeakAuras 2',            description:'Конструктор кастомных индикаторов кулдаунов, баффов, ресурсов и таймеров.' },
  { name:'ElvUI',                  description:'Полная замена пользовательского интерфейса — компактные панели и фреймы.' },
  { name:'Plater Nameplates',      description:'Гибко настраиваемые таблички противников с поддержкой скриптов.' },
  { name:'OmniCD',                 description:'Отслеживание кулдаунов всей группы — полезно в M+ и рейде.' },
  { name:'GTFO',                   description:'Громкий сигнал, когда стоишь в плохом — спасает жизни.' },
  { name:'MythicDungeonTools',     description:'Планировщик маршрутов и пуллов в эпохальных подземельях.' },
  { name:'Method Raid Tools',      description:'Метки, кики, кулдауны рейда и таймеры боя.' },
  { name:'AngryKeystones',         description:'Расширенная информация по таймеру и прогрессу M+ ключа.' },
];

const MOCK_WEAKAURAS = [
  { name:'Frost DK Core',          description:'Основные баффы, дебаффы и кулдауны для Frost DK — Pillar of Frost, Breath of Sindragosa, Killing Machine.' },
  { name:'Havoc DH Tracker',       description:'Метаморфоза, Immolation Aura, эссенция демона и таймер Eye Beam.' },
  { name:'Fire Mage Combustion',   description:'Окно Combustion, Hot Streak, Heating Up и кулдауны.' },
  { name:'Holy Paladin Beacon',    description:'Маяки света, Holy Power и важные хилл-кулдауны.' },
  { name:'Sub Rogue Energy',       description:'Combo Points, Shadow Dance, Symbols of Death — всё в одном окне.' },
  { name:'Affliction Warlock DoTs',description:'Длительность Agony, Corruption, Unstable Affliction и Malefic Rapture.' },
  { name:'M+ Interrupt Rotation',  description:'Подсказывает чей кик идёт следующим — для всех 5 в группе.' },
  { name:'Raid Boss Timers',       description:'Кастомные таймеры механик последних рейд-боссов.' },
];

// Stable PRNG
function _hash(s){ let h=2166136261; for(let i=0;i<s.length;i++){h^=s.charCodeAt(i); h=Math.imul(h,16777619)} return h>>>0 }
function _rng(seed){ return function(){ seed = (seed*1664525 + 1013904223)>>>0; return seed/4294967296; }}

const MOCK_NAMES = ['Гритсфорд','Маевелина','Тираниэль','Дэшвиктор','Морнвин','Красссстор','Ринельд','Сабершот','Зурагос','Виндласт','Стелкасс','Элдрик','Норвельд','Шадриан','Калкориэль','Феннвик','Орелла','Грогнар','Селена','Дракгар','Бренвик','Иллара','Каэрдан','Тессил','Ваймарис','Сильвергрэйв','Дрейн','Крайхорн','Лорвельд','Аззариан','Норамис','Мистрель','Ксантериус','Олорион','Бриэльна','Кулдорн','Мараис','Раэст','Вельтара','Дронкарр'];
const MOCK_SERVERS = ['Гордунни','Ревущий фьорд','Пиратская бухта','Азурегос','Ясеневый лес','Tarren Mill','Kazzak'];

// Mock item catalog (just enough variety for the trinket/popularity stats)
const TRINKETS = [
  { id:220202, name:'Сигнал Нерубарского Горна' },
  { id:220215, name:'Жемчужина Запретного Сна' },
  { id:220228, name:'Тикающая Личинка' },
  { id:220241, name:'Сокрытый Светоч' },
  { id:219877, name:'Хроносфера Глубинного Стража' },
  { id:219880, name:'Пульт Управления Взрывателем' },
  { id:219841, name:'Блестящая Канистра' },
];
const RINGS = [
  { id:219325, name:'Кольцо Глубинного Зова' },
  { id:219331, name:'Печать Червоточины' },
  { id:219315, name:'Печатка Железного Капитана' },
];
const NECKS = [{ id:219312, name:'Ожерелье Королевской Крови' }];
const CLOAKS = [{ id:219318, name:'Плащ Последнего Вдоха' }];
const WEAPONS = [
  { id:221023, name:'Бич Преследователя', q:'epic' },
  { id:221145, name:'Клык Паучьей Матки', q:'legendary' },
  { id:220305, name:'Жезл Вечного Плетения', q:'epic' },
];
const SLOT_ITEMS = {
  head:[{id:212430,name:'Шлем Безмолвного Зова'},{id:212431,name:'Капюшон Извивающейся Тьмы'}],
  shoulder:[{id:212442,name:'Оплечье Нерубарского Легата'},{id:212443,name:'Эполеты Шёлковой Охоты'}],
  chest:[{id:212455,name:'Нагрудник Смолкнувшей Ярости'},{id:212456,name:'Одеяние Потрескавшегося Шёлка'}],
  hands:[{id:212474,name:'Рукавицы Нитевидной Хватки'},{id:212475,name:'Перчатки Расколотого Эфира'}],
  legs:[{id:212468,name:'Поножи Подземного Хитина'},{id:212469,name:'Штаны Кочевника Гномрегана'}],
  feet:[{id:212481,name:'Сапоги Паучьего Шага'}],
  waist:[{id:212487,name:'Пояс Кокона'}],
  wrist:[{id:212494,name:'Наручи Плетёного Заклятия'}],
};

function _slotStr({id, name, q='epic'}){
  // pipe-format with item URL — matches DB shape so parser works the same way
  return `<a href="https://www.wowhead.com/item=${id}" class="q${q==='legendary'?5:4}">${name}</a>||`;
}

function MOCK_SECONDARIES_FOR(seed, spec){
  const r = _rng(seed >>> 0);
  // Tilt by spec name
  const k = (spec||'').toLowerCase();
  let h=25, c=25, m=25, v=25;
  if(k.includes('frost')){ h=20; c=28; m=35; v=17; }
  else if(k.includes('fire')){ h=12; c=42; m=32; v=14; }
  else if(k.includes('shadow')){ h=36; c=24; m=24; v=16; }
  else if(k.includes('blood')){ h=15; c=20; m=30; v=35; }
  return {
    haste:       Math.max(8, Math.min(45, Math.round(h + (r()-0.5)*10))),
    crit:        Math.max(8, Math.min(50, Math.round(c + (r()-0.5)*10))),
    mastery:     Math.max(8, Math.min(55, Math.round(m + (r()-0.5)*10))),
    versatility: Math.max(4, Math.min(35, Math.round(v + (r()-0.5)*10))),
  };
}

function MOCK_PLAYERS(mode, segment, classId, specId){
  const seed = _hash(`${mode}-${segment}-${classId}-${specId}`);
  const r = _rng(seed);
  const cls = window.FIRESTORM.CLASSES.find(c=>c.id===classId);
  const spec = cls && cls.specs.find(s=>s.id===specId);
  const n = 60 + Math.floor(r()*100);
  const dpsBase = 2_000_000 + Math.floor(r()*600_000);
  const reportId = ['7Cf2nGWzytXNHkVR','Yp9MdVRT6jWkP2Lq','BfTHjMxQVkW82pZD'][Math.floor(r()*3)];
  const out = [];
  for(let i=0;i<n;i++){
    const pr = _rng(seed + i*31);
    const ilvl = 638 + Math.floor(pr()*10);
    const score = Math.round(dpsBase * (0.65 + pr()*0.7) + (ilvl-638)*1800);
    const equip = {};
    const pickT1 = TRINKETS[Math.floor(pr()*TRINKETS.length)];
    const pickT2 = TRINKETS[Math.floor(pr()*TRINKETS.length)];
    const pickR1 = RINGS[Math.floor(pr()*RINGS.length)];
    const pickR2 = RINGS[Math.floor(pr()*RINGS.length)];
    equip.trinket1 = _slotStr(pickT1);
    equip.trinket2 = _slotStr(pickT2);
    equip.finger1  = _slotStr(pickR1);
    equip.finger2  = _slotStr(pickR2);
    equip.neck     = _slotStr(NECKS[0]);
    equip.back     = _slotStr(CLOAKS[0]);
    const w = WEAPONS[Math.floor(pr()*WEAPONS.length)];
    equip.main_hand = _slotStr(w);
    for(const slot of Object.keys(SLOT_ITEMS)){
      const item = SLOT_ITEMS[slot][Math.floor(pr()*SLOT_ITEMS[slot].length)];
      equip[slot] = _slotStr(item);
    }
    out.push({
      id: seed + i,
      name: MOCK_NAMES[Math.floor(pr()*MOCK_NAMES.length)],
      server: MOCK_SERVERS[Math.floor(pr()*MOCK_SERVERS.length)],
      region: 'EU',
      class: cls ? cls.api : classId,
      spec: spec ? spec.api : specId,
      metric: 'dps',
      score,
      duration_s: 280 + Math.floor(pr()*160),
      ranking_ilvl: ilvl,
      avg_ilvl: ilvl - (Math.floor(pr()*2)),
      encounter_id: 3014 + Math.floor(pr()*8),
      difficulty: mode==='raid' ? 5 : 10,
      report_id: reportId,
      fight_id: 1 + Math.floor(pr()*40),
      source_id: 1 + Math.floor(pr()*30),
      log_url: `https://www.warcraftlogs.com/reports/${reportId}#fight=${1 + Math.floor(pr()*40)}&source=${1 + Math.floor(pr()*30)}`,
      ...equip,
      secondaries: MOCK_SECONDARIES_FOR(seed + i, spec ? spec.api : specId),
      stats: {
        strength:    8000 + Math.floor(pr()*2000),
        agility:     2000 + Math.floor(pr()*500),
        intellect:   2000 + Math.floor(pr()*500),
        stamina:    18000 + Math.floor(pr()*3000),
        dodge:      Math.round(3 + pr()*4),
        parry:      Math.round(5 + pr()*4),
        leech:      Math.round(2 + pr()*4),
        speed:      Math.round(pr()*5),
        avoidance:  Math.round(pr()*4),
      },
    });
  }
  return out.sort((a,b)=> b.score - a.score);
}

window.MOCK_ADDONS = MOCK_ADDONS;
window.MOCK_WEAKAURAS = MOCK_WEAKAURAS;
window.MOCK_PLAYERS = MOCK_PLAYERS;
window.MOCK_SECONDARIES_FOR = MOCK_SECONDARIES_FOR;

// СТАТИЧЕСКИЙ РЕЖИМ — читаем JSON из ./data/
const API_BASE = '';

const CLASSES = [

  { id:'deathknight', api:'DeathKnight', name:'Рыцарь смерти',      color:'#C41E3A', icon:'wow-icons/deathknight.jpg',
    specs:[{id:'blood',api:'Blood',name:'Кровь',role:'tank',icon:'wow-icons/specs/spell_deathknight_bloodpresence.gif'},{id:'frost',api:'Frost',name:'Лёд',role:'dps',icon:'wow-icons/specs/spell_deathknight_frostpresence.gif'},{id:'unholy',api:'Unholy',name:'Нечестивость',role:'dps',icon:'wow-icons/specs/spell_deathknight_unholypresence.gif'}] },
  { id:'demonhunter', api:'DemonHunter', name:'Охотник на демонов', color:'#A330C9', icon:'wow-icons/demonhunter.jpg',
    specs:[{id:'havoc',api:'Havoc',name:'Истребление',role:'dps',icon:'wow-icons/specs/ability_demonhunter_specdps.gif'},{id:'veng',api:'Vengeance',name:'Месть',role:'tank',icon:'wow-icons/specs/ability_demonhunter_spectank.gif'}] },
  { id:'druid',       api:'Druid',       name:'Друид',              color:'#FF7C0A', icon:'wow-icons/druid.jpg',
    specs:[{id:'balance',api:'Balance',name:'Баланс',role:'dps',icon:'wow-icons/specs/spell_nature_starfall.gif'},{id:'feral',api:'Feral',name:'Сила зверя',role:'dps',icon:'wow-icons/specs/ability_druid_catform.gif'},{id:'guardian',api:'Guardian',name:'Страж',role:'tank',icon:'wow-icons/specs/ability_racial_bearform.gif'},{id:'resto',api:'Restoration',name:'Исцеление',role:'heal',icon:'wow-icons/specs/spell_nature_healingtouch.gif'}] },
  { id:'evoker',      api:'Evoker',      name:'Пробудитель',        color:'#33937F', icon:'wow-icons/evoker.jpg',
    specs:[{id:'dev',api:'Devastation',name:'Опустошитель',role:'dps',icon:'wow-icons/specs/classicon_evoker_devastation.gif'},{id:'pres',api:'Preservation',name:'Хранитель',role:'heal',icon:'wow-icons/specs/classicon_evoker_preservation.gif'},{id:'aug',api:'Augmentation',name:'Насыщатель',role:'dps',icon:'wow-icons/specs/classicon_evoker_augmentation.gif'}] },
  { id:'hunter',      api:'Hunter',      name:'Охотник',            color:'#AAD372', icon:'wow-icons/hunter.jpg',
    specs:[{id:'bm',api:'BeastMastery',name:'Повелитель зверей',role:'dps',icon:'wow-icons/specs/ability_hunter_bestialdiscipline.gif'},{id:'mm',api:'Marksmanship',name:'Стрельба',role:'dps',icon:'wow-icons/specs/ability_hunter_focusedaim.gif'},{id:'survival',api:'Survival',name:'Выживание',role:'dps',icon:'wow-icons/specs/ability_hunter_camouflage.gif'}] },
  { id:'mage',        api:'Mage',        name:'Маг',                color:'#3FC7EB', icon:'wow-icons/mage.jpg',
    specs:[{id:'arcane',api:'Arcane',name:'Тайная магия',role:'dps',icon:'wow-icons/specs/spell_holy_magicalsentry.gif'},{id:'fire',api:'Fire',name:'Огонь',role:'dps',icon:'wow-icons/specs/spell_fire_firebolt02.gif'},{id:'frost',api:'Frost',name:'Лёд',role:'dps',icon:'wow-icons/specs/spell_frost_frostbolt02.gif'}] },
  { id:'monk',        api:'Monk',        name:'Монах',              color:'#00FF98', icon:'wow-icons/monk.jpg',
    specs:[{id:'brew',api:'Brewmaster',name:'Хмелевар',role:'tank',icon:'wow-icons/specs/monk_stance_drunkenox.gif'},{id:'mist',api:'Mistweaver',name:'Ткач туманов',role:'heal',icon:'wow-icons/specs/monk_stance_wiseserpent.gif'},{id:'ww',api:'Windwalker',name:'Танцующий с ветром',role:'dps',icon:'wow-icons/specs/monk_stance_whitetiger.gif'}] },
  { id:'paladin',     api:'Paladin',     name:'Паладин',            color:'#F48CBA', icon:'wow-icons/paladin.jpg',
    specs:[{id:'holy',api:'Holy',name:'Свет',role:'heal',icon:'wow-icons/specs/spell_holy_holybolt.gif'},{id:'protection',api:'Protection',name:'Защита',role:'tank',icon:'wow-icons/specs/ability_paladin_shieldofthetemplar.gif'},{id:'retribution',api:'Retribution',name:'Воздаяние',role:'dps',icon:'wow-icons/specs/spell_holy_auraoflight.gif'}] },
  { id:'priest',      api:'Priest',      name:'Жрец',               color:'#FFFFFF', icon:'wow-icons/priest.jpg',
    specs:[{id:'disc',api:'Discipline',name:'Послушание',role:'heal',icon:'wow-icons/specs/spell_holy_powerwordshield.gif'},{id:'holy',api:'Holy',name:'Свет',role:'heal',icon:'wow-icons/specs/spell_holy_guardianspirit.gif'},{id:'shadow',api:'Shadow',name:'Тьма',role:'dps',icon:'wow-icons/specs/spell_shadow_shadowwordpain.gif'}] },
  { id:'rogue',       api:'Rogue',       name:'Разбойник',          color:'#FFF468', icon:'wow-icons/rogue.jpg',
    specs:[{id:'assa',api:'Assassination',name:'Ликвидация',role:'dps',icon:'wow-icons/specs/ability_rogue_eviscerate.gif'},{id:'outlaw',api:'Outlaw',name:'Бой',role:'dps',icon:'wow-icons/specs/ability_rogue_waylay.gif'},{id:'sub',api:'Subtlety',name:'Скрытность',role:'dps',icon:'wow-icons/specs/ability_stealth.gif'}] },
  { id:'shaman',      api:'Shaman',      name:'Шаман',              color:'#0070DD', icon:'wow-icons/shaman.jpg',
    specs:[{id:'ele',api:'Elemental',name:'Стихии',role:'dps',icon:'wow-icons/specs/spell_nature_lightning.gif'},{id:'enh',api:'Enhancement',name:'Совершенствование',role:'dps',icon:'wow-icons/specs/spell_nature_lightningshield.gif'},{id:'resto',api:'Restoration',name:'Исцеление',role:'heal',icon:'wow-icons/specs/spell_nature_magicimmunity.gif'}] },
  { id:'warlock',     api:'Warlock',     name:'Чернокнижник',       color:'#8788EE', icon:'wow-icons/warlock.jpg',
    specs:[{id:'aff',api:'Affliction',name:'Колдовство',role:'dps',icon:'wow-icons/specs/spell_shadow_deathcoil.gif'},{id:'demo',api:'Demonology',name:'Демонология',role:'dps',icon:'wow-icons/specs/spell_shadow_metamorphosis.gif'},{id:'destro',api:'Destruction',name:'Разрушение',role:'dps',icon:'wow-icons/specs/spell_shadow_rainoffire.gif'}] },
  { id:'warrior',     api:'Warrior',     name:'Воин',               color:'#C69B6D', icon:'wow-icons/warrior.jpg',
    specs:[{id:'arms',api:'Arms',name:'Оружие',role:'dps',icon:'wow-icons/specs/ability_warrior_savageblow.gif'},{id:'fury',api:'Fury',name:'Неистовство',role:'dps',icon:'wow-icons/specs/ability_warrior_innerrage.gif'},{id:'protection',api:'Protection',name:'Защита',role:'tank',icon:'wow-icons/specs/ability_warrior_defensivestance.gif'}] },
];

const RAID_BOSSES = [
	{ id:'0',			order:0, name:'Общее' },
	{ id:'3129',		order:1, name:'Сплетенный страж', slug:'Plexus-Sentinel', icon:'https://wow.zamimg.com/images/wow/journal/ui-ej-boss-arcanomatrixwarden.png' },
	{ id:'3131',		order:2, name:'Ткан\'итар', slug:'Loomithar', icon:'https://wow.zamimg.com/images/wow/journal/ui-ej-boss-loombeast.png' },
	{ id:'3130',		order:3, name:'Стражница душ Наазиндри', slug:'Soulbinder-Naazindhri', icon:'https://wow.zamimg.com/images/wow/journal/ui-ej-boss-soulbindernaazindhri.png' },
	{ id:'3132',		order:4, name:'Ткач горна Араз', slug:'Forgeweaver-Araz', icon:'https://wow.zamimg.com/images/wow/journal/ui-ej-boss-highmanaforgeraraz.png' },
	{ id:'3122',		order:5, name:'Ловцы душ', slug:'The-Soul-Hunters', icon:'https://wow.zamimg.com/images/wow/journal/ui-ej-boss-thesoulhunters.png' },
	{ id:'3133',		order:6, name:'Разломий', slug:'Fractillus', icon:'https://wow.zamimg.com/images/wow/journal/ui-ej-boss-fractillus.png' },
	{ id:'3134',		order:7, name:'Соправитель Салхадаар', slug:'Nexus-King-Salhadaar', icon:'https://wow.zamimg.com/images/wow/journal/ui-ej-boss-nexuskingsalhadaar.png' },
	{ id:'3135',		order:8, name:'Пространствус Всепоглощающий', slug:'Dimensius', icon:'https://wow.zamimg.com/images/wow/journal/ui-ej-boss-dimensius.png' },
];
const MPLUS_DUNGEONS = [
  { id:'0',			name:'Общее' },
  { id:'62660',		name:'Ара-Кара, Город Отголесков' },
  { id:'12830',		name:'Заповедник "Аль\'дани"' },
  { id:'62287',		name:'Чертоги Покаяния' },
  { id:'62773',		name:'Операция "Шлюз"' },
  { id:'62649',		name:'Приорат Священного Пламени' },
  { id:'112442',	name:'Тазавеш: Гамбит Со\'леи' },
  { id:'112441',	name:'Тазавеш: Улицы чудес' },
  { id:'62662',		name:'"Сияющий Рассвет"' },
];
const SLOT_LABELS = {
  head:'Голова', neck:'Шея', shoulder:'Плечи', back:'Спина', chest:'Грудь',
  wrist:'Запястья', hands:'Кисти', waist:'Пояс', legs:'Ноги', feet:'Ступни',
  finger1:'Кольцо 1', finger2:'Кольцо 2', trinket1:'Аксессуар 1', trinket2:'Аксессуар 2',
  main_hand:'Оружие', off_hand:'Второе оружие/щит'
};
const ALL_SLOTS = ['head','neck','shoulder','back','chest','wrist','hands','waist','legs','feet','finger1','finger2','trinket1','trinket2','main_hand','off_hand'];

// --- API helpers ---
async function fetchJson(path){
  const url = API_BASE + path;
  try {
    const r = await fetch(url, { mode:'cors' });
    if(!r.ok) throw new Error('HTTP '+r.status);
    return { ok:true, data: await r.json() };
  } catch(e){
    return { ok:false, error: String(e) };
  }
}

async function apiPlayers({mode, segment, classId, specId}){
  const cls = CLASSES.find(c=>c.id===classId);
  const spec = cls && cls.specs.find(s=>s.id===specId);
  const params = new URLSearchParams();
  // Передаём короткие ID (classId, specId) — они маппятся на бэкенде в mappings.py
  if(classId) params.set('class', classId);
  if(specId) params.set('spec', specId);
  // segment = encounter_id (номер босса/подземелья)
  // segment='0' означает "Общее" (все боссы), не передаём encounter в этом случае
  if(segment != null && segment != '0' && segment != 0) params.set('encounter', segment);
  // Передаём mode (raid / mplus) для фильтрации content_type
  if(mode) params.set('mode', mode);
  // Если выбранный спек — хил, по умолчанию запрашиваем hps
  if(spec && spec.role === 'heal') {
    params.set('metric', 'hps');
  }
  // Берём топ-2000, чтобы захватить все логи (8 боссов × 200 логов = 1600).
  // Агрегат по характеристикам будет более точным с большей выборкой.
  // В таблице игроков всё равно показываем по 25 с пагинацией.
  params.set('limit', '2000');
  const res = await fetchJson('/api/players?' + params.toString());
  if(res.ok) return res;
  // Fallback: generate mock
  return { ok:true, data: window.MOCK_PLAYERS(mode, segment, classId, specId), mock:true };
}

async function apiAddons(){
  const res = await fetchJson('/api/addons');
  if(res.ok) return res;
  return { ok:true, mock:true, data: window.MOCK_ADDONS };
}
async function apiWeakauras(){
  const res = await fetchJson('/api/weakauras');
  if(res.ok) return res;
  return { ok:true, mock:true, data: window.MOCK_WEAKAURAS };
}

async function apiEmbellishments(){
  const res = await fetchJson('/api/embellishments');
  if(res.ok) return res;
  return { ok:true, mock:true, data: [] }; // Fallback на пустой массив если API недоступен
}

async function apiStats({mode, segment, classId, specId}){
  const cls = CLASSES.find(c=>c.id===classId);
  const spec = cls && cls.specs.find(s=>s.id===specId);
  const params = new URLSearchParams();
  
  // Убираем дефисы для совместимости (localStorage может хранить старые значения типа "death-knight")
  if(classId) params.set('class', classId.replace(/-/g, ''));
  if(specId) params.set('spec', specId);
  if(segment != null && segment != '0' && segment != 0) params.set('encounter', segment);
  // Передаём mode (raid / mplus) для фильтрации content_type
  if(mode) params.set('mode', mode);
  
  // Если выбранный спек — хил, запрашиваем hps
  if(spec && spec.role === 'heal') {
    params.set('metric', 'hps');
  }
  
  const res = await fetchJson('/api/stats?' + params.toString());
  if(res.ok) return res;
  
  // Fallback: если новый эндпоинт не работает, вернём null
  // (фронт должен обработать это и вызвать старый apiPlayers)
  return { ok:false, error: 'Stats API unavailable' };
}

// Parse pipe-format slot string: "ITEM_HTML|PERM_ENCHANT_HTML|TEMP_ENCHANT_HTML"
// (так формирует api/main.py:build_slot_html — все три части обёрнуты в <a>)
function parseSlotString(s){
  if(!s || typeof s !== 'string') return null;
  const parts = s.split('|');
  const itemUrl = parts[0] || '';
  const itemId = (itemUrl.match(/item=(\d+)/) || [])[1];
  const itemName = (itemUrl.match(/>([^<]+)</) || [])[1] || itemUrl.split('/').pop() || '';
  const quality = (itemUrl.match(/q(\d)/) || [])[1];
  const qualityName = ['poor','common','uncommon','rare','epic','legendary','artifact'][+quality] || 'epic';
  // Парсим data-icon='...' из HTML (добавлено для загрузки иконок)
  const iconMatch = itemUrl.match(/data-icon='([^']+)'/);
  const iconName = iconMatch ? iconMatch[1] : null;
  // Извлекаем полный URL с бонусами и ilvl из href='...'
  const hrefMatch = itemUrl.match(/href='([^']+)'/);
  const fullItemUrl = hrefMatch ? hrefMatch[1] : null;
  // [1] — постоянный энчант, [2] — временный (Howling Rune и т.п.)
  const permEnchantUrl  = parts[1] || '';
  const tempEnchantUrl  = parts[2] || '';
  const permEnchantName = (permEnchantUrl.match(/>([^<]+)</) || [])[1] || (permEnchantUrl ? 'зачарование' : '');
  const tempEnchantName = (tempEnchantUrl.match(/>([^<]+)</) || [])[1] || (tempEnchantUrl ? 'временное' : '');
  return {
    itemId: itemId ? +itemId : null,
    itemName,
    quality: qualityName,
    iconName,  // имя файла иконки из Wowhead (например, "inv_112_raidtrinkets_...")
    fullItemUrl,  // полный URL с bonus и ilvl для корректного tooltip
    // legacy alias — старые места кода ещё могут читать enchantName
    enchantName: permEnchantName,
    permEnchantName,
    tempEnchantName,
    raw: s,
  };
}

// Normalize a player record from API into UI shape
function normalizePlayer(p){
  const equipment = {};
  for(const slot of ALL_SLOTS){
    if(p[slot]) equipment[slot] = parseSlotString(p[slot]);
  }
  // Secondary stats: API may return per-player stats from item_stats; for now we
  // expect optional precomputed `secondaries: {haste,crit,mastery,versatility}`
  // (in % of secondaries total). If missing, fall back to deterministic mock.
  let secondaries = p.secondaries;
  if(!secondaries){
    const seed = (p.name || '').split('').reduce((a,c)=>a+c.charCodeAt(0), p.id || 0);
    secondaries = window.MOCK_SECONDARIES_FOR(seed, p.spec);
  }
  return {
    id: p.id,
    name: p.name,
    server: p.server,
    region: p.region,
    cls: p.class || p.cls,
    spec: p.spec,
    metric: p.metric || 'dps',
    score: p.score,
    duration_s: p.duration_s,
    avg_ilvl: Math.round(p.avg_ilvl || p.ranking_ilvl || 0),
    log_url: p.log_url,
    equipment,
    secondaries,
    // Сырые рейтинги из WCL (с баффами рейда — Ebon Might и пр.):
    // {crit, haste, mastery, versatility, leech, speed, avoidance, armor, parry,
    // dodge, block, strength, agility, intellect, stamina}
    stats: p.stats || {},
    // Чистые статы с экипировки (без баффов) — те же ключи что stats, но только
    // вторички/третички/первички. null если item_stats ещё не заполнен.
    gear_stats: p.gear_stats || null,
    // 'strength' | 'agility' | 'intellect' — primary stat для пары class+spec.
    primary_stat: p.primary_stat || null,
    // tier set: строка со слотами, где есть ANY setID (head,shoulder,chest,hands,legs)
    tier_slots: p.tier_slots || null,
  };
}


// Статические API — читаем JSON из папки data/
async function fetchJson(path){
  const url = API_BASE + path;
  try {
    const r = await fetch(url, { mode:'cors' });
    if(!r.ok) throw new Error('HTTP '+r.status);
    return { ok:true, data: await r.json() };
  } catch(e){
    return { ok:false, error: String(e) };
  }
}

// Автоопределение base path для GitHub Pages / локального тестирования
const _GH_REPO = (function(){
  const p = window.location.pathname;
  // Если hostname = *.github.io и path начинается с /repo-name/...
  if (window.location.hostname.indexOf('github.io') !== -1) {
    const parts = p.split('/').filter(Boolean);
    if (parts.length > 0) return '/' + parts[0];
  }
  return '';
})();

function _dataPath({mode, segment, classId, specId, suffix}){
  const enc = (segment == null || segment == '0' || segment == 0) ? 'all' : segment;
  return `${_GH_REPO}/data/${mode}/${classId}/${specId}/${enc}_${suffix}.json`;
}

async function apiPlayers({mode, segment, classId, specId}){
  const path = _dataPath({mode, segment, classId, specId, suffix: 'players'});
  const res = await fetchJson(path);
  if(res.ok) return res;
  // Fallback на мок
  return { ok:true, data: window.MOCK_PLAYERS ? window.MOCK_PLAYERS(mode, segment, classId, specId) : [], mock:true };
}

async function apiStats({mode, segment, classId, specId}){
  const path = _dataPath({mode, segment, classId, specId, suffix: 'stats'});
  const res = await fetchJson(path);
  if(res.ok) return res;
  return { ok:false, error: 'Stats unavailable' };
}

async function apiAddons(){
  const res = await fetchJson('./addons.json');
  if(res.ok) return res;
  return { ok:true, data: [] };
}

async function apiWeakauras(){
  const res = await fetchJson('./weakauras.json');
  if(res.ok) return res;
  return { ok:true, data: [] };
}

async function apiEmbellishments(){
  const res = await fetchJson('./embellishments.json');
  if(res.ok) return res;
  return { ok:true, data: [] };
}

// Parse pipe-format slot string: "ITEM_HTML|PERM_ENCHANT_HTML|TEMP_ENCHANT_HTML"
function parseSlotString(s){
  if(!s || typeof s !== 'string') return null;
  const parts = s.split('|');
  const itemUrl = parts[0] || '';
  const itemId = (itemUrl.match(/item=(\d+)/) || [])[1];
  const itemName = (itemUrl.match(/>([^<]+)</) || [])[1] || itemUrl.split('/').pop() || '';
  const quality = (itemUrl.match(/q(\d)/) || [])[1];
  const qualityName = ['poor','common','uncommon','rare','epic','legendary','artifact'][+quality] || 'epic';
  // Парсим data-icon='...' из HTML (добавлено для загрузки иконок)
  const iconMatch = itemUrl.match(/data-icon='([^']+)'/);
  const iconName = iconMatch ? iconMatch[1] : null;
  // Извлекаем полный URL с бонусами и ilvl из href='...'
  const hrefMatch = itemUrl.match(/href='([^']+)'/);
  const fullItemUrl = hrefMatch ? hrefMatch[1] : null;
  // [1] — постоянный энчант, [2] — временный (Howling Rune и т.п.)
  const permEnchantUrl  = parts[1] || '';
  const tempEnchantUrl  = parts[2] || '';
  const permEnchantName = (permEnchantUrl.match(/>([^<]+)</) || [])[1] || (permEnchantUrl ? 'зачарование' : '');
  const tempEnchantName = (tempEnchantUrl.match(/>([^<]+)</) || [])[1] || (tempEnchantUrl ? 'временное' : '');
  return {
    itemId: itemId ? +itemId : null,
    itemName,
    quality: qualityName,
    iconName,  // имя файла иконки из Wowhead (например, "inv_112_raidtrinkets_...")
    fullItemUrl,  // полный URL с bonus и ilvl для корректного tooltip
    // legacy alias — старые места кода ещё могут читать enchantName
    enchantName: permEnchantName,
    permEnchantName,
    tempEnchantName,
    raw: s,
  };
}

// Normalize a player record from API into UI shape
function normalizePlayer(p){
  const equipment = {};
  for(const slot of ALL_SLOTS){
    if(p[slot]) equipment[slot] = parseSlotString(p[slot]);
  }
  // Secondary stats: API may return per-player stats from item_stats; for now we
  // expect optional precomputed `secondaries: {haste,crit,mastery,versatility}`
  // (in % of secondaries total). If missing, fall back to deterministic mock.
  let secondaries = p.secondaries;
  if(!secondaries){
    const seed = (p.name || '').split('').reduce((a,c)=>a+c.charCodeAt(0), p.id || 0);
    secondaries = window.MOCK_SECONDARIES_FOR(seed, p.spec);
  }
  return {
    id: p.id,
    name: p.name,
    server: p.server,
    region: p.region,
    cls: p.class || p.cls,
    spec: p.spec,
    metric: p.metric || 'dps',
    score: p.score,
    duration_s: p.duration_s,
    avg_ilvl: Math.round(p.avg_ilvl || p.ranking_ilvl || 0),
    log_url: p.log_url,
    equipment,
    secondaries,
    // Сырые рейтинги из WCL (с баффами рейда — Ebon Might и пр.):
    // {crit, haste, mastery, versatility, leech, speed, avoidance, armor, parry,
    // dodge, block, strength, agility, intellect, stamina}
    stats: p.stats || {},
    // Чистые статы с экипировки (без баффов) — те же ключи что stats, но только
    // вторички/третички/первички. null если item_stats ещё не заполнен.
    gear_stats: p.gear_stats || null,
    // 'strength' | 'agility' | 'intellect' — primary stat для пары class+spec.
    primary_stat: p.primary_stat || null,
    // tier set: строка со слотами, где есть ANY setID (head,shoulder,chest,hands,legs)
    tier_slots: p.tier_slots || null,
  };
}


window.FIRESTORM = {
  CLASSES, RAID_BOSSES, MPLUS_DUNGEONS, SLOT_LABELS, ALL_SLOTS,
  apiPlayers, apiAddons, apiWeakauras, apiEmbellishments, apiStats, parseSlotString, normalizePlayer
};

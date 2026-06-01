// TalentCalc.jsx — встраиваемый калькулятор талантов для страниц гайдов
// Использование в guides.jsx:
//   <window.TALENTCALC.TalentCalc classId="deathknight" specId="blood" />
//
// classId и specId — строки из app.jsx (как в localStorage и маппингах)

(function () {
  const { useState, useMemo, useRef, useEffect } = React;

  // ── Маппинг строк → числовые ID WoW ──────────────────────────────────────
  const SPEC_ID_MAP = {
    warrior:      { arms: 71,  fury: 72,  protection: 73 },
    paladin:      { holy: 65,  protection: 66, retribution: 70 },
    hunter:       { 'beast-mastery': 253, beastmastery: 253, marksmanship: 254, survival: 255 },
    rogue:        { assassination: 259, outlaw: 260, subtlety: 261 },
    priest:       { discipline: 256, holy: 257, shadow: 258 },
    deathknight:  { blood: 250, frost: 251, unholy: 252 },
    shaman:       { elemental: 262, enhancement: 263, restoration: 264 },
    mage:         { arcane: 62,  fire: 63,  frost: 64 },
    warlock:      { affliction: 265, demonology: 266, destruction: 267 },
    monk:         { brewmaster: 268, windwalker: 269, mistweaver: 270 },
    druid:        { balance: 102, feral: 103, guardian: 104, restoration: 105 },
    demonhunter:  { havoc: 577, vengeance: 581 },
    evoker:       { devastation: 1467, preservation: 1468, augmentation: 1473 },
  };
  const CLASS_ID_MAP = {
    warrior: 1, paladin: 2, hunter: 3, rogue: 4, priest: 5,
    deathknight: 6, shaman: 7, mage: 8, warlock: 9, monk: 10,
    druid: 11, demonhunter: 12, evoker: 13,
  };

  function resolveIds(classStr, specStr) {
    const cls = (classStr || '').toLowerCase().replace(/[\s-]/g, '');
    const spc = (specStr  || '').toLowerCase().replace(/[\s-]/g, '');
    const classId = CLASS_ID_MAP[cls] ?? 6;
    const specId  = SPEC_ID_MAP[cls]?.[spc] ?? 250;
    return { classId, specId };
  }

  // ── Визуальные константы ──────────────────────────────────────────────────
  const ICON_BASE       = 'https://wow.zamimg.com/images/wow/icons/large/';
  const CLASS_ICON_BASE = 'https://wow.zamimg.com/images/wow/icons/medium/';
  const GRID_STEP = 600;
  const CELL_PX   = 36;
  const GRID_PX   = 58;

  const CLASS_COLORS = {
    1:'#C79C6E', 2:'#F58CBA', 3:'#ABD473', 4:'#FFF569', 5:'#FFFFFF',
    6:'#C41F3B', 7:'#0070DE', 8:'#69CCF0', 9:'#9482C9', 10:'#00FF98',
    11:'#FF7D0A', 12:'#A330C9', 13:'#33937F',
  };

  const CLASS_NAMES = {"1":"Воин","2":"Паладин","3":"Охотник","4":"Разбойник","5":"Жрец","6":"Рыцарь смерти","7":"Шаман","8":"Маг","9":"Чернокнижник","10":"Монах","11":"Друид","12":"Охотник на демонов","13":"Пробудитель"};
  const SPEC_NAMES = {"71":"Оружие","72":"Неистовство","73":"Защита","65":"Свет","66":"Защита","70":"Воздаяние","253":"Повелитель зверей","254":"Стрельба","255":"Выживание","259":"Ликвидация","260":"Головорез","261":"Скрытность","256":"Послушание","257":"Свет","258":"Тьма","250":"Кровь","251":"Лед","252":"Нечестивость","262":"Стихии","263":"Совершенствование","264":"Исцеление","62":"Тайная магия","63":"Огонь","64":"Лед","265":"Колдовство","266":"Демонология","267":"Разрушение","268":"Хмелевар","269":"Танцующий с ветром","270":"Ткач туманов","102":"Баланс","103":"Сила зверя","104":"Страж","105":"Исцеление","577":"Истребление","581":"Месть","1467":"Опустошение","1468":"Сохранение","1473":"Насыщение"};
  const RU_SUBTREE_NAMES = {"Aldrachi Reaver":"Альдрахийский разоритель","Archon":"Архонт","Chronowarden":"Хроностраж","Colossus":"Колосс","Conduit of the Celestials":"Проводник Небожителей","Dark Ranger":"Темный следопыт","Deathbringer":"Вестник Смерти","Deathstalker":"Ловчий смерти","Diabolist":"Демонопоклонник","Druid of the Claw":"Друид-хищник","Elune's Chosen":"Избранник Элуны","Farseer":"Предсказатель","Fatebound":"Служитель судьбы","Fel-Scarred":"Истерзанный Скверной","Flameshaper":"Ваятель огня","Frostfire":"Ледяной огонь","Hellcaller":"Призыватель огня","Herald of the Sun":"Вестник солнца","Keeper of the Grove":"Хранитель рощи","Lightsmith":"Кузнец Света","Master of Harmony":"Мастер гармонии","Mountain Thane":"Горный тан","Oracle":"Оракул","Pack Leader":"Вожак стаи","Rider of the Apocalypse":"Всадник апокалипсиса","San'layn":"Сан'лейн","Scalecommander":"Дракомандир","Sentinel":"Часовой","Shado-Pan":"Шадо-Пан","Slayer":"Истребитель","Soul Harvester":"Пожинатель душ","Spellslinger":"Чаромет","Stormbringer":"Вестник шторма","Sunfury":"Ярость солнца","Templar":"Храмовник","Totemic":"Тотемист","Trickster":"Ловкач","Voidweaver":"Ткач Бездны","Wildstalker":"Следопыт"};

  function classNameRu(classId, fallback = '') {
    return CLASS_NAMES[classId] || fallback;
  }
  function specNameRu(specId, fallback = '') {
    return SPEC_NAMES[specId] || fallback;
  }
  function subTreeNameRu(entryOrName, fallback = 'Hero') {
    const name = typeof entryOrName === 'string' ? entryOrName : entryOrName?.name;
    return RU_SUBTREE_NAMES[name] || name || fallback;
  }

  // ── Кэш talents.json на уровне модуля ────────────────────────────────────
  let _talentsCache   = null;
  let _talentsPromise = null;

  function loadTalents() {
    if (_talentsCache)  return Promise.resolve(_talentsCache);
    if (_talentsPromise) return _talentsPromise;
    _talentsPromise = fetch('/talents.json')
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(data => { _talentsCache = data; return data; });
    return _talentsPromise;
  }

  // ── Вспомогательные функции ───────────────────────────────────────────────
  function iconUrl(icon) {
    if (!icon) return `${ICON_BASE}inv_misc_questionmark.jpg`;
    return `${ICON_BASE}${icon.replace(/\.(tga|blp)$/i, '')}.jpg`;
  }
  function coordToPx(posX, posY, minX, minY) {
    return {
      x: Math.round(((posX - minX) / GRID_STEP) * GRID_PX),
      y: Math.round(((posY - minY) / GRID_STEP) * GRID_PX),
    };
  }
  function buildNodeMap(nodes) {
    const m = {};
    for (const n of nodes) m[n.id] = n;
    return m;
  }
  function totalSpent(build) {
    return Object.values(build).reduce((s, v) => s + v, 0);
  }
  function getNodeRank(node, build) {
    const rank = build[node.id] || 0;
    if (rank > 0) return rank;
    return node.freeNode ? node.maxRanks || 1 : 0;
  }
  function getNodeChoice(node, build) {
    return build[`${node.id}_choice`] || node.entries?.[0]?.index || 100;
  }
  function isNodeAvailable(node, build, nodeMap) {
    if (node.entryNode || node.freeNode) return true;
    if (!node.prev || node.prev.length === 0) return true;
    return node.prev.some(pid => getNodeRank(nodeMap?.[pid] || { id: pid, maxRanks: 1 }, build) > 0);
  }
  function canRemovePoint(nodeId, build, nodeMap) {
    const h = { ...build, [nodeId]: (build[nodeId] || 0) - 1 };
    if (h[nodeId] <= 0) delete h[nodeId];
    for (const [id, rank] of Object.entries(h)) {
      if (rank <= 0) continue;
      const n = nodeMap[id];
      if (!n || n.entryNode || n.freeNode || !n.prev?.length) continue;
      if (!n.prev.some(pid => getNodeRank(nodeMap[pid] || { id: pid, maxRanks: 1 }, h) > 0)) return false;
    }
    return true;
  }

  // ── SVG Connectors ────────────────────────────────────────────────────────
  function TalentConnectors({ nodes, build, nodeMap, minX, minY }) {
    const half       = CELL_PX / 2;
    const ARROW_SIZE = 5;
    const ARROW_W    = 2.5;

    const segments = useMemo(() => {
      const result = [], seen = new Set();
      for (const node of nodes) {
        for (const nextId of (node.next || [])) {
          const key = `${node.id}-${nextId}`;
          if (seen.has(key)) continue;
          seen.add(key);
          const target = nodeMap[nextId];
          if (!target) continue;

          const from = coordToPx(node.posX,   node.posY,   minX, minY);
          const to   = coordToPx(target.posX, target.posY, minX, minY);

          const fx = from.x + half, fy = from.y + half;
          const tx = to.x   + half, ty = to.y   + half;
          const dx = tx - fx, dy = ty - fy;
          const dist = Math.sqrt(dx*dx + dy*dy) || 1;
          const ux = dx/dist, uy = dy/dist;
          const nx = -uy,     ny =  ux;

          const x1 = fx + ux * (half + 2);
          const y1 = fy + uy * (half + 2);
          const x2 = tx - ux * (half + ARROW_SIZE + 1);
          const y2 = ty - uy * (half + ARROW_SIZE + 1);

          const tipX = tx - ux * (half - 1);
          const tipY = ty - uy * (half - 1);
          const baseX = tipX - ux * ARROW_SIZE;
          const baseY = tipY - uy * ARROW_SIZE;
          const pts = [
            `${tipX},${tipY}`,
            `${baseX + nx*ARROW_W},${baseY + ny*ARROW_W}`,
            `${baseX - nx*ARROW_W},${baseY - ny*ARROW_W}`,
          ].join(' ');

          const fromA = getNodeRank(node, build) > 0;
          const toA   = getNodeRank(target, build) > 0;
          const color = fromA && toA ? '#c9b27a' : '#3a3529';
          const sw    = fromA && toA ? 1.25 : 1;

          result.push({ key, x1, y1, x2, y2, pts, color, sw });
        }
      }
      return result;
    }, [nodes, build, nodeMap, minX, minY]);

    if (!segments.length) return null;
    return (
      <svg style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', pointerEvents:'none', overflow:'visible' }}>
        {segments.map(({ key, x1, y1, x2, y2, pts, color, sw }) => (
          <g key={key}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={sw} strokeLinecap="round" />
            <polygon points={pts} fill={color} />
          </g>
        ))}
      </svg>
    );
  }

  // ── Tooltip ───────────────────────────────────────────────────────────────
  function Tooltip({ entry, node, rank, classColor, x, y }) {
    const maxRank = node.maxRanks || 1;
    const safeX   = Math.min(x, window.innerWidth - 250);
    const safeY   = Math.max(8, y);
    return (
      <div style={{
        position:'fixed', left:safeX, top:safeY, zIndex:9999, width:230,
        background:'linear-gradient(135deg,#18100a,#0c0806)',
        border:`1px solid ${classColor}55`, borderRadius:6,
        padding:'10px 12px', pointerEvents:'none',
        boxShadow:'0 8px 32px rgba(0,0,0,0.85)',
        fontFamily:'"Exo 2",sans-serif',
      }}>
        <div style={{ display:'flex', gap:8, marginBottom:6, alignItems:'center' }}>
          <img src={iconUrl(entry.icon)}
            style={{ width:34, height:34, borderRadius:3, border:`1px solid ${classColor}66` }}
            alt="" onError={e => e.target.src=`${ICON_BASE}inv_misc_questionmark.jpg`} />
          <div>
            <div style={{ color:classColor, fontSize:16, fontWeight:700 }}>{entry.name}</div>
            <div style={{ color:'#777', fontSize:13, marginTop:2 }}>
              {entry.type==='active' ? '⚡ Active' : '✦ Passive'}
              {maxRank > 1 && ` — Rank ${rank}/${maxRank}`}
            </div>
          </div>
        </div>
        {node.type==='choice' && (
          <div style={{ color:'#666', fontSize:13, paddingTop:4, borderTop:'1px solid #222', marginBottom:4 }}>
            Choice node — click to cycle variants
          </div>
        )}
        <div style={{ color:'#aaa', fontSize:14, lineHeight:1.4 }}>
          {rank===0 ? 'Click to learn.'
            : rank<maxRank ? 'Click to rank up. Right-click to remove.'
            : 'Right-click to remove.'}
        </div>
      </div>
    );
  }

  // ── Single Node ───────────────────────────────────────────────────────────
  function TalentNode({ node, build, nodeMap, onLeft, onRight, classColor }) {
    const [hov, setHov]       = useState(false);
    const [tipPos, setTipPos] = useState({ x:0, y:0 });
    const ref = useRef();

    const rank     = getNodeRank(node, build);
    const maxRank  = node.maxRanks || 1;
    const isFull   = rank >= maxRank;
    const isEmpty  = rank === 0;
    const avail    = isNodeAvailable(node, build, nodeMap);
    const isChoice = node.type === 'choice';
    const choiceIdx = getNodeChoice(node, build);
    const displayEntry = isChoice && rank > 0
      ? (node.entries || []).find(e => e.index === choiceIdx) || node.entries?.[0]
      : node.entries?.[0];

    function enter() {
      setHov(true);
      const r = ref.current?.getBoundingClientRect();
      if (r) setTipPos({ x: r.right + 8, y: r.top });
    }

    const borderColor = isFull  ? '#dec57f'
                      : rank > 0 ? '#84ad57'
                      : avail ? '#84ad57'
                      : '#3b3429';
    const isPassive   = displayEntry?.type === 'passive';
    const iconRadius  = isChoice ? '20%' : isPassive ? '50%' : '3px';

    return (
      <div ref={ref}
        style={{ position:'absolute', width:CELL_PX, height:CELL_PX }}
        onMouseEnter={enter}
        onMouseLeave={() => setHov(false)}>
        {isChoice && (
          <div style={{
            position:'absolute', top:-8, left:'50%', transform:'translateX(-50%)',
            fontSize:12, color:'#c8a84b', pointerEvents:'none', zIndex:2, textShadow:'0 0 4px #000',
          }}>⬡</div>
        )}
        <button
          onClick={() => onLeft(node)}
          onContextMenu={e => { e.preventDefault(); onRight(node); }}
          style={{
            width:'100%', height:'100%', padding:0,
            border:`2px solid ${borderColor}`, borderRadius:iconRadius,
            background:'#0a0a0a',
            cursor: node.freeNode ? 'default' : avail || !isEmpty ? 'pointer' : 'not-allowed',
            position:'relative', overflow:'hidden', outline:'none',
            transition:'border-color 0.15s, transform 0.1s, box-shadow 0.15s',
            transform: hov && !node.freeNode && (avail || !isEmpty) ? 'scale(1.15)' : 'scale(1)',
            boxShadow: 'none',
          }}>
          {displayEntry && (
            <img src={iconUrl(displayEntry.icon)} alt={displayEntry.name}
              style={{
                width:'100%', height:'100%', display:'block', borderRadius:iconRadius,
                filter: isEmpty && !avail ? 'grayscale(100%) brightness(0.34)'
                      : hov && !node.freeNode && avail ? 'brightness(1.18)'
                      : isEmpty           ? 'brightness(1)'
                      : 'brightness(1) saturate(1)',
                transition:'filter 0.2s',
              }}
              onError={e => e.target.src=`${ICON_BASE}inv_misc_questionmark.jpg`} />
          )}
        </button>
        {maxRank > 1 && (
          <div style={{
            position:'absolute', right:-2, bottom:-2,
            fontSize:12, fontWeight:700, lineHeight:1,
            color:'#fff', background:'#000', borderRadius:2, padding:'0 3px',
            fontFamily:'"Exo 2",sans-serif', whiteSpace:'nowrap',
            textShadow:'1px 1px 0 #242424,0 1px 0 #242424,-1px 1px 0 #242424,-1px 0 0 #242424,-1px -1px 0 #242424,0 -1px 0 #242424,1px -1px 0 #242424,1px 0 0 #242424', pointerEvents:'none', zIndex:2,
          }}>{rank}/{maxRank}</div>
        )}
        {hov && displayEntry && (
          <Tooltip entry={displayEntry} node={node} rank={rank}
            classColor={classColor || '#c8a84b'} x={tipPos.x} y={tipPos.y} />
        )}
      </div>
    );
  }

  // ── Tree ──────────────────────────────────────────────────────────────────
  function TalentTree({ title, icon, nodes, build, onUpdate, nodeMap, classColor }) {
    if (!nodes || !nodes.length) return null;
    const { minX, minY, maxX, maxY } = useMemo(() => {
      let mnX=Infinity, mnY=Infinity, mxX=-Infinity, mxY=-Infinity;
      for (const n of nodes) {
        if (n.posX < mnX) mnX = n.posX; if (n.posY < mnY) mnY = n.posY;
        if (n.posX > mxX) mxX = n.posX; if (n.posY > mxY) mxY = n.posY;
      }
      return { minX:mnX, minY:mnY, maxX:mxX, maxY:mxY };
    }, [nodes]);

    const cols = Math.round((maxX - minX) / GRID_STEP) + 1;
    const rows = Math.round((maxY - minY) / GRID_STEP) + 1;
    const canvasW = (cols - 1) * GRID_PX + CELL_PX + 8;
    const canvasH = (rows - 1) * GRID_PX + CELL_PX + 8;

    const spent = useMemo(() => nodes.reduce((s,n) => s+(build[n.id]||0), 0), [nodes, build]);
    const gates = [...new Set(nodes.filter(n=>n.reqPoints>0).map(n=>n.reqPoints))].sort((a,b)=>a-b);

    function handleLeft(node) {
      if (node.freeNode) return;
      if (node.reqPoints && spent < node.reqPoints) return;
      if (!isNodeAvailable(node, build, nodeMap) && !getNodeRank(node, build)) return;
      const rank = build[node.id] || 0;
      if (node.type === 'choice') {
        const entries = node.entries || [];
        if (rank === 0) { onUpdate({...build,[node.id]:1,[`${node.id}_choice`]:entries[0]?.index||100}); return; }
        const ci = entries.findIndex(e => e.index === (build[`${node.id}_choice`]||entries[0]?.index));
        const ni = (ci+1) % entries.length;
        onUpdate({...build,[`${node.id}_choice`]:entries[ni].index});
        return;
      }
      if (rank >= node.maxRanks) return;
      onUpdate({...build,[node.id]:rank+1});
    }
    function handleRight(node) {
      if (node.freeNode) return;
      const rank = build[node.id] || 0;
      if (!rank) return;
      if (!canRemovePoint(node.id, build, nodeMap)) return;
      const next = {...build,[node.id]:rank-1};
      if (!next[node.id]) delete next[node.id];
      onUpdate(next);
    }

    return (
      <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
        {/* Header */}
        <div style={{
          display:'flex', alignItems:'center', gap:10, padding:'8px 12px 10px',
          background:`linear-gradient(90deg,${classColor}18,transparent)`,
          borderBottom:`1px solid ${classColor}22`, marginBottom:12,
        }}>
          {icon && <img src={icon} style={{ width:26, height:26, borderRadius:3, border:`1px solid ${classColor}55` }}
            alt="" onError={e=>e.target.style.display='none'} />}
          <div>
            <div style={{ color:classColor, fontSize:16, fontWeight:700, fontFamily:'"Exo 2",sans-serif' }}>{title}</div>
            <div style={{ color:'#555', fontSize:14, fontFamily:'"Exo 2",sans-serif' }}>{spent} pts spent</div>
          </div>
        </div>
        {/* Gates */}
        {gates.length > 0 && (
          <div style={{ display:'flex', gap:6, padding:'0 12px 10px', flexWrap:'wrap' }}>
            {gates.map(req => (
              <div key={req} style={{
                fontSize:13, fontFamily:'"Exo 2",sans-serif', padding:'2px 7px', borderRadius:3,
                background: spent>=req ? `${classColor}18` : '#111',
                color:       spent>=req ? classColor : '#3a3a3a',
                border:`1px solid ${spent>=req ? classColor : '#222'}`,
              }}>
                {spent>=req ? '✓' : '🔒'} {req} pts
              </div>
            ))}
          </div>
        )}
        {/* Canvas */}
        <div style={{ position:'relative', width:canvasW, height:canvasH, margin:'0 auto', overflow:'visible' }}>
          <TalentConnectors nodes={nodes} build={build} nodeMap={nodeMap} minX={minX} minY={minY} />
          {nodes.map(node => {
            const px = coordToPx(node.posX, node.posY, minX, minY);
            return (
              <div key={node.id} style={{ position:'absolute', left:px.x, top:px.y, width:CELL_PX, height:CELL_PX, zIndex:1 }}>
                <TalentNode node={node} build={build} nodeMap={nodeMap}
                  onLeft={handleLeft} onRight={handleRight} classColor={classColor} />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Hero Selector ─────────────────────────────────────────────────────────
  function HeroSelector({ entries, activeSubTreeId, onSelect, classColor }) {
    if (!entries || !entries.length) return null;
    return (
      <div style={{ display:'flex', gap:6, padding:'0 12px 12px', flexWrap:'wrap' }}>
        {entries.map(entry => {
          const isActive = entry.traitSubTreeId === activeSubTreeId;
          return (
            <button key={entry.traitSubTreeId} onClick={() => onSelect(entry.traitSubTreeId)}
              style={{
                padding:'4px 14px', borderRadius:3,
                border:`1px solid ${isActive ? classColor : '#2a2a2a'}`,
                background: isActive ? `${classColor}22` : '#0d0d0d',
                color: isActive ? classColor : '#555',
                fontFamily:'"Exo 2",sans-serif', fontSize:14,
                fontWeight: isActive ? 700 : 400, cursor:'pointer', transition:'all 0.15s',
              }}>
              {entry.name}
            </button>
          );
        })}
      </div>
    );
  }

  const LOADOUT_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const LOADOUT_BITS_PER_CHAR = 6;
  const LOADOUT_VERSION_BITS = 8;
  const LOADOUT_SPEC_BITS = 16;
  const LOADOUT_TREE_HASH_BITS = 128;
  const LOADOUT_RANK_BITS = 6;
  const LOADOUT_CHOICE_BITS = 2;

  function createLoadoutReader(exportString) {
    const dataValues = [];
    for (const ch of exportString.trim()) {
      const value = LOADOUT_CHARS.indexOf(ch);
      if (value < 0) {
        throw new Error('Invalid talent string character');
      }
      dataValues.push(value);
    }

    return {
      dataValues,
      currentIndex: 0,
      currentExtractedBits: 0,
      currentRemainingValue: dataValues[0] || 0,
      extractValue(bitWidth) {
        let value = 0;
        let bitsNeeded = bitWidth;

        while (bitsNeeded > 0) {
          if (this.currentIndex >= this.dataValues.length) {
            throw new Error('Talent string is truncated');
          }

          const remainingBits = LOADOUT_BITS_PER_CHAR - this.currentExtractedBits;
          const bitsToTake = Math.min(remainingBits, bitsNeeded);
          const bitMask = (1 << bitsToTake) - 1;

          value |= (this.currentRemainingValue & bitMask) << (bitWidth - bitsNeeded);

          this.currentRemainingValue >>= bitsToTake;
          this.currentExtractedBits += bitsToTake;
          bitsNeeded -= bitsToTake;

          if (this.currentExtractedBits === LOADOUT_BITS_PER_CHAR) {
            this.currentIndex += 1;
            this.currentExtractedBits = 0;
            this.currentRemainingValue = this.dataValues[this.currentIndex] || 0;
          }
        }

        return value;
      },
      hasRemainingBits() {
        return this.currentIndex < this.dataValues.length;
      },
    };
  }

  function readLoadoutHeader(reader) {
    const minBits = LOADOUT_VERSION_BITS + LOADOUT_SPEC_BITS + LOADOUT_TREE_HASH_BITS;
    const totalBits = reader.dataValues.length * LOADOUT_BITS_PER_CHAR;
    if (totalBits < minBits) {
      return { valid: false, version: 0, specId: 0 };
    }

    const version = reader.extractValue(LOADOUT_VERSION_BITS);
    const specId = reader.extractValue(LOADOUT_SPEC_BITS);

    for (let bitsLeft = LOADOUT_TREE_HASH_BITS; bitsLeft > 0; bitsLeft -= LOADOUT_BITS_PER_CHAR) {
      reader.extractValue(Math.min(LOADOUT_BITS_PER_CHAR, bitsLeft));
    }

    return { valid: true, version, specId };
  }

  function decodeNodeStates(exportString) {
    const reader = createLoadoutReader(exportString);
    const header = readLoadoutHeader(reader);
    if (!header.valid) {
      throw new Error('Invalid talent string format');
    }
    if (header.version !== 1 && header.version !== 2) {
      throw new Error(`Unknown loadout version: ${header.version}`);
    }

    const states = [];
    while (reader.hasRemainingBits()) {
      const isNodeSelected = reader.extractValue(1) === 1;
      let isNodePurchased = isNodeSelected;
      let isPartiallyRanked = false;
      let partialRanksPurchased = 0;
      let isChoiceNode = false;
      let choiceNodeSelection = 0;

      if (header.version > 1 && isNodeSelected) {
        isNodePurchased = reader.extractValue(1) === 1;
      }
      if (isNodePurchased) {
        isPartiallyRanked = reader.extractValue(1) === 1;
        if (isPartiallyRanked) {
          partialRanksPurchased = reader.extractValue(LOADOUT_RANK_BITS);
        }
        isChoiceNode = reader.extractValue(1) === 1;
        if (isChoiceNode) {
          choiceNodeSelection = reader.extractValue(LOADOUT_CHOICE_BITS);
        }
      }

      states.push({
        isNodeSelected,
        isNodePurchased,
        isPartiallyRanked,
        partialRanksPurchased,
        isChoiceNode,
        choiceNodeSelection,
      });
    }

    return {
      importedSpecId: header.specId,
      states,
    };
  }

  function getImportNodeOrder(current) {
    const order = [...(current.fullNodeOrder || [])];
    if (current.classId === 6 && current.specId === 250) {
      const improvedHeartStrike = order.indexOf(76126);
      const improvedVampiricBlood = order.indexOf(76140);
      if (improvedHeartStrike >= 0 && improvedVampiricBlood >= 0) {
        order[improvedHeartStrike] = 76140;
        order[improvedVampiricBlood] = 76126;
      }
    }
    return order;
  }

  function decodeTalentString(code, current) {
    const { importedSpecId, states } = decodeNodeStates(code);
    const allNodes = [
      ...(current.classNodes || []),
      ...(current.specNodes || []),
      ...(current.heroNodes || []),
      ...(current.subTreeNodes || []),
    ];
    const allMap = {};
    for (const node of allNodes) {
      allMap[node.id] = node;
    }

    const fullNodeOrder = getImportNodeOrder(current);
    if (states.length < fullNodeOrder.length) {
      throw new Error('Talent string does not match this tree');
    }

    const classSet = new Set((current.classNodes || []).map(node => node.id));
    const specSet = new Set((current.specNodes || []).map(node => node.id));
    const heroSet = new Set((current.heroNodes || []).map(node => node.id));

    const newClass = {};
    const newSpec = {};
    const newHero = {};
    let newSubTreeId = null;

    fullNodeOrder.forEach((nodeId, index) => {
      const node = allMap[nodeId];
      const state = states[index];
      if (!node || !state || !state.isNodePurchased) return;

      if (node.type === 'subtree') {
        const picked = (node.entries || [])[state.choiceNodeSelection];
        if (picked) {
          newSubTreeId = picked.traitSubTreeId;
        }
        return;
      }

      const build = classSet.has(nodeId)
        ? newClass
        : specSet.has(nodeId)
          ? newSpec
          : heroSet.has(nodeId)
            ? newHero
            : null;
      if (!build) return;

      let rank = node.maxRanks || 1;
      if (state.isPartiallyRanked) {
        rank = Math.max(1, state.partialRanksPurchased);
      }
      build[nodeId] = rank;

      if (node.type === 'choice') {
        const choiceEntry = (node.entries || [])[state.choiceNodeSelection] || node.entries?.[0];
        if (choiceEntry) {
          build[`${nodeId}_choice`] = choiceEntry.index;
        }
      }
    });

    return {
      importedSpecId,
      newClass,
      newSpec,
      newHero,
      newSubTreeId,
    };
  }

  function createLoadoutWriter() {
    return {
      bits: [],
      writeVal(value, bitWidth) {
        for (let i = 0; i < bitWidth; i++) {
          this.bits.push((value >> i) & 1);
        }
      },
      getExportString() {
        let str = '';
        let i = 0;
        while (i < this.bits.length) {
          let charVal = 0;
          for (let b = 0; b < LOADOUT_BITS_PER_CHAR; b++) {
            if (i < this.bits.length) {
              charVal |= (this.bits[i] << b);
              i++;
            }
          }
          str += LOADOUT_CHARS[charVal];
        }
        return str;
      }
    };
  }

  function encodeTalentString(current, classBuild, specBuild, heroBuild, activeSubTreeId) {
    const writer = createLoadoutWriter();
    // Пишем заголовок (v2)
    writer.writeVal(2, LOADOUT_VERSION_BITS); // version = 2
    writer.writeVal(current.specId, LOADOUT_SPEC_BITS);
    
    // Заглушка под treeHash (128 бит нулей)
    for (let i = 0; i < 128; i++) {
      writer.bits.push(0);
    }

    const allNodes = [
      ...(current.classNodes || []),
      ...(current.specNodes || []),
      ...(current.heroNodes || []),
      ...(current.subTreeNodes || []),
    ];
    const allMap = {};
    for (const node of allNodes) {
      allMap[node.id] = node;
    }

    const classSet = new Set((current.classNodes || []).map(node => node.id));
    const specSet = new Set((current.specNodes || []).map(node => node.id));
    const heroSet = new Set((current.heroNodes || []).map(node => node.id));

    const fullNodeOrder = getImportNodeOrder(current);
    
    const resolvedSubTreeId = activeSubTreeId ??
      current?.subTreeNodes?.[0]?.entries?.[0]?.traitSubTreeId ?? null;

    fullNodeOrder.forEach(nodeId => {
      const node = allMap[nodeId];
      if (!node) {
        writer.writeVal(0, 1); // не куплено
        return;
      }

      if (node.type === 'subtree') {
        // subtree переключатель героических веток
        // ищем выбранный subTreeId среди entries
        const entries = node.entries || [];
        const idx = entries.findIndex(e => e.traitSubTreeId === resolvedSubTreeId);
        const selectedIdx = idx >= 0 ? idx : 0;
        
        writer.writeVal(1, 1); // isNodeSelected = true
        writer.writeVal(1, 1); // isNodePurchased = true
        writer.writeVal(0, 1); // isPartiallyRanked = false
        writer.writeVal(1, 1); // isChoiceNode = true
        writer.writeVal(selectedIdx, LOADOUT_CHOICE_BITS);
        return;
      }

      const build = classSet.has(nodeId)
        ? classBuild
        : specSet.has(nodeId)
          ? specBuild
          : heroSet.has(nodeId)
            ? heroBuild
            : null;

      const rank = build ? (build[nodeId] || 0) : 0;
      const maxRank = node.maxRanks || 1;

      if (rank === 0) {
        writer.writeVal(0, 1); // не куплено
        return;
      }

      writer.writeVal(1, 1); // isNodeSelected = true
      writer.writeVal(1, 1); // isNodePurchased = true

      const isPartiallyRanked = rank < maxRank;
      writer.writeVal(isPartiallyRanked ? 1 : 0, 1);
      if (isPartiallyRanked) {
        writer.writeVal(rank, LOADOUT_RANK_BITS);
      }

      const isChoice = node.type === 'choice';
      writer.writeVal(isChoice ? 1 : 0, 1);
      if (isChoice) {
        const choiceIdx = build[`${nodeId}_choice`] || node.entries?.[0]?.index || 100;
        const entries = node.entries || [];
        const idx = entries.findIndex(e => e.index === choiceIdx);
        const selectedIdx = idx >= 0 ? idx : 0;
        writer.writeVal(selectedIdx, LOADOUT_CHOICE_BITS);
      }
    });

    return writer.getExportString();
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function nodesBounds(nodes) {
    let mnX = Infinity, mnY = Infinity, mxX = -Infinity, mxY = -Infinity;
    for (const n of nodes) {
      if (n.posX < mnX) mnX = n.posX;
      if (n.posY < mnY) mnY = n.posY;
      if (n.posX > mxX) mxX = n.posX;
      if (n.posY > mxY) mxY = n.posY;
    }
    return { mnX, mnY, mxX, mxY };
  }

  function renderStaticTreeHtml(nodes, build, nodeMap, title, color, isLast) {
    if (!nodes || !nodes.length) return '';
    const { mnX, mnY, mxX, mxY } = nodesBounds(nodes);
    const cols = Math.round((mxX - mnX) / GRID_STEP) + 1;
    const rows = Math.round((mxY - mnY) / GRID_STEP) + 1;
    const W = (cols - 1) * GRID_PX + CELL_PX + 8;
    const H = (rows - 1) * GRID_PX + CELL_PX + 8;
    const half = CELL_PX / 2;
    const ARROW_SIZE = 5;
    const ARROW_W = 2.5;

    let svgLines = '';
    const seen = new Set();
    for (const node of nodes) {
      for (const nextId of node.next || []) {
        const key = `${node.id}-${nextId}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const target = nodeMap[nextId];
        if (!target) continue;

        const fx = Math.round(((node.posX - mnX) / GRID_STEP) * GRID_PX) + half;
        const fy = Math.round(((node.posY - mnY) / GRID_STEP) * GRID_PX) + half;
        const tx = Math.round(((target.posX - mnX) / GRID_STEP) * GRID_PX) + half;
        const ty = Math.round(((target.posY - mnY) / GRID_STEP) * GRID_PX) + half;
        const dx = tx - fx;
        const dy = ty - fy;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const ux = dx / dist;
        const uy = dy / dist;
        const nx = -uy;
        const ny = ux;
        const x1 = fx + ux * (half + 2);
        const y1 = fy + uy * (half + 2);
        const x2 = tx - ux * (half + ARROW_SIZE + 1);
        const y2 = ty - uy * (half + ARROW_SIZE + 1);
        const tipX = tx - ux * (half - 1);
        const tipY = ty - uy * (half - 1);
        const bx = tipX - ux * ARROW_SIZE;
        const by = tipY - uy * ARROW_SIZE;
        const pts = `${tipX},${tipY} ${bx + nx * ARROW_W},${by + ny * ARROW_W} ${bx - nx * ARROW_W},${by - ny * ARROW_W}`;
        const fromA = getNodeRank(node, build) > 0;
        const toA = getNodeRank(target, build) > 0;
        const col = fromA && toA ? '#c9b27a' : '#3a3529';
        const sw = fromA && toA ? 1.25 : 1;
        svgLines += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${col}" stroke-width="${sw}" stroke-linecap="round"/>`;
        svgLines += `<polygon points="${pts}" fill="${col}"/>`;
      }
    }

    let nodesHtml = '';
    for (const node of nodes) {
      const x = Math.round(((node.posX - mnX) / GRID_STEP) * GRID_PX);
      const y = Math.round(((node.posY - mnY) / GRID_STEP) * GRID_PX);
      const rank = getNodeRank(node, build);
      const maxRank = node.maxRanks || 1;
      const isFull = rank >= maxRank;
      const isEmpty = rank === 0;
      const isChoice = node.type === 'choice';
      const choiceIdx = getNodeChoice(node, build);
      const entry = isChoice && rank > 0
        ? (node.entries || []).find(e => e.index === choiceIdx) || node.entries?.[0]
        : node.entries?.[0];
      if (!entry) continue;
      const isPassive = entry.type === 'passive';
      const radius = isChoice ? '20%' : isPassive ? '50%' : '3px';
      const avail = isNodeAvailable(node, build, nodeMap);
      const filter = isEmpty && !avail
        ? 'grayscale(100%) brightness(0.34)'
        : isEmpty ? 'brightness(1)' : 'brightness(1) saturate(1)';
      const border = isFull
        ? '2px solid #dec57f'
        : rank > 0 || avail ? '2px solid #84ad57' : '2px solid #3b3429';
      const entryName = escapeHtml(entry.name || '');
      nodesHtml += `<div title="${entryName}" style="position:absolute;left:${x}px;top:${y}px;width:${CELL_PX}px;height:${CELL_PX}px;">`;
      nodesHtml += `<img src="${iconUrl(entry.icon)}" alt="${entryName}" style="width:100%;height:100%;display:block;border-radius:${radius};border:${border};filter:${filter};box-sizing:border-box;"/>`;
      if (maxRank > 1) {
        nodesHtml += `<div style="position:absolute;right:-2px;bottom:-2px;font-size:9px;font-weight:700;color:#fff;background:#000;border-radius:2px;padding:0 3px;font-family:'Exo 2',sans-serif;white-space:nowrap;text-shadow:1px 1px 0 #242424,0 1px 0 #242424,-1px 1px 0 #242424,-1px 0 0 #242424,-1px -1px 0 #242424,0 -1px 0 #242424,1px -1px 0 #242424,1px 0 0 #242424;line-height:1;z-index:2;">${rank}/${maxRank}</div>`;
      }
      nodesHtml += '</div>';
    }

    return `
<div style="flex:0 0 auto;padding:0 16px 16px;${isLast ? '' : `border-right:1px solid ${color}18;`} ">
  <div style="color:${color};font-size:12px;font-weight:700;font-family:'Exo 2',sans-serif;padding:6px 12px 10px;margin-bottom:10px;background:linear-gradient(90deg,transparent,${color}18,transparent);border-bottom:1px solid ${color}22;text-align:center;">${escapeHtml(title)}</div>
  <div style="position:relative;width:${W}px;height:${H}px;">
    <svg style="position:absolute;top:0;left:0;width:100%;height:100%;overflow:visible;pointer-events:none;">${svgLines}</svg>
    ${nodesHtml}
  </div>
</div>`;
  }

  function buildStaticTalentHtml(current, options) {
    const {
      classId,
      specId,
      classBuild = {},
      specBuild = {},
      heroBuild = {},
      activeSubTreeId = null,
    } = options || {};
    const allNodes = [
      ...(current.classNodes || []),
      ...(current.heroNodes || []),
      ...(current.specNodes || []),
    ];
    const allMap = {};
    for (const n of allNodes) allMap[n.id] = n;

    const color = CLASS_COLORS[classId] || '#c8a84b';
    const resolvedSubTreeId = activeSubTreeId ??
      current?.subTreeNodes?.[0]?.entries?.[0]?.traitSubTreeId ?? null;
    const activeHeroNodes = (current?.heroNodes || []).filter(n => n.subTreeId === resolvedSubTreeId);
    const activeHeroSubTree = current?.subTreeNodes?.[0]?.entries?.find(
      e => e.traitSubTreeId === resolvedSubTreeId,
    );
    const heroSubTreeName = subTreeNameRu(activeHeroSubTree, 'Герой');

    const trees = [];
    trees.push([current.classNodes || [], classBuild, allMap, classNameRu(classId, current.className || 'Class')]);
    if (activeHeroNodes.length) {
      trees.push([activeHeroNodes, heroBuild, allMap, heroSubTreeName]);
    }
    if ((current.specNodes || []).length) {
      trees.push([current.specNodes || [], specBuild, allMap, specNameRu(specId, current.specName || 'Spec')]);
    }

    const html = trees
      .map(([nodes, build, map, title], index) =>
        renderStaticTreeHtml(nodes, build, map, title, color, index === trees.length - 1),
      )
      .join('');

    return `<div class="tc-static" style="display:inline-block;max-width:100%;overflow-x:auto;background:radial-gradient(ellipse at center, rgba(38, 38, 38, 0.7) 0%, rgba(38, 38, 38, 0.55) 55%, rgba(38, 38, 38, 0.18) 100%);border:none;border-radius:8px;padding:8px 0 16px;margin:16px 0;vertical-align:top;">
  <div style="display:inline-flex;align-items:flex-start;padding:8px 4px 0;">
${html}
  </div>
</div>`;
  }

  // ── Главный компонент ─────────────────────────────────────────────────────
  // Принимает classId и specId как строки ("deathknight", "blood")
  // или числа (6, 250) — оба варианта работают.
  function TalentCalc({ classId: classIdProp, specId: specIdProp, loadoutCode = '' }) {
    const [talentsData, setTalentsData] = useState(_talentsCache);
    const [error, setError]             = useState(null);
    const [classBuild, setClassBuild]   = useState({});
    const [specBuild,  setSpecBuild]    = useState({});
    const [heroBuild,  setHeroBuild]    = useState({});
    const [activeSubTreeId, setActiveSubTreeId] = useState(null);
    const [importCode, setImportCode] = useState('');
    const [importOpen, setImportOpen] = useState(false);
    const [importError, setImportError] = useState(null);
    const [importOk, setImportOk] = useState(false);
    const [exportCopied, setExportCopied] = useState(false);
    const lastAutoImportKey = useRef(null);

    // Резолвим строки в числа
    const { classId, specId } = useMemo(() => {
      if (typeof classIdProp === 'number' && typeof specIdProp === 'number') {
        return { classId: classIdProp, specId: specIdProp };
      }
      return resolveIds(String(classIdProp), String(specIdProp));
    }, [classIdProp, specIdProp]);

    // Сброс билда при смене спека
    useEffect(() => {
      setClassBuild({});
      setSpecBuild({});
      setHeroBuild({});
      setActiveSubTreeId(null);
    }, [classId, specId]);

    // Загрузка talents.json
    useEffect(() => {
      if (_talentsCache) { setTalentsData(_talentsCache); return; }
      loadTalents()
        .then(data => setTalentsData(data))
        .catch(err  => setError(err.message));
    }, []);

    const current = useMemo(() =>
      (talentsData || []).find(d => d.classId===classId && d.specId===specId) ||
      (talentsData || []).find(d => d.classId===classId) || null,
      [talentsData, classId, specId],
    );

    const classNodeMap = useMemo(() => buildNodeMap(current?.classNodes || []), [current]);
    const specNodeMap  = useMemo(() => buildNodeMap(current?.specNodes  || []), [current]);
    const heroNodeMap  = useMemo(() => buildNodeMap(current?.heroNodes  || []), [current]);
    const fullNodeMap  = useMemo(() => ({...classNodeMap,...specNodeMap,...heroNodeMap}), [classNodeMap,specNodeMap,heroNodeMap]);

    const classColor = CLASS_COLORS[classId] || '#c8a84b';
    const clsName    = current?.className || '';
    const spcName    = current?.specName  || '';
    const iconSlug   = clsName.toLowerCase().replace(/\s+/g, '');
    const iconUrl2   = `${CLASS_ICON_BASE}class_${iconSlug}.jpg`;

    const resolvedSubTreeId = activeSubTreeId ??
      current?.subTreeNodes?.[0]?.entries?.[0]?.traitSubTreeId ?? null;
    const activeHeroNodes   = (current?.heroNodes || []).filter(n => n.subTreeId === resolvedSubTreeId);
    const heroSubTreeName   = current?.subTreeNodes?.[0]?.entries?.find(
      e => e.traitSubTreeId === resolvedSubTreeId,
    )?.name || 'Hero';

    const classSpent = totalSpent(classBuild);
    const specSpent  = totalSpent(specBuild);
    const heroSpent  = totalSpent(heroBuild);

    function applyImportCode(code, { showOk = true, clearInput = true } = {}) {
      const trimmedCode = (code || '').trim();
      setImportError(null);
      if (showOk) setImportOk(false);
      if (!trimmedCode || !current) return false;

      try {
        const {
          importedSpecId,
          newClass,
          newSpec,
          newHero,
          newSubTreeId,
        } = decodeTalentString(trimmedCode, current);

        if (importedSpecId !== current.specId) {
          throw new Error(`Code is for a different spec (${importedSpecId})`);
        }

        setClassBuild(newClass);
        setSpecBuild(newSpec);
        setHeroBuild(newHero);
        if (newSubTreeId) setActiveSubTreeId(newSubTreeId);
        if (showOk) {
          setImportOk(true);
          setTimeout(() => {
            setImportOk(false);
            setImportOpen(false);
          }, 1500);
        }
        if (clearInput) setImportCode('');
        return true;
      } catch (err) {
        setImportError(err.message || 'Invalid talent string');
        return false;
      }
    }

    function handleImport() {
      applyImportCode(importCode);
    }

    useEffect(() => {
      const trimmedCode = (loadoutCode || '').trim();
      if (!trimmedCode || !current) return;

      const importKey = `${classId}:${specId}:${trimmedCode}`;
      if (lastAutoImportKey.current === importKey) return;

      const ok = applyImportCode(trimmedCode, { showOk: false, clearInput: false });
      if (ok) {
        lastAutoImportKey.current = importKey;
      }
    }, [loadoutCode, current, classId, specId]);

    if (error) return (
      <div style={{ color:'#c55', padding:24, fontFamily:'sans-serif', fontSize:16 }}>
        Не удалось загрузить таланты: {error}
      </div>
    );
    if (!talentsData) return (
      <div style={{ color:'#555', padding:24, textAlign:'center', fontFamily:'sans-serif', fontSize:16 }}>
        Загрузка талантов…
      </div>
    );
    if (!current) return (
      <div style={{ color:'#555', padding:24, textAlign:'center', fontFamily:'sans-serif', fontSize:16 }}>
        Данные талантов не найдены для {classIdProp} / {specIdProp}
      </div>
    );

    return (
      <div style={{
        background:'linear-gradient(180deg,#08080e,#050505)',
        border:`1px solid ${classColor}22`, borderRadius:8, overflow:'hidden',
        boxShadow:`0 0 60px rgba(0,0,0,0.9), 0 0 120px ${classColor}08`,
        margin:'24px 0',
      }}>
        {/* Шапка */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'10px 16px', borderBottom:`1px solid ${classColor}22`,
          background:'rgba(0,0,0,0.4)', flexWrap:'wrap', gap:8,
        }}>
          <div style={{ color:classColor, fontFamily:'"Exo 2",sans-serif', fontWeight:700, fontSize:18, letterSpacing:'0.5px' }}>
            {spcName} {clsName} — Таланты
          </div>
          <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
            <div style={{
              fontFamily:'"Exo 2",sans-serif', fontSize:15, color:'#666',
              padding:'3px 10px', background:'#0a0a0a', borderRadius:3, border:'1px solid #1a1a1a',
            }}>
              Class: <b style={{color:classColor}}>{classSpent}</b>
              &nbsp;&nbsp;Hero: <b style={{color:classColor}}>{heroSpent}</b>
              &nbsp;&nbsp;Spec: <b style={{color:classColor}}>{specSpent}</b>
              &nbsp;&nbsp;Total: <b style={{color:classColor}}>{classSpent+heroSpent+specSpent}</b>
            </div>
            <button onClick={() => {
              try {
                const code = encodeTalentString(current, classBuild, specBuild, heroBuild, resolvedSubTreeId);
                navigator.clipboard.writeText(code).then(() => {
                  setExportCopied(true);
                  setTimeout(() => setExportCopied(false), 5000);
                });
              } catch (err) {
                console.error('Failed to export code', err);
              }
            }}
              style={{
                padding:'4px 12px', borderRadius:3,
                border:`1px solid ${exportCopied ? '#4ec97a' : '#2a2a2a'}`,
                background: exportCopied ? 'rgba(78,201,122,0.15)' : '#0a0a0a',
                color: exportCopied ? '#4ec97a' : '#666',
                fontFamily:'"Exo 2",sans-serif', fontSize:14, cursor:'pointer',
                fontWeight: exportCopied ? 700 : 400,
                transition: 'all 0.15s ease',
              }}>
              {exportCopied ? '✓ Скопировано' : 'Скопировать'}
            </button>
            <button onClick={() => { setImportOpen(v => !v); setImportError(null); setImportOk(false); }}
              style={{
                padding:'4px 12px', borderRadius:3,
                border:`1px solid ${importOpen ? classColor : '#2a2a2a'}`,
                background: importOpen ? `${classColor}18` : '#0a0a0a',
                color: importOpen ? classColor : '#666',
                fontFamily:'"Exo 2",sans-serif', fontSize:14, cursor:'pointer',
              }}>
              Import
            </button>
            <button onClick={() => { setClassBuild({}); setSpecBuild({}); setHeroBuild({}); }}
              style={{
                padding:'4px 12px', borderRadius:3, border:'1px solid #222',
                background:'#0a0a0a', color:'#555',
                fontFamily:'"Exo 2",sans-serif', fontSize:14, cursor:'pointer',
              }}>
              ✕ Сброс
            </button>
          </div>
        </div>

        {importOpen && (
          <div style={{
            padding:'12px 16px 14px',
            borderBottom:`1px solid ${classColor}18`,
            background:'rgba(0,0,0,0.28)',
          }}>
            <div style={{
              color:'#777', fontSize:14, marginBottom:8, fontFamily:'"Exo 2",sans-serif',
            }}>
              Paste Blizzard loadout string
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
              <input
                type="text"
                value={importCode}
                onChange={e => setImportCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleImport()}
                placeholder="CgPAAAAAAAAAAAAAAAAAAAAA..."
                style={{
                  flex:'1 1 420px', minWidth:220, height:34,
                  padding:'0 10px', borderRadius:4,
                  border:`1px solid ${importError ? '#c44' : '#2a2a2a'}`,
                  background:'#0a0a0a', color:'#ddd', outline:'none',
                  fontSize:15, fontFamily:'Consolas, monospace',
                }}
              />
              <button onClick={handleImport}
                style={{
                  height:34, padding:'0 14px', borderRadius:4,
                  border:`1px solid ${importOk ? '#4a9' : `${classColor}44`}`,
                  background: importOk ? 'rgba(68,170,136,0.14)' : `${classColor}14`,
                  color: importOk ? '#7fd6b2' : classColor,
                  fontFamily:'"Exo 2",sans-serif', fontSize:14, cursor:'pointer',
                }}>
                {importOk ? 'Imported' : 'Apply'}
              </button>
            </div>
            {importError && (
              <div style={{
                marginTop:8, color:'#d66', fontSize:14, fontFamily:'"Exo 2",sans-serif',
              }}>
                {importError}
              </div>
            )}
          </div>
        )}

        {/* Деревья */}
        <div style={{ overflowX:'auto', overflowY:'visible', background:`radial-gradient(ellipse at 50% -10%,${classColor}0a,transparent 65%)` }}>
          <div style={{ display:'inline-flex', alignItems:'flex-start', padding:'24px 12px 28px', gap:0 }}>
            {/* Class tree */}
            <div style={{ flex:'0 0 auto', padding:'0 20px 16px', borderRight:`1px solid ${classColor}18` }}>
              <TalentTree title={`${clsName} Talents`} icon={iconUrl2}
                nodes={current.classNodes||[]} build={classBuild} onUpdate={setClassBuild}
                nodeMap={fullNodeMap} classColor={classColor} />
            </div>
            {/* Hero tree */}
            {activeHeroNodes.length > 0 && (
              <div style={{ flex:'0 0 auto', padding:'0 20px 16px', borderRight:`1px solid ${classColor}18` }}>
                <HeroSelector
                  entries={current.subTreeNodes?.[0]?.entries || []}
                  activeSubTreeId={resolvedSubTreeId}
                  onSelect={id => { setActiveSubTreeId(id); setHeroBuild({}); }}
                  classColor={classColor} />
                <TalentTree title={`${heroSubTreeName} Talents`} icon={iconUrl2}
                  nodes={activeHeroNodes} build={heroBuild} onUpdate={setHeroBuild}
                  nodeMap={fullNodeMap} classColor={classColor} />
              </div>
            )}
            {/* Spec tree */}
            {(current.specNodes||[]).length > 0 && (
              <div style={{ flex:'0 0 auto', padding:'0 20px 16px' }}>
                <TalentTree title={`${spcName} Talents`} icon={iconUrl2}
                  nodes={current.specNodes||[]} build={specBuild} onUpdate={setSpecBuild}
                  nodeMap={fullNodeMap} classColor={classColor} />
              </div>
            )}
          </div>
        </div>

        {/* Подвал */}
        <div style={{
          padding:'6px 16px', borderTop:`1px solid ${classColor}0d`,
          textAlign:'center', color:'#2a2a2a', fontSize:13,
          fontFamily:'"Exo 2",sans-serif', letterSpacing:'0.3px',
        }}>
          Левый клик — добавить ранг &nbsp;·&nbsp; Правый клик — убрать ранг &nbsp;·&nbsp; Choice nodes — клик для смены варианта
        </div>
      </div>
    );
  }

  function TalentStatic({ classId: classIdProp, specId: specIdProp, loadoutCode = '', code = '' }) {
    const [talentsData, setTalentsData] = useState(_talentsCache);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);

    const { classId, specId } = useMemo(() => {
      if (typeof classIdProp === 'number' && typeof specIdProp === 'number') {
        return { classId: classIdProp, specId: specIdProp };
      }
      return resolveIds(String(classIdProp), String(specIdProp));
    }, [classIdProp, specIdProp]);

    useEffect(() => {
      if (_talentsCache) { setTalentsData(_talentsCache); return; }
      loadTalents()
        .then(data => setTalentsData(data))
        .catch(err => setError(err.message));
    }, []);

    const current = useMemo(() =>
      (talentsData || []).find(d => d.classId === classId && d.specId === specId) ||
      (talentsData || []).find(d => d.classId === classId) || null,
      [talentsData, classId, specId],
    );

    const result = useMemo(() => {
      const talentCode = (loadoutCode || code || '').trim();
      if (!current || !talentCode) return { html: '' };

      try {
        const {
          importedSpecId,
          newClass,
          newSpec,
          newHero,
          newSubTreeId,
        } = decodeTalentString(talentCode, current);

        if (importedSpecId !== current.specId) {
          throw new Error(`Code is for a different spec (${importedSpecId})`);
        }

        return {
          html: buildStaticTalentHtml(current, {
            classId,
            specId,
            classBuild: newClass,
            specBuild: newSpec,
            heroBuild: newHero,
            activeSubTreeId: newSubTreeId,
          }),
        };
      } catch (err) {
        return { error: err.message || 'Invalid talent string' };
      }
    }, [current, loadoutCode, code, classId]);

    if (error) return (
      <div style={{ color:'#c55', padding:12, fontFamily:'sans-serif', fontSize:16 }}>
        Не удалось загрузить таланты: {error}
      </div>
    );
    if (!talentsData) return (
      <div style={{ color:'#555', padding:12, fontFamily:'sans-serif', fontSize:16 }}>
        Загрузка талантов…
      </div>
    );
    if (!current) return (
      <div style={{ color:'#555', padding:12, fontFamily:'sans-serif', fontSize:16 }}>
        Данные талантов не найдены для {classIdProp} / {specIdProp}
      </div>
    );
    if (result.error) return (
      <div style={{ color:'#d66', padding:12, fontFamily:'sans-serif', fontSize:16 }}>
        Ошибка таланта: {result.error}
      </div>
    );

    const talentCode = (loadoutCode || code || '').trim();

    return (
      <div style={{ display:'inline-flex', flexDirection:'column', alignItems:'center', maxWidth:'100%' }}>
        {talentCode && (
          <button
            onClick={() => {
              navigator.clipboard.writeText(talentCode).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 5000);
              });
            }}
            style={{
              margin:'10px 0 -4px',
              padding:'8px 22px',
              borderRadius:6,
              border:`1px solid ${copied ? '#4ec97a' : '#333'}`,
              background: copied ? 'rgba(78,201,122,0.18)' : 'rgba(38,38,38,0.7)',
              color: copied ? '#4ec97a' : '#c8c8c8',
              fontFamily:'"Exo 2",sans-serif',
              fontSize:16,
              fontWeight: copied ? 700 : 600,
              cursor:'pointer',
              boxShadow: copied ? '0 0 14px rgba(78,201,122,0.18)' : '0 2px 10px rgba(0,0,0,0.35)',
              transition:'all 0.15s ease',
            }}
          >
            {copied ? 'Скопировано' : 'Скопировать код талантов'}
          </button>
        )}
        <div style={{ display:'contents' }} dangerouslySetInnerHTML={{ __html: result.html }} />
      </div>
    );
  }

  window.TALENTCALC = { TalentCalc, TalentStatic, buildStaticTalentHtml };
})();

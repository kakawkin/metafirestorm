// Стандартное округление процентов (минимум 1% если предмет есть)
function roundPct(pct) {
  const val = pct * 100;
  if (val === 0) return 0;
  if (val < 1) return 1;  // Минимум 1% если есть хоть что-то
  return Math.round(val); // Стандартное округление: 98.49→98, 98.50→99
}

// Aggregate stats block: ilvl distribution, popular trinkets/rings, secondary stats avg, gems/enchants
function aggregate(players){
  if(!players.length) return null;
  // ilvl distribution
  const ilvls = players.map(p=>p.avg_ilvl).filter(Boolean);
  const minI = Math.min(...ilvls), maxI = Math.max(...ilvls);
  const avgI = Math.round(ilvls.reduce((a,b)=>a+b,0)/ilvls.length);

  // popular items per slot
  function popular(slot, top=4){
    const c = new Map();
    for(const p of players){
      const it = p.equipment[slot];
      if(!it || !it.itemId) continue;
      const k = it.itemId;
      if(!c.has(k)) c.set(k, { item: it, count: 0 });
      c.get(k).count++;
    }
    return [...c.values()].sort((a,b)=>b.count-a.count).slice(0, top)
      .map(r=>({ ...r, pct: r.count/players.length }));
  }

  // secondaries (% распределение, legacy) — для обратной совместимости
  const sec = { haste:0, crit:0, mastery:0, versatility:0 };
  for(const p of players){
    sec.haste       += p.secondaries.haste;
    sec.crit        += p.secondaries.crit;
    sec.mastery     += p.secondaries.mastery;
    sec.versatility += p.secondaries.versatility;
  }
  for(const k of Object.keys(sec)) sec[k] = Math.round(sec[k]/players.length);

  // Среднее по абсолютным рейтингам. Источник:
  //   1) gear_stats — чистые статы с экипировки (без баффов рейда), приоритетно.
  //   2) stats — сырые рейтинги из WCL (с баффами) — fallback, если item_stats пуст.
  // Считаем только по записям, у которых поле заполнено (не null).
  function avgStatFrom(source, key){
    let sum = 0, n = 0;
    for(const p of players){
      const src = p[source];
      const v = src && src[key];
      if(v != null && !isNaN(v)){ sum += v; n++; }
    }
    return n ? Math.round(sum/n) : null;
  }
  // Проверяем, есть ли хоть у одного игрока gear_stats (item_stats заполнены).
  const hasGearStats = players.some(p => p.gear_stats);
  const source = hasGearStats ? 'gear_stats' : 'stats';

  const avgStats = {
    crit:        avgStatFrom(source, 'crit'),
    haste:       avgStatFrom(source, 'haste'),
    mastery:     avgStatFrom(source, 'mastery'),
    versatility: avgStatFrom(source, 'versatility'),
    strength:    avgStatFrom(source, 'strength'),
    agility:     avgStatFrom(source, 'agility'),
    intellect:   avgStatFrom(source, 'intellect'),
    stamina:     avgStatFrom(source, 'stamina'),
  };
  // primary_stat одинаков у всех игроков выборки (определяется парой class+spec).
  const primaryStat = players[0] && players[0].primary_stat || null;
  // Флаг для UI — можно пометить "очищенные от баффов" значения
  const statsSource = source;
  
  // Популярное оружие (топ-5)
  const weapon = popular('main_hand', 5);

  // Популярные предметы для всех слотов (для отображения в сетке)
  // Тринкеты не включаем — они показываются отдельным блоком TrinketsRow
  const allSlots = {
    head:      popular('head', 2),
    neck:      popular('neck', 2),
    shoulder:  popular('shoulder', 2),
    back:      popular('back', 2),
    chest:     popular('chest', 2),
    wrist:     popular('wrist', 2),
    hands:     popular('hands', 2),
    waist:     popular('waist', 2),
    legs:      popular('legs', 2),
    feet:      popular('feet', 2),
    finger1:   popular('finger1', 2),
    finger2:   popular('finger2', 2),
    main_hand: popular('main_hand', 2),
    off_hand:  popular('off_hand', 2),
  };

  // Tier Set статистика — процент игроков с tier set в каждом слоте
  // tier_slots из БД содержит CSV слотов, где есть ANY setID
  const tierSlots = ['head', 'shoulder', 'chest', 'hands', 'legs'];
  const tierSlotNames = {
    head: 'Голова',
    shoulder: 'Плечи',
    chest: 'Грудь',
    hands: 'Руки',
    legs: 'Ноги'
  };
  const tierStats = tierSlots.map(slot => {
    let count = 0;
    const itemCounts = new Map(); // подсчёт популярности tier предметов в слоте
    const itemObjects = new Map(); // сохраняем полные объекты item для иконок
    
    for(const p of players){
      // tier_slots = "head,shoulder,chest" — слоты с tier set
      if(p.tier_slots && p.tier_slots.split(',').includes(slot)){
        count++;
        
        // Извлекаем полный объект equipment для иконки
        const eq = p.equipment[slot];
        if(eq && eq.itemId){
          const currentCount = itemCounts.get(eq.itemId) || 0;
          itemCounts.set(eq.itemId, currentCount + 1);
          // Сохраняем объект только первый раз (все одинаковые itemId имеют одинаковую иконку)
          if(!itemObjects.has(eq.itemId)){
            itemObjects.set(eq.itemId, eq);
          }
        }
      }
    }
    
    // Находим самый популярный tier item для этого слота
    let popularItemId = null;
    let maxCount = 0;
    for(const [itemId, cnt] of itemCounts){
      if(cnt > maxCount){
        maxCount = cnt;
        popularItemId = itemId;
      }
    }
    
    return {
      slot: tierSlotNames[slot] || slot,
      slotKey: slot,
      pct: count / players.length,
      item: popularItemId ? itemObjects.get(popularItemId) : null
    };
  }).filter(s => s.pct > 0).sort((a, b) => b.pct - a.pct);

  // Enchants статистика — топ энчантов по слотам
  // Парсим pipe-формат из raw (ITEM|PERM_ENCHANT|TEMP_ENCHANT)
  const enchantSlots = ['back', 'chest', 'wrist', 'legs', 'feet', 'main_hand', 'finger1', 'finger2'];
  const enchantCounts = {};
  for(const slot of enchantSlots){
    const counts = {};
    for(const p of players){
      const eq = p.equipment[slot];
      if(!eq || !eq.raw) continue;
      const parts = eq.raw.split('|');
      // [1] — perm enchant, [2] — temp enchant
      const permUrl = parts[1] || '';
      const tempUrl = parts[2] || '';
      // Извлекаем название и spellId из HTML: <a href="...spell=123">название</a>
      const permNameMatch = permUrl.match(/>([^<]+)</);
      const permSpellMatch = permUrl.match(/spell=(\d+)/);
      const tempNameMatch = tempUrl.match(/>([^<]+)</);
      const tempSpellMatch = tempUrl.match(/spell=(\d+)/);
      
      const permName = permNameMatch ? permNameMatch[1] : null;
      const permSpellId = permSpellMatch ? permSpellMatch[1] : null;
      const tempName = tempNameMatch ? tempNameMatch[1] : null;
      const tempSpellId = tempSpellMatch ? tempSpellMatch[1] : null;
      
      if(permName && permName !== 'зачарование'){
        const key = `${slot}:${permName}:${permSpellId || ''}`;
        counts[key] = (counts[key] || 0) + 1;
      }
      if(tempName && tempName !== 'временное'){
        const key = `${slot}:${tempName} (temp):${tempSpellId || ''}`;
        counts[key] = (counts[key] || 0) + 1;
      }
    }
    enchantCounts[slot] = counts;
  }
  // Топ 1-2 энчанта на слот
  const enchants = [];
  for(const slot of enchantSlots){
    const counts = enchantCounts[slot];
    const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]).slice(0, 2);
    for(const [key, count] of sorted){
      const parts = key.split(':');
      const name = parts[1];
      const spellId = parts[2] || null;
      enchants.push({
        slot: slot.charAt(0).toUpperCase() + slot.slice(1),
        name,
        spellId,
        pct: count / players.length
      });
    }
  }

  // Embellishments статистика — подсчёт комбинаций (пар) embellishments
  // Каждый игрок может иметь максимум 2 embellishment
  // ВАЖНО: bonusIds фильтруются по справочнику embellishments (загружается в BestEmbellishments компоненте)
  // чтобы исключить обычные bonusIds (1540, 6652, 8902, ...) и оставить только embellishment bonusIds
  const embellishmentPairs = {}; // "bonusId1,bonusId2" -> count
  const allEquipmentSlots = ['head', 'neck', 'shoulder', 'back', 'chest', 'wrist', 
                              'hands', 'waist', 'legs', 'feet', 
                              'finger1', 'finger2', 'trinket1', 'trinket2', 
                              'main_hand', 'off_hand'];
  
  // Известные embellishment bonusIds (без 8960 - технический маркер)
  // Это временная мера - в идеале нужно загружать список из API в начале агрегации
  // Но пока используем хардкод, т.к. список стабильный
  const knownEmbellishmentBonusIds = new Set([
    8174, 8175, 8188, 8796, 8797, 8913, 8932, 8937,
    9237, 9379, 9399, 9400, 9412, 9416, 9521, 9532, 9614,
    10518, 10520, 10521,
    11103, 11109, 11209, 11210, 11226,
    11299, 11300, 11301, 11302, 11303, 11304, 11941
  ]);
  
  for(const p of players){
    const playerBonusIds = new Set(); // все bonusIds этого игрока
    
    for(const slot of allEquipmentSlots){
      const eq = p.equipment[slot];
      if(!eq || !eq.raw) continue;
      
      // Парсим bonusIds из URL (первая часть pipe-строки)
      const itemUrl = eq.raw.split('|')[0];
      const bonusMatch = itemUrl.match(/bonus=([0-9:]+)/);
      if(!bonusMatch) continue;
      
      const bonusIds = bonusMatch[1].split(':').map(b => parseInt(b, 10));
      for(const bonusId of bonusIds){
        playerBonusIds.add(bonusId);
      }
    }
    
    // Фильтруем только embellishment bonusIds (убираем 8960 и прочий мусор)
    const embellishmentBonusIds = Array.from(playerBonusIds)
      .filter(bid => knownEmbellishmentBonusIds.has(bid))
      .sort((a, b) => a - b);
    
    // Если у игрока есть embellishments, создаём ключ пары
    if(embellishmentBonusIds.length > 0){
      let pair;
      if(embellishmentBonusIds.length === 1){
        // Если только 1 embellishment - дублируем его (игрок носит 2 одинаковых)
        pair = [embellishmentBonusIds[0], embellishmentBonusIds[0]];
      } else {
        // Если 2+ - берём первые 2
        pair = embellishmentBonusIds.slice(0, 2);
      }
      const pairKey = pair.join(',');
      
      if(!embellishmentPairs[pairKey]){
        embellishmentPairs[pairKey] = 0;
      }
      embellishmentPairs[pairKey]++;
    }
  }
  
  // DEBUG
  console.log('[aggregate] embellishmentPairs:', embellishmentPairs);

  return {
    count: players.length,
    ilvl: { min:minI, max:maxI, avg:avgI },
    trinkets: [...popular('trinket1', 8), ...popular('trinket2', 0)],
    rings: [...popular('finger1', 4), ...popular('finger2', 0)],
    weapon,                  // топ-5 оружий
    neck: popular('neck', 1)[0],
    cloak: popular('back', 1)[0],
    secondaries: sec,        // legacy %
    avgStats,                // абсолютные рейтинги (среднее по выборке)
    primaryStat,             // 'strength'|'agility'|'intellect'|null
    statsSource,             // 'gear_stats' (чистые) | 'stats' (с баффами)
    allSlots,                // популярные предметы для всех слотов
    tierStats,               // процент тир-сета по слотам
    enchants,                // топ энчанты по слотам
    embellishmentPairs,      // {"bonusId1,bonusId2": count} — пары embellishments
  };
}

function StatsRow({title, items, classColor}){
  if(!items || !items.length) return null;
  const { ItemIcon, ItemName } = window.UI;
  return (
    <div className="stats-row">
      <div className="stats-row-title">{title}</div>
      <div className="stats-row-items">
        {items.map((row,i)=>(
          <div key={i} className="pop-item">
            <ItemIcon item={row.item} size={40}/>
            <div className="pop-item-body">
              <ItemName item={row.item}/>
              <window.UI.Bar value={row.pct} color={classColor} height={10}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrinketsRow({items, classColor}){
  if(!items || !items.length) return null;
  const { ItemIcon, ItemName } = window.UI;
  return (
    <div className="stats-row">
      <div className="stats-row-title">Популярные аксессуары</div>
      <div className="trinkets-row">
        {items.map((row,i)=>(
          <div key={i} className="trinket-tile">
            <ItemIcon item={row.item} size={56}/>
            <div className="trinket-pct" style={{color: classColor}}>
              {roundPct(row.pct)}%
            </div>
            <ItemName item={row.item} small/>
          </div>
        ))}
      </div>
    </div>
  );
}

// Имена primary-статов на русском (ключ как в primary_stat: 'strength'|'agility'|'intellect')
const PRIMARY_STAT_LABELS = {
  strength:  'Сила',
  agility:   'Ловкость',
  intellect: 'Интеллект',
};

function fmtRating(v){
  if(v == null || isNaN(v)) return '—';
  return v.toLocaleString('ru-RU');
}

function StatsInfoBlock({icon, title, children}){
  return (
    <div style={{marginBottom:18}}>
      <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:8, fontWeight:700, fontSize:'1.05em', color:'var(--ink)'}}>
        <span style={{fontSize:20}}>{icon}</span>
        {title}
      </div>
      <div style={{paddingLeft:28, color:'var(--ink-mute)', lineHeight:1.55}}>
        {children}
      </div>
    </div>
  );
}

function StatsSourceModalContent(){
  return (
    <React.Fragment>
      <StatsInfoBlock icon="📊" title="Про данные">
        Статистика собрана из <strong style={{color:'var(--accent)'}}>200 логов</strong> на каждую комбинацию спека + босса + инстанса.
        Всего обработано <strong style={{color:'var(--accent)'}}>129 000 логов</strong> за неделю работы скрипта.
      </StatsInfoBlock>

      <StatsInfoBlock icon="🎒" title="Про вещи">
        Проценты показывают, <strong>как часто</strong> топ-игроки носят тот или иной предмет в слоте.
        Это <strong style={{color:'var(--danger)'}}>не BIS-лист</strong> — BIS предполагает, что у вас есть выбор любого предмета.
        На практике какой-то предмет может не выпасть полсезона, но это не повод думать, что вы теряете 30% урона из-за +600 к криту вместо мастери.
        <br/><br/>
        Смотрите на проценты, чтобы понять: в какой слот точно нужна крафтовая вещь, а в каком — достаточно лута.
      </StatsInfoBlock>

      <StatsInfoBlock icon="📈" title="Про статы">
        Указанные ниже вторички — это <strong>средние значения</strong> у лучших игроков спека.
        Они нужны только как ориентир при выборе между <strong>двумя вещами одинакового ilvl</strong>.
        <br/><br/>
        В топ-3 логах часто одинаковый урон при разном распределении:
        <div style={{margin:'8px 0', padding:'8px 12px', background:'var(--bg-2)', borderRadius:6, fontFamily:'var(--code-font)'}}>
          В рамках одного спека и одного босса у одного 10к крита и 14к хасты, а у второго — наоборот 14к крита и 10к хасты. Так как собирались на ilvl
        </div>
        <strong style={{color:'var(--accent)'}}>Главное правило:</strong> ilvl и основной стат (Сила / Ловкость / Интеллект) важнее вторичек.
        Математически это работает так:
        <div style={{margin:'8px 0', padding:'8px 12px', background:'var(--bg-2)', borderRadius:6, fontFamily:'var(--code-font)'}}>
          2<sup>2.2</sup> = 4.59  &nbsp;&nbsp;vs&nbsp;&nbsp;  2.2<sup>2</sup> = 4.84
        </div>
        Большое основание с меньшим показателем даёт больше, чем наоборот — поэтому <strong>Мейнстат &gt; Искусность</strong>, а никогда не наоборот.
        <br/><br/>
        <span style={{color:'var(--danger)'}}>Не понижайте ilvl ради вторички.</span> Общий урон от мейнстата и выносливости падает сильнее, чем компенсирует прирост от мастери.
        <br/><br/>
        <span style={{color:'var(--ink-dim)', fontSize:'0.92em', borderTop:'1px solid var(--line)', display:'block', paddingTop:12}}>
          <strong>P.S.</strong> Даже во 2 сезоне у некоторых BiS-лист основывался на мифическом кольце Джастор с бандитом — много кто выбил хотя бы героический? Поэтому пришлось компенсировать другими крафтовыми вещами, которые в BiS-лист даже и не входили.
        </span>
      </StatsInfoBlock>
    </React.Fragment>
  );
}

// Компактный блок вторичных статов (в строку текстом)
function SecondariesBlock({avgStats, statsSource, classColor}){
  const [sourceModalOpen, setSourceModalOpen] = React.useState(false);

  // Порядок: крит, хаст, мастери, верса
  const stats = [
    {key: 'crit',        label: 'Крит',            value: avgStats.crit,        color: '#e01c1c'},
    {key: 'haste',       label: 'Скорость',        value: avgStats.haste,       color: '#0ed59b'},
    {key: 'mastery',     label: 'Искусность',      value: avgStats.mastery,     color: '#9256ff'},
    {key: 'versatility', label: 'Универсальность', value: avgStats.versatility, color: '#9256ff'},
  ];
  
  const totalSecondary = (avgStats?.crit || 0) + (avgStats?.haste || 0) + (avgStats?.mastery || 0) + (avgStats?.versatility || 0);

  return (
    <div className="sec-block">
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginBottom:8}}>
        <div className="sec-title" style={{marginBottom:0}}>
          Вторичные характеристики
          <span style={{marginLeft:8, fontSize:'0.8em', color:'var(--ink-dim)', fontFamily:'var(--numeric-font)'}}>
            (∑ {totalSecondary.toLocaleString('ru-RU')})
          </span>
        </div>
        <button
          onClick={() => setSourceModalOpen(true)}
          style={{
            padding:'7px 12px',
            borderRadius:6,
            border:'1px solid var(--line)',
            background:'var(--panel-2)',
            color:'var(--ink-mute)',
            fontSize:15,
            fontWeight:600,
            cursor:'pointer',
            transition:'all .15s',
          }}
        >
          Откуда берется статистика
        </button>
      </div>
      <div style={{display:'flex', justifyContent:'space-around', gap:'12px'}}>
        {stats.map(s => (
          <div key={s.key} className="stat-tile">
            <span style={{fontSize:17, fontWeight:600, color:s.color}}>
              {s.label}
            </span>
            <span style={{fontSize:21, fontWeight:700}}>
              {fmtRating(s.value)}
            </span>
          </div>
        ))}
      </div>
      {sourceModalOpen && (
        <div
          onClick={() => setSourceModalOpen(false)}
          style={{
            position:'fixed',
            inset:0,
            zIndex:10000,
            background:'rgba(0,0,0,0.72)',
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            padding:20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width:'min(640px, 100%)',
              minHeight:220,
              background:'var(--panel)',
              border:'1px solid var(--line)',
              borderRadius:10,
              boxShadow:'0 18px 70px rgba(0,0,0,0.65)',
              overflow:'hidden',
            }}
          >
            <div style={{
              display:'flex',
              alignItems:'center',
              justifyContent:'space-between',
              gap:12,
              padding:'14px 18px',
              borderBottom:'1px solid var(--line)',
            }}>
              <div style={{fontSize:18, fontWeight:700, color:'var(--ink)'}}>
                Откуда берется статистика
              </div>
              <button
                onClick={() => setSourceModalOpen(false)}
                style={{
                  width:30,
                  height:30,
                  borderRadius:6,
                  border:'1px solid var(--line)',
                  background:'var(--bg-2)',
                  color:'var(--ink-mute)',
                  fontSize:21,
                  lineHeight:1,
                  cursor:'pointer',
                }}
              >
                ×
              </button>
            </div>
            <div style={{
              padding:18,
              minHeight:150,
              color:'var(--ink-mute)',
              fontSize:16,
              lineHeight:1.6,
            }}>
              <StatsSourceModalContent />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Сетка популярных предметов по всем слотам (компактная, на 50% ширины)
function AllSlotsGrid({allSlots, classColor}){
  const { ItemIcon } = window.UI;
  const { SLOT_LABELS } = window.FIRESTORM;
  
  // Все слоты в одном массиве (тринкеты, main_hand и off_hand убраны — они в отдельном блоке)
  const slots = ['head', 'neck', 'shoulder', 'back', 'chest', 'wrist', 'hands', 'waist', 'legs', 'feet', 'finger1', 'finger2'];
  
  const renderSlot = (slotKey) => {
    const items = (allSlots[slotKey] || []).slice(0, 2); // Топ-2
    if(!items.length) return null;
    
    return (
      <div key={slotKey} className="gear-slot-tile">
        <div className="gear-slot-name">{SLOT_LABELS[slotKey]}</div>
        <div className="gear-slot-items">
          {items.map((row, i) => (
            <div key={i} className="gear-item-col">
              <ItemIcon item={row.item} size={48}/>
              <div className="gear-item-pct" style={{color: classColor}}>
                {roundPct(row.pct)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className="all-slots-grid">
      <div className="all-slots-title">Популярная экипировка по слотам</div>
      <div className="gear-slots-wrap">
        {slots.map(renderSlot)}
      </div>
    </div>
  );
}

// Правая панель: топ оружия, тир-сет, тринкеты, embellishments (компактно)
function GearStatsPanel({weapon, offHand, tierStats, trinkets, embellishmentPairs, playerCount, classColor}){
  const { ItemIcon } = window.UI;
  
  // Топ-5 оружий
  const topWeapons = (weapon || []).slice(0, 5);
  
  // Топ-5 второго оружия/щита
  const topOffHand = (offHand || []).slice(0, 5);
  
  // Тир-сет отсортированный по проценту (от большего к меньшему)
  const sortedTier = (tierStats || []).sort((a, b) => b.pct - a.pct);
  
  // Топ-5 тринкетов
  const topTrinkets = (trinkets || []).slice(0, 5);
  
  return (
    <div className="gear-stats-panel">
      <div className="gear-stats-title">Топ итемы</div>
      
      {/* Топ 5 оружий */}
      {topWeapons.length > 0 && (
        <div className="gear-stats-row">
          <div className="gear-stats-row-title">Топ 5 оружий</div>
          <div className="gear-stats-items">
            {topWeapons.map((row, i) => (
              <div key={i} className="gear-stats-item">
                <ItemIcon item={row.item} size={48}/>
                <div className="gear-stats-pct" style={{color: classColor}}>
                  {roundPct(row.pct)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Топ 5 второго оружия/щита */}
      {topOffHand.length > 0 && (
        <div className="gear-stats-row">
          <div className="gear-stats-row-title">Топ 5 второго оружия/щита</div>
          <div className="gear-stats-items">
            {topOffHand.map((row, i) => (
              <div key={i} className="gear-stats-item">
                <ItemIcon item={row.item} size={48}/>
                <div className="gear-stats-pct" style={{color: classColor}}>
                  {roundPct(row.pct)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Топ 5 тринкетов */}
      {topTrinkets.length > 0 && (
        <div className="gear-stats-row">
          <div className="gear-stats-row-title">Топ 5 тринкетов</div>
          <div className="gear-stats-items">
            {topTrinkets.map((row, i) => (
              <div key={i} className="gear-stats-item">
                <ItemIcon item={row.item} size={48}/>
                <div className="gear-stats-pct" style={{color: classColor}}>
                  {roundPct(row.pct)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Топ 3 embellishments (компактно, встроен в панель) */}
      <BestEmbellishmentsCompact 
        embellishmentPairs={embellishmentPairs} 
        playerCount={playerCount}
        classColor={classColor}
      />
      
      {/* Тір-сет по процентам (в конце, т.к. высокий блок) */}
      {sortedTier.length > 0 && (
        <div className="gear-stats-row">
          <div className="gear-stats-row-title">Тир-сет по слотам</div>
          <div className="gear-stats-tier">
            {sortedTier.map((stat, i) => (
              <div key={i} className="gear-tier-item">
                {stat.item && <ItemIcon item={stat.item} size={48} />}
                <div className="gear-tier-info">
                  <div className="gear-tier-slot">{stat.slot}</div>
                  <div className="gear-tier-pct" style={{color: classColor}}>
                    {roundPct(stat.pct)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Best Tier Set Pieces — процент тир-сета по слотам (head, shoulder, chest, hands, legs)
function BestTierSet({tierStats, classColor}){
  if(!tierStats || !tierStats.length) return null;
  return (
    <div className="stat-section">
      <div className="stat-section-title">Best Tier Set Pieces</div>
      <div className="stat-items-list">
        {tierStats.map((stat, i) => (
          <div key={i} className="stat-text-row">
            <span className="stat-text-label">{stat.slot}</span>
            <span className="stat-text-val">{roundPct(stat.pct)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Best Enchants — самые популярные энчанты (зигзагообразное отображение, только 1 энчант на слот)
function BestEnchants({enchants, classColor}){
  if(!enchants || !enchants.length) return null;
  
  // Группируем по слотам и берём только САМЫЙ популярный энчант для каждого слота
  const bySlot = {};
  enchants.forEach(ench => {
    if(!bySlot[ench.slot] || bySlot[ench.slot].pct < ench.pct) {
      bySlot[ench.slot] = ench;
    }
  });
  
  // Преобразуем в массив
  const items = Object.values(bySlot);
  
  if(items.length === 0) return null;
  
  return (
    <div className="stat-section">
      <div className="stat-section-title">Best Enchants</div>
      <div className="_5qp16">
        {items.map((ench, i) => {
          const isLeft = i % 2 === 0;
          const enchUrl = ench.spellId 
            ? `https://www.wowhead.com/ru/spell=${ench.spellId}`
            : null;
          
          return (
            <div 
              key={i} 
              className="_ujgwdz" 
              style={{
                display: 'flex',
                flexDirection: isLeft ? 'row' : 'row-reverse',
                gap: '10px',
                marginBottom: '10px',
                alignItems: 'center'
              }}
            >
              <div className="_3w7ci9" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isLeft ? 'flex-start' : 'flex-end',
                paddingTop: '5px',
                flex: 1
              }}>
                <h3 style={{fontSize:16, margin: 0, marginBottom: 4}}>{ench.slot}</h3>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexDirection: isLeft ? 'row' : 'row-reverse'
                }}>
                  {enchUrl ? (
                    <a 
                      href={enchUrl}
                      data-wowhead={`spell=${ench.spellId}`}
                      data-wh-rename-link="false"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        textDecoration: 'none',
                        flexDirection: isLeft ? 'row' : 'row-reverse'
                      }}
                    >
                      <img 
                        src="https://wow.zamimg.com/images/wow/icons/large/inv_misc_enchantedscroll.jpg"
                        alt={ench.name}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '6px',
                          border: '2px solid #a335ee'
                        }}
                      />
                      <span style={{
                        color: '#6cd3ff',
                        fontSize:17,
                        whiteSpace: 'nowrap'
                      }}>
                        {ench.name}
                      </span>
                    </a>
                  ) : (
                    <>
                      <img 
                        src="https://wow.zamimg.com/images/wow/icons/large/inv_misc_enchantedscroll.jpg"
                        alt={ench.name}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '6px',
                          border: '2px solid #a335ee'
                        }}
                      />
                      <span style={{fontSize:17, whiteSpace: 'nowrap'}}>{ench.name}</span>
                    </>
                  )}
                </div>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                border: '2px solid ' + classColor,
                borderRadius: '10px',
                padding: '8px 12px',
                minWidth: '60px',
                fontWeight: 600,
                fontSize:19,
                color: classColor
              }}>
                {roundPct(ench.pct)}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Best Embellishments Compact — топ-3 пары embellishments (встраиваемый в GearStatsPanel)
function BestEmbellishmentsCompact({embellishmentPairs, playerCount, classColor}){
  const [embellishments, setEmbellishments] = React.useState([]);
  const { apiEmbellishments } = window.FIRESTORM;
  
  // Загружаем справочник embellishments при монтировании
  React.useEffect(() => {
    apiEmbellishments().then(res => {
      if(res.ok) {
        setEmbellishments(res.data);
      }
    });
  }, []);
  
  if(!embellishmentPairs || !playerCount || !embellishments.length) return null;
  
  // Создаём Map для быстрого поиска embellishment по bonusId
  const embMap = new Map();
  for(const emb of embellishments){
    embMap.set(emb.bonusId, emb);
  }
  
  // Преобразуем пары в массив с данными
  const pairsList = [];
  for(const [pairKey, count] of Object.entries(embellishmentPairs)){
    const bonusIds = pairKey.split(',').map(id => parseInt(id, 10));
    
    // Проверяем что все bonusIds есть в справочнике embellishments
    const embsInPair = bonusIds.filter(id => embMap.has(id));
    if(embsInPair.length === 0) continue; // Пропускаем если ни один не embellishment
    
    // Берём данные embellishments (максимум 2)
    const emb1 = embMap.get(embsInPair[0]);
    const emb2 = embsInPair.length > 1 ? embMap.get(embsInPair[1]) : null;
    
    pairsList.push({
      bonusIds: embsInPair,
      emb1,
      emb2,
      count,
      pct: count / playerCount
    });
  }
  
  // Сортируем по популярности и берём топ-3
  pairsList.sort((a, b) => b.count - a.count);
  const topPairs = pairsList.slice(0, 3);
  
  if(!topPairs.length) return null;
  
  return (
    <div className="gear-stats-row">
      <div className="gear-stats-row-title">Топ 3 Embellishments</div>
      <div className="gear-stats-items">
        {topPairs.map((pair, i) => (
          <div key={i} className="gear-stats-item">
            {/* Две иконки рядом */}
            <div className="emb-pair-icons">
              {pair.emb1 && pair.emb1.icon && (
                <a 
                  href={`https://www.wowhead.com/ru/item=${pair.emb1.itemId}`}
                  className="emb-pair-icon-link"
                  data-wowhead={`item=${pair.emb1.itemId}`}
                  data-wh-rename-link="false"
                  title={pair.emb1.name}
                >
                  <img 
                    src={`https://wow.zamimg.com/images/wow/icons/medium/${pair.emb1.icon}.jpg`} 
                    alt={pair.emb1.name}
                    className="emb-pair-icon"
                  />
                </a>
              )}
              {pair.emb2 && pair.emb2.icon && (
                <a 
                  href={`https://www.wowhead.com/ru/item=${pair.emb2.itemId}`}
                  className="emb-pair-icon-link"
                  data-wowhead={`item=${pair.emb2.itemId}`}
                  data-wh-rename-link="false"
                  title={pair.emb2.name}
                >
                  <img 
                    src={`https://wow.zamimg.com/images/wow/icons/medium/${pair.emb2.icon}.jpg`} 
                    alt={pair.emb2.name}
                    className="emb-pair-icon"
                  />
                </a>
              )}
            </div>
            {/* Процент снизу */}
            <div className="gear-stats-pct" style={{color: classColor}}>
              {roundPct(pair.pct)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Best Embellishments (старый полный компонент - оставим для Best Enchants секции)
function BestEmbellishments({embellishmentPairs, playerCount, classColor}){
  const [embellishments, setEmbellishments] = React.useState([]);
  const { apiEmbellishments } = window.FIRESTORM;
  const containerRef = React.useRef(null);
  
  // Загружаем справочник embellishments при монтировании
  React.useEffect(() => {
    apiEmbellishments().then(res => {
      console.log('[BestEmbellishments] API response:', res);
      if(res.ok) {
        console.log('[BestEmbellishments] First embellishment RAW:', JSON.stringify(res.data[0]));
        console.log('[BestEmbellishments] First embellishment keys:', Object.keys(res.data[0]));
        console.log('[BestEmbellishments] First embellishment:', res.data[0]);
        console.log('[BestEmbellishments] First embellishment itemId:', res.data[0]?.itemId);
        console.log('[BestEmbellishments] All embellishments:', res.data);
        setEmbellishments(res.data);
      }
    });
  }, []);
  
  // Обновляем Wowhead тултипы после рендера
  // ВРЕМЕННО ОТКЛЮЧЕНО - refreshLinks() ломает иконки в других компонентах
  // React.useEffect(() => {
  //   if(!containerRef.current || embellishments.length === 0) return;
  //   
  //   const refreshTooltips = () => {
  //     if(window.$WowheadPower){
  //       try {
  //         window.$WowheadPower.refreshLinks();
  //         console.log('[BestEmbellishments] Wowhead tooltips refreshed');
  //       } catch(e) {
  //         console.warn('[BestEmbellishments] Failed to refresh Wowhead tooltips:', e);
  //       }
  //     }
  //   };
  //   
  //   const timer = setTimeout(refreshTooltips, 300);
  //   return () => clearTimeout(timer);
  // }, [embellishments, embellishmentPairs]);
  
  console.log('[BestEmbellishments] embellishmentPairs:', embellishmentPairs);
  console.log('[BestEmbellishments] playerCount:', playerCount);
  console.log('[BestEmbellishments] embellishments.length:', embellishments.length);
  
  if(!embellishmentPairs || !playerCount || !embellishments.length) return null;
  
  // Создаём Map для быстрого поиска embellishment по bonusId
  const embMap = new Map();
  for(const emb of embellishments){
    embMap.set(emb.bonusId, emb);
  }
  console.log('[BestEmbellishments] embMap size:', embMap.size);
  console.log('[BestEmbellishments] embMap keys:', Array.from(embMap.keys()));
  
  // Преобразуем пары в массив с данными
  const pairsList = [];
  for(const [pairKey, count] of Object.entries(embellishmentPairs)){
    const bonusIds = pairKey.split(',').map(id => parseInt(id, 10));
    
    // Проверяем что все bonusIds есть в справочнике embellishments
    const embsInPair = bonusIds.filter(id => embMap.has(id));
    if(embsInPair.length === 0) continue; // Пропускаем если ни один не embellishment
    
    // Берём данные embellishments (максимум 2)
    const emb1 = embMap.get(embsInPair[0]);
    const emb2 = embsInPair.length > 1 ? embMap.get(embsInPair[1]) : null;
    
    console.log('[BestEmbellishments] Processing pair:', pairKey, 'bonusIds:', bonusIds);
    console.log('[BestEmbellishments] emb1:', emb1, 'emb1.itemId:', emb1?.itemId);
    console.log('[BestEmbellishments] emb2:', emb2, 'emb2.itemId:', emb2?.itemId);
    
    pairsList.push({
      bonusIds: embsInPair,
      emb1,
      emb2,
      count,
      pct: count / playerCount
    });
  }
  
  // Сортируем по популярности
  pairsList.sort((a, b) => b.count - a.count);
  const topPairs = pairsList.slice(0, 10); // Топ-10
  
  if(!topPairs.length){
    return (
      <div className="stat-section" ref={containerRef}>
        <div className="stat-section-title">Best Embellishments</div>
        <div className="stat-items-list" style={{opacity:0.5, fontStyle:'italic'}}>
          Embellishments не найдены
        </div>
      </div>
    );
  }
  
  return (
    <div className="stat-section" ref={containerRef}>
      <div className="stat-section-title">Best Embellishments</div>
      <div className="stat-items-list">
        {topPairs.map((pair, i) => {
          // Проверяем одинаковые ли bonusIds (игрок носит 2 одинаковых embellishments)
          const isDuplicate = pair.bonusIds.length === 2 && pair.bonusIds[0] === pair.bonusIds[1];
          
          // DEBUG для первой пары (при рендере)
          if(i === 0) {
            console.log('[BestEmbellishments] RENDER First pair:', pair);
            console.log('[BestEmbellishments] RENDER emb1:', pair.emb1);
            console.log('[BestEmbellishments] RENDER emb1.itemId:', pair.emb1?.itemId);
          }
          
          return (
            <div key={i} className="emb-item">
              <div className="emb-icons">
                {/* Первое embellishment */}
                {pair.emb1 && pair.emb1.icon && (
                  <a 
                    href={`https://www.wowhead.com/ru/item=${pair.emb1.itemId}`}
                    className="emb-icon-link"
                    data-wowhead={`item=${pair.emb1.itemId}`}
                    data-wh-rename-link="false"
                    title={pair.emb1.name}
                  >
                    <img 
                      src={`https://wow.zamimg.com/images/wow/icons/large/${pair.emb1.icon}.jpg`} 
                      alt={pair.emb1.name}
                      className="emb-icon"
                    />
                  </a>
                )}
                {/* Второе embellishment (всегда показываем, даже если дубликат) */}
                {pair.emb2 && pair.emb2.icon && (
                  <a 
                    href={`https://www.wowhead.com/ru/item=${pair.emb2.itemId}`}
                    className="emb-icon-link"
                    data-wowhead={`item=${pair.emb2.itemId}`}
                    data-wh-rename-link="false"
                    title={pair.emb2.name}
                  >
                    <img 
                      src={`https://wow.zamimg.com/images/wow/icons/large/${pair.emb2.icon}.jpg`} 
                      alt={pair.emb2.name}
                      className="emb-icon"
                    />
                  </a>
                )}
              </div>
              <div className="emb-info">
                <div className="emb-names">
                  {isDuplicate ? (
                    <a 
                      href={`https://www.wowhead.com/ru/item=${pair.emb1.itemId}`}
                      className="emb-name emb-name-link"
                      data-wowhead={`item=${pair.emb1.itemId}`}
                      data-wh-rename-link="false"
                    >
                      {pair.emb1.name} ×2
                    </a>
                  ) : (
                    <>
                      <a 
                        href={`https://www.wowhead.com/ru/item=${pair.emb1.itemId}`}
                        className="emb-name emb-name-link"
                        data-wowhead={`item=${pair.emb1.itemId}`}
                        data-wh-rename-link="false"
                      >
                        {pair.emb1.name}
                      </a>
                      {pair.emb2 && (
                        <a 
                          href={`https://www.wowhead.com/ru/item=${pair.emb2.itemId}`}
                          className="emb-name emb-name-link"
                          data-wowhead={`item=${pair.emb2.itemId}`}
                          data-wh-rename-link="false"
                        >
                          {pair.emb2.name}
                        </a>
                      )}
                    </>
                  )}
                </div>
                <div className="emb-pct" style={{color: classColor}}>
                  {roundPct(pair.pct)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatsBlock({stats, classColor}){
  // stats теперь приходит готовый с бэкенда через /api/stats
  if(!stats || stats.count === 0) {
    return <div className="stats-empty">Нет данных по выбранной комбинации.</div>;
  }
  
  return (
    <div className="stats-block">
      <SecondariesBlock avgStats={stats.avgStats}
                        statsSource={stats.statsSource} classColor={classColor}/>
      
      {/* Два блока рядом: популярная экипировка + статистика */}
      <div className="gear-layout">
        <AllSlotsGrid allSlots={stats.allSlots} classColor={classColor}/>
        <GearStatsPanel 
          weapon={stats.weapon}
          offHand={stats.offHand}
          tierStats={stats.tierStats} 
          trinkets={stats.trinkets}
          embellishmentPairs={stats.embellishmentPairs}
          playerCount={stats.count}
          classColor={classColor}
        />
      </div>
      
      <BestEnchants enchants={stats.enchants} classColor={classColor}/>
    </div>
  );
}

window.STATS = { StatsBlock, aggregate };

// stats-components.jsx — UI-компоненты для блока статистики
// (вспомогательные функции и рендер-компоненты, используемые StatsBlock)

// ── Утилиты ──────────────────────────────────────────────────────────

function roundPct(pct) {
  const val = pct * 100;
  if (val === 0) return 0;
  if (val < 1) return 1;
  return Math.round(val);
}

const PRIMARY_STAT_LABELS = {
  strength:  'Сила',
  agility:   'Ловкость',
  intellect: 'Интеллект',
};

function fmtRating(v){
  if(v == null || isNaN(v)) return '—';
  return v.toLocaleString('ru-RU');
}

// ── Модалка «Откуда берётся статистика» ──────────────────────────────

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
        Статистика собрана из топ <strong style={{color:'var(--accent)'}}>~200 логов</strong> на каждую комбинацию спека + босса + инстанса.
        В общей сложности обработано <strong style={{color:'var(--accent)'}}>~129 000 логов</strong>.
      </StatsInfoBlock>

      <StatsInfoBlock icon="🙆" title="Не соответствие данных вещей">
          Данные с сайта warcraftlogs имеют <strong style={{color:'var(--accent)'}}>расхождения</strong> по причине того, что их алгоритмы
        записывали часть бафов в статы - поэтому при одинаковом илвл у одного игрока 59 тысяч вторичек, а у второго может быть 65.
        Рейтинг вторичек выводится по медиане отбрасывая баги - в списке игроков они присутствуют.0
        Пример у блад дк - часть логов завышена так как чарка от пушки записывается во вторички.0

        Так-же данные о предметах - они сломались и во всплывающем окне показывают завышенные вторичных характеристики.
        Данные больше служат что-бы посмотрели какой предмет выбивается, или какой предмет с какими статами крафтится.
      </StatsInfoBlock>


      <StatsInfoBlock icon="🎒" title="Про вещи">
        Проценты показывают, <strong>как часто</strong> топ-игроки носят тот или иной предмет в слоте.
        Это <strong style={{color:'var(--danger)'}}>не BIS-лист</strong> — BIS лист предполагает что у вас есть абсолютно любые вещи на выбор и Вы комбинируете их в нужном вам порядке
        На практике какой-то предмет может не выпасть полсезона хотя он в BIS листе ( топовые кольца с бандита и ласта передавали приветы всем BIS листам во 2 сезоне).
        <br/><br/>
        Эта таблица больше ориентир что реже носили нонсетом, и в какой слот нужну крафтить точно вещь, а в какую чаще выбивали из инстов или рейда.
      </StatsInfoBlock>

      <StatsInfoBlock icon="📈" title="Про статы">
        Указанные ниже вторички — это <strong>идеальные значения</strong> у лучших игроков спека что-бы с которыми они попали в топ 200 мира по своему классу.
        Они нужны как ориентир при выборе между <strong>двумя вещами одинакового ilvl</strong>.
        <br/><br/>
        Наборы стат получены в результате кластеризации - получение и анализ похожих групп
		<br/><br/>
		<strong style={{color:'var(--accent)'}}>Главное правило:</strong> ilvl и основной стат (Сила / Ловкость / Интеллект) важнее вторичек.
		<br/><br/>
		
        <strong style={{color:'var(--accent)'}}>Главное правило:</strong> ilvl и основной стат (Сила / Ловкость / Интеллект) важнее вторичек.
        Математически это работает так:
		<div style={{margin:'8px 0', padding:'8px 12px', background:'var(--bg-2)', borderRadius:6, fontFamily:'var(--code-font)'}}>
		  2<sup>2.2</sup> = 4.59  &nbsp;&nbsp;vs&nbsp;&nbsp;  2.2<sup>2</sup> = 4.84
		</div>
		Большое основание с меньшим показателем даёт больший результат нечели наоборот. И понижая мейнстат ради той-же искуси - большая часть искуси уходит на компенсацию от потери мейнстата.
		<br/>
		Понизили урон 20 спелкам на 3% что-бы дать 3-4 абилкам 5%. Яркий пример БМ охотник - дамажат петы, а искусь собирают меньше всего которая их апает
      </StatsInfoBlock>
    </React.Fragment>
  );
}

// ── Вторичные характеристики ────────────────────────────────────────

function SecondariesBlock({avgStats, statsSource, builds, segments, classColor}){
  const [sourceModalOpen, setSourceModalOpen] = React.useState(false);

  const hasBuilds = builds && builds.length > 0;
  
  const STAT_DEFS = [
    {key: 'crit',        label: 'Крит',            color: '#e01c1c'},
    {key: 'haste',       label: 'Скорость',        color: '#0ed59b'},
    {key: 'mastery',     label: 'Искусность',      color: '#9256ff'},
    {key: 'versatility', label: 'Универсальность', color: '#9256ff'},
  ];
  
  function renderStatsRow(label, statsData, isBuild){
    const total = (statsData?.crit || 0) + (statsData?.haste || 0) + (statsData?.mastery || 0) + (statsData?.versatility || 0);
    return (
      <div style={{
        display:'flex', 
        alignItems:'center', 
        gap:12, 
        padding:'8px 0',
        borderBottom: '1px solid var(--line)',
        opacity: isBuild ? 0.92 : 1,
      }}>
        <div style={{minWidth:170, fontWeight:600, fontSize:15, color:isBuild ? classColor : 'var(--ink)'}}>
          {label}
        </div>
        <div style={{display:'flex', justifyContent:'space-around', flex:1, gap:12}}>
          {STAT_DEFS.map(s => (
            <div key={s.key} style={{textAlign:'center', minWidth:60}}>
              <div style={{fontSize:13, fontWeight:600, color:s.color, marginBottom:2}}>{s.label}</div>
              <div style={{fontSize:17, fontWeight:700}}>{fmtRating(statsData?.[s.key])}</div>
            </div>
          ))}
        </div>
        <div style={{minWidth:80, textAlign:'right', fontSize:13, color:'var(--ink-dim)', fontFamily:'var(--numeric-font)'}}>
          ∑ {total.toLocaleString('ru-RU')}
        </div>
      </div>
    );
  }

  return (
    <div className="sec-block">
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginBottom:8}}>
        <div className="sec-title" style={{marginBottom:0}}>
          Вторичные характеристики <span style={{fontSize:'0.75em', color:'var(--ink-dim)', fontWeight:400}}>(медиана)</span>
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
      
      {renderStatsRow('Все игроки', avgStats, false)}
      
      {hasBuilds && builds.map((b) => (
        <div key={b.id}>
          {renderStatsRow(`${b.name} (${b.pct}%)`, b.stats, true)}
        </div>
      ))}
      
      {segments && segments.length > 0 && (
        <>
          <div style={{marginTop:6, marginBottom:4, fontSize:13, fontWeight:700, color:'var(--ink-dim)', textTransform:'uppercase', letterSpacing:'0.5px'}}>
            По рангу
          </div>
          {segments.map((seg) => (
            <div key={seg.tier}>
              {renderStatsRow(seg.label, seg.stats, false)}
            </div>
          ))}
        </>
      )}
      
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

// ── Сетка популярных предметов по слотам ────────────────────────────

function AllSlotsGrid({allSlots, classColor}){
  const { ItemIcon } = window.UI;
  const { SLOT_LABELS } = window.FIRESTORM;
  
  const slots = ['head', 'neck', 'shoulder', 'back', 'chest', 'wrist', 'hands', 'waist', 'legs', 'feet', 'finger1', 'finger2'];
  
  const renderSlot = (slotKey) => {
    const items = (allSlots[slotKey] || []).slice(0, 2);
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

// ── Правая панель: топ оружия, тир-сет, тринкеты, embellishments ─────

function GearStatsPanel({weapon, offHand, tierStats, trinkets, embellishmentPairs, playerCount, classColor}){
  const { ItemIcon } = window.UI;
  
  const topWeapons = (weapon || []).slice(0, 5);
  const topOffHand = (offHand || []).slice(0, 5);
  const sortedTier = (tierStats || []).sort((a, b) => b.pct - a.pct);
  const topTrinkets = (trinkets || []).slice(0, 5);
  
  return (
    <div className="gear-stats-panel">
      <div className="gear-stats-title">Топ итемы</div>
      
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
      
      <BestEmbellishmentsCompact 
        embellishmentPairs={embellishmentPairs} 
        playerCount={playerCount}
        classColor={classColor}
      />
      
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

// ── Tier Set (устаревший отдельный блок, не используется) ────────────

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

// ── Enchants ────────────────────────────────────────────────────────

function BestEnchants({enchants, classColor}){
  if(!enchants || !enchants.length) return null;
  
  const bySlot = {};
  enchants.forEach(ench => {
    if(!bySlot[ench.slot] || bySlot[ench.slot].pct < ench.pct) {
      bySlot[ench.slot] = ench;
    }
  });
  
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

// ── Embellishments Compact (встроен в GearStatsPanel) ───────────────

function BestEmbellishmentsCompact({embellishmentPairs, playerCount, classColor}){
  const [embellishments, setEmbellishments] = React.useState([]);
  const { apiEmbellishments } = window.FIRESTORM;
  
  React.useEffect(() => {
    apiEmbellishments().then(res => {
      if(res.ok) {
        setEmbellishments(res.data);
      }
    });
  }, []);
  
  if(!embellishmentPairs || !playerCount || !embellishments.length) return null;
  
  const embMap = new Map();
  for(const emb of embellishments){
    embMap.set(emb.bonusId, emb);
  }
  
  const pairsList = [];
  for(const [pairKey, count] of Object.entries(embellishmentPairs)){
    const bonusIds = pairKey.split(',').map(id => parseInt(id, 10));
    
    const embsInPair = bonusIds.filter(id => embMap.has(id));
    if(embsInPair.length === 0) continue;
    
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
  
  pairsList.sort((a, b) => b.count - a.count);
  const topPairs = pairsList.slice(0, 3);
  
  if(!topPairs.length) return null;
  
  return (
    <div className="gear-stats-row">
      <div className="gear-stats-row-title">Топ 3 Embellishments</div>
      <div className="gear-stats-items">
        {topPairs.map((pair, i) => (
          <div key={i} className="gear-stats-item">
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
            <div className="gear-stats-pct" style={{color: classColor}}>
              {roundPct(pair.pct)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Shared row components ─────────────────────────────────────────────

function StatsRow({title, items, classColor}){
  if(!items || !items.length) return null;
  const { ItemIcon, ItemName } = window.UI;
  return (
    <div className="stats-row">
      <div className="stats-row-title">{title}</div>
      <div className="stats-row-items">
        {items.map((row,i)=>{
          const k = row.item?.itemId || i;
          return (
            <div key={k} className="pop-item">
              <ItemIcon item={row.item} size={40}/>
              <div className="pop-item-body">
                <ItemName item={row.item}/>
                <window.UI.Bar value={row.pct} color={classColor} height={10}/>
              </div>
            </div>
          );
        })}
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
        {items.map((row,i)=>{
          const k = row.item?.itemId || i;
          return (
            <div key={k} className="trinket-tile">
              <ItemIcon item={row.item} size={56}/>
              <div className="trinket-pct" style={{color: classColor}}>
                {roundPct(row.pct)}%
              </div>
              <ItemName item={row.item} small/>
            </div>
          );
        })}
      </div>
    </div>
  );
}

window.STATSCOMP = {
  roundPct,
  fmtRating,
  SecondariesBlock,
  AllSlotsGrid,
  GearStatsPanel,
  BestTierSet,
  BestEnchants,
  BestEmbellishmentsCompact,
  StatsRow,
  TrinketsRow,
};

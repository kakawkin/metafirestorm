// Players list with expandable equipment drawer (in-game layout)
function PlayerRow({player, rank, classColor, expanded, onToggle}){
  const { ItemIcon, formatScore } = window.UI;
  const dur = player.duration_s;
  const durStr = dur ? `${Math.floor(dur/60)}:${String(dur%60).padStart(2,'0')}` : '';

  // In-game equipment layout:
  //   head        | hands
  //   neck        | waist
  //   shoulder    | legs
  //   back        | feet
  //   chest       | finger1
  //   wrist       | finger2
  // bottom (centered): main_hand, off_hand | trinket1, trinket2
  const leftSlots  = ['head','neck','shoulder','back','chest','wrist'];
  const rightSlots = ['hands','waist','legs','feet','finger1','finger2'];

  return (
    <div className={`pl-row ${expanded?'expanded':''}`}>
      <button className="pl-row-main" onClick={onToggle}>
        <span className="pl-rank">#{rank}</span>
        <span className="pl-name" style={{color: classColor}}>{player.name}</span>
        <span className="pl-server">{player.server}</span>
        <span className="pl-score">{formatScore(player.score)}</span>
        <span className="pl-chev">{expanded?'▾':'▸'}</span>
      </button>
      {expanded && (
        <div className="pl-drawer">
          <div className="pl-drawer-head">
            <a className="pl-log" href={player.log_url} target="_blank" rel="noopener">Открыть лог на WarcraftLogs ↗</a>
            <span className="pl-meta">{player.region} · {player.server}</span>
          </div>

          <PlayerStats player={player}/>

          <div className="pl-paperdoll">
            <div className="pl-pd-col pl-pd-left">
              {leftSlots.map(s => <EquipSlot key={s} slot={s} item={player.equipment[s]} align="left"/>)}
            </div>
            <div className="pl-pd-col pl-pd-right">
              {rightSlots.map(s => <EquipSlot key={s} slot={s} item={player.equipment[s]} align="right"/>)}
            </div>
          </div>
          <div className="pl-paperdoll-bottom">
            <div className="pl-pd-group">
              <EquipSlot slot="main_hand" item={player.equipment.main_hand} align="left"/>
              <EquipSlot slot="trinket1"  item={player.equipment.trinket1}  align="left"/>
            </div>
            <div className="pl-pd-group">
              <EquipSlot slot="off_hand" item={player.equipment.off_hand} align="left"/>
              <EquipSlot slot="trinket2" item={player.equipment.trinket2} align="left"/>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PlayerStats({player}){
  const st = player.stats;
  if(!st) return null;
  const fmt = v => v != null ? Math.round(v).toLocaleString('ru-RU') : null;
  const parts = [];
  if(st.crit        != null) parts.push(`Крит: ${fmt(st.crit)}`);
  if(st.haste       != null) parts.push(`Скорость: ${fmt(st.haste)}`);
  if(st.mastery     != null) parts.push(`Искусность: ${fmt(st.mastery)}`);
  if(st.versatility != null) parts.push(`Универсальность: ${fmt(st.versatility)}`);
  if(!parts.length) return null;
  const total = (st.crit||0) + (st.haste||0) + (st.mastery||0) + (st.versatility||0);
  return (
    <div className="pl-stats-line" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
      <span>{parts.join(' · ')}</span>
      <span style={{color:'rgba(255,255,255,0.35)', fontSize:'0.85em', marginLeft:12}}>Σ {Math.round(total).toLocaleString('ru-RU')}</span>
    </div>
  );
}

function EquipSlot({slot, item, align='left'}){
  const { ItemIcon, ItemName } = window.UI;
  const { SLOT_LABELS } = window.FIRESTORM;
  
  // Маппинг: enchant effect ID -> real spell ID для WowHead
  // (при temporary enchant в БД хранится enchant effect ID, а не spell ID)
  const TEMP_ENCHANT_SPELL_MAP = {
    // Alchemy oils (TWW)
    '7495': '451874',  // Алгарийское масло маны
    '7496': '451882',  // Масло пропитывающего яда
    // Blacksmithing imbues (TWW)
    '7543': '458932',  // Заточенное когтесталью оружие (lesser)
    '7545': '458934',  // Заточенное когтесталью оружие
    '7550': '458936',  // Утяжеленное когтесталью оружие
  };

  // Извлекаем spell ID энчантов из raw (формат: ITEM|PERM_ENCHANT|TEMP_ENCHANT)
  let permSpellId = null;
  let tempSpellId = null;
  if(item && item.raw){
    const parts = item.raw.split('|');
    const permUrl = parts[1] || '';
    const tempUrl = parts[2] || '';
    const permMatch = permUrl.match(/spell=(\d+)/);
    const tempMatch = tempUrl.match(/spell=(\d+)/);
    permSpellId = permMatch ? permMatch[1] : null;
    // Для временных энчантов преобразуем enchant effect ID в реальный spell ID
    const tempEffectId = tempMatch ? tempMatch[1] : null;
    tempSpellId = tempEffectId ? (TEMP_ENCHANT_SPELL_MAP[tempEffectId] || null) : null;
  }
  
  return (
    <div className={`equip-slot align-${align}`}>
      <ItemIcon item={item} size={36}/>
      <div className="equip-slot-body">
        <div className="equip-slot-label">{SLOT_LABELS[slot]}</div>
        <ItemName item={item} small/>
        {item && item.permEnchantName && (
          permSpellId ? (
            <a 
              href={`https://www.wowhead.com/ru/spell=${permSpellId}`}
              className="equip-enchant enchant-link"
              data-wowhead={`spell=${permSpellId}`}
              data-wh-rename-link="false"
              title={item.permEnchantName}
            >
              ✦ {item.permEnchantName}
            </a>
          ) : (
            <div className="equip-enchant">✦ {item.permEnchantName}</div>
          )
        )}
        {item && item.tempEnchantName && (
          tempSpellId ? (
            <a 
              href={`https://www.wowhead.com/ru/spell=${tempSpellId}`}
              className="equip-enchant enchant-link"
              data-wowhead={`spell=${tempSpellId}`}
              data-wh-rename-link="false"
              title={item.tempEnchantName}
            >
              ⌛ {item.tempEnchantName}
            </a>
          ) : (
            <div className="equip-enchant">⌛ {item.tempEnchantName}</div>
          )
        )}
      </div>
    </div>
  );
}

function PlayersList({players, classColor}){
  const [open, setOpen] = React.useState(null);
  const [limit, setLimit] = React.useState(100);
  const visible = players.slice(0, limit);
  return (
    <div className="players-list">
      <div className="pl-head">
        <span className="pl-h-rank">#</span>
        <span className="pl-h-name">Имя</span>
        <span className="pl-h-server">Сервер</span>
        <span className="pl-h-score">Score</span>
        <span/>
      </div>
      {visible.map((p,i)=>(
        <PlayerRow key={p.id} player={p} rank={i+1} classColor={classColor}
          expanded={open===p.id}
          onToggle={()=>setOpen(open===p.id ? null : p.id)}/>
      ))}
      {limit < players.length && (
        <button className="pl-more" onClick={()=>setLimit(limit+25)}>
          Показать ещё ({players.length - limit})
        </button>
      )}
    </div>
  );
}

window.PLAYERS = { PlayersList };


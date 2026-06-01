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
  const sec = player.secondaries || {};
  const parts = [];
  if(sec.crit        != null) parts.push(`Крит: ${sec.crit}%`);
  if(sec.haste       != null) parts.push(`Скорость: ${sec.haste}%`);
  if(sec.mastery     != null) parts.push(`Искусность: ${sec.mastery}%`);
  if(sec.versatility != null) parts.push(`Универсальность: ${sec.versatility}%`);
  if(!parts.length) return null;
  return <div className="pl-stats-line">{parts.join(' · ')}</div>;
}

function EquipSlot({slot, item, align='left'}){
  const { ItemIcon, ItemName } = window.UI;
  const { SLOT_LABELS } = window.FIRESTORM;
  
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
    tempSpellId = tempMatch ? tempMatch[1] : null;
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
  const [limit, setLimit] = React.useState(25);
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

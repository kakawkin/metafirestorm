// Selectors: mode (Raid / M+) → segment → class → spec
function ModePicker({mode, setMode, segment, setSegment}){
  const { RAID_BOSSES, MPLUS_DUNGEONS } = window.FIRESTORM;
  const items = mode==='raid' ? RAID_BOSSES : MPLUS_DUNGEONS;
  const allItem = items[0];
  const specificItems = items.slice(1);

  const handleSelectChange = (e) => {
    const val = e.target.value;
    if (val) setSegment(val);
  };

  return (
    <div className="mode-picker">
      <button className={`mode-btn ${mode==='raid'?'on':''}`} onClick={()=>setMode('raid')}>
        <span className="mode-ico">⚔</span>
        <span className="mode-text">
          <span className="mode-title">Рейд</span>
          <span className="mode-sub">Освобождение Нижней Шахты</span>
        </span>
      </button>
      <button className={`mode-btn ${mode==='mplus'?'on':''}`} onClick={()=>setMode('mplus')}>
        <span className="mode-ico">✦</span>
        <span className="mode-text">
          <span className="mode-title">M+</span>
          <span className="mode-sub">Подземелья на время</span>
        </span>
      </button>
      <button
        className={`seg-btn-all ${segment===allItem.id?'on':''}`}
        onClick={()=>setSegment(allItem.id)}
      >
        Общее
      </button>
      <select
        className="seg-select"
        value={specificItems.some(it => it.id === segment) ? segment : ''}
        onChange={handleSelectChange}
      >
        <option value="" disabled>
          {mode==='raid' ? 'Выберите босса…' : 'Выберите подземелье…'}
        </option>
        {specificItems.map(it => (
          <option key={it.id} value={it.id}>
            {mode==='raid' ? `${String(it.order).padStart(2,'0')}. ${it.name}` : it.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function ClassSpecPicker({classId, specId, setClass, setSpec}){
  const { CLASSES } = window.FIRESTORM;
  const [locked, setLocked] = React.useState(null);

  const handleClassClick = (c) => {
    if(classId !== c.id){ setClass(c.id); setSpec(c.specs[0].id); }
  };
  const handleSpecClick = (c, s) => {
    setClass(c.id);
    setSpec(s.id);
    setLocked('hide');
    setTimeout(()=> setLocked(null), 300);
  };

  return (
    <div className="cs-picker">
      <div className="cs-classes">
        {CLASSES.map(c=>(
          <div key={c.id} className={`cs-cls-wrap ${locked==='hide'?'no-hover':''}`}>
            <button className={`cs-cls ${classId===c.id?'on':''}`}
              style={classId===c.id ? {boxShadow:`0 0 0 2px ${c.color}`} : {}}
              onClick={()=>handleClassClick(c)} title={c.name}>
              <img src={c.icon} alt={c.name}/>
            </button>
            <div className="cs-dropdown">
              <div className="cs-dropdown-inner">
              {c.specs.map(s=>(
                <button key={s.id} className={`cs-spec ${specId===s.id && classId===c.id?'on':''}`}
                  style={specId===s.id && classId===c.id ? {background: c.color+'22', borderColor: c.color, color:'#fff'} : {}}
                  onClick={()=>handleSpecClick(c, s)}>
                  <img className="spec-icon" src={s.icon} alt="" aria-hidden="true"/>
                  {s.name}
                </button>
              ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


window.PICKERS = { ModePicker, ClassSpecPicker };

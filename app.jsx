// Top-level App
const { useState, useEffect, useMemo } = React;

function AddonsList({items}){
  return (
    <div className="players-list" style={{padding:'8px 0'}}>
      {items.map((a,i)=>(
        <div key={i} style={{padding:'14px 22px', borderBottom: i<items.length-1 ? '1px solid var(--line)' : 'none'}}>
          <div style={{fontFamily:'Cinzel,serif', color:'var(--gold)', fontSize:18, fontWeight:600, letterSpacing:'.04em', marginBottom:4}}>
            {a.name}
          </div>
          <div style={{color:'var(--ink-mute)', fontSize:16.5}}>{a.description}</div>
        </div>
      ))}
    </div>
  );
}

function addDownloadAttributeToTextAndLuaLinks(html){
  if (!html || typeof document === 'undefined') return html;

  const template = document.createElement('template');
  template.innerHTML = html;

  template.content.querySelectorAll('a[href]').forEach((link) => {
    const href = link.getAttribute('href') || '';
    const cleanHref = href.split('#')[0].split('?')[0];
    if (!/\.(?:txt|lua)$/i.test(cleanHref)) return;

    const fileName = cleanHref.split('/').pop() || 'download.txt';
    link.setAttribute('download', fileName);
  });

  return template.innerHTML;
}

function TalentsPage(){
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancel = false;
    const basePath = (function(){
      if (window.location.hostname.indexOf('github.io') !== -1) {
        const parts = window.location.pathname.split('/').filter(Boolean);
        if (parts.length > 0) return '/' + parts[0];
      }
      return '';
    })();
    setLoading(true);
    setError(null);

    fetch(`${basePath}/talents.md?t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error('Файл talents.md не найден');
        return res.text();
      })
      .then((markdown) => {
        if (cancel) return;
        if (window.marked) {
          marked.setOptions({ breaks: true, gfm: true });
          setHtml(addDownloadAttributeToTextAndLuaLinks(marked.parse(markdown)));
        } else {
          setHtml(`<pre>${markdown.replace(/[&<>]/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]))}</pre>`);
        }
        setLoading(false);

        setTimeout(() => {
          if (window.$WowheadPower) window.$WowheadPower.refreshLinks();
        }, 100);
      })
      .catch((err) => {
        if (cancel) return;
        setError(err.message);
        setLoading(false);
      });

    return () => { cancel = true; };
  }, []);

  if (loading) {
    return <div className="guide-loading">Загрузка талантов...</div>;
  }

  if (error) {
    return (
      <div className="guide-placeholder">
        <div className="guide-placeholder-icon">📖</div>
        <div className="guide-placeholder-title">Раздел талантов пока пуст</div>
        <div className="guide-placeholder-text">
          Создайте файл <code>frontend/talents.md</code> и напишите в нём текст в Markdown.
        </div>
      </div>
    );
  }

  return (
    <div className="guide-with-sidebar">
      <div className="guide-main-column">
        <div className="guide-content markdown-body" dangerouslySetInnerHTML={{__html: html}} />
      </div>
    </div>
  );
}


function WeakAurasPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState('');
  const [activeItem, setActiveItem] = useState('');

  useEffect(() => {
    let cancel = false;
    const basePath = (function(){
      if (window.location.hostname.indexOf('github.io') !== -1) {
        const parts = window.location.pathname.split('/').filter(Boolean);
        if (parts.length > 0) return '/' + parts[0];
      }
      return '';
    })();

    fetch(`${basePath}/weakauras.md?t=${Date.now()}`)
      .then(res => {
         if(!res.ok) throw new Error('Not found');
         return res.text();
      })
      .then(text => {
        if (cancel) return;
        const parsedData = [];
        let currentCategory = null;
        let currentItem = null;

        const lines = text.split('\n');
        for (let line of lines) {
          if (line.startsWith('# ')) {
            currentCategory = { name: line.substring(2).trim(), items: [] };
            parsedData.push(currentCategory);
            currentItem = null;
          } else if (line.startsWith('## ') && currentCategory) {
            currentItem = { name: line.substring(3).trim(), content: '' };
            currentCategory.items.push(currentItem);
          } else if (currentItem) {
            currentItem.content += line + '\n';
          }
        }

        setData(parsedData);
        if (parsedData.length > 0 && parsedData[0].items.length > 0) {
          setActiveCat(parsedData[0].name);
          setActiveItem(parsedData[0].items[0].name);
        }
        setLoading(false);
      })
      .catch(() => {
         if (!cancel) setLoading(false);
      });

    return () => { cancel = true; };
  }, []);

  if (loading) return <div className="guide-loading">Загрузка WeakAuras...</div>;
  if (!data.length) return <div className="guide-placeholder">Файл weakauras.md пуст или не найден</div>;

  const activeContent = data.find(c => c.name === activeCat)?.items.find(i => i.name === activeItem)?.content || '';
  const html = window.marked ? (window.addDownloadAttributeToTextAndLuaLinks ? window.addDownloadAttributeToTextAndLuaLinks(window.marked.parse(activeContent)) : window.marked.parse(activeContent)) : `<pre>${activeContent}</pre>`;

  return (
    <div className="wa-layout">
      <div className="wa-sidebar">
        {data.map(cat => (
          <div key={cat.name} className="wa-cat-block">
            <div className="wa-cat-title">{cat.name}</div>
            <div className="wa-cat-items">
              {cat.items.map(item => (
                <div 
                  key={item.name}
                  className={`wa-item ${activeCat === cat.name && activeItem === item.name ? 'active' : ''}`}
                  onClick={() => { setActiveCat(cat.name); setActiveItem(item.name); }}
                >
                  {item.name}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
          <div 
      className="wa-content-wrapper markdown-body" 
      dangerouslySetInnerHTML={{__html: html}} 
      onClick={(e) => {
        if (e.target && e.target.classList.contains('wa-copy-btn')) {
          const btn = e.target;
          const nextEl = btn.nextElementSibling;
          if (nextEl) {
            navigator.clipboard.writeText(nextEl.textContent).then(() => {
              const originalText = btn.dataset.originalText || btn.textContent;
              if (!btn.dataset.originalText) {
                btn.dataset.originalText = originalText;
              }
              btn.textContent = 'Скопировано ✓';
              btn.style.background = '#4CAF50';
              btn.style.color = '#fff';
              
              setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
                btn.style.color = '';
              }, 2000);
            }).catch(err => {
              console.error('Ошибка копирования', err);
              btn.textContent = 'Ошибка копирования';
              setTimeout(() => { btn.textContent = btn.dataset.originalText || 'Скопировать код'; }, 2000);
            });
          }
        }
      }}
    />
    </div>
  );
}

function App(){
  const { CLASSES, RAID_BOSSES, MPLUS_DUNGEONS, apiPlayers, apiStats, apiAddons, apiWeakauras, normalizePlayer } = window.FIRESTORM;
  const { FeedbackModal } = window.FEEDBACK;
  const { DonateModal } = window.DONATE;
  const normalizeMode = (value) => value === 'mplus' ? 'mplus' : 'raid';

  // helper: безопасное чтение localStorage
  const loadPref = (key, fallback) => {
    try { const v = localStorage.getItem(key); return v != null ? v : fallback; }
    catch(e) { return fallback; }
  };

  // ── GitHub Pages base path (repo name) ───────────────────────────────
  const BASE_PATH = (function(){
    if (window.location.hostname.indexOf('github.io') !== -1) {
      const parts = window.location.pathname.split('/').filter(Boolean);
      if (parts.length > 0) return parts[0];
    }
    return '';
  })();

  // ── Парсинг pretty pathname → состояние ────────────────────────────────
  function parsePath(path) {
    const clean = path.replace(/^\/|\/$/g, '');
    let parts = clean.split('/').filter(Boolean);
    // Убираем base path (repo name) на GitHub Pages
    if (BASE_PATH && parts[0] === BASE_PATH) {
      parts = parts.slice(1);
    }
    if (!parts.length) return {};


    if (parts[0] === 'rankings' && parts.length >= 5) {
      const seg = parts[2] === 'all' ? '0' : parts[2];
      return {
        section: 'rankings',
        mode: parts[1],
        segment: seg,
        classId: parts[3],
        specId: parts[4],
        tab: parts[5] === 'stats' ? 'stats' : 'stats'
      };
    }

    if (['addons','weakauras','talents'].includes(parts[0])) {
      return { section: parts[0] };
    }
    return {};
  }

  const urlParsed = parsePath(window.location.pathname);

  const initialMode = normalizeMode(urlParsed.mode || loadPref('firestorm-mode', 'raid'));
  const initialSection = (() => {
    const s = urlParsed.section || loadPref('firestorm-section', 'rankings');
    return ['rankings', 'addons', 'weakauras', 'talents'].includes(s) ? s : 'rankings';
  })();

  const [section, setSection] = useState(initialSection);
  const [mode, setMode] = useState(initialMode);
  const [segment, setSegment] = useState(() => {
    const list = (initialMode === 'mplus') ? MPLUS_DUNGEONS : RAID_BOSSES;
    // segment НЕ сохраняется в localStorage — всегда "Общее" по умолчанию
    if (urlParsed.segment != null) {
      const found = list.find(x => String(x.id) === String(urlParsed.segment));
      if (found) return found.id;
    }
    return list[0].id; // всегда "Общее" (id='0')
  });
  const [classId, setClassId] = useState(() => urlParsed.classId || loadPref('firestorm-class', 'deathknight'));
  const [specId, setSpecId]   = useState(() => urlParsed.specId || loadPref('firestorm-spec', 'frost'));
  const [rankingsTab, setRankingsTab] = useState('stats');

  // Модальные окна
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [donateOpen, setDonateOpen] = useState(false);

  // ── Синхронизация состояния → pretty URL ───────────────────────────────
  useEffect(() => {
    let path;
    if (section === 'rankings') {
      const seg = segment === '0' || segment === 0 ? 'all' : String(segment);
      path = `/rankings/${mode}/${seg}/${classId}/${specId}/stats`;
    } else if (section === 'addons' || section === 'weakauras' || section === 'talents') {
      path = `/${section}`;
    } else {
      path = '/';
    }
    const fullPath = BASE_PATH ? `/${BASE_PATH}${path}` : path;
    if (window.location.pathname !== fullPath) {
      history.replaceState(null, '', fullPath);
    }
  }, [section, mode, segment, classId, specId]);

  // ── Синхронизация состояния → localStorage (fallback) ───────────────────
  useEffect(() => { try { localStorage.setItem('firestorm-section', section); } catch (e) {} }, [section]);
  useEffect(() => { try { localStorage.setItem('firestorm-mode', normalizeMode(mode)); } catch (e) {} }, [mode]);
  // segment НЕ сохраняется в localStorage (сбрасывается при перезагрузке / переключении табов)
  useEffect(() => { try { localStorage.setItem('firestorm-class', classId); } catch (e) {} }, [classId]);
  useEffect(() => { try { localStorage.setItem('firestorm-spec', specId); } catch (e) {} }, [specId]);

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isMock, setIsMock] = useState(false);
  const [addons, setAddons] = useState([]);
  const [auras, setAuras]   = useState([]);
  const [addonsMock, setAddonsMock] = useState(false);
  const [aurasMock, setAurasMock]   = useState(false);

  // fetch individual players for the leaderboard table
  const [players, setPlayers] = useState([]);
  const [playersLoading, setPlayersLoading] = useState(false);

  // when mode flips, reset segment to first of that mode's list
  // ВАЖНО: при первой загрузке этот эффект не должен затирать восстановленный segment.
  // Используем ref-флаг "первого рендера".
  const isFirstModeChange = React.useRef(true);
  useEffect(()=>{
    if(isFirstModeChange.current){
      isFirstModeChange.current = false;
      return;  // не трогаем segment при первом рендере
    }
    setSegment(mode==='raid' ? RAID_BOSSES[0].id : MPLUS_DUNGEONS[0].id);
  }, [mode]);


  // При возвращении в раздел "Рейтинги" из другой секции — тоже сбрасываем на "Общее"
  const isFirstSectionChange = React.useRef(true);
  const prevSection = React.useRef(section);
  useEffect(() => {
    if (isFirstSectionChange.current) {
      isFirstSectionChange.current = false;
      prevSection.current = section;
      return;
    }
    const wasOther = prevSection.current !== 'rankings';
    const isRankings = section === 'rankings';
    prevSection.current = section;
    if (wasOther && isRankings) {
      setSegment(mode==='raid' ? RAID_BOSSES[0].id : MPLUS_DUNGEONS[0].id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  // fetch stats (агрегированные данные с бэкенда)
  useEffect(()=>{
    if(section !== 'rankings') return;
    let cancel = false;
    setLoading(true);
    apiStats({mode, segment, classId, specId}).then(res=>{
      if(cancel) return;
      if(res.ok){
        setIsMock(false);
        setStats(res.data);
      } else {
        // Fallback если /api/stats не работает (старый бэкенд или ошибка)
        setIsMock(true);
        setStats(null);
      }
      setLoading(false);
    });
    return ()=>{ cancel = true; };
  }, [section, mode, segment, classId, specId]);

  // fetch individual players (top-200 for the leaderboard)
  useEffect(()=>{
    if(section !== 'rankings') return;
    let cancel = false;
    setPlayersLoading(true);
    apiPlayers({mode, segment, classId, specId, limit: 200}).then(res=>{
      if(cancel) return;
      if(res.ok){
        const normalized = (res.data || []).map(normalizePlayer);
        setPlayers(normalized);
      } else {
        setPlayers([]);
      }
      setPlayersLoading(false);
    });
    return ()=>{ cancel = true; };
  }, [section, mode, segment, classId, specId]);

  // fetch addons / auras once
  useEffect(()=>{
    apiAddons().then(res=>{ setAddons(res.data); setAddonsMock(!!res.mock); });
    apiWeakauras().then(res=>{ setAuras(res.data); setAurasMock(!!res.mock); });
  }, []);

  const cls = CLASSES.find(c=>c.id===classId);

  return (
    <div>
      <header className="fs-header">
        <div className="fs-header-inner">
          <img src="logo.png" alt="Firestorm" className="fs-logo"/>
          <nav className="fs-nav">
            <a className={`fs-nav-link ${section==='rankings'?'on':''}`} onClick={e=>{e.preventDefault(); setSection('rankings');}} href="#">Рейтинги</a>
            <a className={`fs-nav-link ${section==='addons'?'on':''}`}   onClick={e=>{e.preventDefault(); setSection('addons');}}   href="#">Аддоны</a>
            <a className={`fs-nav-link ${section==='weakauras'?'on':''}`}onClick={e=>{e.preventDefault(); setSection('weakauras');}}href="#">WeakAuras</a>
            <a className={`fs-nav-link ${section==='talents'?'on':''}`}  onClick={e=>{e.preventDefault(); setSection('talents');}}  href="#">Таланты</a>
          </nav>
          <div className="fs-header-actions">
            <button className="donate-trigger" onClick={() => setDonateOpen(true)}>💰 Поддержать автора</button>
            <button className="feedback-trigger" onClick={() => setFeedbackOpen(true)}>
              💬 Обратная связь
            </button>
          </div>
        </div>
      </header>

      <main className="fs-main">
        {section === 'rankings' && (
          <>
            <window.PICKERS.ModePicker
              mode={mode} setMode={setMode}
              segment={segment} setSegment={setSegment}/>
            <window.PICKERS.ClassSpecPicker
              classId={classId} specId={specId}
              setClass={setClassId} setSpec={setSpecId}/>
            
            {loading ? (
              <div className="fs-loading">Загрузка статистики…</div>
            ) : (
              <window.STATS.StatsBlock stats={stats} players={players} playersLoading={playersLoading} classColor={cls.color}/>
            )}
          </>
        )}

        {section === 'addons' && (
          <>
            <p className="fs-page-sub">Базовый набор от рейдовых лидеров · сообщество одобряет</p>
            <AddonsList items={addons}/>
          </>
        )}


        {section === 'weakauras' && (
          <>
            <p className="fs-page-sub">Готовые наборы триггеров и индикаторов (из weakauras.md)</p>
            <WeakAurasPage />
          </>
        )}

        {section === 'talents' && (
          <>
            <p className="fs-page-sub">Тексты, билды и заметки по талантам из Markdown-файла</p>
            <TalentsPage />
          </>
        )}
      </main>
      
      <FeedbackModal 
        isOpen={feedbackOpen} 
        onClose={() => setFeedbackOpen(false)}
      />
      
      <DonateModal 
        isOpen={donateOpen} 
        onClose={() => setDonateOpen(false)}
      />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);

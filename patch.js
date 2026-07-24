
const fs = require('fs');
let code = fs.readFileSync('app.jsx', 'utf8');

const weakAurasComponent = `
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

    fetch(\`\${basePath}/weakauras.md?t=\${Date.now()}\`)
      .then(res => {
         if(!res.ok) throw new Error('Not found');
         return res.text();
      })
      .then(text => {
        if (cancel) return;
        const parsedData = [];
        let currentCategory = null;
        let currentItem = null;

        const lines = text.split('\\n');
        for (let line of lines) {
          if (line.startsWith('# ')) {
            currentCategory = { name: line.substring(2).trim(), items: [] };
            parsedData.push(currentCategory);
            currentItem = null;
          } else if (line.startsWith('## ') && currentCategory) {
            currentItem = { name: line.substring(3).trim(), content: '' };
            currentCategory.items.push(currentItem);
          } else if (currentItem) {
            currentItem.content += line + '\\n';
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
  const html = window.marked ? (window.addDownloadAttributeToTextAndLuaLinks ? window.addDownloadAttributeToTextAndLuaLinks(window.marked.parse(activeContent)) : window.marked.parse(activeContent)) : \`<pre>\${activeContent}</pre>\`;

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
                  className={\`wa-item \${activeCat === cat.name && activeItem === item.name ? 'active' : ''}\`}
                  onClick={() => { setActiveCat(cat.name); setActiveItem(item.name); }}
                >
                  {item.name}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="wa-content-wrapper markdown-body" dangerouslySetInnerHTML={{__html: html}} />
    </div>
  );
}
`;

code = code.replace('function App(){', weakAurasComponent + '\nfunction App(){');

code = code.replace(
  `{section === 'weakauras' && (
          <>
            <p className="fs-page-sub">Готовые наборы триггеров и индикаторов</p>
            <AddonsList items={auras}/>
          </>
        )}`,
  `{section === 'weakauras' && (
          <>
            <p className="fs-page-sub">Готовые наборы триггеров и индикаторов (из weakauras.md)</p>
            <WeakAurasPage />
          </>
        )}`
);

fs.writeFileSync('app.jsx', code);

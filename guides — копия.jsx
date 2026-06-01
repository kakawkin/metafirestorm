// Guides component — загружает и отображает Markdown-гайды
const { useState, useEffect } = React;

function GuideBlock({classId, specId}) {
  const [guideContent, setGuideContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Формируем имя файла: deathknight_unholy.md
    const fileName = `${classId}_${specId}.md`;
    const guidePath = `guides/${fileName}`;

    setLoading(true);
    setError(null);

    fetch(guidePath)
      .then(res => {
        if (!res.ok) {
          throw new Error('Гайд не найден');
        }
        return res.text();
      })
      .then(markdown => {
        // Рендерим Markdown в HTML через marked.js
        // ВАЖНО: marked по умолчанию разрешает HTML внутри markdown
        marked.setOptions({
          breaks: true,       // Переносы строк → <br>
          gfm: true,          // GitHub Flavored Markdown
        });
        const html = marked.parse(markdown);
        setGuideContent(html);
        setLoading(false);
        
        // После рендеринга инициализируем Wowhead tooltips
        setTimeout(() => {
          if (window.$WowheadPower) window.$WowheadPower.refreshLinks();
        }, 100);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [classId, specId]);

  if (loading) {
    return <div className="guide-loading">Загрузка гайда...</div>;
  }

  if (error) {
    return (
      <div className="guide-placeholder">
        <div className="guide-placeholder-icon">📖</div>
        <div className="guide-placeholder-title">Гайд пока недоступен</div>
        <div className="guide-placeholder-text">
          Гайд для этого спека ещё не создан.<br/>
          Создайте файл <code>{classId}_{specId}.md</code> в папке <code>frontend/guides/</code>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="guide-content markdown-body" 
      dangerouslySetInnerHTML={{__html: guideContent}}
    />
  );
}

window.GUIDES = { GuideBlock };

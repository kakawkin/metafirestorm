// Guides component — загружает и отображает Markdown-гайды
const { useState, useEffect } = React;

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s\-\u0400-\u04FF]/g, "")
    .replace(/\s+/g, "-")
    .substring(0, 50);
}

function extractToc(markdown) {
  const headings = [];
  // Нормализуем line-endings и убираем BOM
  const cleanMd = markdown.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = cleanMd.split("\n");
  lines.forEach((line, idx) => {
    const match = line.match(/^(#{1,5})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      if (level === 1) return; // H1 — заголовок босса, не показываем в TOC
      const text = match[2]
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/\*{1,2}([^*]+)\*{1,2}/g, "$1")
        .trim();
      const id = `toc-${idx}-${slugify(text)}`;
      headings.push({ level, text, id });
    }
  });
  return headings;
}

function isRelativeGuidePath(path) {
  const value = (path || "").trim();
  return !!value && !value.startsWith("#") && !value.startsWith("/") && !/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(value);
}

function getGuideBaseDir(guideFilePath) {
  const normalized = String(guideFilePath || "").split("?")[0].replace(/\\/g, "/");
  const lastSlash = normalized.lastIndexOf("/");
  return lastSlash === -1 ? "" : normalized.slice(0, lastSlash + 1);
}

function resolveGuideAssetUrl(assetPath, guideBaseDir) {
  if (!isRelativeGuidePath(assetPath) || !guideBaseDir) return assetPath;
  try {
    const resolved = new URL(assetPath, `${window.location.origin}/${guideBaseDir}`);
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch (error) {
    return assetPath;
  }
}

function rewriteGuideAssetPaths(html, guideBaseDir) {
  if (!html || !guideBaseDir || typeof document === "undefined") return html;

  const template = document.createElement("template");
  template.innerHTML = html;

  [
    ["img", "src"],
    ["source", "src"],
    ["video", "poster"],
    ["a", "href"],
  ].forEach(([selector, attr]) => {
    template.content.querySelectorAll(`${selector}[${attr}]`).forEach((node) => {
      const currentValue = node.getAttribute(attr);
      if (isRelativeGuidePath(currentValue)) {
        node.setAttribute(attr, resolveGuideAssetUrl(currentValue, guideBaseDir));
      }
    });
  });

  return template.innerHTML;
}

function appendGuidePart(parts, part) {
  if (!part) return;
  const lastPart = parts[parts.length - 1];
  if (part.type === "html" && lastPart?.type === "html") {
    lastPart.html += part.html;
    return;
  }
  parts.push(part);
}

function appendGuideHtml(parts, html) {
  if (!html || !html.trim()) return;
  appendGuidePart(parts, { type: "html", html });
}

function serializeGuideNode(node) {
  if (!node) return "";
  if (node.nodeType === 3) return node.textContent || "";
  if (node.nodeType === 1) return node.outerHTML || "";
  return "";
}

function splitHtmlPartIntoSections(part, introParts, sections) {
  if (typeof document === "undefined") {
    appendGuidePart(introParts, part);
    return;
  }

  const template = document.createElement("template");
  template.innerHTML = part.html;
  const nodes = Array.from(template.content.childNodes);
  let currentSection = sections[sections.length - 1] || null;
  let buffer = [];

  function flushBuffer() {
    const html = buffer.map(serializeGuideNode).join("");
    if (currentSection) {
      appendGuideHtml(currentSection.parts, html);
    } else {
      appendGuideHtml(introParts, html);
    }
    buffer = [];
  }

  nodes.forEach((node) => {
    if (node.nodeType === 1 && node.tagName === "H2") {
      flushBuffer();
      const title = (node.textContent || "").trim() || `Раздел ${sections.length + 1}`;
      currentSection = {
        id: `guide-section-${sections.length + 1}`,
        title,
        parts: [],
      };
      sections.push(currentSection);
      return;
    }
    buffer.push(node);
  });

  flushBuffer();
}

function buildGuideView(parts) {
  const introParts = [];
  const sections = [];

  parts.forEach((part) => {
    if (part.type === "html") {
      splitHtmlPartIntoSections(part, introParts, sections);
      return;
    }

    const currentSection = sections[sections.length - 1];
    appendGuidePart(currentSection ? currentSection.parts : introParts, part);
  });

  // H3-заголовки больше НЕ превращаются в табы автоматически.
  // Используйте явные маркеры ::tabs start Name ... ::tabs end в markdown.

  return { introParts, sections };
}

// Превращает последовательные H3 внутри секции в горизонтальные табы
function splitSectionPartsIntoTabs(parts) {
  if (typeof document === "undefined") return parts;

  const result = [];
  let currentTabs = null;

  parts.forEach((part) => {
    if (part.type !== "html") {
      if (currentTabs) {
        currentTabs.tabs[currentTabs.tabs.length - 1].parts.push(part);
      } else {
        result.push(part);
      }
      return;
    }

    const template = document.createElement("template");
    template.innerHTML = part.html;
    const nodes = Array.from(template.content.childNodes);
    let hasH3 = false;
    nodes.forEach((node) => {
      if (node.nodeType === 1 && node.tagName === "H3") hasH3 = true;
    });

    if (!hasH3) {
      if (currentTabs) {
        currentTabs.tabs[currentTabs.tabs.length - 1].parts.push(part);
      } else {
        result.push(part);
      }
      return;
    }

    let buffer = [];
    function flushBuffer() {
      if (!buffer.length) return;
      const html = buffer.map(serializeGuideNode).join("");
      const htmlPart = { type: "html", html };
      if (currentTabs) {
        currentTabs.tabs[currentTabs.tabs.length - 1].parts.push(htmlPart);
      } else {
        result.push(htmlPart);
      }
      buffer = [];
    }

    nodes.forEach((node) => {
      if (node.nodeType === 1 && node.tagName === "H3") {
        flushBuffer();
        const title = (node.textContent || "").trim() || `Tab ${(currentTabs?.tabs.length || 0) + 1}`;
        if (!currentTabs) {
          currentTabs = { type: "tabs", tabs: [] };
          result.push(currentTabs);
        }
        currentTabs.tabs.push({ name: title, parts: [] });
      } else {
        buffer.push(node);
      }
    });

    flushBuffer();
  });

  return result;
}

function getTalentTagCode(attrs) {
  const match = attrs.match(/\bcode\s*=\s*(["'])(.*?)\1/i);
  return (match?.[2] || "").trim();
}

function getTabName(attrs) {
  const match = attrs.match(/\bname\s*=\s*(["'])(.*?)\1/i);
  return (match?.[2] || "").trim();
}

function buildGuideParts(markdown, guideBaseDir = "") {
  const parts = [];
  const cleanMd = markdown.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  // HTML-теги + markdown-табы ::tabs / ::tab Name / ::/tabs
  const tokenRe = /<(\/?)(talent-calc|talent|tabs|tab)\b([^>]*)>|^::tabs\s*$|^::tab\s+(.*?)$|^::\/tabs\s*$/gim;
  let lastIndex = 0;

  function pushHtml(text) {
    if (text) parts.push({ type: "html", html: rewriteGuideAssetPaths(marked.parse(text), guideBaseDir) });
  }

  let match;
  let currentTabsGroup = null;

  while ((match = tokenRe.exec(cleanMd)) !== null) {
    const matchIndex = match.index;
    const matchText = match[0];
    const isTabsOpen = matchText.trim() === "::tabs";
    const isTab = match[4] !== undefined; // captured by (.*?)
    const isTabsClose = matchText.trim() === "::/tabs";
    const tagName = match[2]?.toLowerCase();
    const isTalentTag = tagName === 'talent' || tagName === 'talent-calc';
    let textBefore = cleanMd.slice(lastIndex, matchIndex);

    // Если внутри таб-группы и встретили НЕ-таб токен (и не talent) — закрываем группу
    if (currentTabsGroup && !isTabsOpen && !isTab && !isTabsClose && !isTalentTag) {
      if (currentTabsGroup.tabs.length > 0) {
        currentTabsGroup.tabs[currentTabsGroup.tabs.length - 1].content += textBefore;
      }
      parts.push(currentTabsGroup);
      currentTabsGroup = null;
      lastIndex = matchIndex;
      textBefore = "";
    }

    // ::tabs — открыть группу
    if (isTabsOpen) {
      pushHtml(textBefore);
      currentTabsGroup = { type: "tabs", tabs: [] };
      lastIndex = tokenRe.lastIndex;
      continue;
    }

    // ::tab Name — новая вкладка
    if (isTab) {
      if (!currentTabsGroup) {
        // Изолированный ::tab — создаём группу с одной вкладкой
        pushHtml(textBefore);
        currentTabsGroup = { type: "tabs", tabs: [] };
      } else if (currentTabsGroup.tabs.length > 0) {
        currentTabsGroup.tabs[currentTabsGroup.tabs.length - 1].content += textBefore;
      }
      currentTabsGroup.tabs.push({ name: (match[4] || "").trim() || "Вкладка", content: "", parts: [] });
      lastIndex = tokenRe.lastIndex;
      continue;
    }

    // ::/tabs — закрыть группу
    if (isTabsClose) {
      if (currentTabsGroup && currentTabsGroup.tabs.length > 0) {
        currentTabsGroup.tabs[currentTabsGroup.tabs.length - 1].content += textBefore;
      } else {
        pushHtml(textBefore);
      }
      if (currentTabsGroup) {
        parts.push(currentTabsGroup);
        currentTabsGroup = null;
      }
      lastIndex = tokenRe.lastIndex;
      continue;
    }

    // HTML-теги (talent, tabs, tab)
    const isClosing = match[1] === "/";
    const attrs = match[3] || "";

    if (currentTabsGroup) {
      if (currentTabsGroup.tabs.length > 0) {
        currentTabsGroup.tabs[currentTabsGroup.tabs.length - 1].content += textBefore;
      }
    } else {
      pushHtml(textBefore);
    }

    lastIndex = tokenRe.lastIndex;

    if (tagName === "talent" || tagName === "talent-calc") {
      if (!isClosing) {
        const code = getTalentTagCode(attrs);
        if (code) {
          const part = {
            type: tagName === "talent" ? "talent-static" : "talent-calc",
            code,
          };
          if (currentTabsGroup && currentTabsGroup.tabs.length > 0) {
            currentTabsGroup.tabs[currentTabsGroup.tabs.length - 1].content += matchText;
          } else {
            parts.push(part);
          }
        }
      }
    } else if (tagName === "tabs") {
      if (!isClosing) {
        currentTabsGroup = { type: "tabs", tabs: [] };
      } else {
        if (currentTabsGroup) {
          parts.push(currentTabsGroup);
          currentTabsGroup = null;
        }
      }
    } else if (tagName === "tab") {
      if (!isClosing) {
        const name = getTabName(attrs) || "Вкладка";
        const newTab = { name, content: "", parts: [] };
        if (!currentTabsGroup) {
          currentTabsGroup = { type: "tabs", tabs: [newTab], implicit: true };
        } else {
          currentTabsGroup.tabs.push(newTab);
        }
      } else {
        const remaining = markdown.slice(lastIndex).trim();
        const nextIsTab = remaining.startsWith("<tab") && !remaining.startsWith("<tab-calc") && !remaining.startsWith("<talent");
        if (!nextIsTab && currentTabsGroup && currentTabsGroup.implicit) {
          parts.push(currentTabsGroup);
          currentTabsGroup = null;
        }
      }
    }
  }

  const remainingText = cleanMd.slice(lastIndex);
  if (currentTabsGroup) {
    if (currentTabsGroup.tabs.length > 0) {
      currentTabsGroup.tabs[currentTabsGroup.tabs.length - 1].content += remainingText;
    }
    parts.push(currentTabsGroup);
  } else {
    pushHtml(remainingText);
  }

  parts.forEach(part => {
    if (part.type === "tabs") {
      part.tabs.forEach(tab => {
        tab.parts = buildGuideParts(tab.content, guideBaseDir);
      });
    }
  });

  return parts.length ? parts : [{ type: "html", html: "" }];
}

// Рекурсивный рендер частей гайда (позволяет вкладкам содержать любые вложенные элементы)
function RenderGuideParts({ parts, classId, specId, TalentCalc, TalentStatic }) {
  return (
    <React.Fragment>
      {parts.map((part, index) => {
        if (part.type === "talent-static") {
          return TalentStatic ? (
            <TalentStatic
              key={`talent-${index}`}
              classId={classId}
              specId={specId}
              loadoutCode={part.code}
            />
          ) : null;
        }
        if (part.type === "talent-calc") {
          return TalentCalc ? (
            <TalentCalc
              key={`talent-calc-${index}`}
              classId={classId}
              specId={specId}
              loadoutCode={part.code}
            />
          ) : null;
        }
        if (part.type === "tabs") {
          return (
            <GuideTabs
              key={`tabs-${index}`}
              part={part}
              classId={classId}
              specId={specId}
              TalentCalc={TalentCalc}
              TalentStatic={TalentStatic}
            />
          );
        }
        return (
          <div
            key={`html-${index}`}
            style={{ display: "contents" }}
            dangerouslySetInnerHTML={{ __html: part.html }}
          />
        );
      })}
    </React.Fragment>
  );
}

// Компонент интерактивных вкладок
function GuideTabs({ part, classId, specId, TalentCalc, TalentStatic }) {
  const [activeTabIdx, setActiveTabIdx] = useState(0);

  if (!part.tabs || !part.tabs.length) return null;

  return (
    <div className="guide-tabs-container" style={{ margin: "24px 0" }}>
      {/* Кнопки переключения вкладок */}
      <div className="guide-tabs">
        {part.tabs.map((tab, idx) => (
          <button
            key={idx}
            className={`guide-tab-btn ${idx === activeTabIdx ? "active" : ""}`}
            onClick={() => {
              setActiveTabIdx(idx);
              // Задержка перед обновлением тултипов Wowhead для нового содержимого
              setTimeout(() => {
                if (window.$WowheadPower) window.$WowheadPower.refreshLinks();
              }, 100);
            }}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Содержимое вкладок */}
      {part.tabs.map((tab, idx) => (
        <div
          key={idx}
          className={`guide-tab-content ${idx === activeTabIdx ? "active" : ""}`}
        >
          <RenderGuideParts
            parts={tab.parts}
            classId={classId}
            specId={specId}
            TalentCalc={TalentCalc}
            TalentStatic={TalentStatic}
          />
        </div>
      ))}
    </div>
  );
}

function GuideTOC({ headings, title }) {
  const [activeId, setActiveId] = useState(null);
  const tocRef = React.useRef(null);
  const wrapperRef = React.useRef(null);
  const targetOffsetRef = React.useRef(0);
  const currentOffsetRef = React.useRef(0);
  const rafRef = React.useRef(null);

  useEffect(() => {
    if (!headings.length) return;

    function lerpScroll() {
      const toc = tocRef.current;
      if (!toc) return;
      const diff = targetOffsetRef.current - currentOffsetRef.current;
      if (Math.abs(diff) > 0.3) {
        currentOffsetRef.current += diff * 0.12; // easing factor (lower = slower/heavier)
        toc.style.transform = `translateY(${Math.round(currentOffsetRef.current)}px)`;
        rafRef.current = requestAnimationFrame(lerpScroll);
      } else {
        currentOffsetRef.current = targetOffsetRef.current;
        toc.style.transform = `translateY(${Math.round(currentOffsetRef.current)}px)`;
        rafRef.current = null;
      }
    }

    function triggerLerp() {
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(lerpScroll);
      }
    }

    const handleScroll = () => {
      const container = document.querySelector(".guide-main-column .guide-content");
      if (!container) return;
      const domHeadings = container.querySelectorAll("h1, h2, h3, h4, h5");
      let current = null;
      domHeadings.forEach((h) => {
        const rect = h.getBoundingClientRect();
        if (rect.top <= 140) current = h.id;
      });
      setActiveId(current);

      // Smart sticky: center TOC vertically once wrapper hits sticky top
      const toc = tocRef.current;
      const wrapper = wrapperRef.current;
      if (!toc || !wrapper) return;

      const tocHeight = toc.offsetHeight;
      const viewportCenter = window.innerHeight / 2;
      const desiredOffset = viewportCenter - 90 - tocHeight / 2;
      const offset = Math.max(0, Math.round(desiredOffset));

      const wrapperRect = wrapper.getBoundingClientRect();
      if (wrapperRect.top <= 91) {
        targetOffsetRef.current = offset;
      } else {
        targetOffsetRef.current = 0;
      }
      triggerLerp();
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [headings]);

  return (
    <div className="toc-wrapper" ref={wrapperRef}>
      <nav className="guide-toc" ref={tocRef}>
        {headings.length === 0 && (
          <div className="guide-toc-empty" style={{color: 'var(--ink-mute)', fontSize: 13, padding: '4px 0'}}>
            Нет разделов
          </div>
        )}

        {headings.length > 0 && (
          <a
            className="guide-toc-item level-1"
            onClick={(e) => {
              e.preventDefault();
              const content = document.querySelector('.guide-main-column .guide-content');
              if (content) {
                window.scrollTo({ top: content.offsetTop - 100, behavior: 'smooth' });
              }
            }}
          >
            Начало
          </a>
        )}

        {headings.map((h) => (
          <a
            key={h.id}
            href={`#${h.id}`}
            className={`guide-toc-item level-${h.level} ${activeId === h.id ? "active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              let el = document.getElementById(h.id);
              if (!el) return;

              // Если элемент скрыт (внутри неактивной вкладки) — активируем вкладку
              if (!el.offsetParent) {
                const tabContent = el.closest('.guide-tab-content');
                if (tabContent) {
                  const tabsContainer = tabContent.closest('.guide-tabs-container');
                  if (tabsContainer) {
                    const contents = Array.from(tabsContainer.querySelectorAll('.guide-tab-content'));
                    const idx = contents.indexOf(tabContent);
                    const buttons = tabsContainer.querySelectorAll('.guide-tab-btn');
                    if (buttons[idx]) {
                      buttons[idx].click();
                      // После переключения вкладки скроллим к заголовку
                      setTimeout(() => {
                        const rect = el.getBoundingClientRect();
                        if (rect.height > 0) {
                          window.scrollTo({ top: window.scrollY + rect.top - 100, behavior: 'smooth' });
                        }
                      }, 60);
                      return;
                    }
                  }
                }
                return; // Не можем скроллить к скрытому элементу
              }

              // Элемент видим — плавный скролл с отступом под хедер
              const rect = el.getBoundingClientRect();
              window.scrollTo({ top: window.scrollY + rect.top - 100, behavior: 'smooth' });
            }}
          >
            {h.text}
          </a>
        ))}
      </nav>
    </div>
  );
}

function GuideStructuredContent({ guideView, classId, specId, TalentCalc, TalentStatic, children }) {
  const sections = guideView?.sections || [];
  const introParts = guideView?.introParts || [];


  if (!sections.length) {
    return (
      <React.Fragment>
        <RenderGuideParts
          parts={introParts}
          classId={classId}
          specId={specId}
          TalentCalc={TalentCalc}
          TalentStatic={TalentStatic}
        />
        {children}
      </React.Fragment>
    );
  }

  return (
    <div className="guide-shell">
      {introParts.length ? (
        <RenderGuideParts
          parts={introParts}
          classId={classId}
          specId={specId}
          TalentCalc={TalentCalc}
          TalentStatic={TalentStatic}
        />
      ) : null}

      {children}

      <div className="guide-section-list">
        {sections.map((section) => (
          <section key={section.id} className="guide-section-block">
            <h2 className="guide-section-bar">{section.title}</h2>
            <div className="guide-section-body">
              <RenderGuideParts
                parts={section.parts}
                classId={classId}
                specId={specId}
                TalentCalc={TalentCalc}
                TalentStatic={TalentStatic}
              />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function GuideBlock({ classId, specId }) {
  const [guideView, setGuideView] = useState({ introParts: [], sections: [] });
  const [toc, setToc] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { TalentCalc, TalentStatic } = window.TALENTCALC || {};

  useEffect(() => {
    const fileName = `${classId}_${specId}.md`;
    const guideFilePath = `guides/classes/${fileName}`;
    const guidePath = `${guideFilePath}?t=${Date.now()}`;
    const guideBaseDir = getGuideBaseDir(guideFilePath);

    setLoading(true);
    setError(null);

    fetch(guidePath, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Гайд не найден");
        }
        return res.text();
      })
      .then((markdown) => {
        setToc(extractToc(markdown));
        marked.setOptions({
          breaks: true,
          gfm: true,
        });
        setGuideView(buildGuideView(buildGuideParts(markdown, guideBaseDir)));
        setLoading(false);

        setTimeout(() => {
          if (window.$WowheadPower) window.$WowheadPower.refreshLinks();
        }, 100);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [classId, specId]);

  useEffect(() => {
    if (!toc.length || !guideView) return;
    const container = document.querySelector(".guide-main-column .guide-content");
    if (!container) return;
    const domHeadings = container.querySelectorAll("h2, h3, h4, h5");
    domHeadings.forEach((h, i) => {
      if (toc[i]) h.id = toc[i].id;
    });
  }, [guideView, toc]);

  if (loading) {
    return <div className="guide-loading">Загрузка гайда...</div>;
  }

  if (error) {
    return (
      <div className="guide-placeholder">
        <div className="guide-placeholder-icon">📖</div>
        <div className="guide-placeholder-title">Гайд пока недоступен</div>
        <div className="guide-placeholder-text">
          Гайд для этого спека ещё не создан.
          <br />
          Создайте файл{" "}
          <code>
            {classId}_{specId}.md
          </code>{" "}
          в папке <code>frontend/guides/classes/</code>
        </div>
      </div>
    );
  }

  return (
    <div className="guide-with-sidebar">
      <GuideTOC headings={toc} />
      <div className="guide-main-column">
        <div className="guide-content markdown-body">
          <GuideStructuredContent
            guideView={guideView}
            classId={classId}
            specId={specId}
            TalentCalc={TalentCalc}
            TalentStatic={TalentStatic}
          />
        </div>
      </div>
    </div>
  );
}

function StandaloneGuideBlock({ bossSlug, title = "Гайд", difficulty, onDifficultyChange }) {
  const [guideView, setGuideView] = useState({ introParts: [], sections: [] });
  const [toc, setToc] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Внутренний fallback если компонент используется без управляющего стейта
  const [internalDifficulty, setInternalDifficulty] = useState(() => {
    try {
      const saved = localStorage.getItem('firestorm-raid-guide-difficulty');
      return saved === 'heroic' ? 'heroic' : 'mythic';
    } catch (e) {
      return 'mythic';
    }
  });

  const effectiveDifficulty = difficulty !== undefined ? difficulty : internalDifficulty;
  const setDifficulty = onDifficultyChange || setInternalDifficulty;

  const { TalentCalc, TalentStatic } = window.TALENTCALC || {};

  // Сохраняем внутренний fallback
  useEffect(() => {
    if (difficulty === undefined) {
      try { localStorage.setItem('firestorm-raid-guide-difficulty', internalDifficulty); } catch (e) {}
    }
  }, [difficulty, internalDifficulty]);

  const fileName = `raid/${bossSlug}/ru_${effectiveDifficulty === 'heroic' ? 'Heroic' : 'Mythic'}_${bossSlug}.md`;

  useEffect(() => {
    const guideFilePath = `guides/${fileName}`;
    const guidePath = `${guideFilePath}?t=${Date.now()}`;
    const guideBaseDir = getGuideBaseDir(guideFilePath);

    setLoading(true);
    setError(null);

    fetch(guidePath, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Гайд не найден");
        }
        return res.text();
      })
      .then((markdown) => {
        setToc(extractToc(markdown));
        marked.setOptions({
          breaks: true,
          gfm: true,
        });
        setGuideView(buildGuideView(buildGuideParts(markdown, guideBaseDir)));
        setLoading(false);

        setTimeout(() => {
          if (window.$WowheadPower) window.$WowheadPower.refreshLinks();
        }, 100);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [fileName, bossSlug, effectiveDifficulty]);

  // Привязываем id к отрендеренным заголовкам для навигации TOC
  useEffect(() => {
    if (!toc.length || !guideView) return;
    const container = document.querySelector(".guide-main-column .guide-content");
    if (!container) return;
    const domHeadings = container.querySelectorAll("h2, h3, h4, h5");
    domHeadings.forEach((h, i) => {
      if (toc[i]) h.id = toc[i].id;
    });
  }, [guideView, toc]);

  if (loading) {
    return <div className="guide-loading">Загрузка гайда...</div>;
  }

  if (error) {
    return (
      <div className="guide-placeholder">
        <div className="guide-placeholder-icon">📖</div>
        <div className="guide-placeholder-title">{title} пока недоступен</div>
        <div className="guide-placeholder-text">
          Создайте файл <code>{fileName}</code> в папке <code>frontend/guides/</code>
        </div>
      </div>
    );
  }

  const displayTitle = `Гайд на ${effectiveDifficulty === 'mythic' ? 'мифического' : 'героического'} босса ${title}`;

  return (
    <div className="guide-with-sidebar">
      <GuideTOC headings={toc} title={displayTitle} />
      <div className="guide-main-column">
        <div className="guide-content markdown-body">
          <GuideStructuredContent
            guideView={guideView}
            classId={null}
            specId={null}
            TalentCalc={TalentCalc}
            TalentStatic={TalentStatic}
          >
            <div className="guide-difficulty-bar">
              <div className="fs-tabs">
            <button
              className={`fs-tab ${effectiveDifficulty === 'heroic' ? 'active' : ''}`}
              onClick={() => setDifficulty('heroic')}
            >
              <img className="guide-diff-icon" src="https://wow.zamimg.com/images/icons/heroic.gif" alt="" />
              Героик
            </button>
            <button
              className={`fs-tab ${effectiveDifficulty === 'mythic' ? 'active' : ''}`}
              onClick={() => setDifficulty('mythic')}
            >
              <img className="guide-diff-icon" src="https://wow.zamimg.com/images/icons/mythic.gif" alt="" />
              Мифик
            </button>
              </div>
            </div>
          </GuideStructuredContent>
        </div>
      </div>
    </div>
  );
}

window.GUIDES = { GuideBlock, StandaloneGuideBlock };

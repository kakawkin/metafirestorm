// UI primitives
const RARITY_COLORS = { common:'#fff', uncommon:'#1eff00', rare:'#0070dd', epic:'#a335ee', legendary:'#ff8000', artifact:'#e6cc80', poor:'#9d9d9d' };

function ItemIcon({item, size=36}){
  if(!item || !item.itemId) return <span className="item-icon empty" style={{width:size,height:size}}/>;
  
  // Если есть iconName из items.db — используем прямую ссылку на zamimg
  // Иначе — пусть Wowhead tooltip заменит placeholder автоматически
  const iconUrl = item.iconName 
    ? `https://wow.zamimg.com/images/wow/icons/large/${item.iconName}.jpg`
    : "https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg";
  
  // Используем полный URL с bonus и ilvl для корректного Wowhead tooltip
  const itemUrl = item.fullItemUrl || `https://www.wowhead.com/ru/item=${item.itemId}`;
  
  // Параметры для Wowhead тултипа - извлекаем из fullItemUrl
  const wowheadData = itemUrl.replace('https://www.wowhead.com/ru/', '');
  
  return (
    <a href={itemUrl}
       className={`item-icon quality-${item.quality}`}
       style={{width:size, height:size}}
       data-wowhead={wowheadData}
       data-wh-rename-link="false"
       title={item.itemName}>
      <img src={iconUrl}
           alt={item.itemName} style={{width:size,height:size,display:'block'}}/>
    </a>
  );
}
function ItemName({item, small}){
  if(!item || !item.itemName) return <span className="item-name empty">—</span>;
  
  // Используем полный URL с bonus и ilvl для корректного Wowhead tooltip
  const itemUrl = item.fullItemUrl || `https://www.wowhead.com/ru/item=${item.itemId}`;
  
  // Параметры для Wowhead тултипа - извлекаем из fullItemUrl
  const wowheadData = itemUrl.replace('https://www.wowhead.com/ru/', '');
  
  return (
    <a href={itemUrl}
       className={`item-name ${small?'sm':''}`}
       style={{color: RARITY_COLORS[item.quality] || '#fff'}}
       data-wowhead={wowheadData}
       data-wh-rename-link="false">
      {item.itemName}
    </a>
  );
}
function Bar({value, color='#f89737', height=18, showLabel=true}){
  const pct = Math.max(0, Math.min(100, Math.round(value*100)));
  return (
    <div className="bar" style={{height}}>
      <div className="bar-fill" style={{width:pct+'%', background:color}}/>
      {showLabel && <span className="bar-label">{pct}%</span>}
    </div>
  );
}
function formatScore(n){
  if(!n) return '—';
  if(n >= 1_000_000) return (n/1_000_000).toFixed(2).replace(/\.?0+$/,'') + 'M';
  if(n >= 1000) return Math.round(n/1000) + 'K';
  return String(n);
}

window.UI = { ItemIcon, ItemName, Bar, formatScore, RARITY_COLORS };

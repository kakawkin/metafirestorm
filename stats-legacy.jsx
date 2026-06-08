// stats-legacy.jsx — устаревший / мёртвый код, сохранён для истории
// НЕ загружается в production. Можно удалить при чистке.

// ── Старая агрегация на фронтенде (заменена на /api/stats) ──────────

function aggregate(players){
  // ... 280 строк старой логики агрегации ...
  // Удалено: теперь всё считается на бэкенде в stats_simple.py
  return null;
}

// ── Старый полный компонент BestEmbellishments ───────────────────────
// (заменён на BestEmbellishmentsCompact в stats-components.jsx)

function BestEmbellishments({embellishmentPairs, playerCount, classColor}){
  // ... 190 строк старого компонента с дублированной логикой ...
  // Удалено: используется только BestEmbellishmentsCompact
  return null;
}

window.STATSLEGACY = { aggregate, BestEmbellishments };

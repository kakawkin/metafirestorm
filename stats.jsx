// stats.jsx — главный компонент блока статистики
// Все UI-компоненты вынесены в stats-components.jsx

function StatsBlock({stats, players, playersLoading, classColor}){
  if(!stats || stats.count === 0) {
    return <div className="stats-empty">Нет данных по выбранной комбинации.</div>;
  }

  const { PlayersList } = window.PLAYERS || {};
  
  return (
    <div className="stats-block">
      <SecondariesBlock avgStats={stats.avgStats}
                        statsSource={stats.statsSource}
                        builds={stats.builds}
                        segments={stats.segments}
                        classColor={classColor}/>
      
      {/* Два блока рядом: популярная экипировка + статистика */}
      <div className="gear-layout">
        <AllSlotsGrid allSlots={stats.allSlots} classColor={classColor}/>
        <GearStatsPanel 
          weapon={stats.weapon}
          offHand={stats.offHand}
          tierStats={stats.tierStats} 
          trinkets={stats.trinkets}
          embellishmentPairs={stats.embellishmentPairs}
          playerCount={stats.count}
          classColor={classColor}
        />
      </div>
      
      <BestEnchants enchants={stats.enchants} classColor={classColor}/>
      
      {/* Топ игроков */}
      {PlayersList && (
        <div style={{marginTop:24}}>
          <div style={{fontSize:20, fontWeight:700, marginBottom:12, color:'var(--ink)'}}>
            Топ игроков
          </div>
          {playersLoading ? (
            <div className="fs-loading">Загрузка списка игроков…</div>
          ) : (
            <PlayersList players={players || []} classColor={classColor}/>
          )}
        </div>
      )}
    </div>
  );
}

window.STATS = { StatsBlock };

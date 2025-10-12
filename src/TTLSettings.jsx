import { useState, useEffect } from 'react';

export default function TTLSettings({ apiService }) {
  const [ttl, setTtl] = useState(apiService?.optimisticJoinTTL || 30000);
  const [pruned, setPruned] = useState(apiService?.prunedJoinCount || 0);
  const minTTL = apiService?.minOptimisticTTL || 500;

  useEffect(() => {
    if (!apiService) return;
    const handleMetrics = m => setPruned(m.prunedJoinCount);
    const handleSettings = s => setTtl(s.optimisticJoinTTL);
    apiService.on('metricsUpdated', handleMetrics);
    apiService.on('settingsUpdated', handleSettings);
    return () => {
      apiService.off('metricsUpdated', handleMetrics);
      apiService.off('settingsUpdated', handleSettings);
    };
  }, [apiService]);

  const applyTtl = () => {
    const v = Number(ttl);
    if (!isNaN(v) && v >= 0) {
      apiService.setOptimisticJoinTTL(v);
    }
  };

  const resetMetrics = () => {
    // direct reset via increment negative diff
    const diff = -apiService.prunedJoinCount;
    if (diff !== 0) {
      apiService.incrementMetric('prunedJoinCount', diff); // will store & emit
    }
  };

  return (
    <div className="mb-4 p-3 rounded-md border border-indigo-100 bg-indigo-50 text-xs flex flex-col gap-2" data-testid="ttl-settings-panel">
      <div className="font-semibold text-indigo-700 flex items-center gap-2">
        <span>Impostazioni Richieste</span>
        <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded">TTL</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1">
          <span>TTL ms:</span>
          <input
            data-testid="ttl-input"
            type="number"
            className="w-28 px-2 py-1 border border-indigo-200 rounded bg-white"
            value={ttl}
            onChange={e => setTtl(e.target.value)}
          />
        </label>
  <span className="text-[10px] text-indigo-600">Min: {minTTL} | Attuale: {apiService?.optimisticJoinTTL}</span>
        <button
          data-testid="ttl-apply"
          onClick={applyTtl}
          className="text-[11px] bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 rounded"
        >Applica</button>
        <button
          data-testid="ttl-reset-metrics"
          onClick={resetMetrics}
          className="text-[11px] bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded"
        >Reset Metriche</button>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-indigo-600" data-testid="pruned-count">Pruned: {pruned}</span>
        </div>
      </div>
      <div className="text-[10px] text-indigo-600 leading-snug">
        Le richieste ottimistiche non confermate oltre il TTL vengono marcate come scadute e rimosse.
      </div>
    </div>
  );
}

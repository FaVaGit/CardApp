// Helper centralizzati per interagire con l'API client esposta nel browser durante i test Playwright
// Richiede che l'app venga avviata con la variabile VITE_E2E=1 così che il singleton sia esposto su window.__apiService
// Le funzioni qui astraggono dettagli di implementazione e rendono i test più dichiarativi.

/** Restituisce alcune metriche interne (TTL, numero richieste prune) */
export async function getJoinMetrics(page) {
  return page.evaluate(() => {
    const api = window.__apiService;
    if (!api) return null;
    return api.getMetrics ? api.getMetrics() : null;
  });
}

/** Forza la scadenza delle richieste ottimistiche simulando il passare del tempo */
export async function forceExpireOptimistic(page) {
  return page.evaluate(() => {
    if (window.__forceExpireOptimistic) {
      window.__forceExpireOptimistic();
      return true;
    }
    return false;
  });
}

/** Imposta un nuovo TTL (ms) per le richieste join ottimistiche */
export async function setOptimisticTTL(page, ms) {
  return page.evaluate((value) => {
    const api = window.__apiService;
    if (api && api.setOptimisticJoinTTL) {
      api.setOptimisticJoinTTL(value);
      return true;
    }
    return false;
  }, ms);
}

/** Richiede una carta sulla sessione corrente, ritorna l'oggetto carta se riuscito */
export async function drawCard(page) {
  return page.evaluate(async () => {
    const api = window.__apiService;
    if (!api || !api.sessionId) return null;
    try {
      const card = await api.drawCard(api.sessionId);
      return card || null;
    } catch {
      return null;
    }
  });
}

/** Attende che nel client venga emesso almeno un evento sessionUpdated di tipo cardDrawn */
export async function waitForCardDrawEvent(page, { timeoutMs = 8000 } = {}) {
  return page.evaluate(({ timeout }) => {
    const api = window.__apiService;
    if (!api) return Promise.resolve({ success: false, reason: 'api-missing' });
    return new Promise(resolve => {
      let timer = setTimeout(() => {
        cleanup();
        resolve({ success: false, reason: 'timeout' });
      }, timeout);

      function cleanup() {
        if (timer) clearTimeout(timer);
        api.off && api.off('sessionUpdated', handler);
      }

      function handler(evt) {
        if (evt && evt.type === 'cardDrawn') {
          cleanup();
          resolve({ success: true, event: evt });
        }
      }

      api.on && api.on('sessionUpdated', handler);
    });
  }, { timeout: timeoutMs });
}

/** Espone un piccolo snapshot di stato utile per asserzioni rapide nei test */
export async function getClientState(page) {
  return page.evaluate(() => {
    const api = window.__apiService;
    if (!api) return null;
    return {
      userId: api.userId,
      sessionId: api.sessionId,
      metrics: api.getMetrics ? api.getMetrics() : {},
      joinCache: api.joinRequestCache,
      lastKnownPartner: api.lastKnownPartner
    };
  });
}

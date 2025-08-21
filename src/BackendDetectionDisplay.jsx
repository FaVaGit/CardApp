import React from 'react';

const BackendDetectionDisplay = ({ detection, isVisible = true }) => {
  if (!isVisible || !detection) {
    return null;
  }

  const getIcon = () => {
    switch (detection.mode) {
      case 'simulatedBackend':
        return '🔧';
      case 'localStorage':
        return '💾';
      default:
        return '❓';
    }
  };

  const getTitle = () => {
    switch (detection.mode) {
      case 'simulatedBackend':
        return 'Backend Simulato';
      case 'localStorage':
        return 'LocalStorage';
      default:
        return 'Modalità Sconosciuta';
    }
  };

  const getStatusColor = () => {
    switch (detection.mode) {
      case 'simulatedBackend':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'localStorage':
        return 'bg-green-50 border-green-200 text-green-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className={`p-4 rounded-xl border-2 mb-4 ${getStatusColor()}`}>
      <div className="flex items-start space-x-3">
        <span className="text-2xl">{getIcon()}</span>
        <div className="flex-1">
          <h3 className="font-bold text-sm mb-2">
            🔍 Configurazione Auto-Rilevata: {getTitle()}
          </h3>
          
          {/* Motivi della selezione */}
          {detection.reasons && detection.reasons.length > 0 && (
            <div className="mb-3">
              <h4 className="font-medium text-xs mb-1">Perché questa configurazione:</h4>
              <ul className="text-xs space-y-1">
                {detection.reasons.map((reason, i) => (
                  <li key={i}>• {reason}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Capabilities */}
          {detection.capabilities && (
            <div className="mb-3">
              <h4 className="font-medium text-xs mb-1">Capacità rilevate:</h4>
              <div className="text-xs grid grid-cols-2 gap-1">
                <div>Incognito: {detection.capabilities.isIncognito ? '✅' : '❌'}</div>
                <div>BroadcastChannel: {detection.capabilities.supportsBroadcastChannel ? '✅' : '❌'}</div>
                <div>Demo Mode: {detection.capabilities.isDemo ? '✅' : '❌'}</div>
                <div>Profilo: {detection.capabilities.hasProfile ? '✅' : '❌'}</div>
              </div>
            </div>
          )}
          
          {/* Limitazioni */}
          {detection.limitations && detection.limitations.length > 0 && (
            <div>
              <h4 className="font-medium text-xs mb-1">Limitazioni:</h4>
              <ul className="text-xs space-y-1">
                {detection.limitations.map((limitation, i) => (
                  <li key={i}>• {limitation}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      
      {/* Override manual */}
      <div className="mt-3 pt-3 border-t border-current border-opacity-20">
        <p className="text-xs opacity-75">
          💡 Per forzare una modalità specifica, aggiungi <code>?backend=localStorage</code> o <code>?backend=simulatedBackend</code> all'URL
        </p>
      </div>
    </div>
  );
};

export default BackendDetectionDisplay;

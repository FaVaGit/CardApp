import React, { useState, useRef, useEffect } from 'react';

/**
 * Chat collaborativa per sessioni condivise
 * Gestisce messaggi in tempo reale tra i partecipanti
 */
export function CollaborativeChat({ 
  messages, 
  participants, 
  currentUser, 
  onSendMessage, 
  isActive = true 
}) {
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll ai nuovi messaggi
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus sull'input quando la chat diventa attiva
  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive]);

  // Invia messaggio
  const handleSendMessage = () => {
    const content = newMessage.trim();
    if (!content || !isActive) return;

    onSendMessage(content);
    setNewMessage('');
    setIsTyping(false);
  };

  // Gestione tasti
  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  // Gestione digitazione
  const handleInputChange = (event) => {
    setNewMessage(event.target.value);
    setIsTyping(event.target.value.length > 0);
  };

  // Formatta timestamp
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('it-IT', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Determina se il messaggio è del utente corrente
  const isOwnMessage = (message) => {
    return message.senderId === currentUser?.id;
  };

  // Messaggi di sistema predefiniti
  const systemMessages = {
    userJoined: (userName) => `🟢 ${userName} si è unito alla sessione`,
    userLeft: (userName) => `🔴 ${userName} ha lasciato la sessione`,
    sessionStarted: '🎮 Sessione condivisa iniziata!',
    canvasUpdated: (userName) => `🎨 ${userName} ha aggiornato il canvas`
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col h-96">
      {/* Header */}
      <div className="p-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">💬</span>
            <h3 className="font-semibold text-gray-800">Chat Condivisa</h3>
          </div>
          <div className="flex items-center gap-2">
            {participants.map((participant, index) => (
              <div
                key={participant.id}
                className="flex items-center gap-1 text-sm"
                title={participant.name}
              >
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600 max-w-20 truncate">
                  {participant.id === currentUser?.id ? 'Tu' : participant.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Messaggi */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">💭</div>
            <p>Inizia la conversazione sulla carta!</p>
            <p className="text-sm mt-1">I messaggi appariranno qui</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={message.id || index}
              className={`flex ${isOwnMessage(message) ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                  message.type === 'system'
                    ? 'bg-blue-50 text-blue-700 text-center text-sm mx-auto'
                    : isOwnMessage(message)
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {message.type !== 'system' && !isOwnMessage(message) && (
                  <div className="text-xs font-medium text-gray-500 mb-1">
                    {message.senderName}
                  </div>
                )}
                <div className="whitespace-pre-wrap break-words">
                  {message.content}
                </div>
                <div className={`text-xs mt-1 ${
                  message.type === 'system'
                    ? 'text-blue-500'
                    : isOwnMessage(message)
                    ? 'text-purple-200'
                    : 'text-gray-500'
                }`}>
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input messaggio */}
      <div className="p-3 border-t border-gray-200">
        {!isActive ? (
          <div className="text-center text-gray-500 py-2">
            <span>Chat non disponibile</span>
          </div>
        ) : (
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={newMessage}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Scrivi un messaggio..."
                disabled={!isActive}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows="1"
                style={{ minHeight: '40px', maxHeight: '100px' }}
              />
              {isTyping && (
                <div className="absolute -top-6 left-2 text-xs text-gray-500">
                  Sta scrivendo...
                </div>
              )}
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || !isActive}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-lg">📤</span>
            </button>
          </div>
        )}
      </div>

      {/* Indicatori di stato */}
      {participants.length > 1 && (
        <div className="px-3 py-1 bg-green-50 border-t border-green-200">
          <div className="flex items-center justify-center gap-1 text-xs text-green-700">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Sessione attiva con {participants.length} partecipanti</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Database delle carte specifiche per famiglie
export const familyCards = [
  // ATTIVITÀ FAMILIARI (1-20)
  { id: 1, title: 'Tradizioni di famiglia', emoji: '👨‍👩‍👧‍👦', color: 'from-amber-400 to-orange-300', category: 'tradizioni', prompts: [
    'Quale tradizione della vostra famiglia vorreste tramandare ai vostri figli?',
    'Inventiamo una nuova tradizione familiare da iniziare questo mese!'
  ]},
  { id: 2, title: 'Ricordi d\'infanzia', emoji: '🧸', color: 'from-pink-400 to-rose-300', category: 'ricordi', prompts: [
    'Raccontate ai bambini il vostro ricordo più divertente da piccoli',
    'Che gioco facevate sempre con i vostri genitori? Riproviamolo!'
  ]},
  { id: 3, title: 'Cucina insieme', emoji: '👩‍🍳', color: 'from-green-400 to-emerald-300', category: 'cucina', prompts: [
    'Scegliamo una ricetta che possono aiutare a preparare tutti',
    'Ogni membro della famiglia inventa un ingrediente "magico" per la cena'
  ]},
  { id: 4, title: 'Avventure domestiche', emoji: '🏠', color: 'from-blue-400 to-cyan-300', category: 'casa', prompts: [
    'Costruiamo un forte con cuscini e coperte in salotto',
    'Ogni stanza diventa un "paese" diverso: quale visitiamo prima?'
  ]},
  { id: 5, title: 'Natura e scoperte', emoji: '🌳', color: 'from-green-500 to-teal-400', category: 'natura', prompts: [
    'Uscita al parco: ognuno cerca un tesoro naturale da portare a casa',
    'Piantiamo insieme qualcosa e ne seguiamo la crescita'
  ]},
  
  // EDUCAZIONE E CRESCITA (21-40)
  { id: 21, title: 'Sogni e aspirazioni', emoji: '⭐', color: 'from-yellow-400 to-amber-300', category: 'sogni', prompts: [
    'Cosa vorresti fare da grande? (vale anche per i genitori!)',
    'Se potessimo avere un superpotere familiare, quale sceglieremmo?'
  ]},
  { id: 22, title: 'Valori familiari', emoji: '💎', color: 'from-purple-400 to-indigo-300', category: 'valori', prompts: [
    'Qual è la cosa più importante che vi insegniamo/avete imparato?',
    'Come mostriamo l\'amore nella nostra famiglia?'
  ]},
  { id: 23, title: 'Sfide e obiettivi', emoji: '🎯', color: 'from-red-400 to-pink-300', category: 'obiettivi', prompts: [
    'Quale sfida possiamo affrontare insieme come famiglia questo mese?',
    'Ognuno sceglie un piccolo obiettivo e ci aiutiamo a raggiungerlo'
  ]},
  { id: 24, title: 'Creatività condivisa', emoji: '🎨', color: 'from-violet-400 to-purple-300', category: 'creativita', prompts: [
    'Creiamo insieme un\'opera d\'arte usando materiali di casa',
    'Inventiamo una storia dove ognuno aggiunge un pezzo'
  ]},
  { id: 25, title: 'Tempo di qualità', emoji: '⏰', color: 'from-orange-400 to-red-300', category: 'tempo', prompts: [
    'Dedichiamo 30 minuti solo a giocare insieme, senza telefoni',
    'Ognuno sceglie un\'attività speciale da fare con un altro membro'
  ]},

  // GIOCHI E DIVERTIMENTO (41-60)
  { id: 41, title: 'Sfide divertenti', emoji: '🏃‍♂️', color: 'from-lime-400 to-green-300', category: 'sfide', prompts: [
    'Gara di barzellette: chi fa ridere di più tutti?',
    'Sfida di talenti: ognuno mostra qualcosa che sa fare bene'
  ]},
  { id: 42, title: 'Caccia al tesoro', emoji: '🗺️', color: 'from-teal-400 to-blue-300', category: 'giochi', prompts: [
    'Nascondiamo indizi per casa per una caccia al tesoro familiare',
    'Ogni membro nasconde un piccolo regalo per gli altri'
  ]},
  { id: 43, title: 'Teatro domestico', emoji: '🎭', color: 'from-pink-500 to-rose-400', category: 'teatro', prompts: [
    'Mettiamo in scena una fiaba dove ognuno ha un ruolo',
    'Imitiamo i nostri animali preferiti e indoviniamo chi è chi'
  ]},
  { id: 44, title: 'Musica insieme', emoji: '🎵', color: 'from-indigo-400 to-purple-300', category: 'musica', prompts: [
    'Creiamo una band familiare con strumenti improvvisati',
    'Ognuno sceglie una canzone che rappresenta la famiglia'
  ]},
  { id: 45, title: 'Viaggi immaginari', emoji: '✈️', color: 'from-cyan-400 to-blue-300', category: 'viaggi', prompts: [
    'Dove andremmo in vacanza tutti insieme se potessimo?',
    'Trasformiamo la casa in un paese straniero per una giornata'
  ]},

  // COMUNICAZIONE E CONNESSIONE (61-80)
  { id: 61, title: 'Gratitudine familiare', emoji: '🙏', color: 'from-amber-500 to-yellow-400', category: 'gratitudine', prompts: [
    'Ognuno dice una cosa per cui è grato di ogni membro della famiglia',
    'Scriviamo insieme una lettera di ringraziamento alla famiglia'
  ]},
  { id: 62, title: 'Ascolto attivo', emoji: '👂', color: 'from-green-500 to-emerald-400', category: 'ascolto', prompts: [
    'Ognuno racconta la cosa più bella della sua giornata',
    'Come possiamo aiutarci di più l\'uno con l\'altro?'
  ]},
  { id: 63, title: 'Emozioni e sentimenti', emoji: '💕', color: 'from-rose-400 to-pink-300', category: 'emozioni', prompts: [
    'Come esprimiamo quando siamo felici, tristi o arrabbiati?',
    'Creiamo gesti speciali per dirci "ti voglio bene"'
  ]},
  { id: 64, title: 'Risoluzione problemi', emoji: '🤝', color: 'from-blue-500 to-cyan-400', category: 'problemi', prompts: [
    'C\'è qualcosa che possiamo migliorare come famiglia?',
    'Inventiamo un modo divertente per risolvere i piccoli litigi'
  ]},
  { id: 65, title: 'Progetti insieme', emoji: '🛠️', color: 'from-gray-500 to-slate-400', category: 'progetti', prompts: [
    'Quale progetto di casa possiamo fare tutti insieme?',
    'Pianifichiamo qualcosa di speciale per il prossimo weekend'
  ]},

  // FESTIVITA' E CELEBRAZIONI (81-100)
  { id: 81, title: 'Feste creative', emoji: '🎉', color: 'from-rainbow-400 to-rainbow-300', category: 'feste', prompts: [
    'Inventiamo una festa familiare per celebrare qualcosa di speciale',
    'Quale compleanno ricordate di più e perché?'
  ]},
  { id: 82, title: 'Stagioni insieme', emoji: '🍂', color: 'from-orange-500 to-amber-400', category: 'stagioni', prompts: [
    'Cosa amiamo di più di questa stagione come famiglia?',
    'Attività speciale da fare solo in questo periodo dell\'anno'
  ]},
  { id: 83, title: 'Ricorrenze speciali', emoji: '📅', color: 'from-purple-500 to-violet-400', category: 'ricorrenze', prompts: [
    'Creiamo una nuova ricorrenza familiare da celebrare ogni anno',
    'Cosa renderebbe speciale questo giorno?'
  ]},
  { id: 84, title: 'Memorie fotografiche', emoji: '📸', color: 'from-teal-500 to-cyan-400', category: 'foto', prompts: [
    'Guardiamo le foto più divertenti che abbiamo fatto insieme',
    'Facciamo una foto creativa tutti insieme adesso!'
  ]},
  { id: 85, title: 'Futuro familiare', emoji: '🔮', color: 'from-indigo-500 to-blue-400', category: 'futuro', prompts: [
    'Come immaginiamo la nostra famiglia tra 5 anni?',
    'Cosa vogliamo ricordare di questo momento quando saremo più grandi?'
  ]}
];

// Carte jolly per famiglie (situazioni immediate)
export const familyJollyCards = [
  { id: 101, title: 'Abbraccio di gruppo', emoji: '🤗', color: 'from-pink-400 to-rose-300', category: 'jolly', prompts: [
    'Tutti insieme per il più grande abbraccio familiare!',
    'Contiamo fino a 10 mentre ci abbracciamo forte'
  ]},
  { id: 102, title: 'Risata contagiosa', emoji: '😂', color: 'from-yellow-400 to-orange-300', category: 'jolly', prompts: [
    'Chi riesce a far ridere tutti in 30 secondi?',
    'Gara di facce buffe: il più ridicolo vince!'
  ]},
  { id: 103, title: 'Freeze dance', emoji: '💃', color: 'from-purple-400 to-pink-300', category: 'jolly', prompts: [
    'Musica e ballo, quando si ferma la musica: statue!',
    'Ogni membro della famiglia inventa un passo di danza'
  ]},
  { id: 104, title: 'Complimenti volanti', emoji: '⭐', color: 'from-blue-400 to-cyan-300', category: 'jolly', prompts: [
    'Ognuno dice un complimento sincero a chi sta alla sua destra',
    'Cosa ammiri di più di ogni membro della famiglia?'
  ]},
  { id: 105, title: 'Momento zen', emoji: '🧘‍♀️', color: 'from-green-400 to-teal-300', category: 'jolly', prompts: [
    'Tutti insieme: 5 respiri profondi e pensiamo a cosa ci rende felici',
    'Momento silenzio: ognuno pensa a un ricordo bello di oggi'
  ]}
];

// Unisci tutte le carte familiari
export const allFamilyCards = [...familyCards, ...familyJollyCards];

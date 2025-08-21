// Database espanso delle carte per il recupero della complicità di coppia
export const expandedCards = [
  // VIAGGI E AVVENTURE (1-15)
  { id: 1, title: 'Viaggi da sogno', emoji: '✈️', color: 'from-blue-400 to-cyan-300', category: 'viaggi', prompts: [
    'Se potessimo teletrasportarci stanotte, dove finiremmo? E cosa mangeremmo per colazione lì?',
    'Scegli tre emoji per descrivere il tuo viaggio ideale e indovina le mie.'
  ]},
  { id: 2, title: 'Weekend improvvisati', emoji: '🗺️', color: 'from-teal-400 to-blue-300', category: 'viaggi', prompts: [
    'Chiudi gli occhi e punta il dito su una mappa: dove finiamo questo weekend?',
    'Programmiamo una gita di 24 ore con solo 100€ in tasca. Cosa facciamo?'
  ]},
  { id: 3, title: 'Viaggi low-cost', emoji: '🎒', color: 'from-green-400 to-teal-300', category: 'viaggi', prompts: [
    'Trova destinazione a meno di 50€ A/R e progettiamo il weekend.',
    'Gara di creatività: vacanza da sogno con il budget di una pizza!'
  ]},
  { id: 4, title: 'Road trip fantastico', emoji: '🚗', color: 'from-orange-400 to-yellow-300', category: 'viaggi', prompts: [
    'Playlist perfetta per 8 ore in macchina? Aggiungiamo anche i nostri duetti!',
    'Scegli una tappa a caso su Maps: ci fermiamo lì per pranzo!'
  ]},
  { id: 5, title: 'Isole deserte', emoji: '🏝️', color: 'from-cyan-400 to-blue-300', category: 'viaggi', prompts: [
    'Naufraghi romantici: quali 3 oggetti porteresti e quale sarebbe il nostro primo rifugio?',
    'Chi fa cosa? Assegniamo ruoli: cucina, pesca, raccolta, divertimento!'
  ]},

  // SVAGO E DIVERTIMENTO (6-20)
  { id: 6, title: 'Cinema & Serie', emoji: '🎬', color: 'from-purple-400 to-pink-300', category: 'svago', prompts: [
    'Se fossimo protagonisti di una serie TV, che genere sarebbe e come si chiamerebbe?',
    'Maratona improvvisata: scegli tu il primo film, io il secondo. Indovina i miei gusti!'
  ]},
  { id: 7, title: 'Videogame & retro', emoji: '🎮', color: 'from-lime-400 to-green-300', category: 'svago', prompts: [
    'Inventiamo un videogame sulla nostra storia: trama, poteri speciali e boss finale!',
    'Sfida nostalgica: qual era il nostro gioco preferito da bambini? Ricordi qualche trucco?'
  ]},
  { id: 8, title: 'Musical improvvisato', emoji: '🎼', color: 'from-rose-400 to-pink-300', category: 'svago', prompts: [
    'Componiamo una canzone su di noi: tu il testo, io la melodia (o viceversa)!',
    'Karaoke casalingo: canta la canzone più imbarazzante che conosci!'
  ]},
  { id: 9, title: 'Giochi di società', emoji: '🎲', color: 'from-indigo-400 to-purple-300', category: 'svago', prompts: [
    'Inventiamo un gioco da tavolo con le nostre regole pazze!',
    'Sfida di memoria: chi ricorda più dettagli del nostro primo appuntamento?'
  ]},
  { id: 10, title: 'Arte e creatività', emoji: '🎨', color: 'from-pink-400 to-purple-300', category: 'svago', prompts: [
    'Ritratti reciproci senza guardare il foglio: chi fa il disegno più divertente?',
    'Scultura con quello che troviamo in casa: tema "il nostro amore"!'
  ]},

  // FAMIGLIA E RADICI (21-35)
  { id: 21, title: 'Tradizioni familiari', emoji: '👨‍👩‍👧‍👦', color: 'from-amber-400 to-orange-300', category: 'famiglia', prompts: [
    'Quale tradizione della tua famiglia vorresti portare nella nostra relazione?',
    'Inventiamo una tradizione tutta nostra: cosa faremo ogni anno?'
  ]},
  { id: 22, title: 'Ricordi d\'infanzia', emoji: '🧸', color: 'from-yellow-400 to-amber-300', category: 'famiglia', prompts: [
    'Racconta il Natale più bello o più disastroso della tua infanzia!',
    'Se potessi dire una cosa al te bambino, cosa gli diresti?'
  ]},
  { id: 23, title: 'Nonni e bisnonni', emoji: '👴', color: 'from-purple-400 to-indigo-300', category: 'famiglia', prompts: [
    'Qual è la storia più bella che ti hanno raccontato i tuoi nonni?',
    'Se i nostri nonni si fossero conosciuti, secondo te sarebbero andati d\'accordo?'
  ]},
  { id: 24, title: 'Fratelli e sorelle', emoji: '👫', color: 'from-green-400 to-cyan-300', category: 'famiglia', prompts: [
    'Qual è la marachella più grossa che hai fatto con tuo fratello/sorella?',
    'Se avessimo cresciuto insieme, secondo te saremmo stati amici o rivali?'
  ]},
  { id: 25, title: 'Casa famiglia', emoji: '🏡', color: 'from-red-400 to-pink-300', category: 'famiglia', prompts: [
    'Descrivi l\'angolo più accogliente della casa dove sei cresciuto.',
    'Se costruissimo la casa dei nostri sogni, quale stanza progetteresti tu?'
  ]},

  // GOSSIP E PETTEGOLEZZI LEGGERI (36-50)
  { id: 36, title: 'Gossip a ruota libera', emoji: '🗣️', color: 'from-pink-400 to-rose-300', category: 'gossip', prompts: [
    'Qual è il pettegolezzo più esilarante che hai sentito ultimamente? (nomi di fantasia!)',
    'Inventiamo un gossip totalmente falso sulla coppia più famosa del momento!'
  ]},
  { id: 37, title: 'Celebrity crush', emoji: '🌟', color: 'from-purple-500 to-pink-400', category: 'gossip', prompts: [
    'Confessioni imbarazzanti: chi era la tua cotta famosa da teenager?',
    'Se dovessi presentarmi a una celebrità, cosa diresti di me?'
  ]},
  { id: 38, title: 'Amici in comune', emoji: '👥', color: 'from-blue-400 to-purple-300', category: 'gossip', prompts: [
    'Quale coppia di amici secondo te durerà di più? E quale meno?',
    'Inventa una storia romantica divertente per due nostri amici single!'
  ]},
  { id: 39, title: 'Social media', emoji: '📱', color: 'from-cyan-400 to-teal-300', category: 'gossip', prompts: [
    'Qual è il post più cringe che hai mai visto? Ricrealo a parole!',
    'Se fossi influencer per un giorno, quale sarebbe il tuo contenuto virale?'
  ]},
  { id: 40, title: 'Pettegolezzi vintage', emoji: '📰', color: 'from-amber-400 to-yellow-300', category: 'gossip', prompts: [
    'Racconta un pettegolezzo della tua scuola che ancora ti fa ridere!',
    'Se fossimo in un film anni \'50, quale scandalo faremmo scoppiare?'
  ]},

  // CIBO E GUSTI (51-65)
  { id: 51, title: 'Cucina afrodisiaca', emoji: '🍷', color: 'from-red-400 to-orange-300', category: 'cibo', prompts: [
    'Menu romantico improvvisato: cosa cuciniamo con quello che c\'è in frigo?',
    'Indovina il mio ingrediente afrodisiaco segreto... hai 3 tentativi!'
  ]},
  { id: 52, title: 'Street food mondiale', emoji: '🌮', color: 'from-yellow-400 to-red-300', category: 'cibo', prompts: [
    'Giro del mondo gastronomico: quale street food proveremo in ogni continente?',
    'Sfida: inventa un panino fusion con i sapori dei nostri paesi del cuore!'
  ]},
  { id: 53, title: 'Dolci tentazioni', emoji: '🍰', color: 'from-pink-400 to-purple-300', category: 'cibo', prompts: [
    'Progetta il dessert più romantico e peccaminoso del mondo!',
    'Confessioni dolci: qual è il dolce che ti fa perdere ogni controllo?'
  ]},
  { id: 54, title: 'Bevande & brindisi', emoji: '🥂', color: 'from-amber-400 to-orange-300', category: 'cibo', prompts: [
    'Inventiamo un cocktail che rappresenti la nostra storia d\'amore!',
    'Serata degustazione: vino, birra o qualcosa di completamente diverso?'
  ]},
  { id: 55, title: 'Ricette della nonna', emoji: '👵', color: 'from-green-400 to-yellow-300', category: 'cibo', prompts: [
    'Qual è la ricetta segreta che vorresti rubare alla tua famiglia?',
    'Cuciniamo insieme il piatto più confortevole della tua infanzia!'
  ]},

  // OBIETTIVI E CRESCITA (66-80)
  { id: 66, title: 'Sogni a 5 anni', emoji: '🌟', color: 'from-violet-400 to-purple-300', category: 'obiettivi', prompts: [
    'Se tra 5 anni potessimo fare qualsiasi cosa, senza limiti di soldi o tempo?',
    'Progettiamo il nostro piano quinquennale: un obiettivo per ogni anno!'
  ]},
  { id: 67, title: 'Bucket list di coppia', emoji: '📝', color: 'from-blue-400 to-cyan-300', category: 'obiettivi', prompts: [
    '10 esperienze da fare assolutamente insieme prima dei 40 (o 50, o 60...)!',
    'Scegli la prima della lista: quando e come la realizziamo?'
  ]},
  { id: 68, title: 'Crescita personale', emoji: '📈', color: 'from-green-400 to-teal-300', category: 'obiettivi', prompts: [
    'Quale abilità vorresti che imparassi? E quale vorresti imparare tu?',
    'Sfida del mese: un\'abitudine sana da provare insieme!'
  ]},
  { id: 69, title: 'Progetti pazzi', emoji: '🚀', color: 'from-orange-400 to-red-300', category: 'obiettivi', prompts: [
    'Se vincessimo alla lotteria domani, qual è la prima follia che faresti?',
    'Inventiamo un business folle insieme: di cosa si occuperà la nostra startup?'
  ]},
  { id: 70, title: 'Eredità emotiva', emoji: '💝', color: 'from-purple-400 to-pink-300', category: 'obiettivi', prompts: [
    'Cosa vorresti che la gente ricordasse di noi come coppia?',
    'Se dovessimo lasciare un messaggio alle future generazioni, cosa scriveremmo?'
  ]},

  // NATURA E AVVENTURE (81-95)
  { id: 81, title: 'Avventure estreme', emoji: '🏔️', color: 'from-gray-400 to-blue-300', category: 'natura', prompts: [
    'Bungee jumping, paracadutismo o immersioni con gli squali? Scegli la nostra prossima adrenalina!',
    'Se dovessimo sopravvivere una settimana in natura, chi farebbe cosa?'
  ]},
  { id: 82, title: 'Animali fantastici', emoji: '🦋', color: 'from-green-400 to-cyan-300', category: 'natura', prompts: [
    'Se fossi un animale selvatico, quale saresti e dove vivresti?',
    'Safari casalingo: descrivi il paesaggio più bello che hai mai visto!'
  ]},
  { id: 83, title: 'Quattro stagioni', emoji: '🌺', color: 'from-pink-400 to-yellow-300', category: 'natura', prompts: [
    'Quale stagione rappresenta meglio il nostro amore e perché?',
    'Programma perfetto per ogni stagione: cosa faremo in primavera, estate, autunno e inverno?'
  ]},
  { id: 84, title: 'Stelle e universo', emoji: '🌌', color: 'from-indigo-500 to-purple-400', category: 'natura', prompts: [
    'Se potessimo battezzare una stella, che nome le daresti?',
    'Notte sotto le stelle: dove andiamo e cosa ci portiamo?'
  ]},
  { id: 85, title: 'Giardino segreto', emoji: '🌸', color: 'from-green-500 to-pink-400', category: 'natura', prompts: [
    'Progettiamo il nostro giardino segreto: fiori, alberi e un angolo speciale!',
    'Se potessimo piantare un albero insieme, dove lo faremo e che specie sceglieremmo?'
  ]},

  // CULTURA E INTELLETTO (96-110)
  { id: 96, title: 'Libri & storie', emoji: '📚', color: 'from-indigo-400 to-blue-300', category: 'cultura', prompts: [
    'Se dovessi scrivere un libro sulla nostra storia, quale sarebbe il titolo?',
    'Club del libro di coppia: scegli il primo libro da leggere insieme!'
  ]},
  { id: 97, title: 'Arte e musei', emoji: '🖼️', color: 'from-purple-400 to-pink-300', category: 'cultura', prompts: [
    'Se fossimo mecenati, quale artista moderno sosterremmo?',
    'Giornata culturale perfetta: museo, mostra o teatro? Pianifichiamo!'
  ]},
  { id: 98, title: 'Lingue del mondo', emoji: '🗨️', color: 'from-cyan-400 to-blue-300', category: 'cultura', prompts: [
    'Quale lingua vorresti che imparassimo insieme e perché?',
    'Inventiamo frasi romantiche in tutte le lingue che conosciamo!'
  ]},
  { id: 99, title: 'Storia antica', emoji: '🏛️', color: 'from-amber-400 to-orange-300', category: 'cultura', prompts: [
    'In quale epoca storica ti sarebbe piaciuto vivere con me?',
    'Se fossimo personaggi storici, chi saremmo e che storia scriveremmo?'
  ]},
  { id: 100, title: 'Filosofia spicciola', emoji: '🤔', color: 'from-gray-500 to-purple-400', category: 'cultura', prompts: [
    'Qual è la domanda esistenziale che ti tormenta di più?',
    'Se dovessimo fondare una nuova corrente filosofica, come la chiameresti?'
  ]},

  // INTIMITÀ E CONNESSIONE (111-120)
  { id: 111, title: 'Linguaggi d\'amore', emoji: '💕', color: 'from-rose-400 to-pink-300', category: 'intimita', prompts: [
    'Quali sono i 5 gesti che ti fanno sentire più amato/a?',
    'Inventiamo un codice segreto per dirci "ti amo" in pubblico!'
  ]},
  { id: 112, title: 'Piccante & pepe', emoji: '🌶️', color: 'from-red-500 to-orange-400', category: 'intimita', prompts: [
    'Qual è il complimento più audace che ti abbiano mai fatto?',
    'Confessioni: qual è il tuo guilty pleasure più segreto?'
  ]},
  { id: 113, title: 'Massaggi e coccole', emoji: '🤗', color: 'from-purple-400 to-pink-300', category: 'intimita', prompts: [
    'Lezione di massaggi reciproci: chi insegna a chi?',
    'Inventiamo il rituale di coccole perfetto per le serate difficili!'
  ]},
  { id: 114, title: 'Regali simbolici', emoji: '🎁', color: 'from-green-400 to-blue-300', category: 'intimita', prompts: [
    'Se potessi regalarmi un\'emozione, quale sceglieresti?',
    'Crea un regalo fatto in casa che rappresenti il nostro primo bacio!'
  ]},
  { id: 115, title: 'Lettere d\'amore', emoji: '💌', color: 'from-red-400 to-rose-300', category: 'intimita', prompts: [
    'Scriviamo una lettera da aprire nel nostro decimo anniversario!',
    'Se dovessi descrivermi in una sola parola romantica, quale sceglieresti?'
  ]},

  // BONUS: CARTE SPECIALI E DIVERTENTI (116-150)
  { id: 116, title: 'Macchina del tempo', emoji: '⏰', color: 'from-blue-500 to-purple-400', category: 'speciali', prompts: [
    'Se potessi portarmi in qualsiasi momento del passato, quando sceglieresti?',
    'Viaggio nel futuro: andiamo a sbirciare come saremo tra 20 anni!'
  ]},
  { id: 117, title: 'Superpoteri', emoji: '🦸', color: 'from-orange-500 to-red-400', category: 'speciali', prompts: [
    'Se avessimo ognuno un superpotere, quali sarebbero e come li useremmo insieme?',
    'Supereroe di coppia: come ci chiameremmo e chi sarebbero i nostri nemici?'
  ]},
  { id: 118, title: 'Geni della lampada', emoji: '🧞', color: 'from-purple-500 to-pink-400', category: 'speciali', prompts: [
    'Tre desideri per coppia: uno per te, uno per me, uno per noi due!',
    'Se fossi un genio, quali tre desideri vorresti che la gente esprimesse di più?'
  ]},
  { id: 119, title: 'Alien e UFO', emoji: '👽', color: 'from-green-500 to-cyan-400', category: 'speciali', prompts: [
    'Primo contatto con gli alieni: cosa gli raccontiamo dell\'amore umano?',
    'Se dovessimo colonizzare un nuovo pianeta, che regole d\'amore stabiliremmo?'
  ]},
  { id: 120, title: 'Reality show', emoji: '📺', color: 'from-yellow-500 to-orange-400', category: 'speciali', prompts: [
    'Inventiamo il reality show più romantico del mondo: format e prove!',
    'Se fossimo concorrenti in un reality, quale sarebbe la nostra strategia vincente?'
  ]},

  // CARTE JOLLY PER MOMENTI SPECIALI (121-150)
  { id: 121, title: 'Complicità flash', emoji: '⚡', color: 'from-yellow-400 to-red-300', category: 'jolly', prompts: [
    'Prossimi 10 minuti: solo battute a effetto, chi ride per primo ha un premio!',
    'Improvvisazione totale: fate una scenetta romantica senza parole!'
  ]},
  { id: 122, title: 'Cambio di ruoli', emoji: '🔄', color: 'from-cyan-400 to-purple-300', category: 'jolly', prompts: [
    'Per i prossimi 15 minuti imitiamo la personalità dell\'altro!',
    'Oggi tu sei me e io sono te: come gestiremmo la giornata?'
  ]},
  { id: 123, title: 'Caccia al tesoro', emoji: '🗺️', color: 'from-brown-400 to-yellow-300', category: 'jolly', prompts: [
    'Nascondi un bigliettino romantico da qualche parte, dammi degli indizi!',
    'Organizza una mini-caccia al tesoro con 5 tappe nella casa!'
  ]},
  { id: 124, title: 'Sfida creativa', emoji: '🎪', color: 'from-purple-400 to-cyan-300', category: 'jolly', prompts: [
    'Con 3 oggetti casuali della casa, inventa una storia d\'amore!',
    'Gara di creatività: chi crea l\'opera d\'arte più romantica in 5 minuti?'
  ]},
  { id: 125, title: 'Telefono senza fili', emoji: '📞', color: 'from-green-400 to-blue-300', category: 'jolly', prompts: [
    'Sussurra una frase romantica all\'orecchio, poi falla ripetere modificata!',
    'Gioco del disegno: uno disegna, l\'altro indovina cosa rappresenta!'
  ]},
  { id: 126, title: 'Premio speciale', emoji: '🏆', color: 'from-gold-400 to-yellow-300', category: 'jolly', prompts: [
    'Inventate un premio assurdo da darvi a vicenda per qualcosa che avete fatto oggi!',
    'Cerimonia di premiazione casalinga: chi vince il premio "partner più dolce"?'
  ]},
  { id: 127, title: 'Momento zen', emoji: '🧘', color: 'from-green-400 to-cyan-300', category: 'jolly', prompts: [
    'Respirazione sincronizzata per 2 minuti guardandovi negli occhi!',
    'Momento mindfulness: descrivete cosa provate qui e ora insieme!'
  ]},
  { id: 128, title: 'Balletto improvvisato', emoji: '💃', color: 'from-pink-500 to-purple-400', category: 'jolly', prompts: [
    'Slow dance sul primo brano che parte in shuffle!',
    'Inventate una coreografia di 30 secondi sulla vostra canzone!'
  ]},
  { id: 129, title: 'Intervista esclusiva', emoji: '🎤', color: 'from-red-400 to-pink-300', category: 'jolly', prompts: [
    'Intervista da VIP: "Come avete fatto a innamorarvi così tanto?"',
    'Tu sei il giornalista, io la star: fammi le domande più assurde!'
  ]},
  { id: 130, title: 'Capsula del tempo', emoji: '📦', color: 'from-purple-500 to-blue-400', category: 'jolly', prompts: [
    'Cosa metteremo nella nostra capsula del tempo da riaprire tra 5 anni?',
    'Registra un messaggio vocale per voi del futuro!'
  ]},

  // CARTE STAGIONALI E FESTIVITA' (131-150)
  { id: 131, title: 'Natale tutto l\'anno', emoji: '🎄', color: 'from-red-500 to-green-400', category: 'festivita', prompts: [
    'Se fosse Natale oggi, quale sarebbe il regalo più creativo che ci faremmo?',
    'Inventiamo una tradizione natalizia solo nostra, anche se siamo a luglio!'
  ]},
  { id: 132, title: 'San Valentino alternativo', emoji: '💘', color: 'from-pink-500 to-red-400', category: 'festivita', prompts: [
    'Festa dell\'amore non convenzionale: niente rose rosse, cosa facciamo?',
    'Se San Valentino fosse ogni mese, come lo celebreremmo ogni volta?'
  ]},
  { id: 133, title: 'Halloween di coppia', emoji: '🎃', color: 'from-orange-500 to-purple-400', category: 'festivita', prompts: [
    'Costume di Halloween di coppia più originale di sempre: di cosa ci vestiamo?',
    'Horror romantico: inventa una storia di fantasmi innamorati!'
  ]},
  { id: 134, title: 'Capodanno personale', emoji: '🎊', color: 'from-gold-400 to-purple-400', category: 'festivita', prompts: [
    'Festeggiamo il nostro "capodanno della relazione": buoni propositi di coppia!',
    'Se potessimo scegliere quando inizia il nostro anno, quale data sceglieremmo?'
  ]},
  { id: 135, title: 'Estate infinita', emoji: '☀️', color: 'from-yellow-500 to-orange-400', category: 'festivita', prompts: [
    'Se l\'estate durasse tutto l\'anno, come cambierebbe la nostra routine?',
    'Giornata estiva perfetta: dalla colazione al tramonto, cosa facciamo?'
  ]},
  { id: 136, title: 'Autunno dorato', emoji: '🍂', color: 'from-orange-400 to-brown-400', category: 'festivita', prompts: [
    'Passeggiata autunnale romantica: dove andiamo e cosa ci portiamo?',
    'Se dovessimo collezionare qualcosa insieme in autunno, cosa sceglieremmo?'
  ]},
  { id: 137, title: 'Inverno magico', emoji: '❄️', color: 'from-blue-400 to-white', category: 'festivita', prompts: [
    'Prima neve dell\'anno: cosa facciamo insieme appena inizia a cadere?',
    'Serata invernale perfetta in casa: atmosfera, attività e coccole!'
  ]},
  { id: 138, title: 'Primavera rinascita', emoji: '🌻', color: 'from-green-400 to-yellow-300', category: 'festivita', prompts: [
    'Cosa vorremmo "rifiorire" nella nostra relazione questa primavera?',
    'Picnic di primavera: dove, cosa mangiamo e quali giochi facciamo?'
  ]},
  { id: 139, title: 'Anniversari inventati', emoji: '🎂', color: 'from-purple-400 to-pink-400', category: 'festivita', prompts: [
    'Inventiamo 5 anniversari assurdi da celebrare durante l\'anno!',
    'Oggi è l\'anniversario del nostro primo... cosa? Inventa e celebriamo!'
  ]},
  { id: 140, title: 'Feste mondiali', emoji: '🌍', color: 'from-cyan-400 to-green-400', category: 'festivita', prompts: [
    'Scegliamo una festa tradizionale di un altro paese da celebrare insieme!',
    'Se potessimo creare una festa mondiale, quale sarebbe e come la festeggeremmo?'
  ]},

  // CARTE FINALI DI CONNESSIONE PROFONDA (141-150)
  { id: 141, title: 'Gratitudine profonda', emoji: '🙏', color: 'from-purple-400 to-blue-300', category: 'connessione', prompts: [
    'Dimmi 3 cose di te per cui sono grato che magari non ti ho mai detto!',
    'Momento di gratitudine: cosa apprezzi di più di noi come coppia?'
  ]},
  { id: 142, title: 'Vulnerabilità dolce', emoji: '🤲', color: 'from-pink-400 to-purple-300', category: 'connessione', prompts: [
    'Condividi una paura che hai superato grazie a noi due insieme.',
    'Qual è la cosa più bella che qualcuno ha detto della nostra relazione?'
  ]},
  { id: 143, title: 'Supporto reciproco', emoji: '🤝', color: 'from-green-400 to-blue-300', category: 'connessione', prompts: [
    'Quando ti senti giù, cosa posso fare per farti sentire meglio?',
    'Come possiamo essere ancora più una squadra nelle difficoltà?'
  ]},
  { id: 144, title: 'Orgoglio di coppia', emoji: '🌟', color: 'from-gold-400 to-orange-300', category: 'connessione', prompts: [
    'Di cosa sei più orgoglioso/a di noi come coppia?',
    'Se dovessi vantarti di noi con un amico, cosa diresti?'
  ]},
  { id: 145, title: 'Crescita insieme', emoji: '🌱', color: 'from-green-500 to-cyan-400', category: 'connessione', prompts: [
    'In cosa senti che siamo cresciuti di più da quando stiamo insieme?',
    'Quale aspetto di me hai aiutato a migliorare senza rendertene conto?'
  ]},
  { id: 146, title: 'Rituali di coppia', emoji: '🕯️', color: 'from-amber-400 to-red-300', category: 'connessione', prompts: [
    'Quale piccolo rituale quotidiano ci rende felici come coppia?',
    'Inventiamo un rituale settimanale tutto nostro per riconnetterci!'
  ]},
  { id: 147, title: 'Complicità silenziosa', emoji: '👁️', color: 'from-indigo-400 to-purple-300', category: 'connessione', prompts: [
    'Momento di comunicazione non verbale: guardatevi negli occhi per 1 minuto!',
    'Quale sguardo tra di noi dice di più di mille parole?'
  ]},
  { id: 148, title: 'Promesse dolci', emoji: '💍', color: 'from-rose-400 to-pink-300', category: 'connessione', prompts: [
    'Facciamoci una promessa piccola ma importante per la prossima settimana!',
    'Se dovessi promettere di migliorare una cosa di me per te, quale sarebbe?'
  ]},
  { id: 149, title: 'Eredità d\'amore', emoji: '💖', color: 'from-purple-500 to-pink-500', category: 'connessione', prompts: [
    'Cosa vogliamo che la gente impari sull\'amore guardando la nostra relazione?',
    'Se scrivessimo un libro sui segreti dell\'amore, quale sarebbe il primo capitolo?'
  ]},
  { id: 150, title: 'Tutto ricomincia', emoji: '🔄', color: 'from-rainbow', category: 'connessione', prompts: [
    'Se dovessimo ricominciare da capo sapendo quello che sappiamo ora, cosa faresti uguale?',
    'Ultimo messaggio di questo mazzo: cosa vuoi dirmi guardandomi negli occhi?'
  ]}
];

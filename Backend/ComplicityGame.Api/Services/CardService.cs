using ComplicityGame.Api.Models;

namespace ComplicityGame.Api.Services;

public interface ICardService
{
    Task<IEnumerable<GameCard>> GetCardsAsync(string gameType);
    Task<GameCard?> GetRandomCardAsync(string gameType);
    Task<GameCard?> GetCardByIdAsync(int cardId);
}

public class CardService : ICardService
{
    // Static card data for Gioco della Complicità
    private readonly List<GameCard> _cards = new()
    {
        // Couple cards
        new GameCard { Id = 1, GameType = "couple", Category = "Intimità", Content = "Racconta un momento in cui ti sei sentito/a particolarmente vicino/a a me", Level = 1 },
        new GameCard { Id = 2, GameType = "couple", Category = "Sogni", Content = "Qual è un sogno che vorresti realizzare insieme a me?", Level = 1 },
        new GameCard { Id = 3, GameType = "couple", Category = "Ricordi", Content = "Qual è il primo ricordo che hai di noi insieme?", Level = 1 },
        new GameCard { Id = 4, GameType = "couple", Category = "Futuro", Content = "Come immagini la nostra vita tra 5 anni?", Level = 2 },
        new GameCard { Id = 5, GameType = "couple", Category = "Intimità", Content = "Cosa apprezzi di più del nostro rapporto?", Level = 1 },
        new GameCard { Id = 6, GameType = "couple", Category = "Crescita", Content = "In che modo sono cresciuto/a grazie a te?", Level = 2 },
        new GameCard { Id = 7, GameType = "couple", Category = "Comunicazione", Content = "C'è qualcosa che vorresti dirmi ma non hai mai avuto il coraggio?", Level = 3 },
        new GameCard { Id = 8, GameType = "couple", Category = "Avventure", Content = "Qual è un'avventura che vorresti vivere insieme?", Level = 1 },
        new GameCard { Id = 9, GameType = "couple", Category = "Sfide", Content = "Qual è stata la sfida più grande che abbiamo superato insieme?", Level = 2 },
        new GameCard { Id = 10, GameType = "couple", Category = "Gratitudine", Content = "Per cosa sei più grato/a nella nostra relazione?", Level = 1 },
        new GameCard { Id = 11, GameType = "couple", Category = "Intimità", Content = "Descrivi un momento perfetto che vorresti condividere con me", Level = 2 },
        new GameCard { Id = 12, GameType = "couple", Category = "Scoperta", Content = "Cosa vorresti scoprire di nuovo l'uno dell'altro?", Level = 2 },
        new GameCard { Id = 13, GameType = "couple", Category = "Supporto", Content = "Come posso sostenerti meglio nei tuoi obiettivi?", Level = 2 },
        new GameCard { Id = 14, GameType = "couple", Category = "Gioco", Content = "Inventa una danza o un gesto speciale che rappresenti il nostro amore", Level = 1 },
        new GameCard { Id = 15, GameType = "couple", Category = "Ricordi", Content = "Qual è il momento più divertente che abbiamo vissuto insieme?", Level = 1 },
        new GameCard { Id = 16, GameType = "couple", Category = "Futuro", Content = "Qual è una tradizione che vorresti creare per noi?", Level = 2 },
        new GameCard { Id = 17, GameType = "couple", Category = "Vulnerabilità", Content = "Condividi una paura che hai per la nostra relazione", Level = 3 },
        new GameCard { Id = 18, GameType = "couple", Category = "Apprezzamento", Content = "Cosa ammiri di più del mio carattere?", Level = 1 },
        new GameCard { Id = 19, GameType = "couple", Category = "Creatività", Content = "Se potessi scrivere una canzone sulla nostra storia, quale sarebbe il ritornello?", Level = 2 },
        new GameCard { Id = 20, GameType = "couple", Category = "Intimità", Content = "In che modo ti fa sentire speciale il nostro amore?", Level = 2 },
        
        // Family cards
        new GameCard { Id = 21, GameType = "family", Category = "Ricordi", Content = "Qual è il ricordo di famiglia che ti fa sorridere di più?", Level = 1 },
        new GameCard { Id = 22, GameType = "family", Category = "Tradizioni", Content = "Qual è la tradizione di famiglia che ami di più?", Level = 1 },
        new GameCard { Id = 23, GameType = "family", Category = "Gratitudine", Content = "Per cosa sei più grato/a nella nostra famiglia?", Level = 1 },
        new GameCard { Id = 24, GameType = "family", Category = "Sogni", Content = "Qual è un sogno che hai per la nostra famiglia?", Level = 2 },
        new GameCard { Id = 25, GameType = "family", Category = "Supporto", Content = "Come possiamo sostenerci meglio l'un l'altro?", Level = 2 },
        new GameCard { Id = 26, GameType = "family", Category = "Valori", Content = "Quale valore di famiglia è più importante per te?", Level = 2 },
        new GameCard { Id = 27, GameType = "family", Category = "Crescita", Content = "Come sei cresciuto/a grazie alla nostra famiglia?", Level = 2 },
        new GameCard { Id = 28, GameType = "family", Category = "Avventure", Content = "Qual è un'avventura che vorresti vivere tutti insieme?", Level = 1 },
        new GameCard { Id = 29, GameType = "family", Category = "Comunicazione", Content = "C'è qualcosa che vorresti dire alla famiglia ma non hai mai detto?", Level = 3 },
        new GameCard { Id = 30, GameType = "family", Category = "Sfide", Content = "Qual è stata la sfida più grande che abbiamo superato come famiglia?", Level = 2 },
        new GameCard { Id = 31, GameType = "family", Category = "Divertimento", Content = "Qual è l'attività più divertente che facciamo insieme?", Level = 1 },
        new GameCard { Id = 32, GameType = "family", Category = "Orgoglio", Content = "Di cosa sei più orgoglioso/a nella nostra famiglia?", Level = 1 },
        new GameCard { Id = 33, GameType = "family", Category = "Futuro", Content = "Come immagini la nostra famiglia tra 10 anni?", Level = 2 },
        new GameCard { Id = 34, GameType = "family", Category = "Unicità", Content = "Cosa rende unica la nostra famiglia?", Level = 1 },
        new GameCard { Id = 35, GameType = "family", Category = "Amore", Content = "Come esprimiamo l'amore nella nostra famiglia?", Level = 2 },
        new GameCard { Id = 36, GameType = "family", Category = "Apprendimento", Content = "Cosa hai imparato di importante dalla nostra famiglia?", Level = 2 },
        new GameCard { Id = 37, GameType = "family", Category = "Momenti", Content = "Qual è il momento della giornata che preferisci trascorrere insieme?", Level = 1 },
        new GameCard { Id = 38, GameType = "family", Category = "Eredità", Content = "Quale eredità vorresti lasciare ai futuri membri della famiglia?", Level = 3 },
        new GameCard { Id = 39, GameType = "family", Category = "Celebrazione", Content = "Come potremmo celebrare meglio i nostri successi di famiglia?", Level = 2 },
        new GameCard { Id = 40, GameType = "family", Category = "Connessione", Content = "In che modo possiamo rafforzare i nostri legami familiari?", Level = 2 }
    };

    public Task<IEnumerable<GameCard>> GetCardsAsync(string gameType)
    {
        var cards = _cards.Where(c => c.GameType.Equals(gameType, StringComparison.OrdinalIgnoreCase));
        return Task.FromResult(cards);
    }

    public Task<GameCard?> GetRandomCardAsync(string gameType)
    {
        var cards = _cards.Where(c => c.GameType.Equals(gameType, StringComparison.OrdinalIgnoreCase)).ToList();
        
        if (!cards.Any())
            return Task.FromResult<GameCard?>(null);

        var random = new Random();
        var randomCard = cards[random.Next(cards.Count)];
        return Task.FromResult<GameCard?>(randomCard);
    }

    public Task<GameCard?> GetCardByIdAsync(int cardId)
    {
        var card = _cards.FirstOrDefault(c => c.Id == cardId);
        return Task.FromResult(card);
    }
}

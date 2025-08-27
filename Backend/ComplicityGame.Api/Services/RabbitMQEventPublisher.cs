using RabbitMQ.Client;
using System.Text;
using System.Text.Json;
using ComplicityGame.Api.Events;

namespace ComplicityGame.Api.Services
{
    public interface IEventPublisher
    {
        Task PublishAsync<T>(T eventObj, string routingKey) where T : BaseEvent;
        Task PublishToUserAsync<T>(T eventObj, string userId) where T : BaseEvent;
        Task PublishToCoupleAsync<T>(T eventObj, string coupleId) where T : BaseEvent;
    }

    public class RabbitMQEventPublisher : IEventPublisher, IDisposable
    {
        private readonly IConnection _connection;
        private readonly IModel _channel;
        private readonly ILogger<RabbitMQEventPublisher> _logger;
        private const string EXCHANGE_NAME = "complicity.events";

        public RabbitMQEventPublisher(ILogger<RabbitMQEventPublisher> logger)
        {
            _logger = logger;
            
            var factory = new ConnectionFactory
            {
                HostName = "localhost",
                UserName = "admin",
                Password = "admin",
                Port = 5672
            };

            _connection = factory.CreateConnection();
            _channel = _connection.CreateModel();

            // Declare exchange
            _channel.ExchangeDeclare(
                exchange: EXCHANGE_NAME,
                type: ExchangeType.Topic,
                durable: true
            );

            _logger.LogInformation("✅ RabbitMQ EventPublisher initialized");
        }

        public async Task PublishAsync<T>(T eventObj, string routingKey) where T : BaseEvent
        {
            try
            {
                var json = JsonSerializer.Serialize(eventObj, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });

                var body = Encoding.UTF8.GetBytes(json);

                _channel.BasicPublish(
                    exchange: EXCHANGE_NAME,
                    routingKey: routingKey,
                    basicProperties: null,
                    body: body
                );

                _logger.LogInformation($"📤 Published event {eventObj.EventType} to {routingKey}");
                await Task.CompletedTask;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Failed to publish event {eventObj.EventType}");
                throw;
            }
        }

        public async Task PublishToUserAsync<T>(T eventObj, string userId) where T : BaseEvent
        {
            await PublishAsync(eventObj, $"user.{userId}");
        }

        public async Task PublishToCoupleAsync<T>(T eventObj, string coupleId) where T : BaseEvent
        {
            await PublishAsync(eventObj, $"couple.{coupleId}");
        }

        public void Dispose()
        {
            _channel?.Close();
            _connection?.Close();
            _logger.LogInformation("🔌 RabbitMQ EventPublisher disposed");
        }
    }
}

using ComplicityGame.Api.Events;

namespace ComplicityGame.Api.Services
{
    public class MockEventPublisher : IEventPublisher
    {
        private readonly ILogger<MockEventPublisher> _logger;

        public MockEventPublisher(ILogger<MockEventPublisher> logger)
        {
            _logger = logger;
        }

        public Task PublishAsync<T>(T eventObj, string routingKey) where T : BaseEvent
        {
            _logger.LogInformation($"📤 [MOCK] Publishing event with routing key {routingKey}: {eventObj.GetType().Name}");
            return Task.CompletedTask;
        }

        public Task PublishToUserAsync<T>(T eventObj, string userId) where T : BaseEvent
        {
            _logger.LogInformation($"📤 [MOCK] Publishing event to user {userId}: {eventObj.GetType().Name}");
            return Task.CompletedTask;
        }

        public Task PublishToCoupleAsync<T>(T eventObj, string coupleId) where T : BaseEvent
        {
            _logger.LogInformation($"📤 [MOCK] Publishing event to couple {coupleId}: {eventObj.GetType().Name}");
            return Task.CompletedTask;
        }

        public void Dispose()
        {
            _logger.LogInformation("🔌 MockEventPublisher disposed");
        }
    }
}

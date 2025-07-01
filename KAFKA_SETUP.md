# Kafka Setup for eShopper

This document explains how to set up and use Kafka in your eShopper microservices application.

## Quick Start

### 1. Start Kafka Infrastructure

```bash
# Start Kafka, Zookeeper, and Kafka UI
docker-compose up -d

# Verify services are running
docker-compose ps
```

### 2. Test Kafka Connection

```bash
# Test if Kafka is working
node scripts/test-kafka.js
```

### 3. Access Kafka UI

Open http://localhost:8080 in your browser to view Kafka topics and messages.

## Architecture

### Current Setup

- **Auth Service**: Produces messages to `email-verification` topic
- **Kafka Library**: Generic Kafka provider for all services
- **Future Email Service**: Will consume from `email-verification` topic

### Message Flow

```
User Registration → Auth Service → Kafka Topic → Email Service (future)
```

## Environment Variables

Add these to your `.env` file:

```env
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=auth-service
```

## Usage Examples

### Producing Messages (Auth Service)

```typescript
import { kafkaProvider } from './main';

// Send OTP verification message
await kafkaProvider.sendMessage({
  topic: 'email-verification',
  key: 'user@example.com',
  value: JSON.stringify({
    type: 'OTP_VERIFICATION',
    email: 'user@example.com',
    otp: '123456',
  }),
});
```

### Consuming Messages (Future Email Service)

```typescript
import { KafkaProvider } from '@eshopper/kafka';

const kafka = new KafkaProvider({
  clientId: 'email-service',
  brokers: ['localhost:9092'],
});

const consumer = kafka.getConsumer('email-service-group');
await consumer.subscribe({ topic: 'email-verification' });

await consumer.run({
  eachMessage: async ({ message }) => {
    const emailData = JSON.parse(message.value.toString());
    // Process email sending logic here
    console.log('Processing email:', emailData);
  },
});
```

## Topics

- `email-verification`: For OTP and email verification messages
- `test-topic`: For testing Kafka functionality

## Next Steps

1. **Create Email Service**: New microservice to consume email messages
2. **Add More Topics**: For notifications, orders, etc.
3. **Add Error Handling**: Retry logic for failed messages
4. **Add Monitoring**: Track message delivery and processing

## Troubleshooting

### Kafka Connection Issues

```bash
# Check if Kafka is running
docker-compose ps

# View Kafka logs
docker-compose logs kafka

# Restart Kafka
docker-compose restart kafka
```

### Topic Creation

Topics are auto-created when first message is sent. You can also create them manually in Kafka UI.

## Development Tips

- Use Kafka UI (http://localhost:8080) to monitor messages
- Check Docker logs for connection issues
- Test with the provided test script before integrating
- Keep Kafka library generic (no business logic)

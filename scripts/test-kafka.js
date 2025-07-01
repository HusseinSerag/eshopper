const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'test-client',
  brokers: ['localhost:9092'],
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'test-group' });

async function testKafka() {
  try {
    console.log('Connecting to Kafka...');
    await producer.connect();
    await consumer.connect();

    console.log('Subscribing to test topic...');
    await consumer.subscribe({ topic: 'test-topic', fromBeginning: true });

    console.log('Sending test message...');
    await producer.send({
      topic: 'test-topic',
      messages: [{ key: 'test-key', value: 'Hello Kafka!' }],
    });

    console.log('Waiting for message...');
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        console.log('Received message:', {
          topic,
          partition,
          key: message.key.toString(),
          value: message.value.toString(),
        });
        process.exit(0);
      },
    });

    // Wait a bit for the message
    setTimeout(() => {
      console.log('No message received, exiting...');
      process.exit(1);
    }, 5000);
  } catch (error) {
    console.error('Kafka test failed:', error);
    process.exit(1);
  }
}

testKafka();

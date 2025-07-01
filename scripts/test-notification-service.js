const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'test-producer',
  brokers: ['localhost:9092'],
});

const producer = kafka.producer();

async function sendTestNotification() {
  try {
    await producer.connect();
    console.log('Connected to Kafka');

    // Send a test OTP email notification
    const testMessage = {
      type: 'EMAIL',
      channel: 'OTP_VERIFICATION',
      email: 'husseinserag2014@gmail.com',
      otp: '123456',
      userName: 'Test User',
    };

    await producer.send({
      topic: 'notifications',
      messages: [
        {
          key: 'test-otp',
          value: JSON.stringify(testMessage),
        },
      ],
    });

    console.log('✅ Test notification sent to Kafka');
    console.log('Message:', JSON.stringify(testMessage, null, 2));
  } catch (error) {
    console.error('❌ Error sending test notification:', error);
  } finally {
    await producer.disconnect();
  }
}

sendTestNotification();

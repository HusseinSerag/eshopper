const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'test-notification-client',
  brokers: ['localhost:9092'],
});

const producer = kafka.producer();

async function testNotificationService() {
  try {
    console.log('Connecting to Kafka...');
    await producer.connect();

    console.log('Sending notification message...');
    await producer.send({
      topic: 'notifications',
      messages: [
        {
          key: 'test@example.com',
          value: JSON.stringify({
            type: 'EMAIL',
            channel: 'OTP_VERIFICATION',
            email: 'test@example.com',
            otp: '123456',
            userName: 'Test User',
          }),
        },
      ],
    });

    console.log('Message sent successfully!');
    console.log(
      'Check the notification service logs to see if the email was processed.'
    );

    await producer.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testNotificationService();

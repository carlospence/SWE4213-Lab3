const express = require('express');
const amqp = require('amqplib');

const app = express();
app.use(express.json());

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const EXCHANGE_NAME = 'appts';
const QUEUE_NAME = 'records';
const PREFETCH_COUNT = 1;
const RETRY_ATTEMPTS = 30;
const RETRY_DELAY_MS = 1000;

let channel;
let connection;

// In-memory appointment log (stored in order they were received)
const appointmentLog = [];

async function connectToRabbitMQ() {
    let attempts = 0;

    while (attempts < RETRY_ATTEMPTS) {
        try {
            connection = await amqp.connect(RABBITMQ_URL);
            channel = await connection.createChannel();

            // Set prefetch count to 1
            await channel.prefetch(PREFETCH_COUNT);

            // Assert the fanout exchange
            await channel.assertExchange(EXCHANGE_NAME, 'fanout', { durable: false });

            // Assert the queue
            await channel.assertQueue(QUEUE_NAME, { durable: false });

            // Bind queue to exchange
            await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, '');

            console.log('Successfully connected to RabbitMQ');
            console.log(`Listening for messages on queue: ${QUEUE_NAME}`);

            // Start consuming messages with manual acknowledgment
            await channel.consume(QUEUE_NAME, async (msg) => {
                if (msg) {
                    try {
                        const content = JSON.parse(msg.content.toString());

                        // Add appointment to in-memory log
                        appointmentLog.push({
                            patient_email: content.patient_email,
                            doctor_name: content.doctor_name,
                            reason: content.reason,
                            timestamp: content.timestamp || new Date().toISOString()
                        });

                        // Print summary
                        console.log(`[Records] New appointment logged — total on record: ${appointmentLog.length}`);
                        appointmentLog.forEach(appointment => {
                            console.log(`  ${appointment.patient_email} → ${appointment.doctor_name} (${appointment.reason}) at ${appointment.timestamp}`);
                        });

                        // Manually acknowledge the message
                        channel.ack(msg);
                    } catch (err) {
                        console.error('Error processing message:', err.message);
                        // Negative acknowledge without requeue to avoid infinite loop
                        channel.nack(msg, false, false);
                    }
                }
            }, { noAck: false });

            return; // Successfully connected and consuming
        } catch (err) {
            attempts++;
            console.error(`Failed to connect to RabbitMQ (attempt ${attempts}/${RETRY_ATTEMPTS}):`, err.message);

            if (attempts < RETRY_ATTEMPTS) {
                console.log(`Retrying in ${RETRY_DELAY_MS}ms...`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            }
        }
    }

    console.error(`Failed to connect to RabbitMQ after ${RETRY_ATTEMPTS} attempts. Exiting.`);
    process.exit(1);
}

// Start the service
connectToRabbitMQ().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    try {
        if (channel) await channel.close();
        if (connection) await connection.close();
    } catch (err) {
        console.error('Error during shutdown:', err.message);
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Shutting down gracefully...');
    try {
        if (channel) await channel.close();
        if (connection) await connection.close();
    } catch (err) {
        console.error('Error during shutdown:', err.message);
    }
    process.exit(0);
});

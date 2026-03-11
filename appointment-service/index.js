const express = require('express');
const axios = require('axios');
const amqp = require('amqplib');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

const DOCTOR_SERVICE_URL = process.env.DOCTOR_SERVICE_URL || 'http://localhost:5002';
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';

let channel;

async function initRabbit() {
    try {
        const conn = await amqp.connect(RABBITMQ_URL);
        channel = await conn.createChannel();
        await channel.assertExchange('appts', 'fanout', { durable: false });
        console.log('Connected to RabbitMQ');
    } catch (err) {
        console.error('RabbitMQ connection error', err.message);
    }
}

initRabbit();

app.post('/appointments', async (req, res) => {
    const { patient_name, patient_email, doctor_id, reason } = req.body;
    if (!patient_name || !patient_email || !doctor_id || !reason) {
        return res.status(400).json({ message: 'Missing required field(s)' });
    }

    try {
        const resp = await axios.post(
            `${DOCTOR_SERVICE_URL}/doctors/${doctor_id}/reserve`,
            { slots: 1 }
        );

        if (resp.status !== 200 || !resp.data.success) {
            const reasonMsg = (resp.data && resp.data.reason) || 'Reservation failed';
            return res.status(409).json({ status: 'rejected', reason: reasonMsg });
        }

        const doctorName = resp.data.doctor_name;

        const appointmentEvent = {
            appointment_id: uuidv4(),
            patient_name,
            patient_email,
            doctor_id,
            doctor_name: doctorName,
            reason,
            timestamp: new Date().toISOString()
        };

        if (channel) {
            channel.publish('appts', '', Buffer.from(JSON.stringify(appointmentEvent)));
        } else {
            console.warn('RabbitMQ channel not available, skipping publish');
        }

        return res.status(201).json({
            appointment_id: appointmentEvent.appointment_id,
            status: 'confirmed',
            message: `Your appointment with ${doctorName} has been booked. A confirmation email will be sent shortly.`
        });
    } catch (err) {
        // doctor service error or network issue
        if (err.response) {
            const reasonMsg = (err.response.data && err.response.data.reason) || 'Reservation failed';
            return res.status(409).json({ status: 'rejected', reason: reasonMsg });
        }
        console.error('Error calling doctor service', err.message);
        return res.status(409).json({ status: 'rejected', reason: 'Failed to reserve with doctor service' });
    }
});
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'Appointment service is running' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Appointment service listening on port ${PORT}`));

const express = require('express');
const axios = require('axios');
const amqp = require('amqplib');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

// In-memory store for booked appointments
const appointments = []; // entries mirror appointmentEvent

const DOCTOR_SERVICE_URL = process.env.DOCTOR_SERVICE_URL || 'http://localhost:5002';
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const RETRY_ATTEMPTS = 30;
const RETRY_DELAY_MS = 1000;

let channel;

async function initRabbit() {
    let attempts = 0;

    while (attempts < RETRY_ATTEMPTS) {
        try {
            const conn = await amqp.connect(RABBITMQ_URL);
            channel = await conn.createChannel();
            await channel.assertExchange('appts', 'fanout', { durable: false });
            console.log('Successfully connected to RabbitMQ');
            return; // Successfully connected
        } catch (err) {
            attempts++;
            console.error(`Failed to connect to RabbitMQ (attempt ${attempts}/${RETRY_ATTEMPTS}):`, err.message);

            if (attempts < RETRY_ATTEMPTS) {
                console.log(`Retrying in ${RETRY_DELAY_MS}ms...`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            }
        }
    }

    console.error(`Failed to connect to RabbitMQ after ${RETRY_ATTEMPTS} attempts. Service will continue without RabbitMQ.`);
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
            status: 'confirmed',
            timestamp: new Date().toISOString()
        };

        // record in-memory for dashboard queries
        appointments.push(appointmentEvent);

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

// Return current appointments log
app.get('/appointments', (req, res) => {
    res.json(appointments);
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Appointment service listening on port ${PORT}`));

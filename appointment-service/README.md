# Appointment Service

This Express.js service provides an endpoint to book new appointments. It coordinates with the
Doctor Service to reserve a slot and publishes an event to a RabbitMQ exchange on successful
bookings.

## Installation

```bash
cd appointment-service
npm install
```

## Configuration

- `DOCTOR_SERVICE_URL` – URL of doctor service (default `http://localhost:5002`).
- `RABBITMQ_URL` – AMQP connection string (default `amqp://localhost`).
- `PORT` – port on which the service listens (default `5001`).

## API

### POST /appointments

**Request body** (all fields required):

```json
{
  "patient_name": "James Okafor",
  "patient_email": "james@example.com",
  "doctor_id": "D001",
  "reason": "Annual check-up"
}
```

### Responses

- **201** – booking confirmed
  ```json
  {
    "appointment_id": "a1b2c3d4-...",
    "status": "confirmed",
    "message": "Your appointment with Dr. Sarah Chen has been booked. A confirmation email will be sent shortly."
  }
  ```

- **400** – missing required field(s)
  ```json
  { "message": "Missing required field(s)" }
  ```

- **409** – reservation rejected
  ```json
  {
    "status": "rejected",
    "reason": "Dr. Sarah Chen has no available slots."
  }
  ```

On successful reservation, an appointment event is published to the `appts` fanout exchange in
RabbitMQ. The event contains `appointment_id`, `patient_name`, `patient_email`, `doctor_id`,
`doctor_name`, `reason`, and `timestamp`.

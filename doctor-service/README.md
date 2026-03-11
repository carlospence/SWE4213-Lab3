# Doctor Service

An Express.js service providing doctor information with in-memory data.

## Installation

```bash
npm install
```

## Running

```bash
npm start
```

The service will run on port 3001.

## API

- GET /doctors: Returns all doctors
- GET /doctors/:id: Returns a specific doctor by ID
- POST /doctors/:id/reserve: Reserves an appointment with a doctor
  - Request body: `{ "slots": 1 }`
  - Success response: `{ "success": true, "doctor_id": "D001", "doctor_name": "Dr. John Doe", "slots_remaining": 4 }`
  - Failure response: `{ "success": false, "reason": "Dr. John Doe has no available slots." }`

## Data Model

Each doctor has:
- ID: Unique identifier
- name: Doctor's name
- specialty: Medical specialty
- availableSlots: Number of available appointment slots
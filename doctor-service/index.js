const express = require('express');
const app = express();

app.use(express.json());

// In-memory data for doctors
const doctors = [
  { ID: 'D001', name: 'Dr. John Doe', specialty: 'Cardiology', availableSlots: 5 },
  { ID: 'D002', name: 'Dr. Jane Smith', specialty: 'Neurology', availableSlots: 3 },
  { ID: 'D003', name: 'Dr. Michael Johnson', specialty: 'Orthopedics', availableSlots: 7 },
  { ID: 'D004', name: 'Dr. Emily Davis', specialty: 'Pediatrics', availableSlots: 4 },
  { ID: 'D005', name: 'Dr. Robert Brown', specialty: 'Dermatology', availableSlots: 6 },
  { ID: 'D006', name: 'Dr. Lisa Wilson', specialty: 'Psychiatry', availableSlots: 2 },
  { ID: 'D007', name: 'Dr. David Miller', specialty: 'Gynecology', availableSlots: 8 },
  { ID: 'D008', name: 'Dr. Sarah Garcia', specialty: 'Ophthalmology', availableSlots: 5 },
  { ID: 'D009', name: 'Dr. James Martinez', specialty: 'Urology', availableSlots: 3 },
  { ID: 'D010', name: 'Dr. Anna Anderson', specialty: 'Radiology', availableSlots: 9 }
];

// Route to get all doctors
app.get('/doctors', (req, res) => {
  res.json(doctors);
});

// Route to get a doctor by ID
app.get('/doctors/:id', (req, res) => {
  const id = req.params.id;
  const doctor = doctors.find(d => d.ID === id);
  if (doctor) {
    res.json(doctor);
  } else {
    res.status(404).json({ message: 'Doctor not found' });
  }
});

// Route to reserve an appointment with a doctor
app.post('/doctors/:id/reserve', (req, res) => {
  const id = req.params.id;
  const { slots } = req.body;
  const doctor = doctors.find(d => d.ID === id);
  if (!doctor) {
    return res.status(404).json({ success: false, reason: 'Doctor not found' });
  }
  if (doctor.availableSlots >= slots) {
    doctor.availableSlots -= slots;
    res.json({
      success: true,
      doctor_id: doctor.ID,
      doctor_name: doctor.name,
      slots_remaining: doctor.availableSlots
    });
  } else {
    res.json({
      success: false,
      reason: `${doctor.name} has no available slots.`
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Doctor service is running' });
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`Doctor service listening on port ${PORT}`);
});
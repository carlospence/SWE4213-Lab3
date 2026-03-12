import { useEffect, useState } from 'react';
import Link from 'next/link';

const DOCTOR_URL = process.env.NEXT_PUBLIC_DOCTOR_URL || 'http://localhost:5002';
const APPOINTMENT_URL = process.env.NEXT_PUBLIC_APPOINTMENT_URL || 'http://localhost:5001';

export default function Home() {
    const [doctors, setDoctors] = useState([]);
    const [form, setForm] = useState({
        patient_name: '',
        patient_email: '',
        doctor_id: '',
        reason: ''
    });
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');

    useEffect(() => {
        fetchDoctors();
    }, []);

    const handleChange = e => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const fetchDoctors = () => {
        fetch(`${DOCTOR_URL}/doctors`)
            .then(res => res.json())
            .then(setDoctors)
            .catch(console.error);
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setMessage('');
        setMessageType('');
        try {
            const resp = await fetch(`${APPOINTMENT_URL}/appointments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            const data = await resp.json();
            if (resp.ok) {
                setMessage('Appointment booked successfully!');
                setMessageType('success');
                setForm({ patient_name: '', patient_email: '', doctor_id: '', reason: '' });
                fetchDoctors();
            } else {
                setMessage(data.reason || data.message || 'Failed to book');
                setMessageType('error');
            }
        } catch (err) {
            setMessage('Network error');
            setMessageType('error');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="absolute top-4 left-4">
                <Link href="/dashboard" className="text-blue-600 underline">Dashboard</Link>
            </div>
            <div className="max-w-md w-full bg-white rounded shadow p-6">
                <h1 className="text-2xl mb-4">Book Appointment</h1>
                {message && <div className={`mb-4 font-medium ${messageType === 'success' ? 'text-green-600' : 'text-red-600'}`}>{message}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block font-medium">Name</label>
                        <input
                            name="patient_name"
                            value={form.patient_name}
                            onChange={handleChange}
                            required
                            className="w-full border rounded px-2 py-1"
                        />
                    </div>
                    <div>
                        <label className="block font-medium">Email</label>
                        <input
                            name="patient_email"
                            type="email"
                            value={form.patient_email}
                            onChange={handleChange}
                            required
                            className="w-full border rounded px-2 py-1"
                        />
                    </div>
                    <div>
                        <label className="block font-medium">Doctor</label>
                        <select
                            name="doctor_id"
                            value={form.doctor_id}
                            onChange={handleChange}
                            required
                            className="w-full border rounded px-2 py-1"
                        >
                            <option value="">Select a doctor</option>
                            {doctors.map(d => (
                                <option key={d.ID} value={d.ID}>
                                    {d.name} ({d.specialty}) - {d.availableSlots} slots available
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block font-medium">Reason</label>
                        <input
                            name="reason"
                            value={form.reason}
                            onChange={handleChange}
                            required
                            className="w-full border rounded px-2 py-1"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white rounded py-2 hover:bg-blue-600"
                    >
                        Book
                    </button>
                </form>
            </div>
        </div>
    );
}

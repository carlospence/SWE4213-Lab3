import { useEffect, useState } from 'react';
import Link from 'next/link';

const DOCTOR_URL = process.env.NEXT_PUBLIC_DOCTOR_URL || 'http://localhost:5002';
const APPOINTMENT_URL = process.env.NEXT_PUBLIC_APPOINTMENT_URL || 'http://localhost:5001';

export default function Dashboard() {
    const [doctors, setDoctors] = useState([]);
    const [appointments, setAppointments] = useState([]);

    const loadData = () => {
        fetch(`${DOCTOR_URL}/doctors`)
            .then(res => res.json())
            .then(setDoctors)
            .catch(console.error);

        fetch(`${APPOINTMENT_URL}/appointments`)
            .then(res => res.json())
            .then(setAppointments)
            .catch(console.error);
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 5000);
        return () => clearInterval(interval);
    }, []);

    const getAppointmentCountForDoctor = (doctorId) => {
        return appointments.filter(a => a.doctor_id === doctorId).length;
    };


    // const getAppointmentCountForDoctor = (doctorId) => {
    //     return appointments.filter(a => a.doctor_id === doctorId).length;
    // };

    return (
        <div className="p-4">
            <div className="mb-4">
                <Link href="/" className="text-blue-600 underline">Book Appointment</Link>
            </div>
            <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h2 className="text-xl font-semibold mb-4">Doctors ({doctors.length})</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {doctors.map(d => (
                            <div key={d.ID} className="bg-white p-4 rounded-lg shadow border border-gray-200 hover:shadow-md transition">
                                <div className="font-semibold text-gray-900">{d.name}</div>
                                <div className="text-sm text-gray-600 mt-1">{d.specialty}</div>
                                <div className="text-sm font-medium text-green-600 mt-2">{d.availableSlots} slots available</div>
                                <div className="text-sm font-medium text-blue-600 mt-2">{getAppointmentCountForDoctor(d.ID)} appointments</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <h2 className="text-xl font-semibold mb-4">Appointments ({appointments.length})</h2>
                    <div className="space-y-3">
                        {appointments.map(a => (
                            <div key={a.appointment_id} className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500 hover:shadow-md transition">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-semibold text-gray-900">{a.patient_name} ({a.patient_email})</div>
                                        <div className="text-sm text-gray-600 mt-1">{a.doctor_name}</div>
                                        <div className="text-sm text-gray-500 mt-1">{a.reason}</div>
                                    </div>
                                </div>
                                <div className="text-xs text-gray-400 mt-2">{new Date(a.timestamp).toLocaleString()}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

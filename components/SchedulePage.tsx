import React, { useState, useMemo } from 'react';
import { Appointment, Job, Customer, Vehicle, User, Service } from '../types';
import AppointmentFormModal from './AppointmentFormModal';
import { EditIcon, TrashIcon } from './icons';

interface SchedulePageProps {
    appointments: Appointment[];
    jobs: Job[];
    customers: Customer[];
    vehicles: Vehicle[];
    currentUser: User | null;
    handleSaveAppointment: (appointment: Appointment) => void;
    handleDeleteAppointment: (appointmentId: string) => void;
    onViewJob: (jobId: string) => void;
    allServices: Service[];
    allUsers: User[];
    allAppointments: Appointment[];
}

const AppointmentCard: React.FC<{
    appointment: Appointment;
    job: Job | undefined;
    customer: Customer | undefined;
    vehicle: Vehicle | undefined;
    onEdit: (appointment: Appointment) => void;
    onDelete: (appointmentId: string) => void;
    onClick: () => void;
}> = ({ appointment, job, customer, vehicle, onEdit, onDelete, onClick }) => {
    const formatTime = (timestamp: number) => new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <button onClick={onClick} className="w-full text-left bg-gray-800 rounded-lg p-3 shadow-lg mb-3 border-l-4 border-blue-500 hover:bg-gray-700 transition-colors">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold text-white text-sm">{customer?.name || 'Unknown Customer'}</p>
                    <p className="text-xs text-gray-400">{vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Unknown Vehicle'}</p>
                </div>
                <div className="flex space-x-1">
                    <button onClick={(e) => { e.stopPropagation(); onEdit(appointment); }} className="p-1 text-gray-400 hover:text-blue-400"><EditIcon className="w-4 h-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(appointment.id); }} className="p-1 text-gray-400 hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
                </div>
            </div>
            <div className="mt-2 text-xs text-gray-300 bg-gray-700/50 rounded px-2 py-1 inline-block">
                {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
            </div>
            {appointment.description && <p className="text-xs text-gray-400 mt-2 italic">"{appointment.description}"</p>}
        </button>
    );
};


const SchedulePage: React.FC<SchedulePageProps> = ({ appointments, jobs, customers, vehicles, currentUser, handleSaveAppointment, handleDeleteAppointment, onViewJob, allServices, allUsers, allAppointments }) => {
    const [weekOffset, setWeekOffset] = useState(0); // 0 for current week, -1 for last, 1 for next
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null);

    const weekDays = useMemo(() => {
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + (weekOffset * 7));
        return Array.from({ length: 7 }).map((_, i) => {
            const day = new Date(startOfWeek);
            day.setDate(day.getDate() + i);
            return day;
        });
    }, [weekOffset]);

    const appointmentsByDay = useMemo(() => {
        const grouped: { [key: string]: Appointment[] } = {};
        appointments.forEach(appt => {
            const dayKey = new Date(appt.startTime).toDateString();
            if (!grouped[dayKey]) {
                grouped[dayKey] = [];
            }
            grouped[dayKey].push(appt);
            grouped[dayKey].sort((a, b) => a.startTime - b.startTime);
        });
        return grouped;
    }, [appointments]);
    
    const handleOpenModal = (appointment: Appointment | null) => {
        setAppointmentToEdit(appointment);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setAppointmentToEdit(null);
    };
    
    const onSave = (appointmentData: Appointment) => {
        handleSaveAppointment(appointmentData);
        handleCloseModal();
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Weekly Schedule</h1>
                    <p className="text-gray-400 mt-1">
                        {weekDays[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - {weekDays[6].toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={() => setWeekOffset(w => w - 1)} className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-md">&larr; Prev</button>
                    <button onClick={() => setWeekOffset(0)} className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-md">Today</button>
                    <button onClick={() => setWeekOffset(w => w + 1)} className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-md">Next &rarr;</button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                {weekDays.map(day => {
                    const dayKey = day.toDateString();
                    const dayAppointments = appointmentsByDay[dayKey] || [];
                    const isToday = day.toDateString() === new Date().toDateString();

                    return (
                        <div key={dayKey} className={`bg-gray-800 rounded-lg p-3 ${isToday ? 'border-2 border-blue-500' : ''}`}>
                            <h3 className={`font-bold text-center ${isToday ? 'text-blue-400' : 'text-white'}`}>
                                {day.toLocaleDateString('en-US', { weekday: 'short' })}
                            </h3>
                            <p className="text-sm text-gray-400 text-center mb-4">
                                {day.toLocaleDateString('en-US', { day: '2-digit' })}
                            </p>
                            <div className="space-y-2">
                               {dayAppointments.length > 0 ? (
                                   dayAppointments.map(appt => {
                                        const job = jobs.find(j => j.id === appt.jobId);
                                        const customer = customers.find(c => c.id === job?.customerId);
                                        const vehicle = vehicles.find(v => v.id === job?.vehicleId);
                                        return (
                                            <AppointmentCard 
                                                key={appt.id}
                                                appointment={appt}
                                                job={job}
                                                customer={customer}
                                                vehicle={vehicle}
                                                onEdit={handleOpenModal}
                                                onDelete={handleDeleteAppointment}
                                                onClick={() => onViewJob(appt.jobId)}
                                            />
                                        )
                                   })
                               ) : (
                                   <div className="h-20 flex items-center justify-center">
                                       <p className="text-xs text-gray-600 italic">No appointments</p>
                                   </div>
                               )}
                            </div>
                        </div>
                    )
                })}
            </div>

            <AppointmentFormModal 
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={onSave}
                appointmentToEdit={appointmentToEdit}
                jobToScheduleId={null} // Not used for editing from this page
                allJobs={jobs}
                allServices={allServices}
                allUsers={allUsers}
                allAppointments={allAppointments}
            />
        </div>
    );
};

export default SchedulePage;

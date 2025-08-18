
import React, { useState, useEffect } from 'react';
import { Appointment, Job, Service, User } from '../types';
import Modal from './Modal';
import { GoogleGenAI } from '@google/genai';
import { SparklesIcon } from './icons';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface AppointmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appointment: Appointment) => void;
  appointmentToEdit: Appointment | null;
  jobToScheduleId: string | null;
  allJobs: Job[];
  allServices: Service[];
  allUsers: User[];
  allAppointments: Appointment[];
}

// Helper to format Date object to "YYYY-MM-DDTHH:mm" string for datetime-local input
const toDateTimeLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const AppointmentFormModal: React.FC<AppointmentFormModalProps> = ({ isOpen, onClose, onSave, appointmentToEdit, jobToScheduleId, allJobs, allServices, allUsers, allAppointments }) => {
  
  const [jobId, setJobId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Appointment['status']>('scheduled');
  
  const [suggestedSlots, setSuggestedSlots] = useState<{startTime: string, endTime: string}[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);

  useEffect(() => {
    if (isOpen) {
        if (appointmentToEdit) {
            setJobId(appointmentToEdit.jobId);
            setStartTime(toDateTimeLocal(new Date(appointmentToEdit.startTime)));
            setEndTime(toDateTimeLocal(new Date(appointmentToEdit.endTime)));
            setDescription(appointmentToEdit.description || '');
            setStatus(appointmentToEdit.status);
        } else if (jobToScheduleId) {
            // Pre-fill for a new appointment from a job
            setJobId(jobToScheduleId);
            const now = new Date();
            now.setMinutes(0); // Round down to the hour
            const start = new Date(now);
            const end = new Date(now.getTime() + 3 * 60 * 60 * 1000); // Default to 3 hours
            setStartTime(toDateTimeLocal(start));
            setEndTime(toDateTimeLocal(end));
            setDescription('');
            setStatus('scheduled');
        } else {
             // Reset for a generic new appointment
            setJobId('');
            setStartTime('');
            setEndTime('');
            setDescription('');
            setStatus('scheduled');
        }
        // Reset AI state
        setSuggestedSlots([]);
        setIsSuggesting(false);
    }
  }, [appointmentToEdit, jobToScheduleId, isOpen]);

  const handleSuggestSlots = async () => {
    if (!jobId) {
        alert("Please select a job first.");
        return;
    }
    setIsSuggesting(true);
    setSuggestedSlots([]);
    try {
        const job = allJobs.find(j => j.id === jobId);
        if (!job) {
            throw new Error("Job not found");
        }
        
        // Calculate job duration
        let totalDuration = 0;
        job.jobItems.forEach(item => {
            const service = allServices.find(s => s.id === item.serviceId);
            if (!service) return;
            if (service.isPackage) {
                service.serviceIds.forEach(subId => {
                    const subService = allServices.find(ss => ss.id === subId);
                    totalDuration += subService?.estimatedDurationHours || 2;
                });
            } else {
                totalDuration += service.estimatedDurationHours || 2;
            }
        });

        const technicians = allUsers.filter(u => u.role === 'technician');
        const formattedAppointments = allAppointments.map(a => ({
            start: new Date(a.startTime).toISOString(),
            end: new Date(a.endTime).toISOString(),
            jobId: a.jobId
        }));
        
        const prompt = `You are a smart scheduling assistant for an auto detailing business. Find the 3 most optimal time slots to schedule a new ${totalDuration}-hour job.

        Constraints & Context:
        - The business operates from 8:00 AM to 6:00 PM local time.
        - The current date is ${new Date().toISOString()}.
        - Consider the list of existing appointments to avoid conflicts: ${JSON.stringify(formattedAppointments)}
        - The available technicians are: ${JSON.stringify(technicians.map(t => ({id: t.id, name: t.name})))}
        - The new job must be scheduled within the next 14 days.

        Prioritize minimizing gaps between appointments and maximizing technician utilization.

        Return your response ONLY as a JSON object with the following structure: { "suggestions": [{ "startTime": "YYYY-MM-DDTHH:mm:ss.sssZ", "endTime": "YYYY-MM-DDTHH:mm:ss.sssZ" }] }. Do not include any other text or explanations.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });

        const result = JSON.parse(response.text);
        setSuggestedSlots(result.suggestions || []);

    } catch (error) {
        console.error("Error suggesting slots:", error);
        alert("Failed to suggest time slots. Please check the console for details.");
    } finally {
        setIsSuggesting(false);
    }
  };

  const applySuggestion = (slot: {startTime: string, endTime: string}) => {
    setStartTime(toDateTimeLocal(new Date(slot.startTime)));
    setEndTime(toDateTimeLocal(new Date(slot.endTime)));
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobId || !startTime || !endTime) {
        alert("Please fill out all required fields.");
        return;
    }

    const startTimestamp = new Date(startTime).getTime();
    const endTimestamp = new Date(endTime).getTime();
    
    if (startTimestamp >= endTimestamp) {
        alert("End time must be after the start time.");
        return;
    }

    const id = appointmentToEdit ? appointmentToEdit.id : `appt_${Date.now()}`;
    
    onSave({
        id,
        jobId,
        startTime: startTimestamp,
        endTime: endTimestamp,
        description,
        status,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={appointmentToEdit ? 'Edit Appointment' : 'Schedule Job'}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="jobId" className="block text-sm font-medium text-gray-300">Job</label>
          <select
            id="jobId"
            value={jobId}
            onChange={e => setJobId(e.target.value)}
            required
            disabled={!!jobToScheduleId || !!appointmentToEdit}
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-800"
          >
            <option value="" disabled>Select a job to schedule...</option>
            {allJobs.filter(j => j.status !== 'completed' && j.status !== 'cancelled').map(job => (
              <option key={job.id} value={job.id}>Job #{job.id.substring(0, 6)}</option>
            ))}
          </select>
        </div>
        
        {/* AI Assist Section */}
        {!appointmentToEdit && (
            <div className="pt-4 border-t border-gray-700">
                <button
                    type="button"
                    onClick={handleSuggestSlots}
                    disabled={isSuggesting || !jobId}
                    className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                    <SparklesIcon className="w-5 h-5 mr-2" />
                    {isSuggesting ? 'Finding Best Slots...' : 'AI Assist: Suggest Time Slots'}
                </button>
                {suggestedSlots.length > 0 && (
                    <div className="mt-4 space-y-2">
                         <p className="text-xs text-center text-gray-400">Click a suggestion to apply it:</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {suggestedSlots.map((slot, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => applySuggestion(slot)}
                                className="text-center text-sm bg-gray-700 hover:bg-gray-600 rounded-md p-2 transition-colors"
                            >
                                <p>{new Date(slot.startTime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                                <p className="font-semibold">{new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </button>
                        ))}
                        </div>
                    </div>
                )}
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-300">Start Time</label>
                <input
                    type="datetime-local"
                    id="startTime"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    required
                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-blue-500 focus:border-blue-500"
                />
             </div>
             <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-300">End Time</label>
                <input
                    type="datetime-local"
                    id="endTime"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    required
                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-blue-500 focus:border-blue-500"
                />
             </div>
        </div>

        <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300">Notes / Description</label>
            <textarea
                name="description"
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
        </div>
        
        <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-300">Status</label>
            <select
                id="status"
                value={status}
                onChange={e => setStatus(e.target.value as Appointment['status'])}
                className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-blue-500 focus:border-blue-500"
            >
                <option value="scheduled">Scheduled</option>
                <option value="inProgress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
            </select>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 bg-gray-600 hover:bg-gray-700 text-gray-100 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            Save Appointment
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AppointmentFormModal;

import React, { useState } from 'react';
import { Job, Customer, Vehicle, Service, Checklist, User, JobItem, JobPhoto } from '../types';
import { CarIcon, UserCircleIcon, BriefcaseIcon, ChecklistIcon, CameraIcon, PencilAltIcon, DocumentDownloadIcon } from './icons';
import SignatureModal from './SignatureModal';
import jsPDF from 'jspdf';

// Interactive Checklist component for Technicians
const InteractiveChecklist: React.FC<{
    jobItem: JobItem;
    checklist: Checklist;
    disabled: boolean;
    onUpdate: (completedTasks: string[]) => void;
}> = ({ jobItem, checklist, disabled, onUpdate }) => {
    const completed = new Set(jobItem.checklistCompletedItems || []);

    const handleToggle = (task: string) => {
        if (disabled) return;
        const newCompleted = new Set(completed);
        if (newCompleted.has(task)) {
            newCompleted.delete(task);
        } else {
            newCompleted.add(task);
        }
        onUpdate(Array.from(newCompleted));
    };

    return (
        <div className="space-y-2">
            {!disabled && <p className="text-xs text-gray-400 mb-2">Check off tasks as you complete them.</p>}
            {disabled && <p className="text-xs text-yellow-400 mb-2">Checklist is disabled. Convert the job to a 'Work Order' to enable it.</p>}
            {checklist.tasks.map((task, index) => (
                <label key={index} className={`flex items-center p-3 bg-gray-700 rounded-md transition-colors ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-gray-600'}`}>
                    <input
                        type="checkbox"
                        checked={completed.has(task)}
                        onChange={() => handleToggle(task)}
                        disabled={disabled}
                        className="h-5 w-5 rounded bg-gray-800 border-gray-600 text-blue-500 focus:ring-blue-500 disabled:cursor-not-allowed"
                    />
                    <span className={`ml-3 text-white ${completed.has(task) ? 'line-through text-gray-400' : ''}`}>
                        {task}
                    </span>
                </label>
            ))}
        </div>
    );
};

// Read-only Checklist component for Admins
const ReadOnlyChecklist: React.FC<{
    jobItem: JobItem;
    checklist: Checklist;
}> = ({ jobItem, checklist }) => {
    const completed = new Set(jobItem.checklistCompletedItems || []);
    const progress = checklist.tasks.length > 0 ? Math.round((completed.size / checklist.tasks.length) * 100) : 0;

    return (
        <div>
             <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">Progress</span>
                <span className="text-sm font-semibold text-white">{progress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
            <ul className="space-y-2 mt-4">
                {checklist.tasks.map((task, index) => (
                    <li key={index} className={`flex items-center text-sm ${completed.has(task) ? 'text-gray-300' : 'text-gray-500'}`}>
                         <div className={`w-4 h-4 rounded-full flex items-center justify-center mr-3 ${completed.has(task) ? 'bg-blue-500' : 'bg-gray-600'}`}>
                            {completed.has(task) && <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        {task}
                    </li>
                ))}
            </ul>
        </div>
    );
};


interface JobDetailPageProps {
    job: Job;
    customer: Customer | undefined;
    vehicle: Vehicle | undefined;
    services: Service[];
    checklists: Checklist[];
    currentUser: User | null;
    onBack: () => void;
    onUpdateChecklist: (jobId: string, jobItemId: string, completedTasks: string[]) => void;
    onAddPhoto: (jobId: string, photoData: Omit<JobPhoto, 'id'>) => void;
    onApprove: (jobId: string, signatureDataUrl: string) => void;
}

const JobDetailPage: React.FC<JobDetailPageProps> = ({ job, customer, vehicle, services, checklists, currentUser, onBack, onUpdateChecklist, onAddPhoto, onApprove }) => {
    const isTechnician = currentUser?.role === 'technician';
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target && typeof event.target.result === 'string') {
                    const photoData = {
                        dataUrl: event.target.result,
                        type,
                        timestamp: Date.now()
                    };
                    onAddPhoto(job.id, photoData);
                }
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };
    
    const handleSaveSignature = (signatureDataUrl: string) => {
        onApprove(job.id, signatureDataUrl);
        setIsSignatureModalOpen(false);
    };

    const handleGeneratePdf = () => {
      if (!job || !customer || !vehicle) return;

      const doc = new jsPDF();
      const isInvoice = job.status === 'invoice' || job.status === 'completed' || job.paymentStatus === 'paid';
      const docTitle = isInvoice ? 'Invoice' : 'Estimate';

      // Header
      doc.setFontSize(22);
      doc.text('Detailing Pro', 14, 22);
      doc.setFontSize(16);
      doc.text(docTitle, 170, 22, { align: 'right' });
      doc.setFontSize(10);
      doc.text(`Job #${job.id.substring(0,6)}`, 196, 28, { align: 'right'});
      doc.text(`Date: ${new Date(job.estimateDate).toLocaleDateString()}`, 14, 30);

      // Customer & Vehicle Info
      doc.setLineWidth(0.5);
      doc.line(14, 40, 196, 40);
      doc.setFontSize(12);
      doc.text('Bill To:', 14, 48);
      doc.setFontSize(10);
      doc.text(customer.name, 14, 54);
      doc.text(customer.email, 14, 59);
      doc.text(customer.phone, 14, 64);
      
      doc.setFontSize(12);
      doc.text('Vehicle:', 110, 48);
      doc.setFontSize(10);
      doc.text(`${vehicle.year} ${vehicle.make} ${vehicle.model}`, 110, 54);
      doc.text(`Color: ${vehicle.color}`, 110, 59);
      doc.text(`VIN: ${vehicle.vin}`, 110, 64);
      doc.line(14, 70, 196, 70);

      // Line Items Table
      let yPos = 80;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Service Description', 14, yPos);
      doc.text('Total', 196, yPos, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      yPos += 7;

      job.jobItems.forEach(item => {
          const service = services.find(s => s.id === item.serviceId);
          if (service) {
              doc.text(service.name, 14, yPos);
              doc.text(`$${item.total.toFixed(2)}`, 196, yPos, { align: 'right' });
              yPos += 7;
          }
      });

      // Totals
      yPos += 3;
      doc.line(120, yPos, 196, yPos);
      yPos += 7;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Total Amount:', 140, yPos);
      doc.text(`$${job.totalAmount.toFixed(2)}`, 196, yPos, { align: 'right' });
      yPos += 7;
      doc.setFont('helvetica', 'normal');
      if (isInvoice) {
          doc.text('Amount Paid:', 140, yPos);
          doc.text(`$${job.paymentReceived.toFixed(2)}`, 196, yPos, { align: 'right' });
          yPos += 7;
          doc.setFont('helvetica', 'bold');
          doc.text('Balance Due:', 140, yPos);
          doc.text(`$${(job.totalAmount - job.paymentReceived).toFixed(2)}`, 196, yPos, { align: 'right' });
      }
      
      doc.save(`${docTitle}_${job.id.substring(0,6)}.pdf`);
    };

    return (
        <>
            <div className="container mx-auto p-4 md:p-8">
                <header className="mb-6 flex justify-between items-start">
                    <div>
                        <button onClick={onBack} className="flex items-center text-blue-400 hover:text-blue-300 mb-4 font-semibold">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            Back to List
                        </button>
                        <h1 className="text-3xl font-bold text-white">Job Details</h1>
                        <p className="text-gray-400 mt-1">Job #{job.id.substring(0,6)}</p>
                    </div>
                    <button onClick={handleGeneratePdf} className="flex items-center bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors mt-12">
                        <DocumentDownloadIcon className="w-5 h-5 mr-2" />
                        Download PDF
                    </button>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left column: Job and Customer info */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                            <h2 className="text-xl font-bold text-white flex items-center mb-4"><UserCircleIcon className="w-6 h-6 mr-3 text-gray-400"/>Customer</h2>
                            <p className="text-lg font-semibold">{customer?.name}</p>
                            <p className="text-gray-400">{customer?.phone}</p>
                            <p className="text-gray-400">{customer?.email}</p>
                        </div>
                        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                            <h2 className="text-xl font-bold text-white flex items-center mb-4"><CarIcon className="w-6 h-6 mr-3 text-gray-400"/>Vehicle</h2>
                            <p className="text-lg font-semibold">{vehicle?.make} {vehicle?.model}</p>
                            <p className="text-gray-400">{vehicle?.year} - {vehicle?.color}</p>
                            <p className="text-gray-400 font-mono text-xs mt-1">{vehicle?.vin}</p>
                        </div>
                        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                            <h2 className="text-xl font-bold text-white flex items-center mb-4"><BriefcaseIcon className="w-6 h-6 mr-3 text-gray-400"/>Job Summary</h2>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span>Status:</span> <span className="font-semibold capitalize">{job.status}</span></div>
                                <div className="flex justify-between"><span>Total:</span> <span className="font-semibold">${job.totalAmount.toFixed(2)}</span></div>
                                <div className="flex justify-between"><span>Paid:</span> <span className="font-semibold">${job.paymentReceived.toFixed(2)}</span></div>
                            </div>
                        </div>
                         {/* Customer Approval Section */}
                        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                            <h2 className="text-xl font-bold text-white flex items-center mb-4"><PencilAltIcon className="w-6 h-6 mr-3 text-gray-400"/>Approval</h2>
                            {job.customerApprovalStatus === 'approved' ? (
                                <div>
                                    <p className="text-sm text-green-400 font-semibold mb-2">Estimate Approved</p>
                                    {job.customerSignatureDataUrl && <img src={job.customerSignatureDataUrl} alt="Customer Signature" className="bg-gray-700 rounded-md p-2" />}
                                    <p className="text-xs text-gray-500 mt-2">Signed on: {job.approvalTimestamp ? new Date(job.approvalTimestamp).toLocaleString() : 'N/A'}</p>
                                </div>
                            ) : job.customerApprovalStatus === 'pending' && job.status === 'estimate' ? (
                                <div>
                                    <p className="text-sm text-yellow-400 font-semibold mb-3">Pending Customer Approval</p>
                                    {isTechnician && (
                                        <button onClick={() => setIsSignatureModalOpen(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                                            Get Customer Signature
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 italic">Approval not applicable for this job status.</p>
                            )}
                        </div>
                    </div>

                    {/* Right column: Services and Checklists */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Photo Documentation Section */}
                        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                            <h2 className="text-xl font-bold text-white flex items-center mb-4"><CameraIcon className="w-6 h-6 mr-3 text-gray-400"/>Photo Documentation</h2>
                            {isTechnician && (
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <label className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg text-center">
                                        + Add 'Before' Photo
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, 'before')} />
                                    </label>
                                    <label className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg text-center">
                                        + Add 'After' Photo
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, 'after')} />
                                    </label>
                                </div>
                            )}
                            {job.photos && job.photos.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {job.photos.map(photo => (
                                        <div key={photo.id} className="relative group">
                                            <img src={photo.dataUrl} alt={`${photo.type} photo`} className="rounded-md aspect-square object-cover" />
                                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs text-center py-1 rounded-b-md capitalize">
                                                {photo.type}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 italic text-center py-4">No photos have been uploaded for this job.</p>
                            )}
                        </div>
                        {job.jobItems.map(item => {
                            const service = services.find(s => s.id === item.serviceId);
                            const checklist = checklists.find(c => c.serviceId === item.serviceId);
                            const canInteractWithChecklist = isTechnician && job.status === 'workOrder';

                            if (!service) return null;

                            return (
                                <div key={item.id} className="bg-gray-800 p-6 rounded-lg shadow-lg">
                                    <h3 className="text-xl font-bold text-white">{service.name}</h3>
                                    {checklist ? (
                                        <div className="mt-4 pt-4 border-t border-gray-700">
                                            <h4 className="text-lg font-semibold text-white flex items-center mb-3">
                                                <ChecklistIcon className="w-5 h-5 mr-2 text-gray-400"/>
                                                {checklist.name}
                                            </h4>
                                            {isTechnician ? (
                                                <InteractiveChecklist
                                                    jobItem={item}
                                                    checklist={checklist}
                                                    disabled={!canInteractWithChecklist}
                                                    onUpdate={(completedTasks) => onUpdateChecklist(job.id, item.id, completedTasks)}
                                                />
                                            ) : (
                                                <ReadOnlyChecklist jobItem={item} checklist={checklist} />
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 mt-4 pt-4 border-t border-gray-700 italic">No checklist associated with this service.</p>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
            <SignatureModal 
                isOpen={isSignatureModalOpen}
                onClose={() => setIsSignatureModalOpen(false)}
                onSave={handleSaveSignature}
            />
        </>
    );
};

export default JobDetailPage;
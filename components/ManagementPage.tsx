
import React, { useState, useMemo } from 'react';
import { Service, PricingMatrix, Upcharge, Checklist, Customer, Vehicle, Job, Payment, Appointment, User, Promotion } from '../types';
import { PlusIcon, EditIcon, TrashIcon, PackageIcon, DealerIcon, SearchIcon, CalculatorIcon, UpchargeIcon, ChecklistIcon, UserGroupIcon, CarIcon, BriefcaseIcon, ArrowRightCircleIcon, ReceiptPercentIcon, CreditCardIcon, CalendarIcon, LinkIcon } from './icons';
import ServiceFormModal from './ServiceFormModal';
import PricingMatrixFormModal from './PricingMatrixFormModal';
import UpchargeFormModal from './UpchargeFormModal';
import ChecklistFormModal from './ChecklistFormModal';
import CustomerFormModal from './CustomerFormModal';
import JobFormModal from './JobFormModal';
import PaymentFormModal from './PaymentFormModal';
import AppointmentFormModal from './AppointmentFormModal';

const ServiceCard: React.FC<{ 
    service: Service;
    allServices: Service[];
    appliedMatrices: PricingMatrix[];
    hasChecklist: boolean;
    onEdit: (service: Service) => void;
    onDelete: (serviceId: string) => void;
}> = ({ service, allServices, appliedMatrices, hasChecklist, onEdit, onDelete }) => (
    <div className="bg-gray-800 rounded-lg shadow-lg p-5 flex flex-col justify-between hover:shadow-blue-500/20 hover:-translate-y-1 transition-all duration-300">
        <div>
            <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold text-white pr-4">{service.name}</h3>
                <span className="text-xl font-semibold text-blue-400">${service.basePrice}</span>
            </div>
            <div className="flex items-center space-x-4 mt-2 mb-3">
                {service.isPackage && (
                    <div className="flex items-center text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full">
                        <PackageIcon className="w-4 h-4 mr-1" />
                        Package
                    </div>
                )}
                {service.isDealerPackage && (
                    <div className="flex items-center text-xs bg-purple-900 text-purple-200 px-2 py-1 rounded-full">
                        <DealerIcon className="w-4 h-4 mr-1" />
                        Dealer
                    </div>
                )}
                 {hasChecklist && (
                    <div className="flex items-center text-xs bg-green-900 text-green-200 px-2 py-1 rounded-full">
                        <ChecklistIcon className="w-4 h-4 mr-1" />
                        Checklist
                    </div>
                )}
            </div>
            <p className="text-gray-400 text-sm mt-1 mb-4">{service.description}</p>
            
            {service.isPackage && service.serviceIds.length > 0 && (
                <div className="mb-4 pt-3 border-t border-gray-700/50">
                    <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Included Services</h4>
                    <ul className="space-y-1">
                        {service.serviceIds.map(id => {
                            const includedService = allServices.find(s => s.id === id);
                            return includedService ? (
                                <li key={id} className="text-sm text-gray-300 bg-gray-700/40 px-2 py-1 rounded-md">
                                    {includedService.name}
                                </li>
                            ) : null;
                        })}
                    </ul>
                </div>
            )}
            
            {appliedMatrices.length > 0 && (
                 <div className="mb-4 pt-3 border-t border-gray-700/50">
                    <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Pricing Rules Applied</h4>
                    <div className="flex flex-wrap gap-2">
                        {appliedMatrices.map(matrix => (
                             <div key={matrix.id} className="flex items-center text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full">
                                <CalculatorIcon className="w-4 h-4 mr-1.5" />
                                {matrix.name}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
        <div className="flex justify-end space-x-2 border-t border-gray-700 pt-3 mt-auto">
            <button onClick={() => onEdit(service)} className="p-2 text-gray-400 hover:text-blue-400 transition-colors rounded-full hover:bg-gray-700">
                <EditIcon className="w-5 h-5" />
            </button>
            <button onClick={() => onDelete(service.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-gray-700">
                <TrashIcon className="w-5 h-5" />
            </button>
        </div>
    </div>
);


const PricingMatrixCard: React.FC<{
    matrix: PricingMatrix;
    allServices: Service[];
    onEdit: (matrix: PricingMatrix) => void;
    onDelete: (matrixId: string) => void;
}> = ({ matrix, allServices, onEdit, onDelete }) => (
    <div className="bg-gray-800 rounded-lg shadow-lg p-5 flex flex-col justify-between">
        <div>
            <h3 className="text-lg font-bold text-white mb-3">{matrix.name}</h3>
            
            <div className="mb-4">
                <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Rules</h4>
                <ul className="space-y-1 text-sm">
                    {matrix.rules.map(rule => (
                        <li key={rule.id} className="flex justify-between items-center bg-gray-700/40 px-2 py-1 rounded-md">
                            <span>{rule.factor}</span>
                            <span className="font-mono text-blue-300">
                                {rule.adjustmentType === 'percentage' ? `${rule.adjustmentValue}%` : `$${rule.adjustmentValue.toFixed(2)}`}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="mb-4">
                <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Applied to {matrix.appliesToServiceIds.length} Service(s)</h4>
                 <div className="flex flex-wrap gap-2">
                    {matrix.appliesToServiceIds.map(serviceId => {
                        const service = allServices.find(s => s.id === serviceId);
                        return service ? (
                             <span key={serviceId} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full">{service.name}</span>
                        ) : null;
                    })}
                </div>
            </div>
        </div>
        <div className="flex justify-end space-x-2 border-t border-gray-700 pt-3 mt-4">
            <button onClick={() => onEdit(matrix)} className="p-2 text-gray-400 hover:text-blue-400 transition-colors rounded-full hover:bg-gray-700">
                <EditIcon className="w-5 h-5" />
            </button>
            <button onClick={() => onDelete(matrix.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-gray-700">
                <TrashIcon className="w-5 h-5" />
            </button>
        </div>
    </div>
);

const UpchargeCard: React.FC<{
    upcharge: Upcharge;
    onEdit: (upcharge: Upcharge) => void;
    onDelete: (upchargeId: string) => void;
}> = ({ upcharge, onEdit, onDelete }) => (
    <div className="bg-gray-800 rounded-lg shadow-lg p-5 flex flex-col justify-between">
        <div>
            <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold text-white pr-4">{upcharge.name}</h3>
                <span className="text-xl font-semibold text-blue-400">
                     {upcharge.isPercentage ? `${upcharge.defaultAmount}%` : `$${upcharge.defaultAmount.toFixed(2)}`}
                </span>
            </div>
            <p className="text-gray-400 text-sm mt-2 mb-4">{upcharge.description}</p>
        </div>
        <div className="flex justify-end space-x-2 border-t border-gray-700 pt-3 mt-auto">
            <button onClick={() => onEdit(upcharge)} className="p-2 text-gray-400 hover:text-blue-400 transition-colors rounded-full hover:bg-gray-700">
                <EditIcon className="w-5 h-5" />
            </button>
            <button onClick={() => onDelete(upcharge.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-gray-700">
                <TrashIcon className="w-5 h-5" />
            </button>
        </div>
    </div>
);

const ChecklistCard: React.FC<{
    checklist: Checklist;
    allServices: Service[];
    onEdit: (checklist: Checklist) => void;
    onDelete: (checklistId: string) => void;
}> = ({ checklist, allServices, onEdit, onDelete }) => {
    const associatedService = allServices.find(s => s.id === checklist.serviceId);
    return (
        <div className="bg-gray-800 rounded-lg shadow-lg p-5 flex flex-col justify-between">
            <div>
                <h3 className="text-lg font-bold text-white mb-2">{checklist.name}</h3>
                {associatedService && (
                    <div className="mb-4">
                        <span className="text-xs font-semibold uppercase text-gray-500 mr-2">APPLIES TO:</span>
                        <span className="text-sm text-blue-300 bg-gray-700/50 px-2 py-1 rounded">{associatedService.name}</span>
                    </div>
                )}
                
                <div className="mb-4">
                    <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Tasks ({checklist.tasks.length})</h4>
                    <ul className="space-y-1 text-sm list-disc list-inside text-gray-400 max-h-32 overflow-y-auto pr-2">
                        {checklist.tasks.map((task, index) => (
                            <li key={index} className="truncate">{task}</li>
                        ))}
                    </ul>
                </div>
            </div>
            <div className="flex justify-end space-x-2 border-t border-gray-700 pt-3 mt-4">
                <button onClick={() => onEdit(checklist)} className="p-2 text-gray-400 hover:text-blue-400 transition-colors rounded-full hover:bg-gray-700">
                    <EditIcon className="w-5 h-5" />
                </button>
                <button onClick={() => onDelete(checklist.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-gray-700">
                    <TrashIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

const CustomerCard: React.FC<{
    customer: Customer;
    vehicles: Vehicle[];
    onEdit: (customer: Customer) => void;
    onDelete: (customerId: string) => void;
}> = ({ customer, vehicles, onEdit, onDelete }) => (
    <div className="bg-gray-800 rounded-lg shadow-lg p-5 flex flex-col justify-between">
        <div>
            <h3 className="text-lg font-bold text-white">{customer.name}</h3>
            <p className="text-sm text-gray-400">{customer.phone}</p>
            <p className="text-sm text-gray-400">{customer.email}</p>
            
            <div className="mt-4 pt-4 border-t border-gray-700/50">
                <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Vehicles ({vehicles.length})</h4>
                <ul className="space-y-1">
                    {vehicles.map(vehicle => (
                        <li key={vehicle.id} className="flex items-center text-sm text-gray-300 bg-gray-700/40 px-2 py-1 rounded-md">
                            <CarIcon className="w-4 h-4 mr-2 text-gray-400" />
                            {vehicle.year} {vehicle.make} {vehicle.model}
                        </li>
                    ))}
                    {vehicles.length === 0 && <li className="text-sm text-gray-500 italic">No vehicles on file.</li>}
                </ul>
            </div>
        </div>
        <div className="flex justify-end space-x-2 border-t border-gray-700 pt-3 mt-4">
            <button onClick={() => onEdit(customer)} className="p-2 text-gray-400 hover:text-blue-400 transition-colors rounded-full hover:bg-gray-700">
                <EditIcon className="w-5 h-5" />
            </button>
            <button onClick={() => onDelete(customer.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-gray-700">
                <TrashIcon className="w-5 h-5" />
            </button>
        </div>
    </div>
);

const JobCard: React.FC<{
    job: Job;
    customer: Customer | undefined;
    vehicle: Vehicle | undefined;
    isScheduled: boolean;
    onEdit: (job: Job) => void;
    onDelete: (jobId: string) => void;
    onConvertToWorkOrder: (jobId: string) => void;
    onGenerateInvoice: (jobId: string) => void;
    onRecordPayment: (job: Job) => void;
    onSchedule: (jobId: string) => void;
    onShare: (jobId: string) => void;
}> = ({ job, customer, vehicle, isScheduled, onEdit, onDelete, onConvertToWorkOrder, onGenerateInvoice, onRecordPayment, onSchedule, onShare }) => {
    const statusColor = {
        estimate: 'bg-yellow-800 text-yellow-200',
        workOrder: 'bg-blue-800 text-blue-200',
        invoice: 'bg-purple-800 text-purple-200',
        completed: 'bg-green-800 text-green-200',
        cancelled: 'bg-gray-700 text-gray-300',
    };
    
    const paymentStatusColor = {
        unpaid: 'text-red-400',
        partial: 'text-yellow-400',
        paid: 'text-green-400',
    };

    const renderAction = () => {
        if (!isScheduled && (job.status === 'estimate' || job.status === 'workOrder')) {
            return (
                <button onClick={() => onSchedule(job.id)} className="w-full flex items-center justify-center bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-3 rounded-lg transition-colors text-sm">
                    <CalendarIcon className="w-5 h-5 mr-2" />
                    Schedule Job
                </button>
            );
        }

        switch (job.status) {
            case 'estimate':
                return (
                    <button onClick={() => onConvertToWorkOrder(job.id)} className="w-full flex items-center justify-center bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-3 rounded-lg transition-colors text-sm">
                        <ArrowRightCircleIcon className="w-5 h-5 mr-2" />
                        Convert to Work Order
                    </button>
                );
            case 'workOrder':
                return (
                    <button onClick={() => onGenerateInvoice(job.id)} className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg transition-colors text-sm">
                        <ReceiptPercentIcon className="w-5 h-5 mr-2" />
                        Generate Invoice
                    </button>
                );
            case 'invoice':
                 return (
                    <button onClick={() => onRecordPayment(job)} className="w-full flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3 rounded-lg transition-colors text-sm">
                        <CreditCardIcon className="w-5 h-5 mr-2" />
                        Record Payment
                    </button>
                );
            default:
                return <div className="h-[38px]"></div>; // Placeholder for consistent height
        }
    };

    return (
        <div className="bg-gray-800 rounded-lg shadow-lg flex flex-col justify-between">
            <div className="p-5">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-bold text-white">{customer?.name || 'N/A'}</h3>
                        <p className="text-sm text-gray-400">
                            {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'N/A'}
                        </p>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                        <span className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${statusColor[job.status] || statusColor.cancelled}`}>
                            {job.status}
                        </span>
                        {isScheduled && (
                            <span className="text-xs font-semibold flex items-center bg-teal-800 text-teal-200 px-2 py-1 rounded-full">
                                <CalendarIcon className="w-3 h-3 mr-1.5" />
                                Scheduled
                            </span>
                        )}
                    </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-700/50">
                    <div className="flex justify-between items-baseline">
                        <h4 className="text-sm font-semibold text-gray-300">Total:</h4>
                        <span className="text-2xl font-bold text-blue-400">${job.totalAmount.toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between items-baseline mt-2">
                        <h4 className="text-sm font-semibold text-gray-300">Paid:</h4>
                        <span className={`text-lg font-semibold ${paymentStatusColor[job.paymentStatus]}`}>
                            ${job.paymentReceived.toFixed(2)}
                        </span>
                    </div>
                     <div className="flex justify-between items-baseline mt-1">
                        <h4 className="text-xs text-gray-500">Created:</h4>
                        <span className="text-xs text-gray-400">{new Date(job.estimateDate).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
            <div className="bg-gray-900/50 p-3 mt-auto">
                <div className="flex justify-between items-center">
                    <div className="flex-grow pr-3">
                        {renderAction()}
                    </div>
                    <div className="flex items-center space-x-1 flex-shrink-0">
                         <button onClick={() => onShare(job.id)} className="p-2 text-gray-400 hover:text-green-400 transition-colors rounded-full hover:bg-gray-700" title="Share Customer Link">
                            <LinkIcon className="w-5 h-5" />
                        </button>
                         <button onClick={() => onEdit(job)} className="p-2 text-gray-400 hover:text-blue-400 transition-colors rounded-full hover:bg-gray-700" title="Edit Job" disabled={job.status === 'completed' || job.status === 'cancelled'}>
                            <EditIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => onDelete(job.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-gray-700" title="Delete Job">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface ManagementPageProps {
    services: Service[];
    pricingMatrices: PricingMatrix[];
    upcharges: Upcharge[];
    checklists: Checklist[];
    customers: Customer[];
    vehicles: Vehicle[];
    jobs: Job[];
    appointments: Appointment[];
    promotions: Promotion[];
    users: User[];
    currentUser: User | null;
    handleSaveService: (service: Service) => void;
    handleDeleteService: (serviceId: string) => void;
    handleSaveMatrix: (matrix: PricingMatrix) => void;
    handleDeleteMatrix: (matrixId: string) => void;
    handleSaveUpcharge: (upcharge: Upcharge) => void;
    handleDeleteUpcharge: (upchargeId: string) => void;
    handleSaveChecklist: (checklist: Checklist) => void;
    handleDeleteChecklist: (checklistId: string) => void;
    handleSaveCustomer: (customer: Customer, vehicles: Vehicle[]) => Promise<Customer>;
    handleDeleteCustomer: (customerId: string) => void;
    handleSaveJob: (job: Job) => void;
    handleDeleteJob: (jobId: string) => void;
    handleConvertToWorkOrder: (jobId: string) => void;
    handleGenerateInvoice: (jobId: string) => void;
    handleSavePayment: (jobId: string, payment: Payment) => void;
    handleSaveAppointment: (appointment: Appointment) => void;
}

const ManagementPage: React.FC<ManagementPageProps> = ({
    services,
    pricingMatrices,
    upcharges,
    checklists,
    customers,
    vehicles,
    jobs,
    appointments,
    promotions,
    users,
    currentUser,
    handleSaveService,
    handleDeleteService,
    handleSaveMatrix,
    handleDeleteMatrix,
    handleSaveUpcharge,
    handleDeleteUpcharge,
    handleSaveChecklist,
    handleDeleteChecklist,
    handleSaveCustomer,
    handleDeleteCustomer,
    handleSaveJob,
    handleDeleteJob,
    handleConvertToWorkOrder,
    handleGenerateInvoice,
    handleSavePayment,
    handleSaveAppointment,
}) => {
  // Local UI state for modals and filters is still needed
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState<Service | null>(null);

  const [isMatrixModalOpen, setIsMatrixModalOpen] = useState(false);
  const [matrixToEdit, setMatrixToEdit] = useState<PricingMatrix | null>(null);

  const [isUpchargeModalOpen, setIsUpchargeModalOpen] = useState(false);
  const [upchargeToEdit, setUpchargeToEdit] = useState<Upcharge | null>(null);

  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [checklistToEdit, setChecklistToEdit] = useState<Checklist | null>(null);
  
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [jobToEdit, setJobToEdit] = useState<Job | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [jobForPayment, setJobForPayment] = useState<Job | null>(null);

  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [jobToScheduleId, setJobToScheduleId] = useState<string | null>(null);


  const [searchTerm, setSearchTerm] = useState('');
  const [filterPackages, setFilterPackages] = useState(false);
  const [filterDealer, setFilterDealer] = useState(false);

  // Modal Handlers that also close the modal on save
  const handleOpenServiceModal = (service: Service | null) => {
    setServiceToEdit(service);
    setIsServiceModalOpen(true);
  };
  const handleCloseServiceModal = () => {
    setIsServiceModalOpen(false);
    setServiceToEdit(null);
  };
  const onSaveService = (serviceData: Service) => {
    handleSaveService(serviceData);
    handleCloseServiceModal();
  };
  
  const handleOpenMatrixModal = (matrix: PricingMatrix | null) => {
    setMatrixToEdit(matrix);
    setIsMatrixModalOpen(true);
  };
  const handleCloseMatrixModal = () => {
    setIsMatrixModalOpen(false);
    setMatrixToEdit(null);
  };
  const onSaveMatrix = (matrixData: PricingMatrix) => {
    handleSaveMatrix(matrixData);
    handleCloseMatrixModal();
  };
  
  const handleOpenUpchargeModal = (upcharge: Upcharge | null) => {
    setUpchargeToEdit(upcharge);
    setIsUpchargeModalOpen(true);
  };
  const handleCloseUpchargeModal = () => {
    setIsUpchargeModalOpen(false);
    setUpchargeToEdit(null);
  };
  const onSaveUpcharge = (upchargeData: Upcharge) => {
    handleSaveUpcharge(upchargeData);
    handleCloseUpchargeModal();
  };
  
  const handleOpenChecklistModal = (checklist: Checklist | null) => {
    setChecklistToEdit(checklist);
    setIsChecklistModalOpen(true);
  };
  const handleCloseChecklistModal = () => {
    setIsChecklistModalOpen(false);
    setChecklistToEdit(null);
  };
  const onSaveChecklist = (checklistData: Checklist) => {
    handleSaveChecklist(checklistData);
    handleCloseChecklistModal();
  };
  
  const handleOpenCustomerModal = (customer: Customer | null) => {
    setCustomerToEdit(customer);
    setIsCustomerModalOpen(true);
  };
  const handleCloseCustomerModal = () => {
    setIsCustomerModalOpen(false);
    setCustomerToEdit(null);
  };
  const onSaveCustomer = async (customerData: Customer, vehicleData: Vehicle[]) => {
    await handleSaveCustomer(customerData, vehicleData);
    handleCloseCustomerModal();
  };
  
  const handleOpenJobModal = (job: Job | null) => {
    setJobToEdit(job);
    setIsJobModalOpen(true);
  };
  const handleCloseJobModal = () => {
    setIsJobModalOpen(false);
    setJobToEdit(null);
  };
  const onSaveJob = (jobData: Job) => {
    handleSaveJob(jobData);
    handleCloseJobModal();
  }
 
  const handleOpenPaymentModal = (job: Job) => {
    setJobForPayment(job);
    setIsPaymentModalOpen(true);
  };
  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setJobForPayment(null);
  };
  const onSavePayment = (jobId: string, payment: Payment) => {
    handleSavePayment(jobId, payment);
    handleClosePaymentModal();
  };

  const handleOpenAppointmentModal = (jobId: string) => {
    setJobToScheduleId(jobId);
    setIsAppointmentModalOpen(true);
  };
  const handleCloseAppointmentModal = () => {
    setIsAppointmentModalOpen(false);
    setJobToScheduleId(null);
  };
  const onSaveAppointment = (appointmentData: Appointment) => {
    handleSaveAppointment(appointmentData);
    handleCloseAppointmentModal();
  };

  const handleShareJobLink = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (job && job.publicLinkKey) {
        const url = `${window.location.origin}${window.location.pathname}?jobKey=${job.publicLinkKey}`;
        navigator.clipboard.writeText(url).then(() => {
            alert('Customer portal link copied to clipboard!');
        }, (err) => {
            console.error('Could not copy text: ', err);
            alert('Failed to copy link.');
        });
    } else {
        alert('Could not find a shareable link for this job.');
    }
  };

  const filteredServices = useMemo(() => {
    return services.filter(service => {
        const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              service.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPackageFilter = !filterPackages || service.isPackage;
        const matchesDealerFilter = !filterDealer || service.isDealerPackage;

        return matchesSearch && matchesPackageFilter && matchesDealerFilter;
    });
  }, [services, searchTerm, filterPackages, filterDealer]);
  
  const scheduledJobIds = useMemo(() => new Set(appointments.map(a => a.jobId)), [appointments]);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div>
            <h1 className="text-3xl font-bold text-white">Management</h1>
            <p className="text-gray-400 mt-1">Manage all aspects of your auto detailing business.</p>
        </div>
      </header>

      {/* Job Management Section */}
      <section id="jobs" className="mb-16">
        <header className="flex flex-wrap justify-between items-center mb-6 gap-4">
            <div>
                <h2 className="text-2xl font-bold text-white">Job Management</h2>
                <p className="text-gray-400 mt-1">Create estimates, manage work orders, and track invoices.</p>
            </div>
            <button
              onClick={() => handleOpenJobModal(null)}
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
            >
              <BriefcaseIcon className="w-5 h-5 mr-2" />
              Create New Job
            </button>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map(job => (
                <JobCard 
                    key={job.id}
                    job={job}
                    customer={customers.find(c => c.id === job.customerId)}
                    vehicle={vehicles.find(v => v.id === job.vehicleId)}
                    isScheduled={scheduledJobIds.has(job.id)}
                    onEdit={handleOpenJobModal}
                    onDelete={handleDeleteJob}
                    onConvertToWorkOrder={handleConvertToWorkOrder}
                    onGenerateInvoice={handleGenerateInvoice}
                    onRecordPayment={handleOpenPaymentModal}
                    onSchedule={handleOpenAppointmentModal}
                    onShare={handleShareJobLink}
                />
            ))}
        </div>
        {jobs.length === 0 && (
            <div className="text-center py-16 bg-gray-800 rounded-lg">
                <h3 className="text-xl text-gray-400">No jobs found.</h3>
                <p className="text-gray-500 mt-2">Click "Create New Job" to get started.</p>
            </div>
        )}
      </section>
      
      {/* Customer Management Section */}
      <section id="customers" className="mb-16">
        <header className="flex flex-wrap justify-between items-center mb-6 gap-4">
            <div>
                <h2 className="text-2xl font-bold text-white">Customer Management (CRM)</h2>
                <p className="text-gray-400 mt-1">Manage your clients and their vehicles.</p>
            </div>
            <button
              onClick={() => handleOpenCustomerModal(null)}
              className="flex items-center bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
            >
              <UserGroupIcon className="w-5 h-5 mr-2" />
              Add Customer
            </button>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {customers.map(customer => (
                <CustomerCard 
                    key={customer.id}
                    customer={customer}
                    vehicles={vehicles.filter(v => v.customerId === customer.id)}
                    onEdit={handleOpenCustomerModal}
                    onDelete={handleDeleteCustomer}
                />
            ))}
        </div>
        {customers.length === 0 && (
            <div className="text-center py-16 bg-gray-800 rounded-lg">
                <h3 className="text-xl text-gray-400">No customers found.</h3>
                <p className="text-gray-500 mt-2">Click "Add Customer" to get started.</p>
            </div>
        )}
      </section>

      {/* Service Management Section */}
      <section id="services" className="mb-16">
        <header className="flex flex-wrap justify-between items-center mb-6 gap-4">
            <div>
                <h2 className="text-2xl font-bold text-white">Service Management</h2>
                <p className="text-gray-400 mt-1">Manage your auto detailing services and packages.</p>
            </div>
            <button
              onClick={() => handleOpenServiceModal(null)}
              className="flex items-center bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Add Service
            </button>
        </header>
        <div className="mb-8 p-4 bg-gray-800 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="relative md:col-span-1">
                    <input
                        type="text"
                        placeholder="Search services..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 pl-10 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <SearchIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                <div className="md:col-span-2 flex items-center justify-start md:justify-end space-x-6">
                    <div className="flex items-center">
                        <input
                            id="filterPackages"
                            name="filterPackages"
                            type="checkbox"
                            checked={filterPackages}
                            onChange={e => setFilterPackages(e.target.checked)}
                            className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="filterPackages" className="ml-2 block text-sm text-gray-300">Packages Only</label>
                    </div>
                    <div className="flex items-center">
                        <input
                            id="filterDealer"
                            name="filterDealer"
                            type="checkbox"
                            checked={filterDealer}
                            onChange={e => setFilterDealer(e.target.checked)}
                            className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="filterDealer" className="ml-2 block text-sm text-gray-300">Dealer Only</label>
                    </div>
                </div>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map(service => {
                const appliedMatrices = pricingMatrices.filter(m => m.appliesToServiceIds.includes(service.id));
                const hasChecklist = checklists.some(c => c.serviceId === service.id);
                return (
                    <ServiceCard 
                        key={service.id} 
                        service={service} 
                        allServices={services}
                        appliedMatrices={appliedMatrices}
                        hasChecklist={hasChecklist}
                        onEdit={handleOpenServiceModal}
                        onDelete={handleDeleteService}
                    />
                );
            })}
        </div>
        {filteredServices.length === 0 && (
            <div className="text-center py-16">
                <h3 className="text-xl text-gray-400">No services found.</h3>
                <p className="text-gray-500 mt-2">Try adjusting your search or filter criteria.</p>
            </div>
        )}
      </section>

      {/* Pricing Matrices Section */}
      <section id="pricing" className="mb-16">
        <header className="flex flex-wrap justify-between items-center mb-6 gap-4">
            <div>
                <h2 className="text-2xl font-bold text-white">Pricing Matrices</h2>
                <p className="text-gray-400 mt-1">Define rules to dynamically adjust service prices.</p>
            </div>
            <button
              onClick={() => handleOpenMatrixModal(null)}
              className="flex items-center bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
            >
              <CalculatorIcon className="w-5 h-5 mr-2" />
              Add Pricing Matrix
            </button>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pricingMatrices.map(matrix => (
                <PricingMatrixCard 
                    key={matrix.id}
                    matrix={matrix}
                    allServices={services}
                    onEdit={handleOpenMatrixModal}
                    onDelete={handleDeleteMatrix}
                />
            ))}
        </div>
        {pricingMatrices.length === 0 && (
            <div className="text-center py-16 bg-gray-800 rounded-lg">
                <h3 className="text-xl text-gray-400">No pricing matrices found.</h3>
                <p className="text-gray-500 mt-2">Click "Add Pricing Matrix" to create your first set of rules.</p>
            </div>
        )}
      </section>

      {/* Upcharges Section */}
      <section id="upcharges" className="mb-16">
        <header className="flex flex-wrap justify-between items-center mb-6 gap-4">
            <div>
                <h2 className="text-2xl font-bold text-white">Upcharges</h2>
                <p className="text-gray-400 mt-1">Manage common, standalone service charges.</p>
            </div>
            <button
              onClick={() => handleOpenUpchargeModal(null)}
              className="flex items-center bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
            >
              <UpchargeIcon className="w-5 h-5 mr-2" />
              Add Upcharge
            </button>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcharges.map(upcharge => (
                <UpchargeCard 
                    key={upcharge.id}
                    upcharge={upcharge}
                    onEdit={handleOpenUpchargeModal}
                    onDelete={handleDeleteUpcharge}
                />
            ))}
        </div>
         {upcharges.length === 0 && (
            <div className="text-center py-16 bg-gray-800 rounded-lg">
                <h3 className="text-xl text-gray-400">No upcharges found.</h3>
                <p className="text-gray-500 mt-2">Click "Add Upcharge" to create your first one.</p>
            </div>
        )}
      </section>

      {/* Checklists Section */}
      <section id="checklists" className="mb-16">
        <header className="flex flex-wrap justify-between items-center mb-6 gap-4">
            <div>
                <h2 className="text-2xl font-bold text-white">Checklists</h2>
                <p className="text-gray-400 mt-1">Define standard operating procedures for your services.</p>
            </div>
            <button
              onClick={() => handleOpenChecklistModal(null)}
              className="flex items-center bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
            >
              <ChecklistIcon className="w-5 h-5 mr-2" />
              Add Checklist
            </button>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {checklists.map(checklist => (
                <ChecklistCard 
                    key={checklist.id}
                    checklist={checklist}
                    allServices={services}
                    onEdit={handleOpenChecklistModal}
                    onDelete={handleDeleteChecklist}
                />
            ))}
        </div>
         {checklists.length === 0 && (
            <div className="text-center py-16 bg-gray-800 rounded-lg">
                <h3 className="text-xl text-gray-400">No checklists found.</h3>
                <p className="text-gray-500 mt-2">Click "Add Checklist" to create a procedure.</p>
            </div>
        )}
      </section>

      <ServiceFormModal
        isOpen={isServiceModalOpen}
        onClose={handleCloseServiceModal}
        onSave={onSaveService}
        serviceToEdit={serviceToEdit}
        allServices={services}
      />
      <PricingMatrixFormModal
        isOpen={isMatrixModalOpen}
        onClose={handleCloseMatrixModal}
        onSave={onSaveMatrix}
        matrixToEdit={matrixToEdit}
        allServices={services}
      />
      <UpchargeFormModal
        isOpen={isUpchargeModalOpen}
        onClose={handleCloseUpchargeModal}
        onSave={onSaveUpcharge}
        upchargeToEdit={upchargeToEdit}
      />
      <ChecklistFormModal
        isOpen={isChecklistModalOpen}
        onClose={handleCloseChecklistModal}
        onSave={onSaveChecklist}
        checklistToEdit={checklistToEdit}
        allServices={services}
      />
      <CustomerFormModal
        isOpen={isCustomerModalOpen}
        onClose={handleCloseCustomerModal}
        onSave={onSaveCustomer}
        customerToEdit={customerToEdit}
        allVehicles={vehicles}
       />
       <JobFormModal
        isOpen={isJobModalOpen}
        onClose={handleCloseJobModal}
        onSave={onSaveJob}
        jobToEdit={jobToEdit}
        customers={customers}
        vehicles={vehicles}
        services={services}
        pricingMatrices={pricingMatrices}
        upcharges={upcharges}
        promotions={promotions}
        onSaveCustomer={handleSaveCustomer}
      />
      <PaymentFormModal
        isOpen={isPaymentModalOpen}
        onClose={handleClosePaymentModal}
        onSave={onSavePayment}
        job={jobForPayment}
      />
      <AppointmentFormModal
        isOpen={isAppointmentModalOpen}
        onClose={handleCloseAppointmentModal}
        onSave={onSaveAppointment}
        appointmentToEdit={null}
        jobToScheduleId={jobToScheduleId}
        allJobs={jobs}
        allServices={services}
        allUsers={users}
        allAppointments={appointments}
      />
    </div>
  );
};

export default ManagementPage;

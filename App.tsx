
import React, { useState, useMemo, useEffect } from 'react';
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-react';
import Layout from './components/Layout';
import DashboardPage from './components/DashboardPage';
import ManagementPage from './components/ManagementPage';
import SchedulePage from './components/SchedulePage';
import SettingsPage from './components/SettingsPage';
import JobDetailPage from './components/JobDetailPage';
import ReportsPage from './components/ReportsPage';
import InventoryPage from './components/InventoryPage';
import MarketingPage from './components/MarketingPage';
import CustomerPortalPage from './components/CustomerPortalPage';
import StripeOnboarding from './components/StripeOnboarding';
import LandingPage from './components/LandingPage'; // Import the new Landing Page
import { initialServices, initialPricingMatrices, initialUpcharges, initialChecklists, initialCustomers, initialVehicles, initialJobs, initialAppointments, initialUsers, initialCompany, initialProducts, initialSuppliers, initialPromotions } from './data/mockData';
import { Service, PricingMatrix, Upcharge, Checklist, Customer, Vehicle, Job, Payment, Appointment, User, Company, JobPhoto, Page, Product, Supplier, Promotion, Campaign } from './types';

function App() {
  const [activePage, setActivePage] = useState<Page>('dashboard');

  // Centralized State
  const [services, setServices] = useState<Service[]>(initialServices);
  const [pricingMatrices, setPricingMatrices] = useState<PricingMatrix[]>(initialPricingMatrices);
  const [upcharges, setUpcharges] = useState<Upcharge[]>(initialUpcharges);
  const [checklists, setChecklists] = useState<Checklist[]>(initialChecklists);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [company, setCompany] = useState<Company>(initialCompany);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [promotions, setPromotions] = useState<Promotion[]>(initialPromotions);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [publicJob, setPublicJob] = useState<Job | null>(null); // State for the customer portal job

  const { user, isLoaded } = useUser();

  // Top-level routing for Customer Portal
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const jobKey = urlParams.get('jobKey');
    if (jobKey) {
        const foundJob = initialJobs.find(j => j.publicLinkKey === jobKey);
        if (foundJob) {
            setPublicJob(foundJob);
        }
    }
  }, []); // Run once on initial load

  const currentUser = useMemo(() => {
      if (!isLoaded || !user) return null;
      return users.find(u => u.email === user.primaryEmailAddress?.emailAddress) || null;
  }, [user, isLoaded, users]);

  // When user switches, if they are on a page they can't access, move them to dashboard
  useEffect(() => {
    const adminPages: Page[] = ['management', 'settings', 'reports', 'inventory', 'marketing', 'stripe-onboarding'];
    if (currentUser?.role === 'technician' && adminPages.includes(activePage)) {
        setActivePage('dashboard');
    }
  }, [currentUser, activePage]);


  // Handlers
  const handleSaveService = (serviceData: Service) => {
    setServices(prev => {
        const exists = prev.some(s => s.id === serviceData.id);
        return exists ? prev.map(s => s.id === serviceData.id ? serviceData : s) : [...prev, serviceData];
    });
  };
  const handleDeleteService = (serviceId: string) => {
    if (window.confirm('Are you sure you want to delete this service? This will also remove it from any packages, pricing rules, and checklists.')) {
        setServices(prev => prev.filter(s => s.id !== serviceId));
        setPricingMatrices(prev => prev.map(matrix => ({
            ...matrix,
            appliesToServiceIds: matrix.appliesToServiceIds.filter(id => id !== serviceId)
        })));
        setChecklists(prev => prev.filter(c => c.serviceId !== serviceId));
    }
  };

  const handleSaveMatrix = (matrixData: PricingMatrix) => {
    setPricingMatrices(prev => {
        const exists = prev.some(m => m.id === matrixData.id);
        return exists ? prev.map(m => m.id === matrixData.id ? matrixData : m) : [...prev, matrixData];
    });
  };
  const handleDeleteMatrix = (matrixId: string) => {
    if (window.confirm('Are you sure you want to delete this pricing matrix?')) {
        setPricingMatrices(prev => prev.filter(m => m.id !== matrixId));
    }
  };

  const handleSaveUpcharge = (upchargeData: Upcharge) => {
    setUpcharges(prev => {
        const exists = prev.some(u => u.id === upchargeData.id);
        return exists ? prev.map(u => u.id === upchargeData.id ? upchargeData : u) : [...prev, upchargeData];
    });
  };
  const handleDeleteUpcharge = (upchargeId: string) => {
    if (window.confirm('Are you sure you want to delete this upcharge?')) {
        setUpcharges(prev => prev.filter(u => u.id !== upchargeId));
    }
  };
  
  const handleSaveChecklist = (checklistData: Checklist) => {
    setChecklists(prev => {
        const exists = prev.some(c => c.id === checklistData.id);
        return exists ? prev.map(c => c.id === checklistData.id ? checklistData : c) : [...prev, checklistData];
    });
  };
  const handleDeleteChecklist = (checklistId: string) => {
    if (window.confirm('Are you sure you want to delete this checklist?')) {
        setChecklists(prev => prev.filter(c => c.id !== checklistId));
    }
  };
  
  const handleSaveCustomer = async (customerData: Customer, vehicleData: Vehicle[]): Promise<Customer> => {
    setCustomers(prev => {
        const exists = prev.some(c => c.id === customerData.id);
        return exists ? prev.map(c => c.id === customerData.id ? customerData : c) : [...prev, customerData];
    });
    setVehicles(prev => {
        const otherCustomerVehicles = prev.filter(v => v.customerId !== customerData.id);
        return [...otherCustomerVehicles, ...vehicleData];
    });
    return customerData;
  };

  const handleDeleteCustomer = (customerId: string) => {
    if (window.confirm('Are you sure you want to delete this customer? This will also delete all their associated vehicles.')) {
        setCustomers(prev => prev.filter(c => c.id !== customerId));
        setVehicles(prev => prev.filter(v => v.customerId !== customerId));
    }
  };
  
  const handleSaveJob = (jobData: Job) => {
    // Recalculate discount if a promotion is applied
    const promotion = promotions.find(p => p.id === jobData.appliedPromotionId && p.isActive);
    const subtotal = jobData.jobItems.reduce((acc, item) => acc + item.total, 0);
    let discount = 0;
    if (promotion) {
      if (promotion.type === 'percentage') {
        discount = subtotal * (promotion.value / 100);
      } else {
        discount = promotion.value;
      }
    }
    jobData.discountAmount = discount;
    jobData.totalAmount = subtotal - discount;

    setJobs(prev => {
      const exists = prev.some(j => j.id === jobData.id);
      
      if (!exists && currentUser?.role === 'technician' && currentUser.id) {
        jobData.assignedTechnicianIds = [...(jobData.assignedTechnicianIds || []), currentUser.id];
      }
      
      if (!exists && jobData.status === 'estimate') {
        jobData.customerApprovalStatus = 'pending';
      }

      return exists ? prev.map(j => j.id === jobData.id ? jobData : j) : [...prev, jobData];
    });
  };
  const handleDeleteJob = (jobId: string) => {
    if (window.confirm('Are you sure you want to delete this job? This will also remove any associated appointments.')) {
        setJobs(prev => prev.filter(j => j.id !== jobId));
        setAppointments(prev => prev.filter(a => a.jobId !== jobId));
    }
  };
  
  const handleConvertToWorkOrder = (jobId: string) => {
      setJobs(prev => prev.map(job => 
          job.id === jobId 
              ? { ...job, status: 'workOrder', workOrderDate: Date.now() } 
              : job
      ));
  };

  const handleGenerateInvoice = (jobId: string) => {
      setJobs(prev => prev.map(job => 
          job.id === jobId 
              ? { ...job, status: 'invoice', invoiceDate: Date.now() } 
              : job
      ));
  };

  const handleSavePayment = (jobId: string, payment: Payment) => {
    setJobs(prev => prev.map(job => {
        if (job.id !== jobId) return job;

        const updatedPayments = [...(job.payments || []), payment];
        const newPaymentReceived = job.paymentReceived + payment.amount;
        const newPaymentStatus: Job['paymentStatus'] = newPaymentReceived >= job.totalAmount ? 'paid' : 'partial';
        
        const isNowCompleted = newPaymentStatus === 'paid';

        const updatedJob: Job = {
            ...job,
            payments: updatedPayments,
            paymentReceived: newPaymentReceived,
            paymentStatus: newPaymentStatus,
            status: isNowCompleted ? 'completed' : job.status,
            completionDate: isNowCompleted ? Date.now() : job.completionDate,
        };
        
        if (publicJob?.id === jobId) setPublicJob(updatedJob);

        return updatedJob;
    }));
  };

  const handleSaveAppointment = (appointmentData: Appointment) => {
    setAppointments(prev => {
      const exists = prev.some(a => a.id === appointmentData.id);
      return exists ? prev.map(a => a.id === appointmentData.id ? appointmentData : a) : [...prev, appointmentData];
    });
  };

  const handleDeleteAppointment = (appointmentId: string) => {
    if (window.confirm('Are you sure you want to delete this appointment?')) {
        setAppointments(prev => prev.filter(a => a.id !== appointmentId));
    }
  };

  const handleSaveUser = (userData: User) => {
    setUsers(prev => {
        const exists = prev.some(u => u.id === userData.id);
        return exists ? prev.map(u => u.id === userData.id ? userData : u) : [...prev, userData];
    });
  };

  const handleDeleteUser = (userId: string) => {
    if (currentUser?.id === userId) {
        alert("You cannot delete yourself.");
        return;
    }
    if (window.confirm('Are you sure you want to delete this user?')) {
        setUsers(prev => prev.filter(u => u.id !== userId));
    }
  };

  const handleSaveCompany = (companyData: Company) => {
    setCompany(companyData);
  };
  
  const handleSaveProduct = (productData: Product) => {
    setProducts(prev => {
        const exists = prev.some(p => p.id === productData.id);
        return exists ? prev.map(p => p.id === productData.id ? productData : p) : [...prev, productData];
    });
  };
  
  const handleDeleteProduct = (productId: string) => {
      if (window.confirm('Are you sure you want to delete this product?')) {
          setProducts(prev => prev.filter(p => p.id !== productId));
      }
  };
  
  const handleSavePromotion = (promotionData: Promotion) => {
    setPromotions(prev => {
        const exists = prev.some(p => p.id === promotionData.id);
        return exists ? prev.map(p => p.id === promotionData.id ? promotionData : p) : [...prev, promotionData];
    });
  };
  
  const handleDeletePromotion = (promotionId: string) => {
      if (window.confirm('Are you sure you want to delete this promotion?')) {
          setPromotions(prev => prev.filter(p => p.id !== promotionId));
      }
  };
  
  const handleSaveCampaign = (campaignData: Campaign) => {
    setCampaigns(prev => {
        const exists = prev.some(c => c.id === campaignData.id);
        return exists ? prev.map(c => c.id === campaignData.id ? campaignData : c) : [...prev, campaignData];
    });
  };

  const handleViewJobDetail = (jobId: string) => {
    setSelectedJobId(jobId);
  };

  const handleBackToList = () => {
    setSelectedJobId(null);
  };

  const handleUpdateChecklistProgress = (jobId: string, jobItemId: string, completedTasks: string[]) => {
    setJobs(prevJobs => prevJobs.map(job => {
      if (job.id === jobId) {
        return {
          ...job,
          jobItems: job.jobItems.map(item => {
            if (item.id === jobItemId) {
              return { ...item, checklistCompletedItems: completedTasks };
            }
            return item;
          })
        };
      }
      return job;
    }));
  };

  const handleAddJobPhoto = (jobId: string, photoData: Omit<JobPhoto, 'id'>) => {
    setJobs(prevJobs => prevJobs.map(job => {
        if (job.id === jobId) {
            const newPhoto: JobPhoto = {
                ...photoData,
                id: `photo_${Date.now()}`
            };
            return {
                ...job,
                photos: [...(job.photos || []), newPhoto]
            };
        }
        return job;
    }));
  };

  const handleApproveJob = (jobId: string, signatureDataUrl: string) => {
    setJobs(prevJobs => prevJobs.map(job => {
        if (job.id === jobId) {
            const updatedJob: Job = {
                ...job,
                customerApprovalStatus: 'approved',
                customerSignatureDataUrl: signatureDataUrl,
                approvalTimestamp: Date.now()
            };
            if (publicJob?.id === jobId) setPublicJob(updatedJob);
            return updatedJob;
        }
        return job;
    }));
  };
  
  const handleStripeOnboardingComplete = (accountId: string) => {
    setCompany(prev => ({ ...prev, stripeConnectAccountId: accountId }));
    setActivePage('settings');
  };


  // Filter data based on current user
  const jobsForCurrentUser = useMemo(() => {
    if (currentUser?.role === 'technician') {
        return jobs.filter(job => job.assignedTechnicianIds?.includes(currentUser.id));
    }
    return jobs; // Admins see all jobs
  }, [jobs, currentUser]);

  const appointmentsForCurrentUser = useMemo(() => {
    const jobIdsForCurrentUser = new Set(jobsForCurrentUser.map(j => j.id));
    return appointments.filter(appt => jobIdsForCurrentUser.has(appt.jobId));
  }, [appointments, jobsForCurrentUser]);


  // Dashboard calculations based on user role
  const dashboardStats = useMemo(() => {
    const activeJobs = jobsForCurrentUser.filter(job => job.status !== 'completed' && job.status !== 'cancelled').length;

    let revenueThisMonth = 0;
    let totalCustomers = 0;

    if (currentUser?.role === 'admin') {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        revenueThisMonth = jobs.reduce((total, job) => {
            const monthPayments = (job.payments || [])
                .filter(p => p.paymentDate >= firstDayOfMonth)
                .reduce((sum, p) => sum + p.amount, 0);
            return total + monthPayments;
        }, 0);
        totalCustomers = customers.length;
    }
    
    return { activeJobs, revenueThisMonth, totalCustomers };
  }, [jobs, customers, jobsForCurrentUser, currentUser]);

  // Main application router / view renderer
  if (publicJob) {
    const jobCustomer = customers.find(c => c.id === publicJob.customerId);
    const jobVehicle = vehicles.find(v => v.id === publicJob.vehicleId);
    
    if (!jobCustomer || !jobVehicle) {
        return <div className="flex items-center justify-center h-screen"><p>Error: Could not load job details.</p></div>;
    }

    return <CustomerPortalPage 
        job={publicJob}
        customer={jobCustomer}
        vehicle={jobVehicle}
        services={services}
        onApprove={handleApproveJob}
        onSavePayment={handleSavePayment}
    />
  }

  const renderPage = () => {
    if (!currentUser) {
        return <div className="flex items-center justify-center h-screen"><p>Mapping user account...</p></div>;
    }

    if (selectedJobId) {
        const selectedJob = jobs.find(j => j.id === selectedJobId);
        if (selectedJob) {
            return <JobDetailPage 
                job={selectedJob}
                customer={customers.find(c => c.id === selectedJob.customerId)}
                vehicle={vehicles.find(v => v.id === selectedJob.vehicleId)}
                services={services}
                checklists={checklists}
                currentUser={currentUser}
                onBack={handleBackToList}
                onUpdateChecklist={handleUpdateChecklistProgress}
                onAddPhoto={handleAddJobPhoto}
                onApprove={handleApproveJob}
            />;
        }
    }

    switch (activePage) {
      case 'dashboard':
        return <DashboardPage 
            activeJobs={dashboardStats.activeJobs}
            revenueThisMonth={dashboardStats.revenueThisMonth}
            totalCustomers={dashboardStats.totalCustomers}
            currentUser={currentUser}
            jobsForCurrentUser={jobsForCurrentUser}
            customers={customers}
            vehicles={vehicles}
            onViewJob={handleViewJobDetail}
            services={services}
            pricingMatrices={pricingMatrices}
            upcharges={upcharges}
            promotions={promotions}
            onSaveJob={handleSaveJob}
            onSaveCustomer={handleSaveCustomer}
        />;
      case 'management':
        if (currentUser.role !== 'admin') return null;
        return <ManagementPage 
            services={services}
            pricingMatrices={pricingMatrices}
            upcharges={upcharges}
            checklists={checklists}
            customers={customers}
            vehicles={vehicles}
            jobs={jobs}
            appointments={appointments}
            promotions={promotions}
            users={users}
            currentUser={currentUser}
            handleSaveService={handleSaveService}
            handleDeleteService={handleDeleteService}
            handleSaveMatrix={handleSaveMatrix}
            handleDeleteMatrix={handleDeleteMatrix}
            handleSaveUpcharge={handleSaveUpcharge}
            handleDeleteUpcharge={handleDeleteUpcharge}
            handleSaveChecklist={handleSaveChecklist}
            handleDeleteChecklist={handleDeleteChecklist}
            handleSaveCustomer={handleSaveCustomer}
            handleDeleteCustomer={handleDeleteCustomer}
            handleSaveJob={handleSaveJob}
            handleDeleteJob={handleDeleteJob}
            handleConvertToWorkOrder={handleConvertToWorkOrder}
            handleGenerateInvoice={handleGenerateInvoice}
            handleSavePayment={handleSavePayment}
            handleSaveAppointment={handleSaveAppointment}
        />;
      case 'schedule':
        return <SchedulePage 
            appointments={appointmentsForCurrentUser}
            jobs={jobsForCurrentUser}
            customers={customers}
            vehicles={vehicles}
            handleSaveAppointment={handleSaveAppointment}
            handleDeleteAppointment={handleDeleteAppointment}
            currentUser={currentUser}
            onViewJob={handleViewJobDetail}
            allServices={services}
            allUsers={users}
            allAppointments={appointments}
        />;
       case 'settings':
        if (currentUser.role !== 'admin') return null;
        return <SettingsPage 
            users={users}
            company={company}
            currentUser={currentUser}
            onSaveUser={handleSaveUser}
            onDeleteUser={handleDeleteUser}
            onSaveCompany={handleSaveCompany}
            setActivePage={setActivePage}
        />;
       case 'stripe-onboarding':
         if (currentUser.role !== 'admin') return null;
         return <StripeOnboarding onOnboardingComplete={handleStripeOnboardingComplete} />;
       case 'reports':
        if (currentUser.role !== 'admin') return null;
        return <ReportsPage 
            jobs={jobs}
            services={services}
            users={users}
            customers={customers}
            vehicles={vehicles}
        />;
       case 'inventory':
        if (currentUser.role !== 'admin') return null;
        return <InventoryPage 
            products={products}
            suppliers={suppliers}
            onSaveProduct={handleSaveProduct}
            onDeleteProduct={handleDeleteProduct}
        />;
       case 'marketing':
        if (currentUser.role !== 'admin') return null;
        return <MarketingPage 
            promotions={promotions}
            campaigns={campaigns}
            onSavePromotion={handleSavePromotion}
            onDeletePromotion={handleDeletePromotion}
            onSaveCampaign={handleSaveCampaign}
        />;
      default:
        return <DashboardPage 
            activeJobs={dashboardStats.activeJobs}
            revenueThisMonth={dashboardStats.revenueThisMonth}
            totalCustomers={dashboardStats.totalCustomers}
            currentUser={currentUser}
            jobsForCurrentUser={jobsForCurrentUser}
            customers={customers}
            vehicles={vehicles}
            onViewJob={handleViewJobDetail}
            services={services}
            pricingMatrices={pricingMatrices}
            upcharges={upcharges}
            promotions={promotions}
            onSaveJob={handleSaveJob}
            onSaveCustomer={handleSaveCustomer}
        />;
    }
  };
  
  if (!isLoaded) {
      return (
          <div className="flex items-center justify-center h-screen bg-gray-900">
              <p className="text-white">Loading Application...</p>
          </div>
      );
  }

  return (
    <>
      <SignedOut>
        <LandingPage />
      </SignedOut>
      <SignedIn>
        <div className="min-h-screen bg-gray-900 text-gray-100">
          <Layout 
            activePage={activePage} 
            setActivePage={setActivePage}
            currentUser={currentUser}
          >
            {renderPage()}
          </Layout>
        </div>
      </SignedIn>
    </>
  );
}

export default App;
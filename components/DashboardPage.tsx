
import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { BriefcaseIcon, CreditCardIcon, UserGroupIcon, PlusIcon } from './icons';
import { User, Job } from '../types';
import JobFormModal from './JobFormModal';

interface DashboardPageProps {
    currentUser: User | null;
    onViewJob: (jobId: string) => void;
}

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 flex items-center space-x-4">
        <div className="bg-gray-700 p-3 rounded-full">
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    </div>
);

const DashboardPage: React.FC<DashboardPageProps> = ({ currentUser, onViewJob }) => {
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  
  const dashboardData = useQuery(api.users.getDashboardData);

  if (!currentUser || !dashboardData) {
      return <div className="p-8 text-center">Loading dashboard...</div>;
  }

  const { stats, jobsForCurrentUser } = dashboardData;
  const isTechnician = currentUser.role === 'technician';

  return (
    <>
        <div className="container mx-auto p-4 md:p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                <p className="text-gray-400 mt-1">
                    Welcome back, {currentUser.name}! {isTechnician ? "Here is a summary of your assigned jobs." : "Here's a snapshot of your business."}
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard 
                    title={isTechnician ? "My Active Jobs" : "Active Jobs"} 
                    value={stats.activeJobs.toString()} 
                    icon={<BriefcaseIcon className="w-6 h-6 text-blue-400" />} 
                />
                {!isTechnician && (
                    <>
                        <StatCard 
                            title="Revenue (This Month)" 
                            value={stats.revenueThisMonth.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                            icon={<CreditCardIcon className="w-6 h-6 text-green-400" />} 
                        />
                        <StatCard 
                            title="Total Customers" 
                            value={stats.totalCustomers.toString()} 
                            icon={<UserGroupIcon className="w-6 h-6 text-yellow-400" />} 
                        />
                    </>
                )}
            </div>

            <div className={`bg-gray-800 rounded-lg shadow-lg p-6 ${isTechnician ? '' : 'hidden'}`}>
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white">My Assigned Jobs</h2>
                    <button
                        onClick={() => setIsJobModalOpen(true)}
                        className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
                    >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Create New Job
                    </button>
                </div>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                    {jobsForCurrentUser.length > 0 ? jobsForCurrentUser.map(job => {
                        const { customer, vehicle } = job;
                        const statusColor = {
                            estimate: 'border-yellow-500', workOrder: 'border-blue-500', invoice: 'border-purple-500',
                            completed: 'border-green-500', cancelled: 'border-gray-600',
                        };
                        return (
                            <button 
                                key={job._id} 
                                onClick={() => onViewJob(job._id)} 
                                className={`w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors border-l-4 ${statusColor[job.status]}`}
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-white">{customer?.name}</p>
                                        <p className="text-sm text-gray-400">{vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Unknown Vehicle'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-mono text-lg text-blue-400">${job.totalAmount.toFixed(2)}</p>
                                        <p className="text-xs text-gray-400 capitalize">{job.status}</p>
                                    </div>
                                </div>
                            </button>
                        );
                    }) : (
                        <div className="text-center py-12">
                            <p className="text-gray-500">You have no assigned jobs.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
        <JobFormModal
            isOpen={isJobModalOpen}
            onClose={() => setIsJobModalOpen(false)}
            jobToEdit={null}
        />
    </>
  );
};

export default DashboardPage;

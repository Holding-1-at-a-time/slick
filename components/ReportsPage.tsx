import React, { useMemo, useState } from 'react';
import { Job, Service, User, Customer, Vehicle } from '../types';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { ClipboardListIcon, SearchIcon } from './icons';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ReportsPageProps {
    jobs: Job[];
    services: Service[];
    users: User[];
    customers: Customer[];
    vehicles: Vehicle[];
}

const toInputDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const ReportsPage: React.FC<ReportsPageProps> = ({ jobs, services, users, customers, vehicles }) => {
    
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        technicianId: 'all',
    });
    const [vehicleSearch, setVehicleSearch] = useState('');

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const technicians = useMemo(() => users.filter(u => u.role === 'technician'), [users]);
    
    const filteredJobs = useMemo(() => {
        return jobs.filter(job => {
            const jobDate = new Date(job.estimateDate);
            if (filters.startDate && toInputDateString(jobDate) < filters.startDate) {
                return false;
            }
            if (filters.endDate && toInputDateString(jobDate) > filters.endDate) {
                return false;
            }
            if (filters.technicianId !== 'all' && !job.assignedTechnicianIds?.includes(filters.technicianId)) {
                return false;
            }
            return true;
        });
    }, [jobs, filters]);
    
    const revenueData = useMemo(() => {
        const labels: string[] = [];
        const data: number[] = [];
        const revenueByDate: { [key: string]: number } = {};

        const dateRange = Math.min(
          30, 
          filters.startDate && filters.endDate 
            ? (new Date(filters.endDate).getTime() - new Date(filters.startDate).getTime()) / (1000 * 3600 * 24) + 1
            : 30
        );

        const firstDay = filters.startDate ? new Date(filters.startDate) : new Date();
        if (!filters.startDate) firstDay.setDate(firstDay.getDate() - (dateRange-1));

        for (let i = 0; i < dateRange; i++) {
            const date = new Date(firstDay);
            date.setDate(date.getDate() + i);
            const dateString = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            labels.push(dateString);
            revenueByDate[date.toDateString()] = 0;
        }
        
        filteredJobs.forEach(job => {
            (job.payments || []).forEach(payment => {
                const paymentDate = new Date(payment.paymentDate);
                const dateString = paymentDate.toDateString();
                if (revenueByDate[dateString] !== undefined) {
                    revenueByDate[dateString] += payment.amount;
                }
            });
        });

        labels.forEach(label => {
            const date = new Date(label + ', ' + new Date().getFullYear());
            data.push(revenueByDate[date.toDateString()] || 0);
        });
        
        return { labels, datasets: [{ label: 'Daily Revenue', data, borderColor: 'rgb(59, 130, 246)', backgroundColor: 'rgba(59, 130, 246, 0.5)', tension: 0.1 }] };
    }, [filteredJobs, filters.startDate, filters.endDate]);
    
    const servicePerformance = useMemo(() => {
        const performance: { [key: string]: { count: number; revenue: number } } = {};
        services.forEach(s => { performance[s.id] = { count: 0, revenue: 0 }; });

        filteredJobs.forEach(job => {
            job.jobItems.forEach(item => {
                if (performance[item.serviceId]) {
                    performance[item.serviceId].count += 1;
                    performance[item.serviceId].revenue += item.total;
                }
            });
        });

        return Object.entries(performance).map(([serviceId, data]) => ({ service: services.find(s => s.id === serviceId)!, ...data })).filter(item => item.service).sort((a, b) => b.revenue - a.revenue);
    }, [filteredJobs, services]);
    
    const technicianLeaderboard = useMemo(() => {
        const stats: { [key: string]: { completedJobs: number; revenue: number } } = {};
        technicians.forEach(t => { stats[t.id] = { completedJobs: 0, revenue: 0 }; });

        filteredJobs.filter(j => j.status === 'completed').forEach(job => {
            (job.assignedTechnicianIds || []).forEach(techId => {
                if (stats[techId]) {
                    stats[techId].completedJobs += 1;
                    stats[techId].revenue += job.totalAmount;
                }
            });
        });

        return Object.entries(stats).map(([techId, data]) => ({ technician: technicians.find(t => t.id === techId)!, ...data, averageJobValue: data.completedJobs > 0 ? data.revenue / data.completedJobs : 0 })).filter(item => item.technician).sort((a, b) => b.revenue - a.revenue);
    }, [filteredJobs, technicians]);

    const searchedVehicleWithJobs = useMemo(() => {
        if (!vehicleSearch.trim()) return null;
        const lowerSearch = vehicleSearch.toLowerCase();
        
        const customerMap = new Map(customers.map(c => [c.id, c.name.toLowerCase()]));

        const vehicle = vehicles.find(v => 
            v.vin.toLowerCase().includes(lowerSearch) ||
            v.make.toLowerCase().includes(lowerSearch) ||
            v.model.toLowerCase().includes(lowerSearch) ||
            (customerMap.get(v.customerId) || '').includes(lowerSearch)
        );

        if (!vehicle) return { vehicle: null, jobs: [] };
        
        const vehicleJobs = jobs.filter(j => j.vehicleId === vehicle.id).sort((a,b) => b.estimateDate - a.estimateDate);
        return { vehicle, jobs: vehicleJobs };
    }, [vehicleSearch, vehicles, customers, jobs]);

    const chartOptions = { responsive: true, plugins: { legend: { display: false } }, scales: { y: { ticks: { color: '#9CA3AF' } }, x: { ticks: { color: '#9CA3AF' } } } };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white">Reports & Analytics</h1>
                <p className="text-gray-400 mt-1">Key insights into your business performance.</p>
            </header>

            <section className="mb-12 bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-white mb-4">Filters</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-400">Start Date</label>
                        <input type="date" name="startDate" id="startDate" value={filters.startDate} onChange={handleFilterChange} className="mt-1 w-full bg-gray-700 rounded-md py-2 px-3 text-white"/>
                    </div>
                    <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-400">End Date</label>
                        <input type="date" name="endDate" id="endDate" value={filters.endDate} onChange={handleFilterChange} className="mt-1 w-full bg-gray-700 rounded-md py-2 px-3 text-white"/>
                    </div>
                    <div>
                        <label htmlFor="technicianId" className="block text-sm font-medium text-gray-400">Technician</label>
                        <select name="technicianId" id="technicianId" value={filters.technicianId} onChange={handleFilterChange} className="mt-1 w-full bg-gray-700 rounded-md py-2 px-3 text-white">
                            <option value="all">All Technicians</option>
                            {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                </div>
            </section>

            <section className="mb-12 bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-white mb-4">Revenue Over Time</h2>
                <Line options={chartOptions} data={revenueData} />
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                <section>
                    <h2 className="text-xl font-bold text-white mb-4">Service Performance</h2>
                    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                         <table className="min-w-full"><thead className="bg-gray-700"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Service</th><th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase">Times Performed</th><th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase">Total Revenue</th></tr></thead><tbody className="divide-y divide-gray-700">{servicePerformance.map(({ service, count, revenue }) => (<tr key={service.id} className="hover:bg-gray-700/50"><td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-white">{service.name}</td><td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300 text-right">{count}</td><td className="px-4 py-4 whitespace-nowrap text-sm text-blue-400 text-right font-semibold">{revenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td></tr>))}</tbody></table>
                    </div>
                </section>
                <section>
                    <h2 className="text-xl font-bold text-white mb-4">Technician Leaderboard</h2>
                     <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                        <table className="min-w-full"><thead className="bg-gray-700"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Technician</th><th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase">Jobs Done</th><th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase">Revenue</th><th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase">Avg. Job Value</th></tr></thead><tbody className="divide-y divide-gray-700">{technicianLeaderboard.map(({ technician, completedJobs, revenue, averageJobValue }) => (<tr key={technician.id} className="hover:bg-gray-700/50"><td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-white">{technician.name}</td><td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300 text-right">{completedJobs}</td><td className="px-4 py-4 whitespace-nowrap text-sm text-blue-400 text-right font-semibold">{revenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td><td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300 text-right">{averageJobValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td></tr>))}</tbody></table>
                    </div>
                </section>
            </div>
            
            <section>
                 <h2 className="text-xl font-bold text-white mb-4 flex items-center"><ClipboardListIcon className="w-6 h-6 mr-3 text-gray-400"/>Vehicle Service History</h2>
                 <div className="bg-gray-800 rounded-lg shadow-lg p-6">
                    <div className="relative mb-4">
                        <input type="text" placeholder="Search by VIN, make, model, or customer name..." value={vehicleSearch} onChange={e => setVehicleSearch(e.target.value)} className="w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3 pl-10 text-white"/>
                        <SearchIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"/>
                    </div>
                    {searchedVehicleWithJobs ? (
                        searchedVehicleWithJobs.vehicle ? (
                            <div>
                                <h3 className="text-lg font-bold text-white">{`${searchedVehicleWithJobs.vehicle.year} ${searchedVehicleWithJobs.vehicle.make} ${searchedVehicleWithJobs.vehicle.model}`}</h3>
                                <p className="text-sm text-gray-400">Owner: {customers.find(c=>c.id === searchedVehicleWithJobs.vehicle?.customerId)?.name}</p>
                                <div className="mt-4 border-t border-gray-700 pt-4">
                                    <table className="min-w-full"><thead className="bg-gray-700/50"><tr><th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Date</th><th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Services</th><th className="px-4 py-2 text-right text-xs font-medium text-gray-300 uppercase">Total</th></tr></thead><tbody className="divide-y divide-gray-700">{searchedVehicleWithJobs.jobs.map(job => (<tr key={job.id}><td className="px-4 py-3 whitespace-nowrap text-sm">{new Date(job.estimateDate).toLocaleDateString()}</td><td className="px-4 py-3 text-sm">{job.jobItems.map(i => services.find(s=>s.id===i.serviceId)?.name).join(', ')}</td><td className="px-4 py-3 text-right text-sm font-semibold text-blue-400">{job.totalAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td></tr>))}</tbody></table>
                                </div>
                            </div>
                        ) : ( <p className="text-center text-gray-500 py-4">No vehicle found matching your search.</p> )
                    ) : ( <p className="text-center text-gray-500 py-4">Enter a search term to find a vehicle's history.</p> )}
                 </div>
            </section>
        </div>
    );
};

export default ReportsPage;
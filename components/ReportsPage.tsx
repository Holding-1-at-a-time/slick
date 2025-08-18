
import React, { useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { ClipboardListIcon, SearchIcon } from './icons';
import { api } from '@/convex/_generated/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const toInputDateString = (date: Date) => date.toISOString().split('T')[0];


/**
 * The ReportsPage component displays various reports and analytics for the technicians, services, and vehicles.
 * It allows the user to filter the reports by date range and technician. It also provides a search feature to look up specific vehicles and their associated jobs.
 *
 * @return {React.FC} The ReportsPage component
 */
const ReportsPage: React.FC = () => {
    const [filters, setFilters] = useState({
        startDate: toInputDateString(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
        endDate: toInputDateString(new Date()),
        technicianId: 'all',
    });
    const [vehicleSearch, setVehicleSearch] = useState('');

    const reportsData = useQuery(api.reports.getReportsData, {
        startDate: new Date(filters.startDate).getTime(),
        endDate: new Date(filters.endDate).getTime(),
        technicianId: filters.technicianId,
    });
    const vehicleHistory = useQuery(api.reports.getVehicleHistory, vehicleSearch ? { query: vehicleSearch } : "skip");

    /**
     * Handles the change event of filter inputs or selects.
     * Updates the filter state with the new value.
     *
     * @param {React.ChangeEvent<HTMLInputElement | HTMLSelectElement>} e - The change event.
     * @return {void} This function does not return anything.
     */
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));

    };

    const technicians = reportsData?.technicians ?? [];

    const revenueData = useMemo(() => {
        if (!reportsData) {
            return { labels: [], datasets: [] };
        }
        const { labels, data } = reportsData.revenueOverTime;
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
        if (!vehicleSearch.trim()) {
            return null;
        }
        const lowerSearch = vehicleSearch.toLowerCase();

        const customerMap = new Map<string, string>(customers.map(c => [c.id, c.name.toLowerCase()]));

        const vehicle = vehicles.find(v =>
            v.vin.toLowerCase().includes(lowerSearch) ||
            v.make.toLowerCase().includes(lowerSearch) ||
            v.model.toLowerCase().includes(lowerSearch) ||
            (customerMap.get(v.customerId) ?? '').includes(lowerSearch)
        );

        if (!vehicle) {
            return { vehicle: null, jobs: [] };
        }

        const vehicleJobs = jobs.filter(j => j.vehicleId === vehicle.id).sort((a, b) => b.estimateDate - a.estimateDate);
        return { vehicle, jobs: vehicleJobs };
    }, [vehicleSearch, vehicles, customers, jobs]);
}, [reportsData];

const chartOptions = { responsive: true, plugins: { legend: { display: false } }, scales: { y: { ticks: { color: '#9CA3AF' } }, x: { ticks: { color: '#9CA3AF' } } } };

if (!reportsData) return <div className="p-8 text-center">Loading reports...</div>;

return (
    <div className="container mx-auto p-4 md:p-8">
        <header className="mb-8"><h1 className="text-3xl font-bold text-white">Reports & Analytics</h1><p className="text-gray-400 mt-1">Key insights into your business performance.</p></header>

        <section className="mb-12 bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label htmlFor="startDate" className="block text-sm font-medium text-gray-400">Start Date</label><input type="date" name="startDate" id="startDate" value={filters.startDate} onChange={handleFilterChange} className="mt-1 w-full bg-gray-700 rounded-md py-2 px-3 text-white" /></div>
                <div><label htmlFor="endDate" className="block text-sm font-medium text-gray-400">End Date</label><input type="date" name="endDate" id="endDate" value={filters.endDate} onChange={handleFilterChange} className="mt-1 w-full bg-gray-700 rounded-md py-2 px-3 text-white" /></div>
                <div><label htmlFor="technicianId" className="block text-sm font-medium text-gray-400">Technician</label><select name="technicianId" id="technicianId" value={filters.technicianId} onChange={handleFilterChange} className="mt-1 w-full bg-gray-700 rounded-md py-2 px-3 text-white"><option value="all">All</option>{technicians.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}</select></div>
            </div>
        </section>

        <section className="mb-12 bg-gray-800 rounded-lg shadow-lg p-6"><h2 className="text-xl font-bold text-white mb-4">Revenue Over Time</h2><Line options={chartOptions} data={revenueData} /></section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <section><h2 className="text-xl font-bold text-white mb-4">Service Performance</h2><div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden"><table className="min-w-full"><thead className="bg-gray-700"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Service</th><th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase">Times</th><th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase">Revenue</th></tr></thead><tbody className="divide-y divide-gray-700">{reportsData.servicePerformance.map(({ service, count, revenue }) => (<tr key={service._id} className="hover:bg-gray-700/50"><td className="px-4 py-4 text-sm font-medium text-white">{service.name}</td><td className="px-4 py-4 text-sm text-gray-300 text-right">{count}</td><td className="px-4 py-4 text-sm text-blue-400 text-right font-semibold">${revenue.toFixed(2)}</td></tr>))}</tbody></table></div></section>
            <section><h2 className="text-xl font-bold text-white mb-4">Technician Leaderboard</h2><div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden"><table className="min-w-full"><thead className="bg-gray-700"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Technician</th><th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase">Jobs</th><th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase">Revenue</th><th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase">Avg Value</th></tr></thead><tbody className="divide-y divide-gray-700">{reportsData.technicianLeaderboard.map(({ technician, completedJobs, revenue, averageJobValue }) => (<tr key={technician._id} className="hover:bg-gray-700/50"><td className="px-4 py-4 text-sm font-medium text-white">{technician.name}</td><td className="px-4 py-4 text-sm text-gray-300 text-right">{completedJobs}</td><td className="px-4 py-4 text-sm text-blue-400 text-right font-semibold">${revenue.toFixed(2)}</td><td className="px-4 py-4 text-sm text-gray-300 text-right">${averageJobValue.toFixed(2)}</td></tr>))}</tbody></table></div></section>
        </div>

        <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center"><ClipboardListIcon className="w-6 h-6 mr-3 text-gray-400" />Vehicle Service History</h2>
            <div className="bg-gray-800 rounded-lg shadow-lg p-6">
                <div className="relative mb-4"><input type="text" placeholder="Search by VIN, make, model, or customer name..." value={vehicleSearch} onChange={e => setVehicleSearch(e.target.value)} className="w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3 pl-10 text-white" /><SearchIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" /></div>
                {vehicleSearch.trim() ? (
                    vehicleHistory ? (
                        <div>
                            <h3 className="text-lg font-bold text-white">{`${vehicleHistory.vehicle.year} ${vehicleHistory.vehicle.make} ${vehicleHistory.vehicle.model}`}</h3>
                            <p className="text-sm text-gray-400">Owner: {vehicleHistory.customerName}</p>
                            <div className="mt-4 border-t border-gray-700 pt-4"><table className="min-w-full"><thead className="bg-gray-700/50"><tr><th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Date</th><th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Services</th><th className="px-4 py-2 text-right text-xs font-medium text-gray-300 uppercase">Total</th></tr></thead><tbody className="divide-y divide-gray-700">{vehicleHistory.jobs.map(job => (<tr key={job._id}><td className="px-4 py-3 text-sm">{new Date(job.estimateDate).toLocaleDateString()}</td><td className="px-4 py-3 text-sm">{job.serviceNames.join(', ')}</td><td className="px-4 py-3 text-right text-sm font-semibold text-blue-400">${job.totalAmount.toFixed(2)}</td></tr>))}</tbody></table></div>
                        </div>
                    ) : (<p className="text-center text-gray-500 py-4">No vehicle found matching your search.</p>)
                ) : (<p className="text-center text-gray-500 py-4">Enter a search term to find a vehicle's history.</p>)}
            </div>
        </section>
    </div>
);
export default ReportsPage;

import React, { useState, useEffect } from 'react';
import { User, Company, Page } from '../types';
import { PlusIcon, EditIcon, TrashIcon, UserCircleIcon, OfficeBuildingIcon, StripeIcon } from './icons';
import UserFormModal from './UserFormModal';

interface SettingsPageProps {
    users: User[];
    company: Company;
    currentUser: User | null;
    onSaveUser: (user: User) => void;
    onDeleteUser: (userId: string) => void;
    onSaveCompany: (company: Company) => void;
    setActivePage: (page: Page) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ users, company, currentUser, onSaveUser, onDeleteUser, onSaveCompany, setActivePage }) => {
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [companyData, setCompanyData] = useState<Company>(company);
    
    useEffect(() => {
        setCompanyData(company);
    }, [company]);

    const handleOpenUserModal = (user: User | null) => {
        setUserToEdit(user);
        setIsUserModalOpen(true);
    };

    const handleCloseUserModal = () => {
        setUserToEdit(null);
        setIsUserModalOpen(false);
    };

    const handleSaveUser = (user: User) => {
        onSaveUser(user);
        handleCloseUserModal();
    };

    const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCompanyData(prev => ({ ...prev, [name]: name === 'defaultLaborRate' ? parseFloat(value) || 0 : value }));
    };

    const handleCompanySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSaveCompany(companyData);
        alert('Company profile saved!'); // Simple feedback
    };


    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white">Settings</h1>
                <p className="text-gray-400 mt-1">Manage your company profile and user accounts.</p>
            </header>

            {/* Company Profile Section */}
            <section id="company-profile" className="mb-12">
                <div className="bg-gray-800 rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-bold text-white flex items-center mb-4">
                        <OfficeBuildingIcon className="w-6 h-6 mr-3 text-gray-400"/>
                        Company Profile
                    </h2>
                    <form onSubmit={handleCompanySubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-300">Company Name</label>
                                <input type="text" name="name" id="name" value={companyData.name} onChange={handleCompanyChange} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3 text-white"/>
                            </div>
                            <div>
                                <label htmlFor="defaultLaborRate" className="block text-sm font-medium text-gray-300">Default Labor Rate ($/hr)</label>
                                <input type="number" name="defaultLaborRate" id="defaultLaborRate" value={companyData.defaultLaborRate} onChange={handleCompanyChange} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3 text-white"/>
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <button type="submit" className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
                                Save Company Profile
                            </button>
                        </div>
                    </form>
                </div>
            </section>
            
             {/* Payments & Billing Section */}
            <section id="billing" className="mb-12">
                <div className="bg-gray-800 rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-bold text-white flex items-center mb-4">
                        <StripeIcon className="w-6 h-6 mr-3"/>
                        Payments & Billing
                    </h2>
                    {companyData.stripeConnectAccountId ? (
                         <div className="bg-green-900/50 border border-green-700 text-green-200 p-4 rounded-lg flex items-center justify-between">
                            <div>
                                <p className="font-bold">Your account is connected to Stripe.</p>
                                <p className="text-sm">Account ID: <span className="font-mono">{companyData.stripeConnectAccountId}</span></p>
                            </div>
                            <span className="text-sm font-semibold bg-green-700 px-3 py-1 rounded-full">Connected</span>
                        </div>
                    ) : (
                        <div className="bg-gray-900/50 border border-gray-700 p-4 rounded-lg flex flex-col md:flex-row items-center justify-between">
                            <div>
                                <p className="font-bold text-white">Connect with Stripe to accept payments and manage subscriptions.</p>
                                <p className="text-sm text-gray-400">Onboard your business to enable powerful payment processing features.</p>
                            </div>
                            <button onClick={() => setActivePage('stripe-onboarding')} className="mt-4 md:mt-0 w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                                Onboard with Stripe
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* User Management Section */}
            <section id="user-management">
                 <header className="flex flex-wrap justify-between items-center mb-6 gap-4">
                    <h2 className="text-xl font-bold text-white flex items-center">
                        <UserCircleIcon className="w-6 h-6 mr-3 text-gray-400"/>
                        User Management
                    </h2>
                    <button onClick={() => handleOpenUserModal(null)} className="flex items-center bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Add User
                    </button>
                </header>
                <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                    <table className="min-w-full">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-gray-700/50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{user.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-green-800 text-green-100' : 'bg-blue-800 text-blue-100'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleOpenUserModal(user)} className="p-2 text-gray-400 hover:text-blue-400"><EditIcon className="w-5 h-5" /></button>
                                        <button onClick={() => onDeleteUser(user.id)} className="p-2 text-gray-400 hover:text-red-500" disabled={currentUser?.id === user.id}><TrashIcon className="w-5 h-5" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <UserFormModal 
                isOpen={isUserModalOpen}
                onClose={handleCloseUserModal}
                onSave={handleSaveUser}
                userToEdit={userToEdit}
            />
        </div>
    );
};

export default SettingsPage;
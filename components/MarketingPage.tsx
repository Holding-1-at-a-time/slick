import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Promotion, Campaign } from '../types';
import { PlusIcon, EditIcon, TrashIcon, MegaphoneIcon, ExclamationTriangleIcon } from './icons';
import PromotionFormModal from './PromotionFormModal';
import CampaignFormModal from './CampaignFormModal';

const CampaignCard: React.FC<{ campaign: Campaign }> = ({ campaign }) => {
    const getStatusIndicator = () => {
        switch (campaign.status) {
            case 'generating':
                return (
                    <div className="flex items-center text-xs text-blue-300 animate-pulse">
                        <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Generating...
                    </div>
                );
            case 'failed':
                return (
                    <div className="flex items-center text-xs text-red-400">
                        <ExclamationTriangleIcon className="w-4 h-4 mr-1.5" />
                        Generation Failed
                    </div>
                );
            case 'complete':
                 return <p className="text-xs text-gray-500">Created: {new Date(campaign.createdAt).toLocaleDateString()}</p>;
            default:
                return null;
        }
    }
    
    return (
        <div className="bg-gray-800 rounded-lg shadow-lg p-4 flex flex-col justify-between min-h-[160px]">
            <div>
                <p className="font-semibold text-white truncate">{campaign.subject || `Goal: ${campaign.goal}`}</p>
                {campaign.status === 'complete' && <p className="text-sm text-gray-300 mt-2 line-clamp-2">{campaign.body}</p>}
                {campaign.status === 'generating' && <p className="text-sm text-gray-400 mt-2">AI is crafting your email content. This may take a moment...</p>}
                 {campaign.status === 'failed' && <p className="text-sm text-red-300 mt-2 line-clamp-2">{campaign.body}</p>}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-700/50 flex justify-end items-center">
                {getStatusIndicator()}
            </div>
        </div>
    );
};


const MarketingPage: React.FC = () => {
    const data = useQuery(api.marketing.getData);
    const promotions = data?.promotions ?? [];
    const campaigns = data?.campaigns ?? [];
    const deletePromotion = useMutation(api.marketing.deletePromotion);

    const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
    const [promotionToEdit, setPromotionToEdit] = useState<Promotion | null>(null);
    const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
    
    const handleOpenPromotionModal = (promotion: Promotion | null) => {
        setPromotionToEdit(promotion);
        setIsPromotionModalOpen(true);
    };

    const handleCloseModals = () => {
        setIsPromotionModalOpen(false); setPromotionToEdit(null);
        setIsCampaignModalOpen(false);
    }
    
    const handleDeletePromotion = (id: string) => {
        if(window.confirm('Are you sure?')) deletePromotion({id});
    }

    if (!data) return <div className="p-8 text-center">Loading marketing data...</div>;

    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="mb-8"><h1 className="text-3xl font-bold text-white">Marketing & Promotions</h1><p className="text-gray-400 mt-1">Create discount codes and email campaigns to grow your business.</p></header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <section id="promotions">
                    <header className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold text-white">Promotions</h2><button onClick={() => handleOpenPromotionModal(null)} className="flex items-center bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg"><PlusIcon className="w-5 h-5 mr-2" />New Promotion</button></header>
                    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                        <table className="min-w-full"><thead className="bg-gray-700"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Code</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Discount</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th><th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase">Actions</th></tr></thead>
                            <tbody className="divide-y divide-gray-700">{promotions.map(promo => (<tr key={promo._id}><td className="px-6 py-4 font-mono text-blue-300">{promo.code}</td><td className="px-6 py-4">{promo.type === 'percentage' ? `${promo.value}%` : `$${promo.value.toFixed(2)}`}</td><td className="px-6 py-4"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${promo.isActive ? 'bg-green-800 text-green-100' : 'bg-gray-600 text-gray-200'}`}>{promo.isActive ? 'Active' : 'Inactive'}</span></td><td className="px-6 py-4 text-right"><button onClick={() => handleOpenPromotionModal(promo)} className="p-2 text-gray-400 hover:text-blue-400"><EditIcon className="w-5 h-5" /></button><button onClick={() => handleDeletePromotion(promo._id)} className="p-2 text-gray-400 hover:text-red-500"><TrashIcon className="w-5 h-5" /></button></td></tr>))}</tbody>
                        </table>
                        {promotions.length === 0 && <p className="text-center text-gray-500 py-8">No promotions created yet.</p>}
                    </div>
                </section>
                <section id="campaigns">
                     <header className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold text-white">Email Campaigns</h2><button onClick={() => setIsCampaignModalOpen(true)} className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"><PlusIcon className="w-5 h-5 mr-2" />New Campaign</button></header>
                    <div className="space-y-4">
                        {campaigns.map(campaign => <CampaignCard key={campaign._id} campaign={campaign} />)}
                        {campaigns.length === 0 && (<div className="text-center py-16 bg-gray-800 rounded-lg"><MegaphoneIcon className="w-12 h-12 mx-auto text-gray-600" /><h3 className="text-xl text-gray-400 mt-4">No campaigns found.</h3><p className="text-gray-500 mt-2">Click "New Campaign" to engage your customers.</p></div>)}
                    </div>
                </section>
            </div>
            <PromotionFormModal isOpen={isPromotionModalOpen} onClose={handleCloseModals} promotionToEdit={promotionToEdit} />
            <CampaignFormModal isOpen={isCampaignModalOpen} onClose={handleCloseModals} campaignToEdit={null} />
        </div>
    );
};

export default MarketingPage;
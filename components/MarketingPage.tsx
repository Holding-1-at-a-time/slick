
import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Promotion, Campaign } from '../types';
import { PlusIcon, EditIcon, TrashIcon, MegaphoneIcon } from './icons';
import PromotionFormModal from './PromotionFormModal';
import CampaignFormModal from './CampaignFormModal';

const MarketingPage: React.FC = () => {
    const data = useQuery(api.marketing.getData);
    const promotions = data?.promotions ?? [];
    const campaigns = data?.campaigns ?? [];
    const deletePromotion = useMutation(api.marketing.deletePromotion);

    const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
    const [promotionToEdit, setPromotionToEdit] = useState<Promotion | null>(null);
    const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
    const [campaignToEdit, setCampaignToEdit] = useState<Campaign | null>(null);

    const handleOpenPromotionModal = (promotion: Promotion | null) => {
        setPromotionToEdit(promotion);
        setIsPromotionModalOpen(true);
    };

    const handleOpenCampaignModal = (campaign: Campaign | null) => {
        setCampaignToEdit(campaign);
        setIsCampaignModalOpen(true);
    };

    const handleCloseModals = () => {
        setIsPromotionModalOpen(false); setPromotionToEdit(null);
        setIsCampaignModalOpen(false); setCampaignToEdit(null);
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
                     <header className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold text-white">Email Campaigns</h2><button onClick={() => handleOpenCampaignModal(null)} className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"><PlusIcon className="w-5 h-5 mr-2" />New Campaign</button></header>
                    <div className="space-y-4">
                        {campaigns.map(campaign => (<div key={campaign._id} className="bg-gray-800 rounded-lg shadow-lg p-4"><p className="font-semibold text-white">{campaign.subject}</p><p className="text-xs text-gray-400 mt-1 italic">Goal: {campaign.goal}</p><p className="text-sm text-gray-300 mt-2 truncate">{campaign.body}</p><p className="text-xs text-gray-500 mt-3 text-right">Created: {new Date(campaign.createdAt).toLocaleDateString()}</p></div>))}
                        {campaigns.length === 0 && (<div className="text-center py-16 bg-gray-800 rounded-lg"><MegaphoneIcon className="w-12 h-12 mx-auto text-gray-600" /><h3 className="text-xl text-gray-400 mt-4">No campaigns found.</h3><p className="text-gray-500 mt-2">Click "New Campaign" to engage your customers.</p></div>)}
                    </div>
                </section>
            </div>
            <PromotionFormModal isOpen={isPromotionModalOpen} onClose={handleCloseModals} promotionToEdit={promotionToEdit} />
            <CampaignFormModal isOpen={isCampaignModalOpen} onClose={handleCloseModals} campaignToEdit={campaignToEdit} />
        </div>
    );
};

export default MarketingPage;

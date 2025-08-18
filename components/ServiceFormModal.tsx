import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Service } from '../types';
import Modal from './Modal';
import { MagicIcon } from './icons';

// It's recommended to initialize the API client once.
// Ensure API_KEY is set in your environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface ServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (service: Service) => void;
  serviceToEdit: Service | null;
  allServices: Service[];
}

const ServiceFormModal: React.FC<ServiceFormModalProps> = ({ isOpen, onClose, onSave, serviceToEdit, allServices }) => {
  const [formData, setFormData] = useState<Omit<Service, 'id'>>({
    name: '',
    description: '',
    basePrice: 0,
    isPackage: false,
    serviceIds: [],
    isDealerPackage: false,
  });
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (serviceToEdit) {
      setFormData({
        name: serviceToEdit.name,
        description: serviceToEdit.description,
        basePrice: serviceToEdit.basePrice,
        isPackage: serviceToEdit.isPackage,
        serviceIds: serviceToEdit.serviceIds || [],
        isDealerPackage: serviceToEdit.isDealerPackage,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        basePrice: 0,
        isPackage: false,
        serviceIds: [],
        isDealerPackage: false,
      });
    }
  }, [serviceToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target;
    const name = target.name;

    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: target.checked }));
    } else if (target instanceof HTMLInputElement && target.type === 'number') {
      // Use parseFloat, but provide a fallback for empty strings which parse to NaN
      setFormData(prev => ({ ...prev, [name]: parseFloat(target.value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: target.value }));
    }
  };

  const handleServiceSelection = (serviceId: string) => {
    setFormData(prev => {
        const newServiceIds = prev.serviceIds.includes(serviceId)
            ? prev.serviceIds.filter(id => id !== serviceId)
            : [...prev.serviceIds, serviceId];
        return { ...prev, serviceIds: newServiceIds };
    });
  };

  const handleGenerateDescription = async () => {
    if (!formData.name) {
        alert('Please enter a service name first.');
        return;
    }
    setIsGenerating(true);
    try {
        const prompt = `Generate a compelling, concise service description for an auto detailing service named "${formData.name}". The description should be suitable for a customer-facing menu. Keep it to 1-2 sentences and sound professional and appealing.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        
        const description = response.text;
        setFormData(prev => ({ ...prev, description: description.trim() }));

    } catch (error) {
        console.error("Error generating description:", error);
        alert('Failed to generate description. Please check the console for details.');
    } finally {
        setIsGenerating(false);
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = serviceToEdit ? serviceToEdit.id : `new_${Date.now()}`;
    onSave({ ...formData, id });
  };
  
  const availableServicesForPackage = allServices.filter(s => !s.isPackage && s.id !== serviceToEdit?.id);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={serviceToEdit ? 'Edit Service' : 'Add New Service'}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300">Service Name</label>
          <input
            type="text"
            name="name"
            id="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
            <div className="flex justify-between items-center mb-1">
                 <label htmlFor="description" className="block text-sm font-medium text-gray-300">Description</label>
                 <button 
                    type="button" 
                    onClick={handleGenerateDescription}
                    disabled={isGenerating || !formData.name}
                    className="flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                    aria-label="Suggest description with AI"
                >
                    <MagicIcon className="w-4 h-4" />
                    <span>{isGenerating ? 'Generating...' : 'Suggest'}</span>
                 </button>
            </div>
          <textarea
            name="description"
            id="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            required
            className="block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          ></textarea>
        </div>
        <div>
          <label htmlFor="basePrice" className="block text-sm font-medium text-gray-300">Base Price ($)</label>
          <input
            type="number"
            name="basePrice"
            id="basePrice"
            value={formData.basePrice}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center space-x-8">
            <div className="flex items-center">
              <input
                id="isPackage"
                name="isPackage"
                type="checkbox"
                checked={formData.isPackage}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="isPackage" className="ml-2 block text-sm text-gray-300">Is a Package?</label>
            </div>
            <div className="flex items-center">
              <input
                id="isDealerPackage"
                name="isDealerPackage"
                type="checkbox"
                checked={formData.isDealerPackage}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="isDealerPackage" className="ml-2 block text-sm text-gray-300">Dealer Package?</label>
            </div>
        </div>

        {formData.isPackage && (
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Included Services</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4 bg-gray-900 rounded-md max-h-48 overflow-y-auto">
              {availableServicesForPackage.map(s => (
                <div key={s.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`service-${s.id}`}
                    checked={formData.serviceIds.includes(s.id)}
                    onChange={() => handleServiceSelection(s.id)}
                    className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor={`service-${s.id}`} className="ml-2 text-sm text-gray-300">{s.name}</label>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
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
            Save Service
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ServiceFormModal;
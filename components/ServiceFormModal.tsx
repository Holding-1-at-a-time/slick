import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';
import { Service } from '../types';
import Modal from './Modal';
import { MagicIcon } from './icons';

interface ServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceToEdit: Service | null;
}

const ServiceFormModal: React.FC<ServiceFormModalProps> = ({ isOpen, onClose, serviceToEdit }) => {
  const [formData, setFormData] = useState<Omit<Service, '_id' | '_creationTime'>>({
    name: '',
    description: '',
    basePrice: 0,
    isPackage: false,
    serviceIds: [],
    isDealerPackage: false,
    estimatedDurationHours: 1,
  });

  const allServices = useQuery(api.services.getAll);
  const createService = useMutation(api.services.create);
  const updateService = useMutation(api.services.update);
  const generateDescriptionAction = useAction(api.ai.generateServiceDescription);
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
        estimatedDurationHours: serviceToEdit.estimatedDurationHours || 1,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        basePrice: 0,
        isPackage: false,
        serviceIds: [],
        isDealerPackage: false,
        estimatedDurationHours: 1,
      });
    }
  }, [serviceToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
    }
  };

  const handleServiceSelection = (serviceId: Id<'services'>) => {
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
        const description = await generateDescriptionAction({ serviceName: formData.name });
        setFormData(prev => ({ ...prev, description: description.trim() }));
    } catch (error) {
        console.error("Error generating description:", error);
        alert('Failed to generate description. Please check the console for details.');
    } finally {
        setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (serviceToEdit) {
      await updateService({ id: serviceToEdit._id, ...formData });
    } else {
      await createService(formData);
    }
    onClose();
  };
  
  const availableServicesForPackage = allServices?.filter(s => !s.isPackage && s._id !== serviceToEdit?._id) || [];

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
        <div className="grid grid-cols-2 gap-4">
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
          <div>
            <label htmlFor="estimatedDurationHours" className="block text-sm font-medium text-gray-300">Est. Duration (hrs)</label>
            <input
              type="number"
              name="estimatedDurationHours"
              id="estimatedDurationHours"
              value={formData.estimatedDurationHours}
              onChange={handleChange}
              required
              min="0.5"
              step="0.5"
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center space-x-8">
            <div className="flex items-center">
              <input id="isPackage" name="isPackage" type="checkbox" checked={formData.isPackage} onChange={handleChange} className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500" />
              <label htmlFor="isPackage" className="ml-2 block text-sm text-gray-300">Is a Package?</label>
            </div>
            <div className="flex items-center">
              <input id="isDealerPackage" name="isDealerPackage" type="checkbox" checked={formData.isDealerPackage} onChange={handleChange} className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500" />
              <label htmlFor="isDealerPackage" className="ml-2 block text-sm text-gray-300">Dealer Package?</label>
            </div>
        </div>

        {formData.isPackage && (
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Included Services</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4 bg-gray-900 rounded-md max-h-48 overflow-y-auto">
              {availableServicesForPackage.map(s => (
                <div key={s._id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`service-${s._id}`}
                    checked={formData.serviceIds.includes(s._id)}
                    onChange={() => handleServiceSelection(s._id)}
                    className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor={`service-${s._id}`} className="ml-2 text-sm text-gray-300">{s.name}</label>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-600 hover:bg-gray-700 text-gray-100 rounded-md transition-colors">
            Cancel
          </button>
          <button type="submit" className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
            Save Service
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ServiceFormModal;

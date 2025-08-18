
import React, { useState, useEffect } from 'react';
import { Upcharge } from '../types';
import Modal from './Modal';

interface UpchargeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (upcharge: Upcharge) => void;
  upchargeToEdit: Upcharge | null;
}

const UpchargeFormModal: React.FC<UpchargeFormModalProps> = ({ isOpen, onClose, onSave, upchargeToEdit }) => {
  const [formData, setFormData] = useState<Omit<Upcharge, 'id'>>({
    name: '',
    description: '',
    defaultAmount: 0,
    isPercentage: false,
  });

  useEffect(() => {
    if (upchargeToEdit) {
      setFormData({
        name: upchargeToEdit.name,
        description: upchargeToEdit.description,
        defaultAmount: upchargeToEdit.defaultAmount,
        isPercentage: upchargeToEdit.isPercentage,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        defaultAmount: 0,
        isPercentage: false,
      });
    }
  }, [upchargeToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target;
    const name = target.name;

    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
        setFormData(prev => ({ ...prev, [name]: target.checked }));
    } else if (target instanceof HTMLInputElement && target.type === 'number') {
        setFormData(prev => ({ ...prev, [name]: parseFloat(target.value) || 0 }));
    } else {
        setFormData(prev => ({ ...prev, [name]: target.value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = upchargeToEdit ? upchargeToEdit.id : `new_${Date.now()}`;
    onSave({ ...formData, id });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={upchargeToEdit ? 'Edit Upcharge' : 'Add New Upcharge'}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300">Upcharge Name</label>
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
          <label htmlFor="description" className="block text-sm font-medium text-gray-300">Description</label>
          <textarea
            name="description"
            id="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          ></textarea>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="defaultAmount" className="block text-sm font-medium text-gray-300">Default Amount</label>
              <input
                type="number"
                name="defaultAmount"
                id="defaultAmount"
                value={formData.defaultAmount}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-end pb-2">
                <div className="flex items-center">
                  <input
                    id="isPercentage"
                    name="isPercentage"
                    type="checkbox"
                    checked={formData.isPercentage}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isPercentage" className="ml-2 block text-sm text-gray-300">Is Percentage (%)?</label>
                </div>
            </div>
        </div>
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
            Save Upcharge
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default UpchargeFormModal;

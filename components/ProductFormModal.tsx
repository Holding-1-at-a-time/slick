import React, { useState, useEffect } from 'react';
import { Product, Supplier } from '../types';
import Modal from './Modal';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  productToEdit: Product | null;
  suppliers: Supplier[];
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({ isOpen, onClose, onSave, productToEdit, suppliers }) => {
  const [formData, setFormData] = useState<Omit<Product, 'id'>>({
    name: '',
    category: '',
    supplierId: '',
    stockLevel: 0,
    reorderPoint: 0,
  });

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        name: productToEdit.name,
        category: productToEdit.category,
        supplierId: productToEdit.supplierId,
        stockLevel: productToEdit.stockLevel,
        reorderPoint: productToEdit.reorderPoint,
      });
    } else {
      setFormData({
        name: '',
        category: '',
        supplierId: suppliers.length > 0 ? suppliers[0].id : '',
        stockLevel: 0,
        reorderPoint: 0,
      });
    }
  }, [productToEdit, isOpen, suppliers]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
        ...prev, 
        [name]: name === 'stockLevel' || name === 'reorderPoint' ? parseInt(value) || 0 : value 
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplierId) {
        alert("Please select a supplier.");
        return;
    }
    const id = productToEdit ? productToEdit.id : `prod_${Date.now()}`;
    onSave({ ...formData, id });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={productToEdit ? 'Edit Product' : 'Add New Product'}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300">Product Name</label>
                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3 text-white" />
            </div>
            <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-300">Category</label>
                <input type="text" name="category" id="category" value={formData.category} onChange={handleChange} required placeholder="e.g., Chemicals" className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3 text-white" />
            </div>
        </div>
        <div>
            <label htmlFor="supplierId" className="block text-sm font-medium text-gray-300">Supplier</label>
            <select name="supplierId" id="supplierId" value={formData.supplierId} onChange={handleChange} required className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3 text-white">
                <option value="" disabled>Select a supplier...</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
        </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="stockLevel" className="block text-sm font-medium text-gray-300">Current Stock Level</label>
                <input type="number" name="stockLevel" id="stockLevel" value={formData.stockLevel} onChange={handleChange} required className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3 text-white" />
            </div>
            <div>
                <label htmlFor="reorderPoint" className="block text-sm font-medium text-gray-300">Reorder Point</label>
                <input type="number" name="reorderPoint" id="reorderPoint" value={formData.reorderPoint} onChange={handleChange} required className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3 text-white" />
            </div>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
          <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-600 hover:bg-gray-700 text-gray-100 rounded-md">
            Cancel
          </button>
          <button type="submit" className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md">
            Save Product
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ProductFormModal;

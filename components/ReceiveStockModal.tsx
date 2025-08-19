import React, { useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Product } from '../types';
import Modal from './Modal';
import { Id } from '../convex/_generated/dataModel';

interface ReceiveStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
}

const ReceiveStockModal: React.FC<ReceiveStockModalProps> = ({ isOpen, onClose, products }) => {
  const [productId, setProductId] = useState<Id<'products'> | ''>('');
  const [quantity, setQuantity] = useState(1);
  const [costPerUnit, setCostPerUnit] = useState(0);
  const [notes, setNotes] = useState('');
  
  const receiveStock = useMutation(api.inventory.receiveStock);

  useEffect(() => {
    if (isOpen) {
        setProductId(products[0]?._id || '');
        setQuantity(1);
        setCostPerUnit(0);
        setNotes('');
    }
  }, [isOpen, products]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || quantity <= 0) return alert("Please select a product and enter a positive quantity.");
    await receiveStock({ productId, quantity, costPerUnit, notes });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Receive Stock">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div><label htmlFor="productId" className="block text-sm font-medium text-gray-300">Product</label><select id="productId" value={productId} onChange={e => setProductId(e.target.value as Id<'products'>)} required className="mt-1 block w-full bg-gray-700 rounded-md py-2 px-3 text-white"><option value="" disabled>Select a product...</option>{products.map(p => (<option key={p._id} value={p._id}>{p.name} (Current: {p.stockLevel})</option>))}</select></div>
        <div className="grid grid-cols-2 gap-4">
            <div><label htmlFor="quantity" className="block text-sm font-medium text-gray-300">Quantity Added</label><input type="number" id="quantity" value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 0)} required min="1" className="mt-1 block w-full bg-gray-700 rounded-md py-2 px-3 text-white"/></div>
            <div><label htmlFor="costPerUnit" className="block text-sm font-medium text-gray-300">Cost per Unit ($)</label><input type="number" id="costPerUnit" value={costPerUnit} onChange={e => setCostPerUnit(parseFloat(e.target.value) || 0)} min="0" step="0.01" className="mt-1 block w-full bg-gray-700 rounded-md py-2 px-3 text-white"/></div>
        </div>
        <div><label htmlFor="notes" className="block text-sm font-medium text-gray-300">Notes (Optional)</label><input type="text" id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g., PO #12345" className="mt-1 block w-full bg-gray-700 rounded-md py-2 px-3 text-white"/></div>
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
          <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-600 hover:bg-gray-700 text-gray-100 rounded-md">Cancel</button>
          <button type="submit" className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md">Add to Inventory</button>
        </div>
      </form>
    </Modal>
  );
};

export default ReceiveStockModal;
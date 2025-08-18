import React, { useState, useEffect } from 'react';
import { User } from '../types';
import Modal from './Modal';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: User) => void;
  userToEdit: User | null;
}

const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, onSave, userToEdit }) => {
  const [formData, setFormData] = useState<Omit<User, 'id'>>({
    name: '',
    email: '',
    role: 'technician',
  });

  useEffect(() => {
    if (userToEdit) {
      setFormData({
        name: userToEdit.name,
        email: userToEdit.email,
        role: userToEdit.role,
      });
    } else {
      setFormData({
        name: '',
        email: '',
        role: 'technician',
      });
    }
  }, [userToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = userToEdit ? userToEdit.id : `user_${Date.now()}`;
    onSave({ ...formData, id });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={userToEdit ? 'Edit User' : 'Add New User'}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300">Full Name</label>
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
          <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email Address</label>
          <input
            type="email"
            name="email"
            id="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-300">Role</label>
            <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
                <option value="technician">Technician</option>
                <option value="admin">Admin</option>
            </select>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
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
            Save User
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default UserFormModal;

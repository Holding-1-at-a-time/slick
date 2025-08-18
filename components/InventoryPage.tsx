import React, { useState, useMemo } from 'react';
import { Product, Supplier } from '../types';
import { PlusIcon, EditIcon, TrashIcon, SearchIcon, CubeIcon } from './icons';
import ProductFormModal from './ProductFormModal';

interface InventoryPageProps {
    products: Product[];
    suppliers: Supplier[];
    onSaveProduct: (product: Product) => void;
    onDeleteProduct: (productId: string) => void;
}

const InventoryPage: React.FC<InventoryPageProps> = ({ products, suppliers, onSaveProduct, onDeleteProduct }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [productToEdit, setProductToEdit] = useState<Product | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const supplierMap = useMemo(() => new Map(suppliers.map(s => [s.id, s.name])), [suppliers]);

    const filteredProducts = useMemo(() => {
        return products.filter(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (supplierMap.get(product.supplierId) || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [products, searchTerm, supplierMap]);

    const handleOpenModal = (product: Product | null) => {
        setProductToEdit(product);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setProductToEdit(null);
        setIsModalOpen(false);
    };

    const handleSave = (product: Product) => {
        onSaveProduct(product);
        handleCloseModal();
    };

    const getStatus = (product: Product) => {
        if (product.stockLevel <= 0) {
            return { text: 'Out of Stock', color: 'bg-red-800 text-red-100' };
        }
        if (product.stockLevel <= product.reorderPoint) {
            return { text: 'Low Stock', color: 'bg-yellow-800 text-yellow-100' };
        }
        return { text: 'In Stock', color: 'bg-green-800 text-green-100' };
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Inventory Management</h1>
                    <p className="text-gray-400 mt-1">Track product stock levels and manage suppliers.</p>
                </div>
                <button
                    onClick={() => handleOpenModal(null)}
                    className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Add Product
                </button>
            </header>

            <div className="bg-gray-800 rounded-lg shadow-lg p-4 mb-6">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search products by name, category, or supplier..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 pl-10 text-white"
                    />
                    <SearchIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
            </div>

            <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <table className="min-w-full">
                    <thead className="bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Product Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Supplier</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Stock / Reorder</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {filteredProducts.map(product => {
                            const status = getStatus(product);
                            return (
                                <tr key={product.id} className="hover:bg-gray-700/50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{product.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{product.category}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{supplierMap.get(product.supplierId) || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">{product.stockLevel} / {product.reorderPoint}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${status.color}`}>
                                            {status.text}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleOpenModal(product)} className="p-2 text-gray-400 hover:text-blue-400"><EditIcon className="w-5 h-5" /></button>
                                        <button onClick={() => onDeleteProduct(product.id)} className="p-2 text-gray-400 hover:text-red-500"><TrashIcon className="w-5 h-5" /></button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                 {filteredProducts.length === 0 && (
                    <div className="text-center py-16">
                        <CubeIcon className="w-12 h-12 mx-auto text-gray-600" />
                        <h3 className="text-xl text-gray-400 mt-4">No products found.</h3>
                        <p className="text-gray-500 mt-2">Try adjusting your search or add a new product.</p>
                    </div>
                )}
            </div>
            <ProductFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSave}
                productToEdit={productToEdit}
                suppliers={suppliers}
            />
        </div>
    );
};

export default InventoryPage;

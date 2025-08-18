import React, { useState, useEffect, useMemo } from 'react';
import { Job, Customer, Vehicle, Service, PricingMatrix, Upcharge, JobItem, PricingRule, Promotion } from '../types';
import Modal from './Modal';
import { PlusIcon, TrashIcon, SparklesIcon } from './icons';
import CustomerFormModal from './CustomerFormModal';
import { GoogleGenAI } from '@google/genai';

// Initialize the Google Gemini AI client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


interface JobFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (job: Job) => void;
  jobToEdit: Job | null;
  customers: Customer[];
  vehicles: Vehicle[];
  services: Service[];
  pricingMatrices: PricingMatrix[];
  upcharges: Upcharge[];
  promotions: Promotion[];
  onSaveCustomer: (customer: Customer, vehicles: Vehicle[]) => Promise<Customer>;
}

const JobFormModal: React.FC<JobFormModalProps> = ({ isOpen, onClose, onSave, jobToEdit, customers, vehicles, services, pricingMatrices, upcharges, promotions, onSaveCustomer }) => {
  const [formData, setFormData] = useState<Omit<Job, 'id' | 'jobItems' | 'totalAmount' | 'paymentReceived' | 'paymentStatus'>>({
    customerId: '',
    vehicleId: '',
    status: 'estimate',
    estimateDate: Date.now(),
    notes: '',
    appliedPromotionId: '',
    discountAmount: 0,
  });
  const [jobItems, setJobItems] = useState<JobItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  // State for Visual Quoting
  const [visualQuoteFiles, setVisualQuoteFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);


  const availableVehicles = useMemo(() => {
    return vehicles.filter(v => v.customerId === selectedCustomerId);
  }, [selectedCustomerId, vehicles]);

  useEffect(() => {
    if (jobToEdit) {
      setFormData({
        customerId: jobToEdit.customerId,
        vehicleId: jobToEdit.vehicleId,
        status: jobToEdit.status,
        estimateDate: jobToEdit.estimateDate,
        notes: jobToEdit.notes || '',
        appliedPromotionId: jobToEdit.appliedPromotionId,
        discountAmount: jobToEdit.discountAmount,
      });
      setSelectedCustomerId(jobToEdit.customerId);
      setJobItems(jobToEdit.jobItems);
      const appliedPromo = promotions.find(p => p.id === jobToEdit.appliedPromotionId);
      setPromoCode(appliedPromo?.code || '');
    } else {
      setFormData({
        customerId: '',
        vehicleId: '',
        status: 'estimate',
        estimateDate: Date.now(),
        notes: '',
        appliedPromotionId: '',
        discountAmount: 0,
      });
      setJobItems([]);
      setSelectedCustomerId('');
      setPromoCode('');
    }
    // Reset AI feature state on open/close
    setVisualQuoteFiles([]);
    setIsAnalyzing(false);
  }, [jobToEdit, isOpen, promotions]);
  
  const subtotal = useMemo(() => {
    return jobItems.reduce((acc, item) => acc + item.total, 0);
  }, [jobItems]);

  const { discountAmount, appliedPromotionId } = useMemo(() => {
    const promo = promotions.find(p => p.code.toLowerCase() === promoCode.toLowerCase() && p.isActive);
    if (!promo) {
        return { discountAmount: 0, appliedPromotionId: undefined };
    }

    let discount = 0;
    if (promo.type === 'percentage') {
        discount = subtotal * (promo.value / 100);
    } else {
        discount = promo.value > subtotal ? subtotal : promo.value;
    }
    return { discountAmount: discount, appliedPromotionId: promo.id };
  }, [promoCode, promotions, subtotal]);

  const totalAmount = useMemo(() => subtotal - discountAmount, [subtotal, discountAmount]);


  const handleMainChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'customerId') {
      setSelectedCustomerId(value);
      setFormData(prev => ({...prev, vehicleId: ''})); // Reset vehicle when customer changes
    }
  };

  const handleAddNewCustomer = async (customerData: Customer, vehicleData: Vehicle[]) => {
    const newCustomer = await onSaveCustomer(customerData, vehicleData);
    setIsCustomerModalOpen(false);
    // Automatically select the newly created customer
    setSelectedCustomerId(newCustomer.id);
    setFormData(prev => ({...prev, customerId: newCustomer.id, vehicleId: ''}));
  };

  const addServiceItem = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;

    const newItem: JobItem = {
        id: `item_${Date.now()}`,
        serviceId: service.id,
        quantity: 1,
        unitPrice: service.basePrice,
        appliedPricingRuleIds: [],
        addedUpchargeIds: [],
        total: service.basePrice
    };
    setJobItems(prev => [...prev, newItem]);
  };
  
  const removeJobItem = (itemId: string) => {
    setJobItems(prev => prev.filter(item => item.id !== itemId));
  };
  
  // A helper to find all applicable matrices and rules for a given service
  const getApplicableRules = (serviceId: string) => {
    return pricingMatrices
      .filter(matrix => matrix.appliesToServiceIds.includes(serviceId))
      .map(matrix => ({
        matrixId: matrix.id,
        matrixName: matrix.name,
        rules: matrix.rules
      }));
  }

  const handleRuleToggle = (itemId: string, ruleId: string) => {
    setJobItems(items => items.map(item => {
        if (item.id !== itemId) return item;
        
        const newRuleIds = item.appliedPricingRuleIds.includes(ruleId)
            ? item.appliedPricingRuleIds.filter(id => id !== ruleId)
            : [...item.appliedPricingRuleIds, ruleId];
        
        return { ...item, appliedPricingRuleIds: newRuleIds };
    }));
  };
  
  const handleUpchargeToggle = (itemId: string, upchargeId: string) => {
      setJobItems(items => items.map(item => {
        if (item.id !== itemId) return item;

        const newUpchargeIds = item.addedUpchargeIds.includes(upchargeId)
            ? item.addedUpchargeIds.filter(id => id !== upchargeId)
            : [...item.addedUpchargeIds, upchargeId];

        return { ...item, addedUpchargeIds: newUpchargeIds };
    }));
  };

  // Recalculate totals whenever items or their rules change
  useEffect(() => {
    const allRules = pricingMatrices.flatMap(m => m.rules);

    setJobItems(currentItems => currentItems.map(item => {
        let newTotal = item.unitPrice * item.quantity;

        // Apply pricing rules
        item.appliedPricingRuleIds.forEach(ruleId => {
            const rule = allRules.find(r => r.id === ruleId);
            if (!rule) return;

            if (rule.adjustmentType === 'fixedAmount') {
                newTotal += rule.adjustmentValue;
            } else { // percentage
                newTotal += newTotal * (rule.adjustmentValue / 100);
            }
        });

        // Apply standalone upcharges
        item.addedUpchargeIds.forEach(upchargeId => {
            const upcharge = upcharges.find(u => u.id === upchargeId);
            if (!upcharge) return;

            if (upcharge.isPercentage) {
                 newTotal += newTotal * (upcharge.defaultAmount / 100);
            } else {
                newTotal += upcharge.defaultAmount;
            }
        });
        
        return { ...item, total: newTotal };
    }));
  }, [jobItems.map(i => i.appliedPricingRuleIds).join(','), jobItems.map(i => i.addedUpchargeIds).join(','), pricingMatrices, upcharges]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = jobToEdit ? jobToEdit.id : `job_${Date.now()}`;
    const finalJob: Job = {
        ...formData,
        customerId: selectedCustomerId,
        id,
        jobItems,
        appliedPromotionId,
        discountAmount,
        totalAmount,
        paymentReceived: jobToEdit?.paymentReceived || 0,
        paymentStatus: jobToEdit?.paymentStatus || 'unpaid',
    };
    onSave(finalJob);
  };
  
  const alreadyAddedServiceIds = useMemo(() => new Set(jobItems.map(item => item.serviceId)), [jobItems]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setVisualQuoteFiles(Array.from(e.target.files));
    }
  };

  // Helper function to convert a File to a Gemini GenerativePart
  const fileToGenerativePart = (file: File): Promise<{inlineData: {data: string, mimeType: string}}> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = (reader.result as string).split(',')[1];
        resolve({
          inlineData: {
            data: base64Data,
            mimeType: file.type,
          },
        });
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleVisualQuote = async () => {
    if (visualQuoteFiles.length === 0) {
      alert("Please upload at least one photo.");
      return;
    }
    setIsAnalyzing(true);
    try {
      const imageParts = await Promise.all(visualQuoteFiles.map(fileToGenerativePart));
      
      const servicesList = services.map(s => `ID: "${s.id}", Name: "${s.name}", Description: "${s.description}"`).join('\n');
      const upchargesList = upcharges.map(u => `ID: "${u.id}", Name: "${u.name}", Description: "${u.description}"`).join('\n');
      
      const prompt = `Analyze these images of a vehicle. Identify its make, model, and color if possible, but focus on detecting common detailing issues. These issues could include heavy paint swirls, scratches, salt stains on carpets, tree sap, bug residue, or excessive pet hair.

      Based on your findings, suggest a list of services and a list of upcharges from the provided lists below that would address the identified issues.
      
      Available Services:
      ${servicesList}
      
      Available Upcharges:
      ${upchargesList}
      
      Return your response ONLY as a JSON object with the following structure: { "suggestedServiceIds": ["id1", "id2", ...], "suggestedUpchargeIds": ["id1", "id2", ...] }. Do not include any other text, explanations, or markdown formatting.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: prompt }, ...imageParts] }
      });

      const cleanedJsonString = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const suggestions = JSON.parse(cleanedJsonString);
      const { suggestedServiceIds = [], suggestedUpchargeIds = [] } = suggestions;

      const newJobItems: JobItem[] = suggestedServiceIds.map((serviceId: string) => {
          const service = services.find(s => s.id === serviceId);
          if (!service) return null;
          return {
              id: `item_${Date.now()}_${service.id}`,
              serviceId: service.id,
              quantity: 1,
              unitPrice: service.basePrice,
              appliedPricingRuleIds: [],
              addedUpchargeIds: [],
              total: service.basePrice
          };
      }).filter((item: JobItem | null): item is JobItem => item !== null);

      if (newJobItems.length > 0 && suggestedUpchargeIds.length > 0) {
          newJobItems[0].addedUpchargeIds = [...newJobItems[0].addedUpchargeIds, ...suggestedUpchargeIds];
      }

      setJobItems(newJobItems);
      setVisualQuoteFiles([]);


    } catch (error) {
      console.error("Error with Visual Quoting:", error);
      alert("Failed to analyze photos. Please check the console for details.");
    } finally {
      setIsAnalyzing(false);
    }
  };


  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={jobToEdit ? 'Edit Job/Estimate' : 'Create New Job/Estimate'}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer & Vehicle Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label htmlFor="customerId" className="block text-sm font-medium text-gray-300">Customer</label>
                  <div className="flex items-center space-x-2 mt-1">
                      <select id="customerId" name="customerId" value={selectedCustomerId} onChange={handleMainChange} required className="block w-full bg-gray-700 rounded-md py-2 px-3 text-white focus:ring-blue-500 focus:border-blue-500">
                          <option value="" disabled>Select a customer...</option>
                          {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                       <button type="button" onClick={() => setIsCustomerModalOpen(true)} className="flex-shrink-0 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-3 rounded-lg text-sm transition-colors">
                          New
                      </button>
                  </div>
              </div>
              <div>
                  <label htmlFor="vehicleId" className="block text-sm font-medium text-gray-300">Vehicle</label>
                  <select id="vehicleId" name="vehicleId" value={formData.vehicleId} onChange={handleMainChange} required disabled={!selectedCustomerId} className="mt-1 block w-full bg-gray-700 rounded-md py-2 px-3 text-white focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-800 disabled:text-gray-500">
                      <option value="" disabled>Select a vehicle...</option>
                      {availableVehicles.map(v => <option key={v.id} value={v.id}>{`${v.year} ${v.make} ${v.model}`}</option>)}
                  </select>
              </div>
          </div>
          
          {/* AI Visual Quoting Section */}
          <div className="pt-4 border-t border-gray-700">
            <h3 className="text-lg font-medium text-gray-200 mb-2">Visual Quoting (AI Assist)</h3>
            <div className="p-4 bg-gray-900 rounded-md space-y-3">
              <div>
                <label htmlFor="visual-quote-files" className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg text-center text-sm w-full block">
                  {visualQuoteFiles.length > 0 ? `${visualQuoteFiles.length} photo(s) selected` : "Upload Vehicle Photos"}
                </label>
                <input id="visual-quote-files" type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
              </div>
              {visualQuoteFiles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {visualQuoteFiles.map((file, index) => (
                    <img key={index} src={URL.createObjectURL(file)} alt={`preview ${index}`} className="w-16 h-16 rounded-md object-cover" />
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={handleVisualQuote}
                disabled={isAnalyzing || visualQuoteFiles.length === 0}
                className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm disabled:bg-gray-500 disabled:cursor-not-allowed"
              >
                <SparklesIcon className="w-5 h-5 mr-2" />
                {isAnalyzing ? 'Analyzing...' : 'Analyze Photos & Suggest Services'}
              </button>
            </div>
          </div>

          {/* Job Items */}
          <div className="pt-4 border-t border-gray-700">
              <h3 className="text-lg font-medium text-gray-200 mb-2">Line Items</h3>
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {jobItems.map(item => {
                      const service = services.find(s => s.id === item.serviceId);
                      const applicableRules = getApplicableRules(item.serviceId);
                      if (!service) return null;
                      return (
                          <div key={item.id} className="p-3 bg-gray-900 rounded-md space-y-3">
                              <div className="flex justify-between items-start">
                                  <div>
                                      <h4 className="font-bold text-white">{service.name}</h4>
                                      <p className="text-xs text-gray-400">Base: ${item.unitPrice.toFixed(2)}</p>
                                  </div>
                                  <div className="text-right">
                                      <p className="font-bold text-lg text-blue-400">${item.total.toFixed(2)}</p>
                                      <button type="button" onClick={() => removeJobItem(item.id)} className="p-1 text-gray-500 hover:text-red-500 -mr-1 mt-1">
                                          <TrashIcon className="w-4 h-4" />
                                      </button>
                                  </div>
                              </div>
                              
                              {/* Applicable Pricing Rules */}
                              {applicableRules.length > 0 && (
                                  <div>
                                      {applicableRules.map(({matrixName, rules}) => (
                                          <div key={matrixName}>
                                              <label className="text-xs font-semibold text-gray-500 uppercase">{matrixName}</label>
                                              <div className="flex flex-wrap gap-2 mt-1">
                                                  {rules.map(rule => (
                                                      <button type="button" key={rule.id} onClick={() => handleRuleToggle(item.id, rule.id)} className={`text-xs px-2 py-1 rounded-full border transition-colors ${item.appliedPricingRuleIds.includes(rule.id) ? 'bg-blue-500 border-blue-400 text-white' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}>
                                                          {rule.factor} (+{rule.adjustmentType === 'percentage' ? `${rule.adjustmentValue}%` : `$${rule.adjustmentValue}`})
                                                      </button>
                                                  ))}
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              )}

                              {/* Addable Upcharges */}
                              {upcharges.length > 0 && (
                                  <div>
                                      <label className="text-xs font-semibold text-gray-500 uppercase">Add Upcharges</label>
                                      <div className="flex flex-wrap gap-2 mt-1">
                                          {upcharges.map(upcharge => (
                                              <button type="button" key={upcharge.id} onClick={() => handleUpchargeToggle(item.id, upcharge.id)} className={`text-xs px-2 py-1 rounded-full border transition-colors ${item.addedUpchargeIds.includes(upcharge.id) ? 'bg-green-500 border-green-400 text-white' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}>
                                                  {upcharge.name} (+{upcharge.isPercentage ? `${upcharge.defaultAmount}%` : `$${upcharge.defaultAmount}`})
                                              </button>
                                          ))}
                                      </div>
                                  </div>
                              )}
                          </div>
                      );
                  })}
              </div>
              
              <div className="mt-4">
                  <label htmlFor="service-adder" className="sr-only">Add Service</label>
                  <select 
                      id="service-adder"
                      value=""
                      onChange={e => addServiceItem(e.target.value)}
                      className="w-full bg-gray-700 rounded-md py-2 px-3 text-white focus:ring-blue-500 focus:border-blue-500"
                  >
                      <option value="" disabled>+ Add a service...</option>
                      {services.filter(s => !alreadyAddedServiceIds.has(s.id)).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
              </div>
          </div>

          {/* Notes & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-300">Notes</label>
                  <textarea name="notes" id="notes" value={formData.notes} onChange={handleMainChange} rows={3} className="mt-1 block w-full bg-gray-700 rounded-md py-2 px-3 text-white focus:ring-blue-500 focus:border-blue-500"></textarea>
              </div>
              <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-300">Status</label>
                  <select id="status" name="status" value={formData.status} onChange={handleMainChange} className="mt-1 block w-full bg-gray-700 rounded-md py-2 px-3 text-white focus:ring-blue-500 focus:border-blue-500">
                      <option value="estimate">Estimate</option>
                      <option value="workOrder">Work Order</option>
                      <option value="invoice">Invoice</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                  </select>
                  <div className="mt-2">
                    <label htmlFor="promoCode" className="block text-sm font-medium text-gray-300">Promotion Code</label>
                    <input type="text" id="promoCode" value={promoCode} onChange={e => setPromoCode(e.target.value)} className="mt-1 block w-full bg-gray-700 rounded-md py-2 px-3 text-white" />
                  </div>
              </div>
          </div>
          
          {/* Total */}
          <div className="pt-4 border-t border-gray-700 text-right space-y-1">
              <div className="flex justify-end items-center">
                  <span className="text-md text-gray-400 mr-4">Subtotal:</span>
                  <span className="text-lg font-semibold text-gray-300">${subtotal.toFixed(2)}</span>
              </div>
               {discountAmount > 0 && (
                  <div className="flex justify-end items-center">
                      <span className="text-md text-green-400 mr-4">Discount:</span>
                      <span className="text-lg font-semibold text-green-400">-${discountAmount.toFixed(2)}</span>
                  </div>
              )}
               <div className="flex justify-end items-center">
                  <span className="text-lg font-medium text-gray-300 mr-4">Total:</span>
                  <span className="text-3xl font-bold text-blue-400">${totalAmount.toFixed(2)}</span>
              </div>
          </div>


          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-600 hover:bg-gray-700 text-gray-100 rounded-md transition-colors">
              Cancel
            </button>
            <button type="submit" className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
              Save Job
            </button>
          </div>
        </form>
      </Modal>
      <CustomerFormModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSave={handleAddNewCustomer}
        customerToEdit={null}
        allVehicles={vehicles}
      />
    </>
  );
};

export default JobFormModal;
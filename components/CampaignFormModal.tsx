import React, { useState, useEffect } from 'react';
import { Campaign } from '../types';
import Modal from './Modal';
import { GoogleGenAI } from '@google/genai';
import { MagicIcon } from './icons';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface CampaignFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (campaign: Campaign) => void;
  campaignToEdit: Campaign | null;
}

const CampaignFormModal: React.FC<CampaignFormModalProps> = ({ isOpen, onClose, onSave, campaignToEdit }) => {
  const [formData, setFormData] = useState<Omit<Campaign, 'id' | 'createdAt'>>({
    goal: '',
    subject: '',
    body: '',
  });
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (campaignToEdit) {
      setFormData({
        goal: campaignToEdit.goal,
        subject: campaignToEdit.subject,
        body: campaignToEdit.body,
      });
    } else {
      setFormData({
        goal: '',
        subject: '',
        body: '',
      });
    }
  }, [campaignToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleGenerateContent = async () => {
    if (!formData.goal) {
      alert('Please enter a campaign goal first.');
      return;
    }
    setIsGenerating(true);
    try {
      const prompt = `You are a marketing expert for an auto detailing business. Based on the following campaign goal, generate a compelling subject line and a concise, professional email body.
        
        Campaign Goal: "${formData.goal}"

        Format your response as a JSON object with two keys: "subject" and "body". The body should be plain text and include placeholders like "[Customer Name]" where appropriate.`;
      
      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: { responseMimeType: "application/json" }
      });
      
      const content = JSON.parse(response.text);
      setFormData(prev => ({ ...prev, subject: content.subject, body: content.body }));

    } catch (error) {
      console.error("Error generating campaign content:", error);
      alert('Failed to generate content. Please try a different goal or check the console.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = campaignToEdit ? campaignToEdit.id : `camp_${Date.now()}`;
    onSave({ ...formData, id, createdAt: Date.now() });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={campaignToEdit ? 'View Campaign' : 'Create New Campaign'}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="goal" className="block text-sm font-medium text-gray-300">Campaign Goal</label>
           <div className="flex items-center space-x-2 mt-1">
                <input
                    type="text"
                    name="goal"
                    id="goal"
                    value={formData.goal}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Promote a 20% spring cleaning discount"
                    className="block w-full bg-gray-700 rounded-md py-2 px-3 text-white"
                />
                <button 
                    type="button" 
                    onClick={handleGenerateContent}
                    disabled={isGenerating || !formData.goal}
                    className="flex-shrink-0 flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg text-sm disabled:bg-gray-500"
                >
                    <MagicIcon className="w-4 h-4 mr-2" />
                    {isGenerating ? 'Generating...' : 'Generate'}
                </button>
           </div>
        </div>
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-300">Subject Line</label>
          <input
            type="text"
            name="subject"
            id="subject"
            value={formData.subject}
            onChange={handleChange}
            required
            className="mt-1 block w-full bg-gray-700 rounded-md py-2 px-3 text-white"
          />
        </div>
        <div>
          <label htmlFor="body" className="block text-sm font-medium text-gray-300">Email Body</label>
          <textarea
            name="body"
            id="body"
            value={formData.body}
            onChange={handleChange}
            required
            rows={8}
            className="mt-1 block w-full bg-gray-700 rounded-md py-2 px-3 text-white"
          ></textarea>
        </div>
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
          <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-600 hover:bg-gray-700 text-gray-100 rounded-md">
            Cancel
          </button>
          <button type="submit" className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md">
            Save Campaign
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CampaignFormModal;

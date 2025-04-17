import React, { useState } from 'react';
import { NewVersionProps } from '../../../langgraph-app/src/types';

interface NewVersionFormProps {
  data: NewVersionProps;
  onSubmit: (data: NewVersionProps) => void;
  onCancel: () => void;
}

const NewVersionForm: React.FC<NewVersionFormProps> = ({ 
  data, 
  onSubmit, 
  onCancel 
}) => {
  // Initialize with default values if empty
  const [formData, setFormData] = useState<NewVersionProps>({
    productId: data.productId || '',
    rolloverDate: data.rolloverDate || new Date().toISOString().split('T')[0],
    projectId: data.projectId || '',
    displayName: data.displayName || [
      { text: `Version for ${data.productId || 'Product'}`, language: 'en-xx' },
      { text: `نسخة للمنتج ${data.productId || ''}`, language: 'ar-xx' }
    ]
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDisplayNameChange = (value: string) => {
    // Update both language versions with the same value
    const updatedDisplayName = [
      { text: value, language: 'en-xx' },
      { text: value, language: 'ar-xx' }
    ];
    
    setFormData(prev => ({
      ...prev,
      displayName: updatedDisplayName
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Collect validation errors
    const errors = [];
    
    // If product ID is empty or "product", show validation error
    if (!formData.productId || formData.productId === "product") {
      errors.push("Please enter a valid Product ID");
    }
    
    if (!formData.rolloverDate) {
      errors.push("Please enter a rollover date");
    }
    
    if (errors.length > 0) {
      alert(errors.join("\n"));
      return;
    }
    
    // Handle empty project ID
    const submissionData = {
      ...formData,
      projectId: formData.projectId || ""
    };
    
    console.log("Submitting new version form with data:", submissionData);
    onSubmit(submissionData);
  };

  // Get the display name for English (or default to empty)
  const displayNameText = formData.displayName && formData.displayName.length > 0 
    ? formData.displayName.find(d => d.language === 'en-xx')?.text || '' 
    : '';

  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 my-3">
      <h3 className="text-lg font-medium mb-4">New Product Version Form</h3>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label htmlFor="productId" className="block text-sm font-medium text-gray-700">
              Product ID*
            </label>
            <input
              type="text"
              id="productId"
              name="productId"
              required
              value={formData.productId}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter product ID (e.g. 1094110)"
            />
          </div>
          
          <div>
            <label htmlFor="rolloverDate" className="block text-sm font-medium text-gray-700">
              Rollover Date*
            </label>
            <input
              type="date"
              id="rolloverDate"
              name="rolloverDate"
              required
              value={formData.rolloverDate}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="projectId" className="block text-sm font-medium text-gray-700">
              Project ID
            </label>
            <input
              type="text"
              id="projectId"
              name="projectId"
              value={formData.projectId}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter project ID (optional, e.g. PLM2502-934)"
            />
          </div>

          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
              Display Name
            </label>
            <input
              type="text"
              id="displayName"
              value={displayNameText}
              onChange={(e) => handleDisplayNameChange(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter display name for the version"
            />
          </div>
        </div>
        
        <div className="mt-4 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewVersionForm;

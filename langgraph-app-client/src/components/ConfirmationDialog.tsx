import React from 'react';
import { ConfirmationProps } from '../../../langgraph-app/src/types';

interface ConfirmationDialogProps {
  data: ConfirmationProps;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({ 
  data, 
  onConfirm, 
  onCancel 
}) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 my-3">
      <h3 className="text-lg font-medium mb-2">{data.title}</h3>
      <p className="text-gray-600 mb-4">{data.message}</p>
      
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          No
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Yes
        </button>
      </div>
    </div>
  );
};

export default ConfirmationDialog;

import React, { useState } from "react";
import { PriceModificationProps } from "../../../langgraph-app/src/types";

interface PriceModificationFormProps {
  data: PriceModificationProps;
  onSubmit: (data: PriceModificationProps) => void;
  onCancel: () => void;
}

const PriceModificationForm: React.FC<PriceModificationFormProps> = ({
  data,
  onSubmit,
  onCancel,
}) => {
  // Initialize with default values if empty
  const [formData, setFormData] = useState<PriceModificationProps>({
    productId: data.productId || "",
    priceId: data.priceId || "",
    newPrice: data.newPrice || undefined,
    rolloverDate: data.rolloverDate || new Date().toISOString().split("T")[0],
    projectId: data.projectId || "",
    catalogName: data.catalogName || "B2CCatalog",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "newPrice" ? (value ? parseFloat(value) : undefined) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Collect validation errors
    const errors = [];

    if (!formData.productId) {
      errors.push("Product ID is required");
    }

    if (!formData.priceId) {
      errors.push("Price ID is required");
    }

    if (!formData.newPrice) {
      errors.push("New Price is required");
    }

    if (errors.length > 0) {
      alert(errors.join("\n"));
      return;
    }

    // Handle empty project ID
    const submissionData = {
      ...formData,
      projectId: formData.projectId || "",
    };

    console.log(
      "Submitting price modification form with data:",
      submissionData
    );
    onSubmit(submissionData);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 my-3">
      <h3 className="text-lg font-medium mb-4">Price Modification Form</h3>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label
              htmlFor="productId"
              className="block text-sm font-medium text-gray-700"
            >
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
            <label
              htmlFor="priceId"
              className="block text-sm font-medium text-gray-700"
            >
              Price ID*
            </label>
            <input
              type="text"
              id="priceId"
              name="priceId"
              required
              value={formData.priceId}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter price ID (e.g. PRC9242016851)"
            />
          </div>

          <div>
            <label
              htmlFor="newPrice"
              className="block text-sm font-medium text-gray-700"
            >
              New Price*
            </label>
            <input
              type="number"
              step="0.01"
              id="newPrice"
              name="newPrice"
              required
              value={formData.newPrice || ""}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter new price (e.g. 40)"
            />
          </div>

          <div>
            <label
              htmlFor="rolloverDate"
              className="block text-sm font-medium text-gray-700"
            >
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
            <label
              htmlFor="projectId"
              className="block text-sm font-medium text-gray-700"
            >
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

export default PriceModificationForm;

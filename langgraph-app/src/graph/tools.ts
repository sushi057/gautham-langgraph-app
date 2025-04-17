import axios from "axios";
import * as dotenv from "dotenv";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

dotenv.config();

// --- Configuration ---
const BASE_URL = "https://stc-sandbox.kloudville.com";
// const LOGIN_URL = `${BASE_URL}/service/idm/authentication/login`;
const MODIFY_PRICE_URL = `${BASE_URL}/service/stcui/UICustomAPI/customPriceCreation`;
const CREATE_VERSION_URL = `${BASE_URL}/service/stcui/UICustomAPI/customProductCreation`;

const LOGIN_CREDENTIALS = {
  userLogin: {
    user: process.env.USERNAME,
    password: process.env.PASSWORD,
  },
};

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "X-CSRF-Token": process.env.CSRF_TOKEN, // Send captured CSRF token back
  },
});

/**
 * Tool to modify a product's price.
 */
const updatePrice = tool(
  async (input) => {
    const {
      productId,
      priceId,
      newPrice,
      rolloverDate,
      projectId,
      catalogName = "B2CCatalog",
    } = input;

    // Assume productAvailableDate is same as rolloverDate based on example
    const productAvailableDate = rolloverDate;

    const payload = {
      catalogName,
      projectId: projectId || "", // API might require empty string if null/undefined
      productId,
      productAvailableDate,
      priceList: [
        {
          priceId,
          rolloverDate,
          valueAmount: newPrice,
        },
      ],
    };

    // print the headers
    console.log(
      " > Headers:",
      JSON.stringify(apiClient.defaults.headers, null, 2)
    );
    console.log(" > Sending Payload:", JSON.stringify(payload, null, 2));

    try {
      const response = await apiClient.post(MODIFY_PRICE_URL, payload);
      console.log(" > Modify Price Response Status:", response.status);

      if (response.status >= 200 && response.status < 300) {
        console.log(" > Price update successful.");
        return {
          success: true,
          message: "Price update successful",
          details: response.data,
        };
      } else {
        console.error(` > Price update failed with status: ${response.status}`);
        return {
          success: false,
          message: `Price update failed with status: ${response.status}`,
          details: response.data,
        };
      }
    } catch (error: any) {
      console.error(
        " > Error during price update:",
        error.response?.data || error.message
      );
      return {
        success: false,
        error: error.response?.data || error.message,
        details: "Price update operation failed",
      };
    }
  },
  {
    name: "updatePrice",
    schema: z.object({
      productId: z.string(),
      priceId: z.string(),
      newPrice: z.number(),
      rolloverDate: z.string(),
      projectId: z.string().optional(),
      catalogName: z.string().optional().default("B2CCatalog"),
    }),
  }
);

/**
 * Tool to create a new product version/rollout.
 */

const createNewProductVersion = tool(
  async (input) => {
    const { productId, rolloverDate, projectId, displayName } = input;
    console.log(`[Tool Called: createNewVersion for Product ${productId}]`);

    // Default display name if not provided - ADJUST LANGUAGES/TEXT AS NEEDED
    const defaultDisplayName = [
      { text: `Version for ${productId} (${rolloverDate})`, language: "en-xx" }, // Generic English name
      { text: `Version for ${productId} (${rolloverDate})`, language: "ar-xx" }, // Generic Arabic name
    ];

    const payload = {
      projectId: projectId || "", // Use empty string if undefined
      productId,
      rolloverDate,
      displayName: displayName || defaultDisplayName,
    };

    console.log(" > Sending Payload:", JSON.stringify(payload, null, 2));

    try {
      const response = await apiClient.post(CREATE_VERSION_URL, payload);
      console.log(" > Create Version Response Status:", response.status);
      // console.log(" > Create Version Response Data:", response.data);

      if (response.status >= 200 && response.status < 300) {
        console.log(" > New version creation successful.");
        return {
          success: true,
          message: "New version creation successful",
          details: response.data,
        };
      } else {
        console.error(
          ` > New version creation failed with status: ${response.status}`
        );
        return {
          success: false,
          message: `New version creation failed with status: ${response.status}`,
          details: response.data,
        };
      }
    } catch (error: any) {
      console.error(
        " > Error during version creation:",
        error.response?.data || error.message
      );
      return {
        success: false,
        error: error.response?.data || error.message,
        details: "Version creation operation failed",
      };
    }
  },
  {
    name: "createNewProductVersion",
    schema: z.object({
      productId: z.string(),
      rolloverDate: z.string(),
      projectId: z.string().optional(),
      displayName: z
        .array(
          z.object({
            text: z.string(),
            language: z.string(),
          })
        )
        .optional(),
    }),
  }
);

// Combine real API tools with placeholders
export const apiTools = {
  updatePrice,
  createNewProductVersion,
};

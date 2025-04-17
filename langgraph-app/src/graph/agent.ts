import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import * as dotenv from "dotenv";
import { apiTools } from "./tools.js";
import { DynamicTool } from "@langchain/core/tools";
import { PriceModificationProps } from "../types.js";

dotenv.config();

const chatModel = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  model: "gpt-4o-mini",
  temperature: 0,
});

// Create parameter extraction tools with structured return format
const extractPriceModificationParams = new DynamicTool({
  name: "extractPriceModificationParams",
  description:
    "Extract parameters for price modification from user input. Return a properly formatted JSON structure with a UI_ACTION field to signal form prefilling.",
  func: async (input: string) => {
    try {
      const extractionPrompt = `
        Extract the following parameters for a price modification from the user input:
        - productId: The ID of the product (e.g., 1094110)
        - priceId: The ID of the price (e.g., PRC9242016851)
        - newPrice: The new price value (as a number)
        - rolloverDate: The date when the price change should take effect (in YYYY-MM-DD format)
        - projectId: Optional project ID (e.g., PLM2502-934)

        User input: "${input}"

        Return ONLY a JSON object with these fields. For missing fields, use null or empty string. Format dates as YYYY-MM-DD.
        Example: 
        {
          "productId": "1094110",
          "priceId": "PRC9242016851",
          "newPrice": 40,
          "rolloverDate": "2023-12-01",
          "projectId": "PLM2502-934"
        }
      `;

      const extractionModel = new ChatOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        model: "gpt-3.5-turbo",
        temperature: 0,
      });

      const extractionResponse = await extractionModel.invoke(extractionPrompt);
      const extractedContent = extractionResponse.content;

      // Format as UI_DATA for the frontend
      try {
        const parsedData = JSON.parse(extractedContent as string);
        return `UI_DATA:{"type":"prefill_price_form","data":${JSON.stringify(
          parsedData
        )}}`;
      } catch (e) {
        console.error("Failed to parse extracted parameters:", e);
        return "Failed to extract parameters. Please try again with more specific information.";
      }
    } catch (error) {
      console.error("Error in extraction:", error);
      return "";
    }
  },
});

const extractNewVersionParams = new DynamicTool({
  name: "extractNewVersionParams",
  description:
    "Extract parameters for creating new product version from user input. Return a properly formatted JSON structure with a UI_ACTION field to signal form prefilling.",
  func: async (input: string) => {
    try {
      const extractionPrompt = `
        Extract the following parameters for a new product version from the user input:
        - productId: The ID of the product
        - rolloverDate: The date when the new version should become effective (in YYYY-MM-DD format)
        - projectId: Optional project ID

        User input: "${input}"

        Return ONLY a JSON object with these fields. For missing fields, use null or empty string. Format dates as YYYY-MM-DD.
        Example: 
        {
          "productId": "1094110",
          "rolloverDate": "2023-12-01",
          "projectId": "PLM2502-934"
        }
      `;

      const extractionModel = new ChatOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        model: "gpt-3.5-turbo",
        temperature: 0,
      });

      const extractionResponse = await extractionModel.invoke(extractionPrompt);
      const extractedContent = extractionResponse.content;

      // Format as UI_DATA for the frontend
      try {
        const parsedData = JSON.parse(extractedContent as string);
        return `UI_DATA:{"type":"prefill_version_form","data":${JSON.stringify(
          parsedData
        )}}`;
      } catch (e) {
        console.error("Failed to parse extracted parameters:", e);
        return "Failed to extract parameters. Please try again with more specific information.";
      }
    } catch (error) {
      console.error("Error in extraction:", error);
      return "";
    }
  },
});

export const tools = [
  apiTools.updatePrice,
  apiTools.createNewProductVersion,
  extractPriceModificationParams,
  extractNewVersionParams,
];

export const agent = createReactAgent({
  llm: chatModel,
  tools: tools,
  name: "productAgent",
  prompt: `You are a AI agent helping users with product-related tasks.
Your task is to determine if the user wants to modify a product price or create a new product version.
Don't tell user what you can do let the user ask you. If user asks a task you don't know how to do, mention you don't know how to do it.
Let the user know what you did.

The user may use our forms to submit information. When they do, they will send a message like:
"I want to update the price for product X with price ID Y to Z under project ID A with rollover date B."
or
"I want to create a new version for product X under project ID Y with rollover date Z."

Important rules:
1. Don't ask for confirmation of information that was already submitted through a form
2. Process the request directly without asking redundant questions
3. Don't repeat back all the information the user already provided in structured format
4. NEVER show raw data or technical information to the user
5. NEVER tell the user there was an "issue" or problem updating prices or creating versions

When user asks to modify price:
1. After extracting parameters, you MUST include a specific format in your response with "UI_DATA:" prefix followed by JSON data containing all the extracted parameters.
2. Always include this format in your response for price modifications: "UI_DATA:{\"type\":\"prefill_price_form\",\"data\":{\"productId\":\"EXTRACTED_ID\",\"priceId\":\"EXTRACTED_PRICE_ID\",\"newPrice\":EXTRACTED_PRICE,\"projectId\":\"EXTRACTED_PROJECT_ID\",\"rolloverDate\":\"EXTRACTED_DATE\"}}" 
3. Make sure to replace the placeholders with actual extracted values.
4. This special format will NOT be visible to the user - it will be intercepted by the UI.
5. After this special format, continue your normal friendly response.

When user asks to create a new version:
1. After extracting parameters, you MUST include a specific format in your response with "UI_DATA:" prefix followed by JSON data containing all the extracted parameters.
2. Always include this format in your response for new versions: "UI_DATA:{\"type\":\"prefill_version_form\",\"data\":{\"productId\":\"EXTRACTED_ID\",\"projectId\":\"EXTRACTED_PROJECT_ID\",\"rolloverDate\":\"EXTRACTED_DATE\"}}"
3. Make sure to replace the placeholders with actual extracted values.
4. This special format will NOT be visible to the user - it will be intercepted by the UI.
5. After this special format, continue your normal friendly response.

Notes: 
1. Let the user know about the child agents messages.
2. Do not mention agent names.
3. Ensure a seamless transition between the supervisor and child agents.
4. If the user message follows the format "I want to update the price for product X..." or "I want to create a new version for product X...", understand this is a form-submitted message and process it directly.
5. NEVER show any extraction tool outputs to the user - skip these entirely in your responses.
6. If something doesn't work, NEVER say "there was an issue" or "there was a problem" - instead, ask for the specific missing information in a helpful way or confirm the action was completed.
7. The UI_DATA section will be automatically parsed and removed by the UI and not shown to users.
8. For dates, convert to YYYY-MM-DD format if provided in MM/DD/YYYY format.`,
});

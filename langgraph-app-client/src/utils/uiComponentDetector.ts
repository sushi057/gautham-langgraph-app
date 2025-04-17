import { v4 as uuidv4 } from "uuid";
import { UIComponentUnion } from "../../../langgraph-app/src/types";

/**
 * Detects potential UI components based on LLM intent classification
 */
export const detectUIComponents = async (
  content: string
): Promise<UIComponentUnion | null> => {
  // Default date as today in YYYY-MM-DD format
  const defaultDate = new Date().toISOString().split("T")[0];

  try {
    // Call OpenAI API to detect intent
    // Import environment configuration
    const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
      console.error("OpenAI API key not found in environment variables");
      return null;
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are an intent classifier. Determine if the user wants to modify a price or create a new product version. Respond with exactly one of these: 'PRICE_MODIFICATION', 'NEW_VERSION', or 'NONE'." +
              "Note: If the message is something very specific like 'I want to update the price for product X with price ID Y to Z under project ID A with rollover date B.' or 'I want to create a new version for product X under project ID Y with rollover date Z.', then return 'NONE'.",
          },
          {
            role: "user",
            content: content,
          },
        ],
        temperature: 0.1,
        max_tokens: 10,
      }),
    });

    if (!response.ok) {
      console.error("Error calling OpenAI API:", await response.text());
      return null;
    }

    const data = await response.json();
    const intent =
      data.choices[0]?.message?.content?.trim().toUpperCase() || "NONE";

    console.log("Detected intent:", intent);
    console.log("content", content);

    // Return appropriate component based on detected intent
    if (intent === "PRICE_MODIFICATION") {
      return {
        type: "priceModificationForm",
        id: uuidv4(),
        createdAt: Date.now(),
        props: {
          productId: "",
          priceId: "",
          newPrice: undefined,
          rolloverDate: defaultDate,
          projectId: "",
        },
      };
    } else if (intent === "NEW_VERSION") {
      return {
        type: "newVersionForm",
        id: uuidv4(),
        createdAt: Date.now(),
        props: {
          productId: "",
          rolloverDate: defaultDate,
          projectId: "",
          displayName: [
            { text: "New Product Version", language: "en-xx" },
            { text: "New Product Version", language: "ar-xx" },
          ],
        },
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error in intent detection:", error);
  }

  return null;
};

/**
 * Creates a confirmation dialog component for the given form data
 */
export const createConfirmationComponent = (data: any): UIComponentUnion => {
  return {
    type: "confirmationDialog",
    id: uuidv4(),
    createdAt: Date.now(),
    props: {
      title: data.productId
        ? `Confirm Action for ${data.productId}`
        : "Confirm Action",
      message: data.newPrice
        ? `Are you sure you want to update the price to ${data.newPrice}?`
        : "Are you sure you want to create a new product version?",
      action: data.newPrice ? "updatePrice" : "createNewProductVersion",
      actionData: data,
    },
  };
};

/**
 * Formats a confirmation message based on the action and data
 */
export const formatConfirmationMessage = (
  action: string,
  data: any
): string => {
  if (action === "updatePrice") {
    return `I want to update the price for product ${
      data.productId || ""
    } with price ID ${data.priceId || ""} to ${data.newPrice || ""}${
      data.projectId ? ` under project ID ${data.projectId}` : ""
    }${data.rolloverDate ? ` with rollover date ${data.rolloverDate}` : ""}.`;
  } else {
    return `I want to create a new version for product ${data.productId || ""}${
      data.projectId ? ` under project ID ${data.projectId}` : ""
    }${data.rolloverDate ? ` with rollover date ${data.rolloverDate}` : ""}.`;
  }
};

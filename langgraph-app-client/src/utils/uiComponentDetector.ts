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

  // Check for UI_DATA in content first (for direct form prefilling)
  const uiDataMatch = content.match(/UI_DATA:(\{.*\})/s);
  if (uiDataMatch && uiDataMatch[1]) {
    try {
      const uiData = JSON.parse(uiDataMatch[1]);

      if (uiData.type === "prefill_price_form" && uiData.data) {
        return {
          type: "priceModificationForm",
          id: uuidv4(),
          createdAt: Date.now(),
          props: {
            productId: uiData.data.productId || "",
            priceId: uiData.data.priceId || "",
            newPrice: uiData.data.newPrice
              ? Number(uiData.data.newPrice)
              : undefined,
            rolloverDate: uiData.data.rolloverDate || defaultDate,
            projectId: uiData.data.projectId || "",
            catalogName: uiData.data.catalogName || "B2CCatalog",
          },
        };
      } else if (uiData.type === "prefill_version_form" && uiData.data) {
        return {
          type: "newVersionForm",
          id: uuidv4(),
          createdAt: Date.now(),
          props: {
            productId: uiData.data.productId || "",
            rolloverDate: uiData.data.rolloverDate || defaultDate,
            projectId: uiData.data.projectId || "",
            displayName: [
              {
                text: `Version for ${uiData.data.productId || "Product"}`,
                language: "en-xx",
              },
              {
                text: `Version for ${uiData.data.productId || "Product"}`,
                language: "ar-xx",
              },
            ],
          },
        };
      }
      return null;
    } catch (error) {
      console.error("Error parsing UI_DATA:", error);
    }
  }

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
      // Also try to extract parameters from content using OpenAI
      const extractResponse = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
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
                content: `Extract price modification parameters from the user message.
                        Return a JSON object with these fields:
                        - productId (string)
                        - priceId (string)
                        - newPrice (number)
                        - rolloverDate (string in YYYY-MM-DD format)
                        - projectId (string, optional)
                        For missing values, use empty strings or null.`,
              },
              {
                role: "user",
                content: content,
              },
            ],
            temperature: 0,
            max_tokens: 200,
          }),
        }
      );

      let extractedParams = {
        productId: "",
        priceId: "",
        newPrice: undefined as number | undefined,
        rolloverDate: defaultDate,
        projectId: "",
      };

      if (extractResponse.ok) {
        try {
          const extractData = await extractResponse.json();
          const extractedText = extractData.choices[0]?.message?.content;
          if (extractedText) {
            const parsed = JSON.parse(extractedText);
            extractedParams = {
              ...extractedParams,
              ...parsed,
            };
          }
        } catch (e) {
          console.error("Failed to parse extracted parameters:", e);
        }
      }

      return {
        type: "priceModificationForm",
        id: uuidv4(),
        createdAt: Date.now(),
        props: extractedParams,
      };
    } else if (intent === "NEW_VERSION") {
      // Also try to extract parameters for new version
      const extractResponse = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
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
                content: `Extract new product version parameters from the user message.
                        Return a JSON object with these fields:
                        - productId (string)
                        - rolloverDate (string in YYYY-MM-DD format)
                        - projectId (string, optional)
                        For missing values, use empty strings or null.`,
              },
              {
                role: "user",
                content: content,
              },
            ],
            temperature: 0,
            max_tokens: 200,
          }),
        }
      );

      let extractedParams = {
        productId: "",
        rolloverDate: defaultDate,
        projectId: "",
      };

      if (extractResponse.ok) {
        try {
          const extractData = await extractResponse.json();
          const extractedText = extractData.choices[0]?.message?.content;
          if (extractedText) {
            const parsed = JSON.parse(extractedText);
            extractedParams = {
              ...extractedParams,
              ...parsed,
            };
          }
        } catch (e) {
          console.error("Failed to parse extracted parameters:", e);
        }
      }

      return {
        type: "newVersionForm",
        id: uuidv4(),
        createdAt: Date.now(),
        props: {
          ...extractedParams,
          displayName: [
            {
              text: `Version for ${extractedParams.productId || "Product"}`,
              language: "en-xx",
            },
            {
              text: `Version for ${extractedParams.productId || "Product"}`,
              language: "ar-xx",
            },
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

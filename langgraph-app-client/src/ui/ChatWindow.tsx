import React, { useState, useEffect, useRef } from "react";
import { useStream } from "@langchain/langgraph-sdk/react";
import type { Message } from "@langchain/langgraph-sdk";
import MessageDiv from "./MessageDiv";
import PriceModificationForm from "../components/PriceModificationForm";
import NewVersionForm from "../components/NewVersionForm";
import ConfirmationDialog from "../components/ConfirmationDialog";
import { UIComponentUnion } from "../../../langgraph-app/src/types";
import {
  detectUIComponents,
  createConfirmationComponent,
  formatConfirmationMessage,
} from "../utils/uiComponentDetector";
import { v4 as uuidv4 } from "uuid";

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ isOpen, onClose }) => {
  // Use type assertion to allow headers property
  const thread = useStream<{ messages: Message[] }>({
    apiUrl: "http://localhost:2024",
    assistantId: "agent",
    messagesKey: "messages",
    headers: {
      "x-user-id": "user_123",
      "x-org-id": "org_456",
    },
  } as any); // Type assertion to bypass TypeScript checking

  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // State for UI components
  const [uiComponents, setUiComponents] = useState<UIComponentUnion[]>([]);
  // Track if we've recently processed UI_DATA to prevent double forms
  const [processedUIData, setProcessedUIData] = useState<boolean>(false);

  const [lastUserMessage, setLastUserMessage] = useState<string | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [thread.messages, uiComponents]);

  // Process assistant messages for UI_DATA
  useEffect(() => {
    if (thread.messages.length > 0) {
      // Check the latest assistant message for UI_DATA
      const lastAssistantMessageIndex = [...thread.messages]
        .reverse()
        .findIndex((msg) => msg.type === "ai");

      if (lastAssistantMessageIndex >= 0) {
        const reversedIndex = lastAssistantMessageIndex;
        const actualIndex = thread.messages.length - 1 - reversedIndex;

        // Get assistant message content
        const assistantMessage = thread.messages[actualIndex];
        const assistantContent = assistantMessage.content as string;

        // Try to extract UI_DATA from the message with a more robust pattern
        // This handles complex nested JSON structures better
        const uiDataMatch = assistantContent.match(/UI_DATA:(\{.*\})/s);

        if (uiDataMatch && uiDataMatch[1]) {
          try {
            console.log("Found UI_DATA:", uiDataMatch[1]);
            // Parse the JSON data
            const uiData = JSON.parse(uiDataMatch[1]);

            // Handle different types of UI data
            if (uiData.type === "prefill_price_form") {
              // Create a price modification form with prefilled data
              const priceFormComponent: UIComponentUnion = {
                type: "priceModificationForm",
                id: uuidv4(),
                createdAt: Date.now(),
                props: {
                  productId: uiData.data.productId || "",
                  priceId: uiData.data.priceId || "",
                  newPrice: uiData.data.newPrice,
                  rolloverDate:
                    uiData.data.rolloverDate ||
                    new Date().toISOString().split("T")[0],
                  projectId: uiData.data.projectId || "",
                },
              };

              // Remove any existing price modification forms
              setUiComponents((prev) =>
                prev.filter((c) => c.type !== "priceModificationForm")
              );

              // Then add the new pre-filled form
              setUiComponents((prev) => [...prev, priceFormComponent]);

              // Set the flag to prevent intent-based form creation
              setProcessedUIData(true);

              // Remove the UI_DATA from the message to prevent it from being displayed
              const cleanedMessage = assistantContent
                .replace(/UI_DATA:\{.*\}/s, "")
                .trim();
              thread.messages[actualIndex].content = cleanedMessage;
            } else if (uiData.type === "prefill_version_form") {
              // Create a new version form with prefilled data
              const versionFormComponent: UIComponentUnion = {
                type: "newVersionForm",
                id: uuidv4(),
                createdAt: Date.now(),
                props: {
                  productId: uiData.data.productId || "",
                  rolloverDate:
                    uiData.data.rolloverDate ||
                    new Date().toISOString().split("T")[0],
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

              // Remove any existing new version forms
              setUiComponents((prev) =>
                prev.filter((c) => c.type !== "newVersionForm")
              );

              // Then add the new pre-filled form
              setUiComponents((prev) => [...prev, versionFormComponent]);

              // Set the flag to prevent intent-based form creation
              setProcessedUIData(true);

              // Remove the UI_DATA from the message to prevent it from being displayed
              const cleanedMessage = assistantContent
                .replace(/UI_DATA:\{.*\}/s, "")
                .trim();
              thread.messages[actualIndex].content = cleanedMessage;
            }
          } catch (error) {
            console.error("Error parsing UI_DATA:", error);
          }
        }
      }
    }
  }, [thread.messages]);

  // Detect UI components based on user intent
  useEffect(() => {
    let isMounted = true; // Prevent state updates after unmount

    const detectIntent = async () => {
      if (thread.messages.length > 0 && !processedUIData) {
        // Check the latest user message for intent detection

        const lastUserMessageIndex = [...thread.messages]
          .reverse()
          .findIndex((msg) => msg.type === "human");

        if (lastUserMessageIndex >= 0) {
          const reversedIndex = lastUserMessageIndex;
          const actualIndex = thread.messages.length - 1 - reversedIndex;

          // Get user message content
          const userMessage = thread.messages[actualIndex];
          const userContent = userMessage.content as string;

          if (lastUserMessage == userContent) {
            return;
          }

          // Only try to detect components from user messages with meaningful content
          // Skip messages that are auto-generated confirmation messages
          if (
            userContent.includes("I want to update the price for") &&
            userContent.includes("I want to create a new version for")
          ) {
            return;
          } else {
            try {
              // Call LLM-based component detection
              const component = await detectUIComponents(userContent);

              // Only update state if component exists and we're still mounted
              if (
                isMounted &&
                component &&
                !uiComponents.some((comp) => comp.type === component.type)
              ) {
                setUiComponents((prev) => [...prev, component]);
                setLastUserMessage(userContent);
              }
            } catch (error) {
              console.error("Error detecting UI components:", error);
            }
          }
        }
      }
    };

    detectIntent();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
      setProcessedUIData(false);
    };
  }, [thread.messages, processedUIData, uiComponents, lastUserMessage]);

  // Filter out empty messages when displaying them
  const filteredMessages = thread.messages.filter((msg) => {
    // Keep only messages with actual content
    const content = msg.content as string;
    return content && content.trim() !== "" && content !== "false";
  });

  // Handle form submission
  const handleFormSubmit = (componentId: string, data: any) => {
    console.log("Form submitted with data:", data);

    // Make sure all required fields are present
    if (data.productId) {
      // Create confirmation component
      const confirmComponent = createConfirmationComponent(data);

      // Remove the form component
      setUiComponents((prev) => prev.filter((c) => c.id !== componentId));

      // Add the confirmation component
      setUiComponents((prev) => [...prev, confirmComponent]);
    } else {
      alert("Product ID is required");
    }
  };

  // Handle confirmation
  const handleConfirmation = (componentId: string, confirmed: boolean) => {
    const component = uiComponents.find((c) => c.id === componentId);

    if (confirmed && component?.type === "confirmationDialog") {
      const { action, actionData } = component.props;

      // Format the confirmation message
      const message = formatConfirmationMessage(action, actionData);
      console.log("Sending confirmation message:", message);

      // Remove ALL UI components when submitting the final confirmation
      setUiComponents([]);

      // Submit the message
      thread.submit({ messages: [{ type: "human", content: message }] });
    } else {
      // If user cancels, just remove the confirmation dialog
      setUiComponents((prev) => prev.filter((c) => c.id !== componentId));
    }
  };

  // Handle form cancellation
  const handleCancel = (componentId: string) => {
    setUiComponents((prev) => prev.filter((c) => c.id !== componentId));
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <div className="bg-white rounded-lg shadow-2xl w-96 md:w-[450px] h-[500px] max-h-[80vh] flex flex-col animate-fade-in overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-blue-600 text-white rounded-t-lg">
          <h2 className="text-xl font-bold">Chat Assistant</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 focus:outline-none"
            aria-label="Close chat"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {filteredMessages.filter((msg) => msg.type !== "tool").length ===
          0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>Start a conversation with the assistant.</p>
            </div>
          ) : (
            filteredMessages
              .filter((message) => message.type !== "tool")
              .map((message) => (
                <MessageDiv
                  key={message.id}
                  text={message.content as string}
                  sender={message.type}
                />
              ))
          )}

          {/* Render UI Components */}
          {uiComponents.map((component) => {
            if (component.type === "priceModificationForm") {
              return (
                <PriceModificationForm
                  key={component.id}
                  data={component.props}
                  onSubmit={(data) => handleFormSubmit(component.id, data)}
                  onCancel={() => handleCancel(component.id)}
                />
              );
            } else if (component.type === "newVersionForm") {
              return (
                <NewVersionForm
                  key={component.id}
                  data={component.props}
                  onSubmit={(data) => handleFormSubmit(component.id, data)}
                  onCancel={() => handleCancel(component.id)}
                />
              );
            } else if (component.type === "confirmationDialog") {
              return (
                <ConfirmationDialog
                  key={component.id}
                  data={component.props}
                  onConfirm={() => handleConfirmation(component.id, true)}
                  onCancel={() => handleConfirmation(component.id, false)}
                />
              );
            }
            return null;
          })}

          <div ref={messagesEndRef} />

          {thread.isLoading && (
            <div className="flex justify-center py-2">
              <div className="animate-pulse flex space-x-1">
                <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
              </div>
            </div>
          )}
        </div>

        <form
          className="p-4 border-t bg-white rounded-b-lg"
          onSubmit={(e) => {
            e.preventDefault();
            if (!newMessage.trim()) return;

            const form = e.target as HTMLFormElement;
            const message = new FormData(form).get("message") as string;

            form.reset();
            setNewMessage("");
            thread.submit({ messages: [{ type: "human", content: message }] });
          }}
        >
          <div className="flex shadow-sm rounded-md overflow-hidden border border-gray-300">
            <input
              name="message"
              type="text"
              className="flex-1 py-3 px-4 text-gray-700 focus:outline-none"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={thread.isLoading}
            />
            {thread.isLoading ? (
              <button
                key="stop"
                type="button"
                onClick={() => thread.stop()}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-3 px-6 transition-colors duration-200"
              >
                Stop
              </button>
            ) : (
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 transition-colors duration-200 disabled:bg-gray-400"
                disabled={!newMessage.trim()}
              >
                Send
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;

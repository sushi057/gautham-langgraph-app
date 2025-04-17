import type { Message } from "@langchain/langgraph-sdk";

/**
 * Different types of UI components that can be rendered
 */
export type ComponentType =
  | "priceModificationForm"
  | "newVersionForm"
  | "confirmationDialog";

/**
 * Base interface for all UI components
 */
export interface UIComponent {
  type: ComponentType;
  id: string;
  createdAt: number;
}

/**
 * Props for price modification form
 */
export interface PriceModificationProps {
  productId?: string;
  priceId?: string;
  currentPrice?: number;
  newPrice?: number;
  rolloverDate?: string;
  projectId?: string;
  catalogName?: string;
}

/**
 * UI component for price modification
 */
export interface PriceModificationForm extends UIComponent {
  type: "priceModificationForm";
  props: PriceModificationProps;
}

/**
 * Props for new product version form
 */
export interface NewVersionProps {
  productId?: string;
  rolloverDate?: string;
  projectId?: string;
  displayName?: Array<{
    text: string;
    language: string;
  }>;
}

/**
 * UI component for creating new product version
 */
export interface NewVersionForm extends UIComponent {
  type: "newVersionForm";
  props: NewVersionProps;
}

/**
 * Props for confirmation dialog
 */
export interface ConfirmationProps {
  title: string;
  message: string;
  action: "updatePrice" | "createNewProductVersion";
  actionData: any;
}

/**
 * UI component for confirmation dialog
 */
export interface ConfirmationDialog extends UIComponent {
  type: "confirmationDialog";
  props: ConfirmationProps;
}

/**
 * Union type of all possible UI components
 */
export type UIComponentUnion =
  | PriceModificationForm
  | NewVersionForm
  | ConfirmationDialog;

/**
 * KonciergeState defines the shape of our graph state with generative UI components
 */
export interface KonciergeState {
  messages: Message[];
  components: UIComponentUnion[];
}

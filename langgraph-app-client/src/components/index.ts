import PriceModificationForm from './PriceModificationForm';
import NewVersionForm from './NewVersionForm';
import ConfirmationDialog from './ConfirmationDialog';

export const ComponentMap = {
  priceModificationForm: PriceModificationForm,
  newVersionForm: NewVersionForm,
  confirmationDialog: ConfirmationDialog
};

export type { default as PriceModificationForm } from './PriceModificationForm';
export type { default as NewVersionForm } from './NewVersionForm';
export type { default as ConfirmationDialog } from './ConfirmationDialog';

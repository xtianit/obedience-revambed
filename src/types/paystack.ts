export type PaystackResponse = {
  reference: string;
  status: string;
};

export type PaystackHandler = {
  openIframe: () => void;
};

export type PaystackConfig = {
  key: string;
  email: string;
  amount: number;
  currency: string;
  reference: string;
  plan?: string;
  metadata?: Record<string, unknown>;
  onClose: () => void;
  callback: (response: PaystackResponse) => void;
};
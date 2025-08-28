export interface IWebhookData {
  event: string;
  data: {
    id: number;
    domain: string;
    amount: number;
    currency: string;
    source: string;
    reason: string;
    recipient: number;
    status: string;
    reference: string;
    gateway_response: string;
    channel: string;
    paid_at: string;
    created_at: string;
    updated_at: string;
    metadata: {
      referrer: string;
      custom_fields: Array<{
        display_name: string;
        variable_name: string;
        value: string;
      }>;
      [key: string]: any;
    };
    customer: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      customer_code: string;
      phone: string;
      metadata: any;
      risk_action: string;
      international_format_phone: string;
    };
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
      signature: string;
      account_name: string;
      receiver_bank_account_number: string;
      receiver_bank: string;
    };
    fees: number;
    fees_split: any;
    transaction_date: string;
    plan: any;
    subaccount: any;
    order_id: any;
    paidAt: string;
    requested_amount: number;
    pos_transaction_data: any;
    [key: string]: any;
  };
}

export interface IWebhookVerification {
  signature: string;
  timestamp: string;
  body: string;
}

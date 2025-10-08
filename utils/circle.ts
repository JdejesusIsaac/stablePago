/**
 * Circle API Utility Functions
 * Handles authentication and requests to Circle's API
 */

const CIRCLE_BASE_URL = process.env.CIRCLE_BASE_URL || 'https://api-sandbox.circle.com';
const CIRCLE_API_KEY = process.env.CIRCLE_API_KEY;

if (!CIRCLE_API_KEY) {
  console.warn('CIRCLE_API_KEY not configured');
}

export interface CircleAPIOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  idempotencyKey?: string;
}

/**
 * Make authenticated request to Circle API
 */
export async function circleRequest<T = any>(
  endpoint: string,
  options: CircleAPIOptions = {}
): Promise<T> {
  const { method = 'GET', body, idempotencyKey } = options;

  const headers: HeadersInit = {
    'Authorization': `Bearer ${CIRCLE_API_KEY}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }

  const url = `${CIRCLE_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new CircleAPIError(
      data.message || 'Circle API request failed',
      response.status,
      data
    );
  }

  return data;
}

/**
 * Circle API Error
 */
export class CircleAPIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public data: any
  ) {
    super(message);
    this.name = 'CircleAPIError';
  }
}

/**
 * Types for Circle API
 */
export interface CircleBankWire {
  billingDetails: {
    name: string;
    city: string;
    country: string;
    line1: string;
    district?: string;
    postalCode?: string;
  };
  bankAddress: {
    bankName: string;
    city: string;
    country: string;
    line1: string;
    district?: string;
  };
  accountNumber: string;
  routingNumber?: string; // For US banks
  iban?: string; // For international banks
}

export interface CirclePayout {
  destination: {
    type: 'wire';
    id: string;
  };
  amount: {
    currency: 'USD';
    amount: string;
  };
  source?: {
    type: 'wallet';
    id: string;
    identities?: CircleIdentity[];
  };
}

export interface CircleIdentity {
  type: 'individual' | 'business';
  name: string;
  addresses: {
    line1: string;
    city: string;
    district: string;
    country: string;
    postalCode: string;
    line2?: string;
  }[];
}

export interface CirclePayoutStatus {
  id: string;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  amount: {
    amount: string;
    currency: string;
  };
  fees: {
    amount: string;
    currency: string;
  };
  createDate: string;
  updateDate: string;
  trackingRef?: string;
  errorCode?: string;
  errorMessage?: string;
}


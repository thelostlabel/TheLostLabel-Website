/**
 * Wise (TransferWise) API client for label artist payouts.
 *
 * Required env vars:
 *   WISE_API_TOKEN   – Personal or Business API token from Wise developer settings
 *   WISE_PROFILE_ID  – Wise profile ID (Business profile recommended)
 *   WISE_SANDBOX     – "true" to use sandbox (default: false)
 */

const BASE_URL = process.env.WISE_SANDBOX === "true"
  ? "https://api.sandbox.transferwise.tech"
  : "https://api.transferwise.com";

const TOKEN = process.env.WISE_API_TOKEN;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WiseProfile {
  id: number;
  type: "personal" | "business";
  details: {
    name?: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
  };
}

export interface WiseRecipient {
  id: number;
  currency: string;
  type: string;
  profile: number;
  accountHolderName: string;
  details: {
    email?: string;
    [key: string]: unknown;
  };
}

export interface WiseQuote {
  id: string;
  sourceCurrency: string;
  targetCurrency: string;
  sourceAmount: number;
  targetAmount: number;
  rate: number;
  fee: number;
  paymentOptions?: Array<{
    payIn: string;
    payOut: string;
    fee: { total: number; transferwise: number };
    sourceAmount: number;
    targetAmount: number;
  }>;
}

export interface WiseTransfer {
  id: number;
  targetAccount: number;
  quoteUuid: string;
  status: string;
  reference?: string;
  customerTransactionId: string;
  details: { reference?: string };
  created: string;
}

export interface WiseTransferStatus {
  id: number;
  status: string;
  estimatedDelivery?: string;
}

// ---------------------------------------------------------------------------
// Internal fetch helper
// ---------------------------------------------------------------------------

async function wiseRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (!TOKEN) {
    throw new Error("WISE_API_TOKEN is not configured");
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const text = await res.text();
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  if (!res.ok) {
    const message =
      typeof body === "object" && body !== null && "errors" in body
        ? JSON.stringify((body as { errors: unknown }).errors)
        : typeof body === "string"
          ? body
          : `HTTP ${res.status}`;
    throw new Error(`Wise API error (${res.status}): ${message}`);
  }

  return body as T;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Fetch all Wise profiles for the authenticated token. */
export async function getWiseProfiles(): Promise<WiseProfile[]> {
  return wiseRequest<WiseProfile[]>("/v2/profiles");
}

/** Get the configured profile ID, or fall back to the first business profile. */
export async function getWiseProfileId(): Promise<number> {
  const envId = process.env.WISE_PROFILE_ID;
  if (envId) return Number(envId);

  const profiles = await getWiseProfiles();
  const biz = profiles.find((p) => p.type === "business");
  if (biz) return biz.id;
  if (profiles[0]) return profiles[0].id;
  throw new Error("No Wise profile found");
}

/**
 * Create an email-based recipient account on Wise.
 * This is the simplest recipient type – Wise will look up the user by email.
 */
export async function createWiseRecipient(
  profileId: number,
  email: string,
  currency: string,
  accountHolderName: string,
): Promise<WiseRecipient> {
  return wiseRequest<WiseRecipient>("/v1/accounts", {
    method: "POST",
    body: JSON.stringify({
      currency,
      type: "email",
      profile: profileId,
      accountHolderName,
      details: { email },
    }),
  });
}

/**
 * Create a fixed-source-amount quote.
 * @param sourceAmount Amount to send in sourceCurrency
 * @param sourceCurrency e.g. "USD"
 * @param targetCurrency e.g. "USD" (same for domestic, or different for FX)
 */
export async function createWiseQuote(
  profileId: number,
  sourceAmount: number,
  sourceCurrency: string,
  targetCurrency: string,
): Promise<WiseQuote> {
  return wiseRequest<WiseQuote>(`/v3/profiles/${profileId}/quotes`, {
    method: "POST",
    body: JSON.stringify({
      sourceCurrency,
      targetCurrency,
      sourceAmount,
      targetAmount: null,
      payOut: "BALANCE",
    }),
  });
}

/**
 * Create a transfer linking a quote and a recipient.
 * @param customerTransactionId Unique ID for idempotency (use payment record ID)
 */
export async function createWiseTransfer(
  quoteId: string,
  recipientId: number,
  customerTransactionId: string,
  reference = "Label payout",
): Promise<WiseTransfer> {
  return wiseRequest<WiseTransfer>("/v1/transfers", {
    method: "POST",
    body: JSON.stringify({
      targetAccount: recipientId,
      quoteUuid: quoteId,
      customerTransactionId,
      details: { reference },
    }),
  });
}

/**
 * Fund (execute) a transfer from the Wise balance.
 * This is the final step that actually moves money.
 */
export async function fundWiseTransfer(
  profileId: number,
  transferId: number,
): Promise<{ status: string; errorCode?: string }> {
  return wiseRequest(`/v3/profiles/${profileId}/transfers/${transferId}/payments`, {
    method: "POST",
    body: JSON.stringify({ type: "BALANCE" }),
  });
}

/** Get current status of a transfer. */
export async function getWiseTransferStatus(
  transferId: number,
): Promise<WiseTransferStatus> {
  return wiseRequest<WiseTransferStatus>(`/v1/transfers/${transferId}`);
}

/**
 * High-level helper: execute a full payout to an email address.
 * Steps: create recipient → create quote → create transfer → fund transfer.
 * Returns the Wise transfer ID to store as payment reference.
 */
export async function executeWisePayout({
  profileId,
  recipientEmail,
  recipientName,
  amount,
  sourceCurrency = "USD",
  targetCurrency = "USD",
  reference,
  idempotencyKey,
}: {
  profileId: number;
  recipientEmail: string;
  recipientName: string;
  amount: number;
  sourceCurrency?: string;
  targetCurrency?: string;
  reference?: string;
  idempotencyKey: string;
}): Promise<{ transferId: number; status: string }> {
  const recipient = await createWiseRecipient(
    profileId,
    recipientEmail,
    targetCurrency,
    recipientName,
  );

  const quote = await createWiseQuote(
    profileId,
    amount,
    sourceCurrency,
    targetCurrency,
  );

  const transfer = await createWiseTransfer(
    quote.id,
    recipient.id,
    idempotencyKey,
    reference ?? "Label payout",
  );

  await fundWiseTransfer(profileId, transfer.id);

  return { transferId: transfer.id, status: transfer.status };
}

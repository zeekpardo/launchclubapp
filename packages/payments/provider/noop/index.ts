/**
 * No-op payments provider — used while Stripe is not yet configured.
 * Swap packages/payments/provider/index.ts back to "./stripe" when ready.
 */
import type {
	CancelSubscription,
	CreateCheckoutLink,
	CreateCustomerPortalLink,
	SetSubscriptionSeats,
	WebhookHandler,
} from "../../types";

export const createCheckoutLink: CreateCheckoutLink = async () => {
	return null;
};

export const createCustomerPortalLink: CreateCustomerPortalLink = async () => {
	return null;
};

export const setSubscriptionSeats: SetSubscriptionSeats = async () => {
	return;
};

export const cancelSubscription: CancelSubscription = async () => {
	return;
};

export const webhookHandler: WebhookHandler = async () => {
	return new Response("Payments not configured.", { status: 503 });
};

export const config = {
	billingAttachedTo: "organization" as "user" | "organization",
	plans: {
		free: {
			isFree: true,
			maxStudents: 15,
		},
		starter: {
			maxStudents: 75,
			prices: [
				{
					type: "recurring" as "recurring" | "one-time",
					productId: process.env.NEXT_PUBLIC_PRICE_ID_STARTER_MONTHLY as string,
					interval: "month",
					amount: 20,
					currency: "USD",
				},
				{
					type: "recurring" as "recurring" | "one-time",
					productId: process.env.NEXT_PUBLIC_PRICE_ID_STARTER_YEARLY as string,
					interval: "year",
					amount: 200,
					currency: "USD",
				},
			],
		},
		growth: {
			recommended: true,
			maxStudents: 200,
			prices: [
				{
					type: "recurring" as "recurring" | "one-time",
					productId: process.env.NEXT_PUBLIC_PRICE_ID_GROWTH_MONTHLY as string,
					interval: "month",
					amount: 37,
					currency: "USD",
				},
				{
					type: "recurring" as "recurring" | "one-time",
					productId: process.env.NEXT_PUBLIC_PRICE_ID_GROWTH_YEARLY as string,
					interval: "year",
					amount: 370,
					currency: "USD",
				},
			],
		},
		standard: {
			maxStudents: 500,
			prices: [
				{
					type: "recurring" as "recurring" | "one-time",
					productId: process.env.NEXT_PUBLIC_PRICE_ID_STANDARD_MONTHLY as string,
					interval: "month",
					amount: 75,
					currency: "USD",
				},
				{
					type: "recurring" as "recurring" | "one-time",
					productId: process.env.NEXT_PUBLIC_PRICE_ID_STANDARD_YEARLY as string,
					interval: "year",
					amount: 750,
					currency: "USD",
				},
			],
		},
		plus: {
			maxStudents: 1000,
			prices: [
				{
					type: "recurring" as "recurring" | "one-time",
					productId: process.env.NEXT_PUBLIC_PRICE_ID_PLUS_MONTHLY as string,
					interval: "month",
					amount: 120,
					currency: "USD",
				},
				{
					type: "recurring" as "recurring" | "one-time",
					productId: process.env.NEXT_PUBLIC_PRICE_ID_PLUS_YEARLY as string,
					interval: "year",
					amount: 1200,
					currency: "USD",
				},
			],
		},
		pro: {
			maxStudents: 1500,
			prices: [
				{
					type: "recurring" as "recurring" | "one-time",
					productId: process.env.NEXT_PUBLIC_PRICE_ID_PRO_MONTHLY as string,
					interval: "month",
					amount: 185,
					currency: "USD",
				},
				{
					type: "recurring" as "recurring" | "one-time",
					productId: process.env.NEXT_PUBLIC_PRICE_ID_PRO_YEARLY as string,
					interval: "year",
					amount: 1850,
					currency: "USD",
				},
			],
		},
		unlimited: {
			maxStudents: null, // no limit
			prices: [
				{
					type: "recurring" as "recurring" | "one-time",
					productId: process.env.NEXT_PUBLIC_PRICE_ID_UNLIMITED_MONTHLY as string,
					interval: "month",
					amount: 245,
					currency: "USD",
				},
				{
					type: "recurring" as "recurring" | "one-time",
					productId: process.env.NEXT_PUBLIC_PRICE_ID_UNLIMITED_YEARLY as string,
					interval: "year",
					amount: 2450,
					currency: "USD",
				},
			],
		},
		enterprise: {
			isEnterprise: true,
			maxStudents: null,
		},
	},
} as const;

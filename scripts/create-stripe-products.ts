import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const plans = [
	{ name: "LaunchClub Starter", monthly: 2000, yearly: 20000, key: "STARTER" },
	{ name: "LaunchClub Growth", monthly: 3700, yearly: 37000, key: "GROWTH" },
	{ name: "LaunchClub Standard", monthly: 7500, yearly: 75000, key: "STANDARD" },
	{ name: "LaunchClub Plus", monthly: 12000, yearly: 120000, key: "PLUS" },
	{ name: "LaunchClub Pro", monthly: 18500, yearly: 185000, key: "PRO" },
	{ name: "LaunchClub Unlimited", monthly: 24500, yearly: 245000, key: "UNLIMITED" },
];

async function main() {
	console.log("Creating Stripe products and prices...\n");

	const envLines: string[] = [];

	for (const plan of plans) {
		const product = await stripe.products.create({ name: plan.name });

		const monthly = await stripe.prices.create({
			product: product.id,
			unit_amount: plan.monthly,
			currency: "usd",
			recurring: { interval: "month" },
			nickname: `${plan.name} Monthly`,
		});

		const yearly = await stripe.prices.create({
			product: product.id,
			unit_amount: plan.yearly,
			currency: "usd",
			recurring: { interval: "year" },
			nickname: `${plan.name} Annual`,
		});

		console.log(`✓ ${plan.name}`);
		console.log(`  Monthly: ${monthly.id}`);
		console.log(`  Annual:  ${yearly.id}\n`);

		envLines.push(`NEXT_PUBLIC_PRICE_ID_${plan.key}_MONTHLY=${monthly.id}`);
		envLines.push(`NEXT_PUBLIC_PRICE_ID_${plan.key}_YEARLY=${yearly.id}`);
	}

	console.log("─────────────────────────────────────────");
	console.log("Add these to your .env.local:\n");
	console.log(envLines.join("\n"));
}

main().catch(console.error);

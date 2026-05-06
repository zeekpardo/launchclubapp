import { config as paymentsConfig } from "@repo/payments/config";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { activeOrganizationQueryKey } from "@saas/organizations/lib/api";
import { AppWrapper } from "@saas/shared/components/AppWrapper";
import { orpc } from "@shared/lib/orpc-query-utils";
import { getServerQueryClient } from "@shared/lib/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import type { PropsWithChildren } from "react";

export default async function OrganizationLayout({
	children,
	params,
}: PropsWithChildren<{
	params: Promise<{
		organizationSlug: string;
	}>;
}>) {
	const { organizationSlug } = await params;

	const organization = await getActiveOrganization(organizationSlug);

	if (!organization) {
		return notFound();
	}

	const queryClient = getServerQueryClient();

	await queryClient.prefetchQuery({
		queryKey: activeOrganizationQueryKey(organizationSlug),
		queryFn: () => organization,
	});

	if (paymentsConfig.billingAttachedTo === "organization") {
		await queryClient.prefetchQuery(
			orpc.payments.listPurchases.queryOptions({
				input: {
					organizationId: organization.id,
				},
			}),
		);
	}

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<AppWrapper>{children}</AppWrapper>
		</HydrationBoundary>
	);
}

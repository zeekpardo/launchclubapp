"use client";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import type { ChartConfig } from "@repo/ui/components/chart";
import { ChartContainer } from "@repo/ui/components/chart";
import { Skeleton } from "@repo/ui/components/skeleton";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Cell, Pie, PieChart, Tooltip } from "recharts";

const statusChartConfig = {
	PENDING: { label: "Pending", color: "#f59e0b" },
	APPROVED: { label: "Approved", color: "#10b981" },
	REJECTED: { label: "Rejected", color: "#ef4444" },
} satisfies ChartConfig;

export function ApplicationsWidget() {
	const t = useTranslations();
	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id ?? "";
	const enabled = !!activeOrganization?.id;
	const params = useParams();
	const organizationSlug = params.organizationSlug as string;
	const basePath = `/app/${organizationSlug}`;

	const { data: applications, isLoading } = useQuery(
		orpc.applications.list.queryOptions({
			input: { organizationId },
			enabled,
		}),
	);

	const queryClient = useQueryClient();
	const reviewApplication = useMutation({
		...orpc.applications.review.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: orpc.applications.list
					.queryOptions({
						input: { organizationId: "" },
					})
					.queryKey.slice(0, 1),
			});
		},
	});

	const handleReview = async (
		id: string,
		status: "APPROVED" | "REJECTED",
	) => {
		try {
			await reviewApplication.mutateAsync({ id, status });
			if (status === "APPROVED") {
				toastSuccess(
					t("launchclub.applications.notifications.approved"),
				);
			} else {
				toastSuccess(
					t("launchclub.applications.notifications.rejected"),
				);
			}
		} catch {
			toastError(t("launchclub.applications.notifications.error"));
		}
	};

	const pending = applications?.filter((a) => a.status === "PENDING") ?? [];
	const approved = applications?.filter((a) => a.status === "APPROVED") ?? [];
	const rejected = applications?.filter((a) => a.status === "REJECTED") ?? [];
	const total = applications?.length ?? 0;

	const chartData = [
		{ name: "PENDING", value: pending.length, fill: "#f59e0b" },
		{ name: "APPROVED", value: approved.length, fill: "#10b981" },
		{ name: "REJECTED", value: rejected.length, fill: "#ef4444" },
	].filter((d) => d.value > 0);

	const displayedPending = pending.slice(0, 5);

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between pb-2">
				<CardTitle className="text-base font-semibold">
					{t("launchclub.dashboard.recentApplications")}
				</CardTitle>
				<Link
					href={`${basePath}/applications`}
					className="text-xs text-primary hover:underline"
				>
					{t("launchclub.applications.viewAll")}
				</Link>
			</CardHeader>
			<CardContent className="space-y-4">
				{isLoading ? (
					<div className="space-y-3">
						<div className="flex gap-2">
							{Array.from({ length: 3 }).map((_, i) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: skeleton list
								<Skeleton key={i} className="h-16 flex-1" />
							))}
						</div>
						<Skeleton className="h-32 w-full" />
						{Array.from({ length: 3 }).map((_, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: skeleton list
							<Skeleton key={i} className="h-10 w-full" />
						))}
					</div>
				) : (
					<>
						{/* Status summary */}
						<div className="grid grid-cols-3 gap-2">
							<div className="flex flex-col items-center rounded-lg border border-amber-200 bg-amber-50 p-2 dark:border-amber-800 dark:bg-amber-950">
								<span className="text-2xl font-bold text-amber-600">
									{pending.length}
								</span>
								<span className="text-xs text-muted-foreground">
									{t(
										"launchclub.applications.status.PENDING",
									)}
								</span>
							</div>
							<div className="flex flex-col items-center rounded-lg border border-emerald-200 bg-emerald-50 p-2 dark:border-emerald-800 dark:bg-emerald-950">
								<span className="text-2xl font-bold text-emerald-600">
									{approved.length}
								</span>
								<span className="text-xs text-muted-foreground">
									{t(
										"launchclub.applications.status.APPROVED",
									)}
								</span>
							</div>
							<div className="flex flex-col items-center rounded-lg border border-red-200 bg-red-50 p-2 dark:border-red-800 dark:bg-red-950">
								<span className="text-2xl font-bold text-red-600">
									{rejected.length}
								</span>
								<span className="text-xs text-muted-foreground">
									{t(
										"launchclub.applications.status.REJECTED",
									)}
								</span>
							</div>
						</div>

						{/* Pie chart */}
						{total > 0 && (
							<ChartContainer
								config={statusChartConfig}
								className="h-36 w-full"
							>
								<PieChart>
									<Pie
										data={chartData}
										dataKey="value"
										nameKey="name"
										cx="50%"
										cy="50%"
										innerRadius={35}
										outerRadius={60}
									>
										{chartData.map((entry) => (
											<Cell
												key={entry.name}
												fill={entry.fill}
											/>
										))}
									</Pie>
									<Tooltip
										formatter={(value, name) => [
											value,
											t(
												`launchclub.applications.status.${name as "PENDING" | "APPROVED" | "REJECTED"}`,
											),
										]}
									/>
								</PieChart>
							</ChartContainer>
						)}

						{/* Pending list */}
						{displayedPending.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								{t("launchclub.dashboard.noData")}
							</p>
						) : (
							<ul className="divide-y">
								{displayedPending.map((app) => (
									<li
										key={app.id}
										className="flex items-center justify-between gap-2 py-2"
									>
										<div className="flex min-w-0 flex-1 flex-col">
											<span className="truncate text-sm font-medium">
												{app.parentFirstName}{" "}
												{app.parentLastName}
											</span>
											<span className="truncate text-xs text-muted-foreground">
												{app.site?.name ?? "—"}
											</span>
										</div>
										<div className="flex shrink-0 items-center gap-2">
											<Badge status="warning">
												{t(
													"launchclub.applications.status.PENDING",
												)}
											</Badge>
											<Button
												variant="ghost"
												size="icon"
												className="text-green-600 hover:bg-green-50 hover:text-green-700"
												onClick={() =>
													handleReview(
														app.id,
														"APPROVED",
													)
												}
												disabled={
													reviewApplication.isPending
												}
												aria-label={t(
													"launchclub.applications.approve",
												)}
											>
												<CheckIcon className="size-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												className="text-red-600 hover:bg-red-50 hover:text-red-700"
												onClick={() =>
													handleReview(
														app.id,
														"REJECTED",
													)
												}
												disabled={
													reviewApplication.isPending
												}
												aria-label={t(
													"launchclub.applications.reject",
												)}
											>
												<XIcon className="size-4" />
											</Button>
										</div>
									</li>
								))}
							</ul>
						)}
					</>
				)}
			</CardContent>
		</Card>
	);
}

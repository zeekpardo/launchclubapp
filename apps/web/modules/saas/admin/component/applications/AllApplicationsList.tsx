"use client";

import { Spinner } from "@repo/ui";
import { Badge } from "@repo/ui/components/badge";
import { Card } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@repo/ui/components/table";
import { Pagination } from "@saas/shared/components/Pagination";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { useEffect } from "react";
import { useDebounceValue } from "usehooks-ts";

const ITEMS_PER_PAGE = 10;

function statusBadgeStatus(
	status: string,
): "success" | "error" | "warning" | "info" {
	if (status === "APPROVED") return "success";
	if (status === "REJECTED") return "error";
	if (status === "PENDING") return "warning";
	return "info";
}

export function AllApplicationsList() {
	const [currentPage, setCurrentPage] = useQueryState(
		"appPage",
		parseAsInteger.withDefault(1),
	);
	const [searchTerm, setSearchTerm] = useQueryState(
		"appQuery",
		parseAsString.withDefault(""),
	);
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useDebounceValue(
		searchTerm,
		300,
		{ leading: true, trailing: false },
	);

	useEffect(() => {
		setDebouncedSearchTerm(searchTerm);
	}, [searchTerm]);

	useEffect(() => {
		setCurrentPage(1);
	}, [debouncedSearchTerm]);

	const { data, isLoading } = useQuery(
		orpc.admin.applications.list.queryOptions({
			input: {
				limit: ITEMS_PER_PAGE,
				offset: (currentPage - 1) * ITEMS_PER_PAGE,
				query: debouncedSearchTerm || undefined,
			},
		}),
	);

	const applications = data?.applications ?? [];

	return (
		<Card className="p-6">
			<h2 className="mb-4 font-semibold text-2xl">All Applications</h2>
			<Input
				type="search"
				placeholder="Search by name or email…"
				value={searchTerm}
				onChange={(e) => setSearchTerm(e.target.value)}
				className="mb-4"
			/>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Applicant</TableHead>
							<TableHead>Org / Site</TableHead>
							<TableHead>Status</TableHead>
							<TableHead className="text-center">
								Children
							</TableHead>
							<TableHead>Submitted</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							<TableRow>
								<TableCell
									colSpan={5}
									className="h-24 text-center"
								>
									<div className="flex h-full items-center justify-center">
										<Spinner className="mr-2 size-4 text-primary" />
										Loading…
									</div>
								</TableCell>
							</TableRow>
						) : applications.length > 0 ? (
							applications.map((app) => (
								<TableRow key={app.id}>
									<TableCell>
										<div className="leading-tight">
											<span className="font-medium">
												{app.parentFirstName}{" "}
												{app.parentLastName}
											</span>
											{app.parentEmail && (
												<span className="block text-foreground/60 text-sm">
													{app.parentEmail}
												</span>
											)}
										</div>
									</TableCell>
									<TableCell>
										<div className="leading-tight">
											<span className="block font-medium text-sm">
												{app.site?.area?.organization
													?.name ?? "—"}
											</span>
											<span className="block text-foreground/60 text-xs">
												{app.site?.name ?? "—"}
											</span>
										</div>
									</TableCell>
									<TableCell>
										<Badge
											status={statusBadgeStatus(
												app.status,
											)}
										>
											{app.status}
										</Badge>
									</TableCell>
									<TableCell className="text-center">
										{app.children?.length ?? 0}
									</TableCell>
									<TableCell className="text-sm">
										{new Date(
											app.createdAt,
										).toLocaleDateString()}
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={5}
									className="h-24 text-center"
								>
									No applications found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{!!data?.total && data.total > ITEMS_PER_PAGE && (
				<Pagination
					className="mt-4"
					totalItems={data.total}
					itemsPerPage={ITEMS_PER_PAGE}
					currentPage={currentPage}
					onChangeCurrentPage={setCurrentPage}
				/>
			)}
		</Card>
	);
}

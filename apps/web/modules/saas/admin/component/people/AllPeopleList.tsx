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

export function AllPeopleList() {
	const [currentPage, setCurrentPage] = useQueryState(
		"peoplePage",
		parseAsInteger.withDefault(1),
	);
	const [searchTerm, setSearchTerm] = useQueryState(
		"peopleQuery",
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
		orpc.admin.people.list.queryOptions({
			input: {
				limit: ITEMS_PER_PAGE,
				offset: (currentPage - 1) * ITEMS_PER_PAGE,
				query: debouncedSearchTerm || undefined,
			},
		}),
	);

	const people = data?.people ?? [];

	return (
		<Card className="p-6">
			<h2 className="mb-4 font-semibold text-2xl">All People</h2>
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
							<TableHead>Name</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Phone</TableHead>
							<TableHead>Organization</TableHead>
							<TableHead>Type</TableHead>
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
						) : people.length > 0 ? (
							people.map((person) => (
								<TableRow key={person.id}>
									<TableCell className="font-medium">
										{person.firstName} {person.lastName}
									</TableCell>
									<TableCell className="text-foreground/70 text-sm">
										{person.email ?? "—"}
									</TableCell>
									<TableCell className="text-foreground/70 text-sm">
										{person.phone ?? "—"}
									</TableCell>
									<TableCell className="text-sm">
										{person.household?.organization?.name ??
											"—"}
									</TableCell>
									<TableCell>
										<Badge
											status={
												person.personType === "STUDENT"
													? "info"
													: "success"
											}
										>
											{person.personType === "STUDENT"
												? "Student"
												: person.personType === "MENTOR"
													? "Mentor"
													: "Parent"}
										</Badge>
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={5}
									className="h-24 text-center"
								>
									No people found.
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

"use client";

import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { Skeleton } from "@repo/ui/components/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@repo/ui/components/table";
import { useForms } from "@saas/forms/hooks/use-forms";
import { FileTextIcon, PlusIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CreateFormModal } from "./CreateFormModal";
import { FormTypeBadge, FormStatusBadge } from "./FormBadges";

const ALL = "__all__";

export function FormsListClient() {
	const { data: forms = [], isLoading } = useForms();
	const params = useParams<{ organizationSlug: string }>();
	const router = useRouter();
	const orgSlug = params.organizationSlug;
	const [createOpen, setCreateOpen] = useState(false);
	const [search, setSearch] = useState("");
	const [selectedType, setSelectedType] = useState<string>(ALL);
	const [selectedStatus, setSelectedStatus] = useState<string>(ALL);
	const [selectedSiteId, setSelectedSiteId] = useState<string>(ALL);

	const sites = useMemo(() => {
		const map = new Map<string, { id: string; name: string }>();
		for (const form of forms) {
			for (const fs of form.formSites ?? []) {
				if (!map.has(fs.site.id)) map.set(fs.site.id, fs.site);
			}
		}
		return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
	}, [forms]);

	const filteredForms = useMemo(() => {
		let list = forms;
		if (selectedType !== ALL) list = list.filter((f) => f.type === selectedType);
		if (selectedStatus !== ALL) list = list.filter((f) => f.status === selectedStatus);
		if (selectedSiteId !== ALL) list = list.filter((f) => f.formSites?.some((fs) => fs.site.id === selectedSiteId));
		if (search.trim()) {
			const q = search.toLowerCase();
			list = list.filter((f) => f.name.toLowerCase().includes(q));
		}
		return list;
	}, [forms, selectedType, selectedStatus, selectedSiteId, search]);

	return (
		<div className="space-y-4">
			{/* Filter bar */}
			<div className="flex flex-col gap-3">
				{/* Row 1: Search + New button */}
				<div className="flex items-center gap-2">
					<Input
						type="search"
						placeholder="Search forms…"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="flex-1"
					/>
					<Button className="shrink-0" onClick={() => setCreateOpen(true)}>
						<PlusIcon className="size-4 md:mr-2" />
						<span className="hidden md:inline">New Form</span>
					</Button>
				</div>

				{/* Row 2: Type + Status + Site selects */}
				<div className="flex items-center gap-2">
					<Select value={selectedType} onValueChange={setSelectedType}>
						<SelectTrigger className="flex-1">
							<SelectValue placeholder="All Types" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ALL}>All Types</SelectItem>
							<SelectItem value="STUDENT">Student</SelectItem>
							<SelectItem value="MENTOR">Mentor</SelectItem>
						</SelectContent>
					</Select>

					<Select value={selectedStatus} onValueChange={setSelectedStatus}>
						<SelectTrigger className="flex-1">
							<SelectValue placeholder="All Statuses" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ALL}>All Statuses</SelectItem>
							<SelectItem value="PUBLISHED">Published</SelectItem>
							<SelectItem value="UNPUBLISHED">Unpublished</SelectItem>
						</SelectContent>
					</Select>

					<Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
						<SelectTrigger className="flex-1">
							<SelectValue placeholder="All Sites" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ALL}>All Sites</SelectItem>
							{sites.map((site) => (
								<SelectItem key={site.id} value={site.id}>
									{site.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Table */}
			<div className="rounded-xl border bg-card">
				<Table>
					<TableHeader>
						<TableRow className="hover:bg-transparent">
							<TableHead className="w-10" />
							<TableHead>Name</TableHead>
							<TableHead>Sites</TableHead>
							<TableHead>Fields</TableHead>
							<TableHead>Type</TableHead>
							<TableHead>Status</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							Array.from({ length: 3 }).map((_, i) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: skeleton
								<TableRow key={i}>
									<TableCell><Skeleton className="size-5 rounded" /></TableCell>
									<TableCell><Skeleton className="h-4 w-40" /></TableCell>
									<TableCell><Skeleton className="h-4 w-10" /></TableCell>
									<TableCell><Skeleton className="h-4 w-10" /></TableCell>
									<TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
									<TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
								</TableRow>
							))
						) : filteredForms.length === 0 ? (
							<TableRow>
								<TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
									{search || selectedType !== ALL || selectedStatus !== ALL || selectedSiteId !== ALL
										? "No forms match your filters."
										: "No forms yet. Create your first form to start collecting applications."}
								</TableCell>
							</TableRow>
						) : (
							filteredForms.map((form) => (
								<TableRow
									key={form.id}
									className="cursor-pointer"
									onClick={() => router.push(`/app/${orgSlug}/forms/${form.id}`)}
								>
									<TableCell>
										<FileTextIcon className="size-4 text-muted-foreground" />
									</TableCell>
									<TableCell className="font-medium">{form.name}</TableCell>
									<TableCell className="text-muted-foreground">{form._count.formSites}</TableCell>
									<TableCell className="text-muted-foreground">{form._count.fields}</TableCell>
									<TableCell><FormTypeBadge type={form.type} /></TableCell>
									<TableCell><FormStatusBadge status={form.status} /></TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			<CreateFormModal open={createOpen} onOpenChange={setCreateOpen} />
		</div>
	);
}

"use client";

import { Button } from "@repo/ui/components/button";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useForms } from "@saas/forms/hooks/use-forms";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PlusIcon, FileTextIcon } from "lucide-react";
import { useState } from "react";
import { CreateFormModal } from "./CreateFormModal";
import { FormTypeBadge, FormStatusBadge } from "./FormBadges";

export function FormsListClient() {
	const { data: forms = [], isLoading } = useForms();
	const params = useParams<{ organizationSlug: string }>();
	const orgSlug = params.organizationSlug;
	const [createOpen, setCreateOpen] = useState(false);

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<p className="text-sm text-muted-foreground">
					{isLoading ? "" : `${forms.length} form${forms.length !== 1 ? "s" : ""}`}
				</p>
				<Button onClick={() => setCreateOpen(true)} size="sm">
					<PlusIcon className="mr-2 size-4" />
					New Form
				</Button>
			</div>

			{isLoading ? (
				<div className="space-y-3">
					{Array.from({ length: 3 }).map((_, i) => (
						<Skeleton key={i} className="h-20 w-full rounded-lg" />
					))}
				</div>
			) : forms.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 py-16 text-center">
					<FileTextIcon className="mb-3 size-10 text-muted-foreground/40" />
					<p className="font-medium">No forms yet</p>
					<p className="mt-1 text-sm text-muted-foreground">
						Create your first form to start collecting applications.
					</p>
					<Button
						className="mt-4"
						size="sm"
						onClick={() => setCreateOpen(true)}
					>
						<PlusIcon className="mr-2 size-4" />
						New Form
					</Button>
				</div>
			) : (
				<div className="space-y-3">
					{forms.map((form) => (
						<Link
							key={form.id}
							href={`/app/${orgSlug}/forms/${form.id}`}
							className="flex items-center gap-4 rounded-lg border bg-card px-5 py-4 hover:bg-muted/50 transition-colors"
						>
							<FileTextIcon className="size-5 shrink-0 text-muted-foreground" />
							<div className="flex-1 min-w-0">
								<p className="font-medium truncate">{form.name}</p>
								<p className="text-xs text-muted-foreground mt-0.5">
									{form._count.formSites} site{form._count.formSites !== 1 ? "s" : ""} &middot;{" "}
									{form._count.fields} field{form._count.fields !== 1 ? "s" : ""}
								</p>
							</div>
							<div className="flex items-center gap-2 shrink-0">
								<FormTypeBadge type={form.type} />
								<FormStatusBadge status={form.status} />
							</div>
						</Link>
					))}
				</div>
			)}

			<CreateFormModal open={createOpen} onOpenChange={setCreateOpen} />
		</div>
	);
}


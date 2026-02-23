"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@repo/ui/components/dialog";
import { Form } from "@repo/ui/components/form";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
	type ResourceFormValues,
	ResourceDialogFields,
} from "./ResourceDialogFields";

// ─── Schema ───────────────────────────────────────────────────────────────────

const formSchema = z.object({
	name: z.string().min(1, "Name is required"),
	url: z.string().url("Must be a valid URL"),
	description: z.string().optional(),
	eventId: z.string().optional(),
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface ResourceEvent {
	id: string;
	name: string;
	startsAt: Date | string;
}

interface ResourceDialogProps {
	groupId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	events: ResourceEvent[];
	/** When provided, the dialog operates in edit mode. */
	editResource?: {
		id: string;
		name: string;
		url: string;
		description?: string | null;
		eventId?: string | null;
	};
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ResourceDialog({
	groupId,
	open,
	onOpenChange,
	events,
	editResource,
}: ResourceDialogProps) {
	const queryClient = useQueryClient();
	const isEdit = !!editResource;

	const createResource = useMutation(orpc.resources.create.mutationOptions());
	const updateResource = useMutation(orpc.resources.update.mutationOptions());

	const form = useForm<ResourceFormValues>({
		resolver: zodResolver(formSchema),
		values: {
			name: editResource?.name ?? "",
			url: editResource?.url ?? "",
			description: editResource?.description ?? "",
			eventId: editResource?.eventId ?? undefined,
		},
	});

	const handleSubmit = form.handleSubmit(async (values) => {
		try {
			if (isEdit) {
				await updateResource.mutateAsync({
					id: editResource.id,
					name: values.name,
					url: values.url,
					description: values.description || undefined,
					eventId: values.eventId ?? null,
				});
				toastSuccess("Resource updated.");
			} else {
				await createResource.mutateAsync({
					groupId,
					name: values.name,
					url: values.url,
					description: values.description || undefined,
					eventId: values.eventId || undefined,
				});
				toastSuccess("Resource added.");
			}
			queryClient.invalidateQueries(
				orpc.resources.list.queryOptions({ input: { groupId } }),
			);
			form.reset();
			onOpenChange(false);
		} catch {
			toastError("Failed to save resource. Please try again.");
		}
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>
						{isEdit ? "Edit Resource" : "Add Resource"}
					</DialogTitle>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={handleSubmit} className="space-y-4">
						<ResourceDialogFields control={form.control} events={events} />

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
							>
								Cancel
							</Button>
							<Button type="submit" loading={form.formState.isSubmitting}>
								{isEdit ? "Save Changes" : "Add Resource"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}

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
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import { toastError } from "@repo/ui/components/toast";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { useSites } from "@saas/sites/hooks/use-sites";
import { useCreateForm } from "@saas/forms/hooks/use-forms";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

const createFormSchema = z.object({
	name: z.string().min(1, "Name is required"),
	type: z.enum(["STUDENT", "MENTOR"]),
	siteIds: z.array(z.string()).min(1, "At least one site is required"),
});

type CreateFormValues = z.infer<typeof createFormSchema>;

interface CreateFormModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function CreateFormModal({ open, onOpenChange }: CreateFormModalProps) {
	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id ?? "";
	const params = useParams<{ organizationSlug: string }>();
	const orgSlug = params.organizationSlug;
	const router = useRouter();
	const createForm = useCreateForm();
	const { data: sites = [] } = useSites();

	const form = useForm<CreateFormValues>({
		resolver: zodResolver(createFormSchema),
		defaultValues: {
			name: "",
			type: "STUDENT",
			siteIds: [],
		},
	});

	const selectedSiteIds = form.watch("siteIds");

	const toggleSite = (siteId: string) => {
		const current = form.getValues("siteIds");
		if (current.includes(siteId)) {
			form.setValue(
				"siteIds",
				current.filter((id) => id !== siteId),
				{ shouldValidate: true },
			);
		} else {
			form.setValue("siteIds", [...current, siteId], { shouldValidate: true });
		}
	};

	const onSubmit = async (values: CreateFormValues) => {
		try {
			const result = await createForm.mutateAsync({
				organizationId,
				name: values.name,
				type: values.type,
				siteIds: values.siteIds,
			});
			onOpenChange(false);
			form.reset();
			router.push(`/app/${orgSlug}/forms/${result.id}`);
		} catch {
			toastError("Failed to create form.");
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>New Form</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Form Name</FormLabel>
									<FormControl>
										<Input {...field} placeholder="e.g. Student Registration 2025" />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="type"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Form Type</FormLabel>
									<FormControl>
										<div className="flex gap-3">
											{(["STUDENT", "MENTOR"] as const).map((t) => (
												<label
													key={t}
													className={`flex flex-1 cursor-pointer items-center justify-center rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${field.value === t ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"}`}
												>
													<input
														type="radio"
														className="sr-only"
														value={t}
														checked={field.value === t}
														onChange={() => field.onChange(t)}
													/>
													{t === "STUDENT" ? "Student" : "Mentor"}
												</label>
											))}
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="siteIds"
							render={() => (
								<FormItem>
									<FormLabel>Sites</FormLabel>
									{sites.length === 0 ? (
										<p className="text-sm text-muted-foreground">
											No sites found. Create a site first.
										</p>
									) : (
										<div className="space-y-2 max-h-48 overflow-y-auto rounded-lg border p-2">
											{sites.map((site) => (
												<label
													key={site.id}
													className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-muted"
												>
													<input
														type="checkbox"
														className="size-4 rounded border-border"
														checked={selectedSiteIds.includes(site.id)}
														onChange={() => toggleSite(site.id)}
													/>
													<span className="text-sm">{site.name}</span>
												</label>
											))}
										</div>
									)}
									<FormMessage />
								</FormItem>
							)}
						/>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={createForm.isPending}>
								{createForm.isPending ? "Creating…" : "Create Form"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@repo/ui/components/alert-dialog";
import { Button } from "@repo/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import { Checkbox } from "@repo/ui/components/checkbox";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Skeleton } from "@repo/ui/components/skeleton";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PencilIcon, PlusCircleIcon, TrashIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
	label: z
		.string()
		.regex(/^\d{4}-\d{4}$/, "Format must be YYYY-YYYY (e.g. 2024-2025)"),
	startDate: z.string().optional(),
	endDate: z.string().optional(),
	isActive: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface AcademicYear {
	id: string;
	label: string;
	startDate?: string | Date | null;
	endDate?: string | Date | null;
	isActive?: boolean | null;
}

function formatDate(value: string | Date | null | undefined): string {
	if (!value) return "";
	return new Date(value).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

function toIsoDatetime(dateStr: string): string {
	// dateStr from <input type="date"> is "YYYY-MM-DD"
	return new Date(dateStr).toISOString();
}

function toDateInputValue(value: string | Date | null | undefined): string {
	if (!value) return "";
	const d = new Date(value);
	const yyyy = d.getFullYear();
	const mm = String(d.getMonth() + 1).padStart(2, "0");
	const dd = String(d.getDate()).padStart(2, "0");
	return `${yyyy}-${mm}-${dd}`;
}

export function AcademicYearsSettings() {
	const { activeOrganization, isOrganizationAdmin } = useActiveOrganization();
	const queryClient = useQueryClient();

	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingYear, setEditingYear] = useState<AcademicYear | undefined>(
		undefined,
	);
	const [deletingYearId, setDeletingYearId] = useState<string | undefined>(
		undefined,
	);

	const orgId = activeOrganization?.id ?? "";

	const queryOptions = orpc.academicYears.list.queryOptions({
		input: { organizationId: orgId },
	});

	const { data: years = [], isLoading } = useQuery({
		...queryOptions,
		enabled: !!activeOrganization?.id,
	});

	const createYear = useMutation(
		orpc.academicYears.create.mutationOptions({
			onSuccess: () =>
				queryClient.invalidateQueries({
					queryKey: queryOptions.queryKey,
				}),
		}),
	);

	const updateYear = useMutation(
		orpc.academicYears.update.mutationOptions({
			onSuccess: () =>
				queryClient.invalidateQueries({
					queryKey: queryOptions.queryKey,
				}),
		}),
	);

	const deleteYear = useMutation(
		orpc.academicYears.delete.mutationOptions({
			onSuccess: () =>
				queryClient.invalidateQueries({
					queryKey: queryOptions.queryKey,
				}),
		}),
	);

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			label: "",
			startDate: "",
			endDate: "",
			isActive: true,
		},
	});

	useEffect(() => {
		if (dialogOpen) {
			form.reset({
				label: editingYear?.label ?? "",
				startDate: toDateInputValue(editingYear?.startDate),
				endDate: toDateInputValue(editingYear?.endDate),
				isActive: editingYear?.isActive ?? true,
			});
		}
	}, [dialogOpen, editingYear]);

	const handleOpenNew = () => {
		setEditingYear(undefined);
		setDialogOpen(true);
	};

	const handleOpenEdit = (year: AcademicYear) => {
		setEditingYear(year);
		setDialogOpen(true);
	};

	const handleDialogOpenChange = (open: boolean) => {
		setDialogOpen(open);
		if (!open) {
			setEditingYear(undefined);
			form.reset();
		}
	};

	const onSubmit = form.handleSubmit(async (values) => {
		try {
			const startDate = values.startDate
				? toIsoDatetime(values.startDate)
				: undefined;
			const endDate = values.endDate
				? toIsoDatetime(values.endDate)
				: undefined;

			if (editingYear) {
				await updateYear.mutateAsync({
					id: editingYear.id,
					label: values.label,
					startDate: startDate ?? null,
					endDate: endDate ?? null,
					isActive: values.isActive,
				});
				toastSuccess("Academic year updated");
			} else {
				await createYear.mutateAsync({
					organizationId: activeOrganization!.id,
					label: values.label,
					startDate: startDate ?? null,
					endDate: endDate ?? null,
					isActive: values.isActive,
				});
				toastSuccess("Academic year created");
			}
			form.reset();
			setDialogOpen(false);
			setEditingYear(undefined);
		} catch {
			toastError("Failed to save academic year");
		}
	});

	async function handleDelete() {
		if (!deletingYearId) return;
		try {
			await deleteYear.mutateAsync({
				id: deletingYearId,
				organizationId: activeOrganization!.id,
			});
			toastSuccess("Academic year deleted");
			setDeletingYearId(undefined);
		} catch {
			toastError("Failed to delete academic year");
		}
	}

	return (
		<>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle>Academic Years</CardTitle>
					{isOrganizationAdmin && (
						<Button
							variant="primary"
							size="sm"
							onClick={handleOpenNew}
							className="gap-2"
						>
							<PlusCircleIcon className="size-4" />
							Add Year
						</Button>
					)}
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="space-y-3">
							{Array.from({ length: 3 }).map((_, i) => (
								<Skeleton
									key={i}
									className="h-14 w-full rounded-lg"
								/>
							))}
						</div>
					) : years.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							No academic years yet. Add one to get started.
						</p>
					) : (
						<div className="divide-y">
							{years.map((year) => (
								<div
									key={year.id}
									className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
								>
									<div className="flex flex-col gap-0.5">
										<div className="flex items-center gap-2">
											<span className="font-semibold text-sm">
												{year.label}
											</span>
											{year.isActive && (
												<span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
													Active
												</span>
											)}
										</div>
										{(year.startDate || year.endDate) && (
											<span className="text-xs text-muted-foreground">
												{year.startDate
													? formatDate(year.startDate)
													: ""}
												{year.startDate && year.endDate
													? " – "
													: ""}
												{year.endDate
													? formatDate(year.endDate)
													: ""}
											</span>
										)}
									</div>
									{isOrganizationAdmin && (
										<div className="flex items-center gap-1">
											<Button
												variant="ghost"
												size="icon"
												onClick={() =>
													handleOpenEdit(
														year as AcademicYear,
													)
												}
												aria-label="Edit academic year"
											>
												<PencilIcon className="size-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												onClick={() =>
													setDeletingYearId(year.id)
												}
												aria-label="Delete academic year"
											>
												<TrashIcon className="size-4 text-destructive" />
											</Button>
										</div>
									)}
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Add / Edit Dialog */}
			<Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{editingYear
								? "Edit Academic Year"
								: "Add Academic Year"}
						</DialogTitle>
					</DialogHeader>

					<form onSubmit={onSubmit} className="space-y-4">
						<div className="space-y-1.5">
							<Label htmlFor="ay-label">Label</Label>
							<Input
								id="ay-label"
								placeholder="2024-2025"
								{...form.register("label")}
							/>
							{form.formState.errors.label && (
								<p className="text-xs text-destructive">
									{form.formState.errors.label.message}
								</p>
							)}
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="ay-startDate">
								Start Date (optional)
							</Label>
							<Input
								id="ay-startDate"
								type="date"
								{...form.register("startDate")}
							/>
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="ay-endDate">
								End Date (optional)
							</Label>
							<Input
								id="ay-endDate"
								type="date"
								{...form.register("endDate")}
							/>
						</div>

						<div className="flex items-center gap-2">
							<Checkbox
								id="ay-isActive"
								checked={form.watch("isActive")}
								onCheckedChange={(checked) =>
									form.setValue("isActive", Boolean(checked))
								}
							/>
							<Label
								htmlFor="ay-isActive"
								className="cursor-pointer"
							>
								Mark as active
							</Label>
						</div>

						<DialogFooter>
							<Button
								type="button"
								variant="ghost"
								onClick={() => handleDialogOpenChange(false)}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								variant="primary"
								loading={form.formState.isSubmitting}
							>
								Save
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<AlertDialog
				open={Boolean(deletingYearId)}
				onOpenChange={(open) => {
					if (!open) setDeletingYearId(undefined);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							Delete Academic Year
						</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this academic year?
							This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={handleDelete}>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}

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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { Textarea } from "@repo/ui/components/textarea";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PURCHASE_REQUEST_CATEGORIES } from "@repo/api/modules/purchase-requests/types";
import {
	useCreatePurchaseRequest,
	useUpdatePurchaseRequest,
	type PurchaseRequest,
} from "../hooks/use-purchase-requests";

const CATEGORY_LABELS: Record<string, string> = {
	supplies: "Supplies",
	snacks: "Snacks",
	activities: "Activities",
	equipment: "Equipment",
	field_trips: "Field Trips",
	guest_speakers: "Guest Speakers",
	other: "Other",
};

const formSchema = z.object({
	item: z.string().min(1, "Item name is required"),
	description: z.string().optional(),
	url: z.string().url("Enter a valid URL").optional().or(z.literal("")),
	amount: z.number().positive("Amount must be positive"),
	category: z.enum(PURCHASE_REQUEST_CATEGORIES),
	justification: z.string().min(1, "Justification is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface PurchaseRequestDialogProps {
	groupId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	editRequest?: PurchaseRequest | null;
}

export function PurchaseRequestDialog({
	groupId,
	open,
	onOpenChange,
	editRequest,
}: PurchaseRequestDialogProps) {
	const isEditing = !!editRequest;
	const createRequest = useCreatePurchaseRequest(groupId);
	const updateRequest = useUpdatePurchaseRequest(groupId);

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			item: "",
			description: "",
			url: "",
			amount: 0,
			category: "supplies",
			justification: "",
		},
	});

	useEffect(() => {
		if (editRequest) {
			form.reset({
				item: editRequest.item,
				description: editRequest.description ?? "",
				url: editRequest.url ?? "",
				amount: Number(editRequest.amount),
				category: editRequest.category as (typeof PURCHASE_REQUEST_CATEGORIES)[number],
				justification: editRequest.justification,
			});
		} else {
			form.reset({
				item: "",
				description: "",
				url: "",
				amount: 0,
				category: "supplies",
				justification: "",
			});
		}
	}, [editRequest, form]);

	const handleSubmit = form.handleSubmit(async (values) => {
		try {
			const normalized = { ...values, url: values.url || undefined };
		if (isEditing) {
				await updateRequest.mutateAsync({ id: editRequest.id, ...normalized });
				toastSuccess("Purchase request updated.");
			} else {
				await createRequest.mutateAsync({ groupId, ...normalized });
				toastSuccess("Purchase request submitted.");
			}
			form.reset();
			onOpenChange(false);
		} catch {
			toastError("Failed to submit request. Please try again.");
		}
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>
						{isEditing ? "Edit Purchase Request" : "New Purchase Request"}
					</DialogTitle>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={handleSubmit} className="space-y-4">
						<FormField
							control={form.control}
							name="item"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Item Name</FormLabel>
									<FormControl>
										<Input {...field} placeholder="Enter item name" />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Description</FormLabel>
									<FormControl>
										<Textarea
											{...field}
											placeholder="Optional description"
											rows={2}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="url"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Item URL (optional)</FormLabel>
									<FormControl>
										<Input
											{...field}
											type="url"
											placeholder="https://..."
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="amount"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Amount ($)</FormLabel>
										<FormControl>
											<Input
												{...field}
												type="number"
												step="0.01"
												min="0"
												placeholder="0.00"
												onChange={(e) =>
													field.onChange(parseFloat(e.target.value) || 0)
												}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="category"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Category</FormLabel>
										<Select onValueChange={field.onChange} value={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select category" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{PURCHASE_REQUEST_CATEGORIES.map((cat) => (
													<SelectItem key={cat} value={cat}>
														{CATEGORY_LABELS[cat]}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name="justification"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Justification</FormLabel>
									<FormControl>
										<Textarea
											{...field}
											placeholder="Explain why this purchase is needed"
											rows={3}
										/>
									</FormControl>
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
							<Button type="submit" loading={form.formState.isSubmitting}>
								{isEditing ? "Update Request" : "Submit Request"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}

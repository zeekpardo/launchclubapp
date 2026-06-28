"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PURCHASE_REQUEST_CATEGORIES } from "@repo/api/modules/purchase-requests/types";
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
import { PlusIcon, Trash2Icon } from "lucide-react";
import { useEffect } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import {
	type PurchaseRequest,
	useCreatePurchaseRequest,
	useUpdatePurchaseRequest,
} from "../hooks/use-purchase-requests";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
	supplies: "Supplies",
	snacks: "Snacks",
	activities: "Activities",
	equipment: "Equipment",
	field_trips: "Field Trips",
	guest_speakers: "Guest Speakers",
	other: "Other",
};

// ─── Schema ───────────────────────────────────────────────────────────────────

const lineItemSchema = z.object({
	item: z.string().min(1, "Required"),
	url: z.string().url("Invalid URL").optional().or(z.literal("")),
	amount: z.number().positive("Must be > 0"),
	quantity: z.number().int().min(1, "Min 1"),
	category: z.enum(PURCHASE_REQUEST_CATEGORIES),
});

const formSchema = z.object({
	name: z.string().min(1, "Name is required"),
	dueDate: z.string().optional(),
	description: z.string().min(1, "Description is required"),
	items: z.array(lineItemSchema).min(1, "Add at least one item"),
});

type FormValues = z.infer<typeof formSchema>;

const defaultItem: FormValues["items"][number] = {
	item: "",
	url: "",
	amount: 0,
	quantity: 1,
	category: "supplies",
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface PurchaseRequestDialogProps {
	groupId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	editRequest?: PurchaseRequest | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

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
			name: "",
			dueDate: "",
			description: "",
			items: [defaultItem],
		},
	});

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "items",
	});

	const watchedItems = useWatch({ control: form.control, name: "items" });
	const total = watchedItems.reduce(
		(sum, i) => sum + (Number(i?.amount) || 0) * (Number(i?.quantity) || 0),
		0,
	);

	useEffect(() => {
		if (editRequest) {
			form.reset({
				name: editRequest.name,
				dueDate: editRequest.dueDate
					? new Date(editRequest.dueDate).toISOString().slice(0, 10)
					: "",
				description: editRequest.description,
				items: editRequest.items.map((i) => ({
					item: i.item,
					url: i.url ?? "",
					amount: Number(i.amount),
					quantity: i.quantity,
					category:
						i.category as (typeof PURCHASE_REQUEST_CATEGORIES)[number],
				})),
			});
		} else {
			form.reset({
				name: "",
				dueDate: "",
				description: "",
				items: [defaultItem],
			});
		}
	}, [editRequest, form]);

	const handleSubmit = form.handleSubmit(async (values) => {
		try {
			const items = values.items.map((i) => ({
				...i,
				url: i.url || undefined,
			}));
			const dueDate = values.dueDate
				? new Date(values.dueDate).toISOString()
				: undefined;
			if (isEditing) {
				const wasReviewed = editRequest.status !== "PENDING";
				await updateRequest.mutateAsync({
					id: editRequest.id,
					name: values.name,
					dueDate,
					description: values.description,
					items,
				});
				toastSuccess(
					wasReviewed
						? "Request updated and resubmitted for review."
						: "Purchase request updated.",
				);
			} else {
				await createRequest.mutateAsync({
					groupId,
					name: values.name,
					dueDate,
					description: values.description,
					items,
				});
				toastSuccess("Purchase request submitted.");
			}
			form.reset({
				name: "",
				dueDate: "",
				description: "",
				items: [defaultItem],
			});
			onOpenChange(false);
		} catch {
			toastError("Failed to submit request. Please try again.");
		}
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>
						{isEditing
							? "Edit Purchase Request"
							: "New Purchase Request"}
					</DialogTitle>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={handleSubmit} className="space-y-5">
						{/* Name + Due Date */}
						<div className="grid grid-cols-[1fr_10rem] gap-4">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Name</FormLabel>
										<FormControl>
											<Input
												{...field}
												placeholder="e.g. Spring field trip supplies"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="dueDate"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Due Date</FormLabel>
										<FormControl>
											<Input {...field} type="date" />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						{/* Description */}
						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Description</FormLabel>
									<FormControl>
										<Textarea
											{...field}
											placeholder="Describe this request (e.g. event, activity, or purpose)"
											rows={2}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Line Items */}
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<p className="text-sm font-medium">Items</p>
							</div>

							{/* Column headers */}
							<div className="grid grid-cols-[1fr_4rem_5rem_8rem_1fr_2rem] gap-2 px-1 text-xs font-medium text-muted-foreground">
								<span>Item</span>
								<span>Qty</span>
								<span>Unit Price</span>
								<span>Category</span>
								<span>URL (optional)</span>
								<span />
							</div>

							{/* Item rows */}
							<div className="space-y-2">
								{fields.map((field, index) => (
									<div
										key={field.id}
										className="grid grid-cols-[1fr_4rem_5rem_8rem_1fr_2rem] items-start gap-2"
									>
										{/* Item name */}
										<FormField
											control={form.control}
											name={`items.${index}.item`}
											render={({ field: f }) => (
												<FormItem className="space-y-0">
													<FormControl>
														<Input
															{...f}
															placeholder="Item name"
														/>
													</FormControl>
													<FormMessage className="text-xs" />
												</FormItem>
											)}
										/>

										{/* Quantity */}
										<FormField
											control={form.control}
											name={`items.${index}.quantity`}
											render={({ field: f }) => (
												<FormItem className="space-y-0">
													<FormControl>
														<Input
															{...f}
															type="number"
															min="1"
															placeholder="1"
															onChange={(e) =>
																f.onChange(
																	Number.parseInt(
																		e.target
																			.value,
																		10,
																	) || 1,
																)
															}
														/>
													</FormControl>
													<FormMessage className="text-xs" />
												</FormItem>
											)}
										/>

										{/* Amount */}
										<FormField
											control={form.control}
											name={`items.${index}.amount`}
											render={({ field: f }) => (
												<FormItem className="space-y-0">
													<FormControl>
														<Input
															{...f}
															type="number"
															step="0.01"
															min="0"
															placeholder="0.00"
															onChange={(e) =>
																f.onChange(
																	Number.parseFloat(
																		e.target
																			.value,
																	) || 0,
																)
															}
														/>
													</FormControl>
													<FormMessage className="text-xs" />
												</FormItem>
											)}
										/>

										{/* Category */}
										<FormField
											control={form.control}
											name={`items.${index}.category`}
											render={({ field: f }) => (
												<FormItem className="space-y-0">
													<Select
														onValueChange={
															f.onChange
														}
														value={f.value}
													>
														<FormControl>
															<SelectTrigger>
																<SelectValue />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															{PURCHASE_REQUEST_CATEGORIES.map(
																(cat) => (
																	<SelectItem
																		key={
																			cat
																		}
																		value={
																			cat
																		}
																	>
																		{
																			CATEGORY_LABELS[
																				cat
																			]
																		}
																	</SelectItem>
																),
															)}
														</SelectContent>
													</Select>
													<FormMessage className="text-xs" />
												</FormItem>
											)}
										/>

										{/* URL */}
										<FormField
											control={form.control}
											name={`items.${index}.url`}
											render={({ field: f }) => (
												<FormItem className="space-y-0">
													<FormControl>
														<Input
															{...f}
															type="url"
															placeholder="https://..."
														/>
													</FormControl>
													<FormMessage className="text-xs" />
												</FormItem>
											)}
										/>

										{/* Remove */}
										<Button
											type="button"
											variant="ghost"
											size="icon"
											className="h-9 w-9 text-muted-foreground hover:text-destructive"
											disabled={fields.length === 1}
											onClick={() => remove(index)}
										>
											<Trash2Icon className="h-4 w-4" />
										</Button>
									</div>
								))}
							</div>

							{/* Add item + total */}
							<div className="flex items-center justify-between pt-1">
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => append(defaultItem)}
								>
									<PlusIcon className="mr-1.5 h-3.5 w-3.5" />
									Add Item
								</Button>
								<p className="text-sm font-semibold">
									Total:{" "}
									<span className="text-green-600">
										${total.toFixed(2)}
									</span>
								</p>
							</div>
						</div>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								loading={form.formState.isSubmitting}
							>
								{isEditing
									? "Update Request"
									: "Submit Request"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}

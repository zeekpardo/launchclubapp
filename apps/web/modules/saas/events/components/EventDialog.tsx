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
import { useCreateEvent, useUpdateEvent } from "@saas/events/hooks/use-events";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z
	.object({
		name: z.string().min(1),
		groupId: z.string().min(1),
		description: z.string().optional(),
		startsAt: z.string().min(1),
		endsAt: z.string().optional(),
	})
	.refine(
		(data) => {
			if (data.endsAt && data.endsAt.length > 0) {
				return new Date(data.endsAt) > new Date(data.startsAt);
			}
			return true;
		},
		{
			message: "End date must be after start date",
			path: ["endsAt"],
		},
	);

type FormValues = z.infer<typeof formSchema>;

function toDatetimeLocal(dateStr: string | Date | null | undefined): string {
	if (!dateStr) return "";
	const d = new Date(dateStr);
	if (Number.isNaN(d.getTime())) return "";
	// Format as YYYY-MM-DDTHH:MM
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toISOString(datetimeLocal: string): string {
	if (!datetimeLocal) return "";
	return new Date(datetimeLocal).toISOString();
}

interface EventDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	event?: {
		id: string;
		name: string;
		groupId: string;
		description?: string | null;
		startsAt: string | Date;
		endsAt?: string | Date | null;
	};
	organizationId: string;
	defaultGroupId?: string;
}

export function EventDialog({
	open,
	onOpenChange,
	event,
	organizationId,
	defaultGroupId,
}: EventDialogProps) {
	const t = useTranslations();
	const createEvent = useCreateEvent();
	const updateEvent = useUpdateEvent();
	const isEditing = Boolean(event);

	const { data: groups } = useQuery(
		orpc.groups.list.queryOptions({
			input: { organizationId },
			enabled: !!organizationId,
		}),
	);

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: event?.name ?? "",
			groupId: event?.groupId ?? defaultGroupId ?? "",
			description: event?.description ?? "",
			startsAt: toDatetimeLocal(event?.startsAt),
			endsAt: toDatetimeLocal(event?.endsAt),
		},
	});

	useEffect(() => {
		if (open) {
			form.reset({
				name: event?.name ?? "",
				groupId: event?.groupId ?? defaultGroupId ?? "",
				description: event?.description ?? "",
				startsAt: toDatetimeLocal(event?.startsAt),
				endsAt: toDatetimeLocal(event?.endsAt),
			});
		}
	}, [open, event, defaultGroupId]);

	const onSubmit = form.handleSubmit(async (values) => {
		try {
			const payload = {
				name: values.name,
				groupId: values.groupId,
				description: values.description || undefined,
				startsAt: toISOString(values.startsAt),
				endsAt: values.endsAt ? toISOString(values.endsAt) : undefined,
			};

			if (isEditing && event) {
				await updateEvent.mutateAsync({ id: event.id, ...payload });
				toastSuccess(t("launchclub.events.form.notifications.updated"));
			} else {
				await createEvent.mutateAsync(payload);
				toastSuccess(t("launchclub.events.form.notifications.created"));
			}
			form.reset();
			onOpenChange(false);
		} catch {
			toastError(t("launchclub.events.form.notifications.error"));
		}
	});

	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				if (!nextOpen) {
					form.reset();
				}
				onOpenChange(nextOpen);
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{isEditing
							? t("launchclub.events.edit")
							: t("launchclub.events.new")}
					</DialogTitle>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={onSubmit} className="space-y-4">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("launchclub.events.form.name")}
									</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="groupId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("launchclub.events.form.group")}
									</FormLabel>
									<Select
										value={field.value}
										onValueChange={field.onChange}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue
													placeholder={t(
														"launchclub.events.selectGroup",
													)}
												/>
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{groups?.map((group) => (
												<SelectItem
													key={group.id}
													value={group.id}
												>
													{group.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t(
											"launchclub.events.form.description",
										)}
									</FormLabel>
									<FormControl>
										<Textarea {...field} rows={3} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="startsAt"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("launchclub.events.form.startsAt")}
									</FormLabel>
									<FormControl>
										<Input
											type="datetime-local"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="endsAt"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("launchclub.events.form.endsAt")}
									</FormLabel>
									<FormControl>
										<Input
											type="datetime-local"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<DialogFooter>
							<Button
								type="button"
								variant="ghost"
								onClick={() => onOpenChange(false)}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								variant="primary"
								loading={form.formState.isSubmitting}
							>
								{t("launchclub.events.form.save")}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}

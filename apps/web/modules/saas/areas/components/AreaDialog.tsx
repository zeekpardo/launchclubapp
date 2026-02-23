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
import { Textarea } from "@repo/ui/components/textarea";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { TrashIcon } from "lucide-react";
import { useCreateArea, useUpdateArea } from "@saas/areas/hooks/use-areas";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
	name: z.string().min(1),
	description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AreaDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	area?: { id: string; name: string; description?: string | null };
	organizationId: string;
	onDelete?: () => void;
}

export function AreaDialog({
	open,
	onOpenChange,
	area,
	organizationId,
	onDelete,
}: AreaDialogProps) {
	const t = useTranslations();
	const createArea = useCreateArea();
	const updateArea = useUpdateArea();
	const isEditing = Boolean(area);

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: area?.name ?? "",
			description: area?.description ?? "",
		},
	});

	useEffect(() => {
		form.reset({
			name: area?.name ?? "",
			description: area?.description ?? "",
		});
	}, [area]);

	const onSubmit = form.handleSubmit(async (values) => {
		try {
			if (isEditing && area) {
				await updateArea.mutateAsync({
					id: area.id,
					name: values.name,
					description: values.description,
				});
				toastSuccess(t("launchclub.areas.form.notifications.updated"));
			} else {
				await createArea.mutateAsync({
					organizationId,
					name: values.name,
					description: values.description,
				});
				toastSuccess(t("launchclub.areas.form.notifications.created"));
			}
			form.reset();
			onOpenChange(false);
		} catch {
			toastError(t("launchclub.areas.form.notifications.error"));
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
							? t("launchclub.areas.edit")
							: t("launchclub.areas.new")}
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
										{t("launchclub.areas.form.name")}
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
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("launchclub.areas.form.description")}
									</FormLabel>
									<FormControl>
										<Textarea {...field} rows={3} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<DialogFooter className="flex-row items-center">
							{isEditing && onDelete && (
								<Button
									type="button"
									variant="ghost"
									className="mr-auto text-destructive hover:text-destructive"
									onClick={() => {
										onOpenChange(false);
										onDelete();
									}}
								>
									<TrashIcon className="size-4" />
									Delete
								</Button>
							)}
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
								{t("launchclub.areas.form.save")}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}

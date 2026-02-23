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
import { useCreateGroup, useUpdateGroup } from "@saas/groups/hooks/use-groups";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { TrashIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { GroupDialogFields } from "./GroupDialogFields";

const formSchema = z.object({
	name: z.string().min(1),
	siteId: z.string().min(1),
	description: z.string().optional(),
	gradeLevel: z.string().optional(),
	startDate: z.string().optional(),
	endDate: z.string().optional(),
	meetingDay: z.string().optional(),
	meetingTime: z.string().optional(),
	meetingEndTime: z.string().optional(),
	meetingRecurrence: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Group {
	id: string;
	name: string;
	siteId: string;
	description?: string | null;
	gradeLevel?: string | null;
	startDate?: Date | string | null;
	endDate?: Date | string | null;
	meetingDay?: string | null;
	meetingTime?: string | null;
	meetingEndTime?: string | null;
	meetingRecurrence?: string | null;
}

interface GroupDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	group?: Group;
	organizationId: string;
	defaultSiteId?: string;
	onDelete?: () => void;
}

export function GroupDialog({
	open,
	onOpenChange,
	group,
	organizationId,
	defaultSiteId,
	onDelete,
}: GroupDialogProps) {
	const t = useTranslations();
	const createGroup = useCreateGroup();
	const updateGroup = useUpdateGroup();

	const { data: sites, isLoading: sitesLoading } = useQuery(
		orpc.sites.list.queryOptions({ input: { organizationId } }),
	);

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
			siteId: defaultSiteId ?? "",
			description: "",
			gradeLevel: "",
			startDate: "",
			endDate: "",
			meetingDay: "",
			meetingTime: "",
			meetingEndTime: "",
			meetingRecurrence: "",
		},
	});

	useEffect(() => {
		if (open) {
			form.reset({
				name: group?.name ?? "",
				siteId: group?.siteId ?? defaultSiteId ?? "",
				description: group?.description ?? "",
				gradeLevel: group?.gradeLevel ?? "",
				startDate: group?.startDate
					? new Date(group.startDate).toISOString().slice(0, 10)
					: "",
				endDate: group?.endDate
					? new Date(group.endDate).toISOString().slice(0, 10)
					: "",
				meetingDay: group?.meetingDay ?? "",
				meetingTime: group?.meetingTime ?? "",
				meetingEndTime: group?.meetingEndTime ?? "",
				meetingRecurrence: group?.meetingRecurrence ?? "",
			});
		}
	}, [open, group, defaultSiteId, form]);

	const onSubmit = form.handleSubmit(async (values) => {
		const payload = {
			...values,
			startDate: values.startDate ? new Date(values.startDate).toISOString() : undefined,
			endDate: values.endDate ? new Date(values.endDate).toISOString() : undefined,
		};
		try {
			if (group) {
				await updateGroup.mutateAsync({ id: group.id, ...payload });
				toastSuccess(t("launchclub.groups.form.notifications.updated"));
			} else {
				await createGroup.mutateAsync(payload);
				toastSuccess(t("launchclub.groups.form.notifications.created"));
			}
			onOpenChange(false);
		} catch {
			toastError(t("launchclub.groups.form.notifications.error"));
		}
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>
						{group ? t("launchclub.groups.edit") : t("launchclub.groups.new")}
					</DialogTitle>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={onSubmit} className="space-y-5">
						<GroupDialogFields
							control={form.control}
							sites={sites}
							sitesLoading={sitesLoading}
						/>

						<DialogFooter className="flex-row items-center">
							{group && onDelete && (
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
								variant="outline"
								onClick={() => onOpenChange(false)}
							>
								Cancel
							</Button>
							<Button type="submit" loading={form.formState.isSubmitting}>
								{t("launchclub.groups.form.save")}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}

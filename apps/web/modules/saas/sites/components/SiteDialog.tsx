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
import { useAreas } from "@saas/areas/hooks/use-areas";
import { TrashIcon } from "lucide-react";
import { useCreateSite, useUpdateSite } from "@saas/sites/hooks/use-sites";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { SiteFormFields } from "./SiteFormFields";

const formSchema = z.object({
	name: z.string().min(1),
	slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
	areaId: z.string().min(1),
	addressLine1: z.string().optional(),
	city: z.string().optional(),
	stateProvince: z.string().optional(),
	postalCode: z.string().optional(),
	country: z.string().optional(),
	phone: z.string().optional(),
	email: z.string().email().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

function slugify(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
}

interface EditingSite {
	id: string;
	name: string;
	slug: string;
	areaId: string;
	addressLine1?: string | null;
	city?: string | null;
	stateProvince?: string | null;
	postalCode?: string | null;
	country?: string | null;
	phone?: string | null;
	email?: string | null;
}

interface SiteDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	site?: EditingSite;
	organizationId: string;
	defaultAreaId?: string;
	onDelete?: () => void;
}

export function SiteDialog({
	open,
	onOpenChange,
	site,
	organizationId: _organizationId,
	defaultAreaId,
	onDelete,
}: SiteDialogProps) {
	const t = useTranslations();
	const createSite = useCreateSite();
	const updateSite = useUpdateSite();
	const { data: areas } = useAreas();
	const isEditing = Boolean(site);

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: site?.name ?? "",
			slug: site?.slug ?? "",
			areaId: site?.areaId ?? defaultAreaId ?? "",
			addressLine1: site?.addressLine1 ?? "",
			city: site?.city ?? "",
			stateProvince: site?.stateProvince ?? "",
			postalCode: site?.postalCode ?? "",
			country: site?.country ?? "",
			phone: site?.phone ?? "",
			email: site?.email ?? "",
		},
	});

	useEffect(() => {
		form.reset({
			name: site?.name ?? "",
			slug: site?.slug ?? "",
			areaId: site?.areaId ?? defaultAreaId ?? "",
			addressLine1: site?.addressLine1 ?? "",
			city: site?.city ?? "",
			stateProvince: site?.stateProvince ?? "",
			postalCode: site?.postalCode ?? "",
			country: site?.country ?? "",
			phone: site?.phone ?? "",
			email: site?.email ?? "",
		});
	}, [site]);

	const nameValue = form.watch("name");

	useEffect(() => {
		if (!isEditing) {
			form.setValue("slug", slugify(nameValue));
		}
	}, [nameValue, isEditing, form]);

	const onSubmit = form.handleSubmit(async (values) => {
		try {
			const payload = {
				name: values.name,
				slug: values.slug,
				areaId: values.areaId,
				addressLine1: values.addressLine1 || undefined,
				city: values.city || undefined,
				stateProvince: values.stateProvince || undefined,
				postalCode: values.postalCode || undefined,
				country: values.country || undefined,
				phone: values.phone || undefined,
				email: values.email || undefined,
			};

			if (isEditing && site) {
				await updateSite.mutateAsync({ id: site.id, ...payload });
				toastSuccess(t("launchclub.sites.form.notifications.updated"));
			} else {
				await createSite.mutateAsync(payload);
				toastSuccess(t("launchclub.sites.form.notifications.created"));
			}
			form.reset();
			onOpenChange(false);
		} catch {
			toastError(t("launchclub.sites.form.notifications.error"));
		}
	});

	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				if (!nextOpen) form.reset();
				onOpenChange(nextOpen);
			}}
		>
			<DialogContent className="max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{isEditing ? t("launchclub.sites.edit") : t("launchclub.sites.new")}
					</DialogTitle>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={onSubmit} className="space-y-4">
						<SiteFormFields control={form.control} areas={areas} />

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
							<Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
								Cancel
							</Button>
							<Button
								type="submit"
								variant="primary"
								loading={form.formState.isSubmitting}
							>
								{t("launchclub.sites.form.save")}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}

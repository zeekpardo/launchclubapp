"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/components/button";
import {
	Dialog,
	DialogContent,
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
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";

const householdFormSchema = z.object({
	name: z.string().min(1),
	addressLine1: z.string().optional(),
	city: z.string().optional(),
	stateProvince: z.string().optional(),
	postalCode: z.string().optional(),
	country: z.string().optional(),
	phone: z.string().optional(),
	email: z.string().email().optional().or(z.literal("")),
});

type HouseholdFormValues = z.infer<typeof householdFormSchema>;

interface HouseholdData {
	id: string;
	name: string;
	addressLine1?: string | null;
	city?: string | null;
	stateProvince?: string | null;
	postalCode?: string | null;
	country?: string | null;
	phone?: string | null;
	email?: string | null;
}

interface HouseholdDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	household?: HouseholdData;
	onCreated?: (householdId: string) => void;
}

export function HouseholdDialog({
	open,
	onOpenChange,
	household,
	onCreated,
}: HouseholdDialogProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const { activeOrganization } = useActiveOrganization();

	const createHousehold = useMutation(
		orpc.households.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					orpc.households.list.queryOptions({
						input: { organizationId: activeOrganization?.id ?? "" },
					}),
				);
			},
		}),
	);

	const updateHousehold = useMutation(
		orpc.households.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					orpc.households.list.queryOptions({
						input: { organizationId: activeOrganization?.id ?? "" },
					}),
				);
			},
		}),
	);

	const form = useForm<HouseholdFormValues>({
		resolver: zodResolver(householdFormSchema),
		defaultValues: {
			name: household?.name ?? "",
			addressLine1: household?.addressLine1 ?? "",
			city: household?.city ?? "",
			stateProvince: household?.stateProvince ?? "",
			postalCode: household?.postalCode ?? "",
			country: household?.country ?? "",
			phone: household?.phone ?? "",
			email: household?.email ?? "",
		},
	});

	const onSubmit = form.handleSubmit(async (values) => {
		try {
			const payload = {
				name: values.name,
				addressLine1: values.addressLine1 || undefined,
				city: values.city || undefined,
				stateProvince: values.stateProvince || undefined,
				postalCode: values.postalCode || undefined,
				country: values.country || undefined,
				phone: values.phone || undefined,
				email: values.email || undefined,
			};

			if (household) {
				await updateHousehold.mutateAsync({
					id: household.id,
					...payload,
				});
			} else {
				if (!activeOrganization?.id) return;
				const created = await createHousehold.mutateAsync({
					organizationId: activeOrganization.id,
					...payload,
				});
				onCreated?.(created.id);
			}

			toastSuccess(t("launchclub.households.form.save"));

			onOpenChange(false);
			form.reset();
		} catch {
			toastError(t("launchclub.people.form.notifications.error"));
		}
	});

	const isPending = createHousehold.isPending || updateHousehold.isPending;

	const title = household
		? t("launchclub.households.edit")
		: t("launchclub.households.new");

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>

				<Form {...form}>
					<form
						onSubmit={onSubmit}
						className="grid grid-cols-1 gap-4"
					>
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("launchclub.households.form.name")}
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
							name="addressLine1"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t(
											"launchclub.households.form.address",
										)}
									</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="city"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t(
												"launchclub.households.form.city",
											)}
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
								name="stateProvince"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t(
												"launchclub.households.form.state",
											)}
										</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="postalCode"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t(
												"launchclub.households.form.zipCode",
											)}
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
								name="country"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Country</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name="phone"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("launchclub.households.form.phone")}
									</FormLabel>
									<FormControl>
										<Input type="tel" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("launchclub.households.form.email")}
									</FormLabel>
									<FormControl>
										<Input type="email" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="flex justify-end">
							<Button type="submit" loading={isPending}>
								{t("launchclub.households.form.save")}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/components/button";
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
import { useUpdateArea } from "@saas/areas/hooks/use-areas";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
	name: z.string().min(1),
	description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AreaSettingsTabProps {
	area: { id: string; name: string; description?: string | null };
	organizationId: string;
}

export function AreaSettingsTab({ area }: AreaSettingsTabProps) {
	const t = useTranslations();
	const updateArea = useUpdateArea();

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: area.name,
			description: area.description ?? "",
		},
	});

	const onSubmit = form.handleSubmit(async (values) => {
		try {
			await updateArea.mutateAsync({
				id: area.id,
				name: values.name,
				description: values.description,
			});
			toastSuccess(t("launchclub.areas.form.notifications.updated"));
		} catch {
			toastError(t("launchclub.areas.form.notifications.error"));
		}
	});

	return (
		<div className="max-w-md space-y-6">
			<div>
				<h3 className="font-semibold">Area Settings</h3>
				<p className="text-sm text-muted-foreground mt-0.5">
					Update the name and description for this area.
				</p>
			</div>

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
					<Button
						type="submit"
						variant="primary"
						loading={form.formState.isSubmitting}
					>
						Save Changes
					</Button>
				</form>
			</Form>
		</div>
	);
}

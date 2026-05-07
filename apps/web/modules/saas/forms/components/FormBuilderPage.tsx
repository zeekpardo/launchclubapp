"use client";

import { Skeleton } from "@repo/ui/components/skeleton";
import { useFormData } from "@saas/forms/hooks/use-forms";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { useParams } from "next/navigation";
import { useState } from "react";
import { FormTypeBadge, FormStatusBadge } from "./FormBadges";
import { BuilderTab } from "./BuilderTab";
import { SettingsTab } from "./SettingsTab";
import { ShareTab } from "./ShareTab";

type TabKey = "builder" | "settings" | "share";

interface FormBuilderPageProps {
	formId: string;
}

export function FormBuilderPage({ formId }: FormBuilderPageProps) {
	const params = useParams<{ organizationSlug: string }>();
	const orgSlug = params.organizationSlug;
	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id ?? "";

	const { data: form, isLoading: formLoading } = useFormData(formId);
	const [activeTab, setActiveTab] = useState<TabKey>("builder");

	if (formLoading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-8 w-64" />
				<Skeleton className="h-96 w-full" />
			</div>
		);
	}

	if (!form) return null;

	return (
		<div className="space-y-6">
			<div className="flex items-start justify-between">
				<div>
					<h1 className="text-2xl font-bold">{form.name}</h1>
					{form.description && (
						<p className="mt-1 text-sm text-muted-foreground">{form.description}</p>
					)}
				</div>
				<div className="flex items-center gap-2">
					<FormTypeBadge type={form.type} />
					<FormStatusBadge status={form.status} />
				</div>
			</div>

			<div className="inline-flex rounded-lg border bg-muted p-1">
				{(["builder", "settings", "share"] as const).map((tab) => (
					<button
						key={tab}
						type="button"
						onClick={() => setActiveTab(tab)}
						className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-all ${
							activeTab === tab
								? "bg-background text-foreground shadow-sm"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						{tab}
					</button>
				))}
			</div>

			{activeTab === "builder" && (
				<BuilderTab
					formId={formId}
					isStudentForm={form.type === "STUDENT"}
					organizationId={organizationId}
					orgSlug={orgSlug}
				/>
			)}
			{activeTab === "settings" && (
				<SettingsTab formId={formId} form={form} orgSlug={orgSlug} />
			)}
			{activeTab === "share" && (
				<ShareTab formId={formId} form={form} orgSlug={orgSlug} />
			)}
		</div>
	);
}

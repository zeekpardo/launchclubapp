"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
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
import { toastError } from "@repo/ui/components/toast";
import {
	DayPicker,
	GradePicker,
	RecurrenceSelect,
} from "@saas/groups/components/GroupFormFields";
import { useCreateGroup } from "@saas/groups/hooks/use-groups";
import { useCreateArea } from "@saas/areas/hooks/use-areas";
import { useCreateSite } from "@saas/sites/hooks/use-sites";
import { useRouter } from "@shared/hooks/router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// ─── Slugify ──────────────────────────────────────────────────────────────────

function slugify(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
	return (
		<div className="mb-6">
			<div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
				<span>
					Step {current} of {total}
				</span>
			</div>
			<div className="flex gap-1.5">
				{Array.from({ length: total }).map((_, i) => (
					<div
						key={i}
						className={`h-1.5 flex-1 rounded-full transition-colors ${
							i < current ? "bg-primary" : "bg-muted"
						}`}
					/>
				))}
			</div>
		</div>
	);
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const areaSchema = z.object({
	name: z.string().min(1, "Name is required"),
	description: z.string().optional(),
});

const siteSchema = z.object({
	name: z.string().min(1, "Name is required"),
	slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens"),
});

const groupSchema = z.object({
	name: z.string().min(1, "Name is required"),
	gradeLevel: z.string().optional(),
	meetingDay: z.string().optional(),
	meetingRecurrence: z.string().optional(),
});

// ─── Props ────────────────────────────────────────────────────────────────────

interface OnboardingWizardProps {
	organizationId: string;
	organizationSlug: string;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function OnboardingWizard({
	organizationId,
	organizationSlug,
}: OnboardingWizardProps) {
	const router = useRouter();
	const createArea = useCreateArea();
	const createSite = useCreateSite();
	const createGroup = useCreateGroup();

	const [step, setStep] = useState<"area" | "site" | "group">("area");
	const [createdAreaId, setCreatedAreaId] = useState("");
	const [createdAreaName, setCreatedAreaName] = useState("");
	const [createdSiteId, setCreatedSiteId] = useState("");
	const [createdSiteName, setCreatedSiteName] = useState("");

	// ── Step 1: Area ──────────────────────────────────────────────────────────

	const areaForm = useForm<z.infer<typeof areaSchema>>({
		resolver: zodResolver(areaSchema),
		defaultValues: { name: "", description: "" },
	});

	const onAreaSubmit = areaForm.handleSubmit(async ({ name, description }) => {
		try {
			const area = await createArea.mutateAsync({
				organizationId,
				name,
				description: description || undefined,
			});
			setCreatedAreaId(area.id);
			setCreatedAreaName(area.name);
			setStep("site");
		} catch {
			toastError("Failed to create area. Please try again.");
		}
	});

	// ── Step 2: Site ──────────────────────────────────────────────────────────

	const siteForm = useForm<z.infer<typeof siteSchema>>({
		resolver: zodResolver(siteSchema),
		defaultValues: { name: "", slug: "" },
	});

	const siteNameValue = siteForm.watch("name");

	useEffect(() => {
		siteForm.setValue("slug", slugify(siteNameValue));
	}, [siteNameValue, siteForm]);

	const onSiteSubmit = siteForm.handleSubmit(async ({ name, slug }) => {
		try {
			const site = await createSite.mutateAsync({
				areaId: createdAreaId,
				name,
				slug,
			});
			setCreatedSiteId(site.id);
			setCreatedSiteName(site.name);
			setStep("group");
		} catch {
			toastError("Failed to create site. Please try again.");
		}
	});

	// ── Step 3: Group ─────────────────────────────────────────────────────────

	const groupForm = useForm<z.infer<typeof groupSchema>>({
		resolver: zodResolver(groupSchema),
		defaultValues: {
			name: "",
			gradeLevel: "",
			meetingDay: "",
			meetingRecurrence: "",
		},
	});

	const onGroupSubmit = groupForm.handleSubmit(
		async ({ name, gradeLevel, meetingDay, meetingRecurrence }) => {
			try {
				const group = await createGroup.mutateAsync({
					siteId: createdSiteId,
					name,
					gradeLevel: gradeLevel || undefined,
					meetingDay: meetingDay || undefined,
					meetingRecurrence: meetingRecurrence || undefined,
				});
				router.replace(`/app/${organizationSlug}/groups/${group.id}`);
			} catch {
				toastError("Failed to create group. Please try again.");
			}
		},
	);

	// ── Render ────────────────────────────────────────────────────────────────

	const stepNumber = step === "area" ? 1 : step === "site" ? 2 : 3;

	return (
		<Card>
			<CardHeader>
				<StepIndicator current={stepNumber} total={3} />
				{step === "area" && (
					<>
						<CardTitle>Create your first Area</CardTitle>
						<CardDescription>
							An Area is a region or campus — the top-level way to organize your
							locations. For example: "North Campus" or "Downtown."
						</CardDescription>
					</>
				)}
				{step === "site" && (
					<>
						<CardTitle>Add a Site to {createdAreaName}</CardTitle>
						<CardDescription>
							A Site is a specific location within an Area — like a building or
							address where people gather.
						</CardDescription>
					</>
				)}
				{step === "group" && (
					<>
						<CardTitle>Create a Group at {createdSiteName}</CardTitle>
						<CardDescription>
							A Group is a team, class, or cohort of people who meet together.
							You can add members and events after setup.
						</CardDescription>
					</>
				)}
			</CardHeader>

			<CardContent>
				{step === "area" && (
					<Form {...areaForm}>
						<form onSubmit={onAreaSubmit} className="space-y-4">
							<FormField
								control={areaForm.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Area Name</FormLabel>
										<FormControl>
											<Input placeholder="e.g. North Campus" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={areaForm.control}
								name="description"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Description (optional)</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Brief description of this area…"
												rows={2}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<Button
								type="submit"
								variant="primary"
								className="w-full"
								loading={areaForm.formState.isSubmitting}
							>
								Continue →
							</Button>
						</form>
					</Form>
				)}

				{step === "site" && (
					<Form {...siteForm}>
						<form onSubmit={onSiteSubmit} className="space-y-4">
							<FormField
								control={siteForm.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Site Name</FormLabel>
										<FormControl>
											<Input placeholder="e.g. Main Building" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={siteForm.control}
								name="slug"
								render={({ field }) => (
									<FormItem>
										<FormLabel>URL Slug</FormLabel>
										<FormControl>
											<Input
												placeholder="main-building"
												{...field}
												className="font-mono text-sm"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<Button
								type="submit"
								variant="primary"
								className="w-full"
								loading={siteForm.formState.isSubmitting}
							>
								Continue →
							</Button>
						</form>
					</Form>
				)}

				{step === "group" && (
					<Form {...groupForm}>
						<form onSubmit={onGroupSubmit} className="space-y-4">
							<FormField
								control={groupForm.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Group Name</FormLabel>
										<FormControl>
											<Input placeholder="e.g. Sunday Elementary" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={groupForm.control}
								name="gradeLevel"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Grade Level (optional)</FormLabel>
										<FormControl>
											<GradePicker
												value={field.value ?? ""}
												onChange={field.onChange}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={groupForm.control}
								name="meetingDay"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Meeting Day (optional)</FormLabel>
										<FormControl>
											<DayPicker
												value={field.value ?? ""}
												onChange={field.onChange}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={groupForm.control}
								name="meetingRecurrence"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Recurrence (optional)</FormLabel>
										<FormControl>
											<RecurrenceSelect
												value={field.value ?? ""}
												onChange={field.onChange}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<Button
								type="submit"
								variant="primary"
								className="w-full"
								loading={groupForm.formState.isSubmitting}
							>
								Finish →
							</Button>
						</form>
					</Form>
				)}
			</CardContent>
		</Card>
	);
}

"use client";

import { Button } from "@repo/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { PlusIcon, TrashIcon } from "lucide-react";
import { useState } from "react";
import type { PublicFormField } from "./FormFieldRenderer";
import { FormFieldRenderer } from "./FormFieldRenderer";
import { PublicFormSubmit } from "./PublicFormSubmit";

interface Site {
	id: string;
	name: string;
}

interface StudentEntry {
	firstName: string;
	lastName: string;
	fields: Record<string, string>;
}

const emptyStudent = (): StudentEntry => ({
	firstName: "",
	lastName: "",
	fields: {},
});

interface StudentFormLayoutProps {
	orgSlug: string;
	formSlug: string;
	formName: string;
	formDescription?: string | null;
	fields: PublicFormField[];
	sites: Site[];
	preselectedSiteId?: string;
}

export function StudentFormLayout({
	orgSlug,
	formSlug,
	formName,
	formDescription,
	fields,
	sites,
	preselectedSiteId,
}: StudentFormLayoutProps) {
	const [parentValues, setParentValues] = useState<Record<string, string>>({
		parentFirstName: "",
		parentLastName: "",
		parentEmail: "",
		parentPhone: "",
	});
	const [students, setStudents] = useState<StudentEntry[]>([emptyStudent()]);
	const [selectedSiteId, setSelectedSiteId] = useState(
		preselectedSiteId ?? "",
	);
	const [submitted, setSubmitted] = useState(false);

	const hasSiteSelector = fields.some((f) => f.type === "SITE_SELECTOR");
	const visibleFields = fields.filter((f) => f.type !== "SITE_SELECTOR");

	// Route fields to the correct section by targetPersonType.
	// PARENT (or null/global) fields go in the parent card; STUDENT fields go in each student card.
	const parentSectionFields = visibleFields.filter(
		(f) => f.targetPersonType === "PARENT" || !f.targetPersonType,
	);
	const studentSectionFields = visibleFields.filter(
		(f) => f.targetPersonType === "STUDENT",
	);

	const updateParent = (key: string, value: string) => {
		setParentValues((prev) => ({ ...prev, [key]: value }));
	};

	const updateStudent = (
		index: number,
		key: keyof StudentEntry,
		value: string,
	) => {
		setStudents((prev) =>
			prev.map((s, i) => (i === index ? { ...s, [key]: value } : s)),
		);
	};

	const updateStudentField = (
		index: number,
		fieldId: string,
		value: string,
	) => {
		setStudents((prev) =>
			prev.map((s, i) =>
				i === index
					? { ...s, fields: { ...s.fields, [fieldId]: value } }
					: s,
			),
		);
	};

	const addStudent = () => {
		setStudents((prev) => [...prev, emptyStudent()]);
	};

	const removeStudent = (index: number) => {
		setStudents((prev) => prev.filter((_, i) => i !== index));
	};

	const getStudentsPayload = (): Record<string, string>[] => {
		return students.map((s) => ({
			firstName: s.firstName,
			lastName: s.lastName,
			...s.fields,
		}));
	};

	if (submitted) {
		return (
			<div className="flex flex-col items-center gap-4 py-16 text-center">
				<div className="rounded-full bg-green-100 p-4">
					<svg
						className="size-10 text-green-600"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M5 13l4 4L19 7"
						/>
					</svg>
				</div>
				<div>
					<p className="text-2xl font-bold">Submitted!</p>
					<p className="mt-2 text-muted-foreground max-w-sm">
						Thank you for your application. We will be in touch
						soon.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Site selector */}
			{hasSiteSelector && !preselectedSiteId && sites.length > 0 && (
				<Card>
					<CardContent className="pt-6">
						<div className="space-y-1.5">
							<label
								className="text-sm font-medium"
								htmlFor="site-selector"
							>
								Site <span className="text-destructive">*</span>
							</label>
							<select
								id="site-selector"
								value={selectedSiteId}
								onChange={(e) =>
									setSelectedSiteId(e.target.value)
								}
								className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
							>
								<option value="">Select a site…</option>
								{sites.map((site) => (
									<option key={site.id} value={site.id}>
										{site.name}
									</option>
								))}
							</select>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Parent Information */}
			<Card>
				<CardHeader>
					<CardTitle>Parent / Guardian Information</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<Label htmlFor="parentFirstName">
								First Name{" "}
								<span className="text-destructive">*</span>
							</Label>
							<Input
								id="parentFirstName"
								value={parentValues.parentFirstName}
								onChange={(e) =>
									updateParent(
										"parentFirstName",
										e.target.value,
									)
								}
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="parentLastName">
								Last Name{" "}
								<span className="text-destructive">*</span>
							</Label>
							<Input
								id="parentLastName"
								value={parentValues.parentLastName}
								onChange={(e) =>
									updateParent(
										"parentLastName",
										e.target.value,
									)
								}
							/>
						</div>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<Label htmlFor="parentEmail">Email</Label>
							<Input
								id="parentEmail"
								type="email"
								value={parentValues.parentEmail}
								onChange={(e) =>
									updateParent("parentEmail", e.target.value)
								}
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="parentPhone">Phone</Label>
							<Input
								id="parentPhone"
								type="tel"
								value={parentValues.parentPhone}
								onChange={(e) =>
									updateParent(
										"parentPhone",
										e.target.value.replace(
											/[^\d\s\-()+.]/g,
											"",
										),
									)
								}
							/>
						</div>
					</div>

					{/* Parent section fields */}
					{parentSectionFields.map((field) => (
						<FormFieldRenderer
							key={field.id}
							field={field}
							value={parentValues[field.id] ?? ""}
							onChange={(val) => updateParent(field.id, val)}
						/>
					))}
				</CardContent>
			</Card>

			{/* Student sections */}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h2 className="text-xl font-bold">Student(s)</h2>
					<Button type="button" size="sm" onClick={addStudent}>
						<PlusIcon className="mr-2 size-4" />
						Add Student
					</Button>
				</div>

				{students.map((student, index) => (
					<Card key={index}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
							<CardTitle className="text-base">
								Student {index + 1}
								{student.firstName && ` — ${student.firstName}`}
							</CardTitle>
							{students.length > 1 && (
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="size-8 text-muted-foreground hover:text-destructive"
									onClick={() => removeStudent(index)}
								>
									<TrashIcon className="size-4" />
								</Button>
							)}
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-1.5">
									<Label
										htmlFor={`student-${index}-firstName`}
									>
										First Name{" "}
										<span className="text-destructive">
											*
										</span>
									</Label>
									<Input
										id={`student-${index}-firstName`}
										value={student.firstName}
										onChange={(e) =>
											updateStudent(
												index,
												"firstName",
												e.target.value,
											)
										}
									/>
								</div>
								<div className="space-y-1.5">
									<Label
										htmlFor={`student-${index}-lastName`}
									>
										Last Name{" "}
										<span className="text-destructive">
											*
										</span>
									</Label>
									<Input
										id={`student-${index}-lastName`}
										value={student.lastName}
										onChange={(e) =>
											updateStudent(
												index,
												"lastName",
												e.target.value,
											)
										}
									/>
								</div>
							</div>

							{/* Student section fields */}
							{studentSectionFields.map((field) => (
								<FormFieldRenderer
									key={field.id}
									field={field}
									value={student.fields[field.id] ?? ""}
									onChange={(val) =>
										updateStudentField(index, field.id, val)
									}
								/>
							))}
						</CardContent>
					</Card>
				))}
			</div>

			<PublicFormSubmit
				orgSlug={orgSlug}
				formSlug={formSlug}
				parentFields={parentValues}
				students={getStudentsPayload()}
				siteId={selectedSiteId || undefined}
				onSuccess={() => setSubmitted(true)}
			/>
		</div>
	);
}

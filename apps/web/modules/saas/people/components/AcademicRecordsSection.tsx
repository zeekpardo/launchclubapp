"use client";

import { isOrganizationAdmin } from "@repo/auth/lib/helper";
import { Button } from "@repo/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { Textarea } from "@repo/ui/components/textarea";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { useSession } from "@saas/auth/hooks/use-session";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { orpcClient } from "@shared/lib/orpc-client";
import {
	ChevronDownIcon,
	ImageIcon,
	PencilIcon,
	PlusIcon,
	Trash2Icon,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
	useAcademicRecords,
	useAcademicYears,
	useDeleteAcademicRecord,
	useUpsertAcademicRecord,
} from "../hooks/use-academic-records";
import { type GradeInputMode, LETTER_OPTIONS, toGpa } from "../lib/gpa";

const GPA_TERM_LABELS: Record<string, string> = {
	Q1: "Q1",
	Q2: "Q2",
	Q3: "Q3",
	Q4: "Q4",
	SEMESTER_1: "Semester 1",
	SEMESTER_2: "Semester 2",
	TRIMESTER_1: "Trimester 1",
	TRIMESTER_2: "Trimester 2",
	TRIMESTER_3: "Trimester 3",
	ANNUAL: "Annual",
};

interface AcademicRecordFormValues {
	schoolYear: string;
	term: string;
	termGpa: string;
	cumulativeGpa: string;
	gradeLevel: string;
	notes: string;
	photoUrl: string;
}

interface AcademicRecordsSectionProps {
	personId: string;
	isStudent: boolean;
}

interface AcademicRecord {
	id: string;
	personId: string;
	schoolYear: string;
	term: string;
	termGpa: number | null;
	cumulativeGpa: number | null;
	gradeLevel: string | null;
	notes: string | null;
	photoUrl: string | null;
}

export function AcademicRecordsSection({
	personId,
	isStudent,
}: AcademicRecordsSectionProps) {
	const { user } = useSession();
	const { activeOrganization } = useActiveOrganization();
	const { data: records = [] } = useAcademicRecords(personId);
	const { data: academicYears = [] } = useAcademicYears(
		activeOrganization?.id ?? "",
	);
	const upsertAcademicRecord = useUpsertAcademicRecord();
	const deleteAcademicRecord = useDeleteAcademicRecord();

	const [collapsed, setCollapsed] = useState(true);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingRecord, setEditingRecord] = useState<AcademicRecord | null>(
		null,
	);
	const [gpaMode, setGpaMode] = useState<GradeInputMode>("gpa");
	const [gpaRaw, setGpaRaw] = useState("");
	const [photoUploading, setPhotoUploading] = useState(false);

	const isAdmin = isOrganizationAdmin(activeOrganization, user);

	const { register, handleSubmit, reset, setValue, watch } =
		useForm<AcademicRecordFormValues>({
			defaultValues: {
				schoolYear: "",
				term: "",
				termGpa: "",
				cumulativeGpa: "",
				gradeLevel: "",
				notes: "",
				photoUrl: "",
			},
		});

	const photoUrl = watch("photoUrl");

	// In percent/letter mode, convert the raw grade to a 4.0 GPA and store it.
	function handleGpaRawChange(raw: string) {
		setGpaRaw(raw);
		const computed = toGpa(gpaMode, raw);
		setValue("termGpa", computed != null ? String(computed) : "");
	}

	async function handlePhotoSelect(file: File) {
		setPhotoUploading(true);
		try {
			const contentType =
				file.type === "image/png" ? "image/png" : "image/jpeg";
			const { signedUploadUrl, path } =
				await orpcClient.academicRecords.photoUploadUrl({
					personId,
					contentType,
				});
			const res = await fetch(signedUploadUrl, {
				method: "PUT",
				headers: { "Content-Type": contentType },
				body: file,
			});
			if (!res.ok) throw new Error("upload failed");
			setValue("photoUrl", path);
		} catch {
			toastError("Photo upload failed. Please try again.");
		} finally {
			setPhotoUploading(false);
		}
	}

	const termValue = watch("term");

	if (!isStudent) return null;

	function openAdd() {
		setEditingRecord(null);
		setGpaMode("gpa");
		setGpaRaw("");
		reset({
			schoolYear: "",
			term: "",
			termGpa: "",
			cumulativeGpa: "",
			gradeLevel: "",
			notes: "",
			photoUrl: "",
		});
		setCollapsed(false);
		setDialogOpen(true);
	}

	function openEdit(record: AcademicRecord) {
		setEditingRecord(record);
		setGpaMode("gpa");
		setGpaRaw("");
		reset({
			schoolYear: record.schoolYear,
			term: record.term,
			termGpa: record.termGpa != null ? String(record.termGpa) : "",
			cumulativeGpa:
				record.cumulativeGpa != null
					? String(record.cumulativeGpa)
					: "",
			gradeLevel: record.gradeLevel ?? "",
			notes: record.notes ?? "",
			photoUrl: record.photoUrl ?? "",
		});
		setDialogOpen(true);
	}

	async function onSubmit(values: AcademicRecordFormValues) {
		try {
			await upsertAcademicRecord.mutateAsync({
				personId,
				schoolYear: values.schoolYear,
				term: values.term as
					| "Q1"
					| "Q2"
					| "Q3"
					| "Q4"
					| "SEMESTER_1"
					| "SEMESTER_2"
					| "TRIMESTER_1"
					| "TRIMESTER_2"
					| "TRIMESTER_3"
					| "ANNUAL",
				termGpa:
					values.termGpa !== "" ? Number(values.termGpa) : undefined,
				cumulativeGpa:
					values.cumulativeGpa !== ""
						? Number(values.cumulativeGpa)
						: undefined,
				gradeLevel:
					values.gradeLevel !== "" ? values.gradeLevel : undefined,
				notes: values.notes !== "" ? values.notes : undefined,
				photoUrl: values.photoUrl !== "" ? values.photoUrl : null,
			});
			toastSuccess("Academic record saved");
			setDialogOpen(false);
		} catch {
			toastError("Failed to save academic record");
		}
	}

	async function handleDelete(record: AcademicRecord) {
		try {
			await deleteAcademicRecord.mutateAsync({
				id: record.id,
				personId,
			});
			toastSuccess("Academic record deleted");
		} catch {
			toastError("Failed to delete academic record");
		}
	}

	const latestCumulative = (records as AcademicRecord[]).find(
		(r) => r.cumulativeGpa != null,
	)?.cumulativeGpa;

	return (
		<>
			<Card>
				<CardHeader className="pb-3">
					<div className="flex items-center justify-between">
						<CardTitle className="text-base">
							Academic Records
						</CardTitle>
						<div className="flex items-center gap-1">
							{isAdmin && (
								<Button
									size="sm"
									variant="ghost"
									onClick={openAdd}
									className="h-7 gap-1 text-xs"
								>
									<PlusIcon className="size-3" />
									Add
								</Button>
							)}
							<Button
								size="icon"
								variant="ghost"
								className="size-7"
								onClick={() => setCollapsed((c) => !c)}
							>
								<ChevronDownIcon
									className={`size-4 transition-transform ${collapsed ? "" : "rotate-180"}`}
								/>
							</Button>
						</div>
					</div>
				</CardHeader>
				{!collapsed && (
					<CardContent>
						{latestCumulative != null && (
							<p className="text-sm text-muted-foreground mb-3">
								Latest:{" "}
								<span className="font-medium text-foreground">
									{latestCumulative.toFixed(2)}
								</span>{" "}
								cumulative
							</p>
						)}

						{(records as AcademicRecord[]).length === 0 ? (
							<p className="text-sm text-muted-foreground">
								No academic records yet.
							</p>
						) : (
							<div className="space-y-2">
								<div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-2 text-xs font-medium text-muted-foreground border-b pb-1">
									<span>School Year</span>
									<span>Term</span>
									<span>GPA</span>
									<span>Cum</span>
									<span>Grade</span>
								</div>
								{(records as AcademicRecord[]).map((record) => (
									<div
										key={record.id}
										className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-2 items-center text-sm py-1"
									>
										<span className="text-xs">
											{record.schoolYear}
										</span>
										<span className="text-xs">
											{GPA_TERM_LABELS[record.term] ??
												record.term}
										</span>
										<span className="text-xs">
											{record.termGpa != null
												? record.termGpa.toFixed(2)
												: "—"}
										</span>
										<span className="text-xs">
											{record.cumulativeGpa != null
												? record.cumulativeGpa.toFixed(
														2,
													)
												: "—"}
										</span>
										<span className="text-xs">
											{record.gradeLevel ?? "—"}
										</span>
										{record.photoUrl && (
											<a
												href={`/image-proxy/customFields/${record.photoUrl}`}
												target="_blank"
												rel="noopener noreferrer"
												className="col-span-5 pt-1"
											>
												{/* biome-ignore lint/performance/noImgElement: signed image-proxy URL */}
												<img
													src={`/image-proxy/customFields/${record.photoUrl}`}
													alt="Academic record"
													className="h-12 w-12 rounded border object-cover"
												/>
											</a>
										)}
										{isAdmin && (
											<div className="col-span-5 flex gap-1 pt-0.5">
												<Button
													size="sm"
													variant="ghost"
													className="h-6 px-2 text-xs"
													onClick={() =>
														openEdit(record)
													}
												>
													<PencilIcon className="size-3 mr-1" />
													Edit
												</Button>
												<Button
													size="sm"
													variant="ghost"
													className="h-6 px-2 text-xs text-destructive hover:text-destructive"
													onClick={() =>
														handleDelete(record)
													}
												>
													<Trash2Icon className="size-3 mr-1" />
													Delete
												</Button>
											</div>
										)}
									</div>
								))}
							</div>
						)}
					</CardContent>
				)}
			</Card>

			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{editingRecord
								? "Edit Academic Record"
								: "Add Academic Record"}
						</DialogTitle>
					</DialogHeader>
					<form
						onSubmit={handleSubmit(onSubmit)}
						className="space-y-4"
					>
						<div className="space-y-2">
							<Label htmlFor="schoolYear">School Year</Label>
							{academicYears.length === 0 ? (
								<p className="text-sm text-muted-foreground">
									No academic years configured. Ask an admin
									to add one in Settings.
								</p>
							) : (
								<Select
									value={watch("schoolYear")}
									onValueChange={(val) =>
										setValue("schoolYear", val)
									}
								>
									<SelectTrigger id="schoolYear">
										<SelectValue placeholder="Select year" />
									</SelectTrigger>
									<SelectContent>
										{academicYears.map((year) => (
											<SelectItem
												key={year.id}
												value={year.label}
											>
												{year.label}
												{year.isActive
													? " (Active)"
													: ""}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="term">Term</Label>
							<Select
								value={termValue}
								onValueChange={(val) => setValue("term", val)}
							>
								<SelectTrigger id="term">
									<SelectValue placeholder="Select term" />
								</SelectTrigger>
								<SelectContent>
									{Object.entries(GPA_TERM_LABELS).map(
										([key, label]) => (
											<SelectItem key={key} value={key}>
												{label}
											</SelectItem>
										),
									)}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between gap-2">
								<Label htmlFor="termGpa">Term GPA</Label>
								<Select
									value={gpaMode}
									onValueChange={(v) => {
										setGpaMode(v as GradeInputMode);
										setGpaRaw("");
										setValue("termGpa", "");
									}}
								>
									<SelectTrigger className="h-7 w-[140px] text-xs">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="gpa">
											Enter GPA
										</SelectItem>
										<SelectItem value="percent">
											Enter percentage
										</SelectItem>
										<SelectItem value="letter">
											Enter letter grade
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
							{gpaMode === "gpa" ? (
								<Input
									id="termGpa"
									type="number"
									placeholder="3.75"
									min={0}
									max={4.0}
									step={0.01}
									{...register("termGpa")}
								/>
							) : gpaMode === "percent" ? (
								<Input
									id="termGpa"
									type="number"
									placeholder="92"
									min={0}
									max={100}
									value={gpaRaw}
									onChange={(e) =>
										handleGpaRawChange(e.target.value)
									}
								/>
							) : (
								<Select
									value={gpaRaw}
									onValueChange={handleGpaRawChange}
								>
									<SelectTrigger id="termGpa">
										<SelectValue placeholder="Select letter grade" />
									</SelectTrigger>
									<SelectContent>
										{LETTER_OPTIONS.map((l) => (
											<SelectItem key={l} value={l}>
												{l}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
							{gpaMode !== "gpa" && (
								<p className="text-xs text-muted-foreground">
									{watch("termGpa")
										? `Converts to ${watch("termGpa")} GPA`
										: "Enter a value to convert to a 4.0 GPA"}
								</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="cumulativeGpa">
								Cumulative GPA
							</Label>
							<Input
								id="cumulativeGpa"
								type="number"
								placeholder="3.82"
								min={0}
								max={4.0}
								step={0.01}
								{...register("cumulativeGpa")}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="gradeLevel">Grade Level</Label>
							<Input
								id="gradeLevel"
								placeholder="10th"
								{...register("gradeLevel")}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="notes">Notes</Label>
							<Textarea
								id="notes"
								placeholder="Optional notes..."
								{...register("notes")}
							/>
						</div>

						<div className="space-y-2">
							<Label>Photo (e.g. report card)</Label>
							{photoUrl ? (
								<div className="flex items-center gap-3">
									{/* biome-ignore lint/performance/noImgElement: signed image-proxy URL */}
									<img
										src={`/image-proxy/customFields/${photoUrl}`}
										alt="Academic record"
										className="h-16 w-16 rounded-md border object-cover"
									/>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="text-destructive hover:text-destructive"
										onClick={() => setValue("photoUrl", "")}
									>
										Remove
									</Button>
								</div>
							) : (
								<label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-3 py-2 text-sm hover:bg-muted">
									<ImageIcon className="size-4" />
									{photoUploading
										? "Uploading…"
										: "Upload photo"}
									<input
										type="file"
										accept="image/jpeg,image/png"
										className="sr-only"
										disabled={photoUploading}
										onChange={(e) => {
											const file = e.target.files?.[0];
											if (file) handlePhotoSelect(file);
											e.target.value = "";
										}}
									/>
								</label>
							)}
						</div>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setDialogOpen(false)}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={upsertAcademicRecord.isPending}
							>
								{upsertAcademicRecord.isPending
									? "Saving..."
									: "Save"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</>
	);
}

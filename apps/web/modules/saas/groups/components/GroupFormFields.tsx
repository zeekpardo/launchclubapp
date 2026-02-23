"use client";

import { cn } from "@repo/ui";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { longDayLabel, narrowDayLabel } from "@saas/groups/lib/day-utils";
import { useLocale } from "next-intl";

// ─── Days of the week ─────────────────────────────────────────────────────────

const WEEK_DAYS = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
];

interface DayPickerProps {
	value: string;
	onChange: (value: string) => void;
}

/** Multi-select day-of-week pill buttons. Stores as "Monday, Wednesday". */
export function DayPicker({ value, onChange }: DayPickerProps) {
	const locale = useLocale();
	const selected = value
		? value.split(",").map((d) => d.trim())
		: [];

	const toggle = (day: string) => {
		const next = selected.includes(day)
			? selected.filter((d) => d !== day)
			: [...selected, day];
		// Preserve canonical week order
		const ordered = WEEK_DAYS.filter((d) => next.includes(d));
		onChange(ordered.join(", "));
	};

	return (
		<div className="flex gap-1.5">
			{WEEK_DAYS.map((day) => (
				<button
					key={day}
					type="button"
					onClick={() => toggle(day)}
					title={longDayLabel(day, locale)}
					className={cn(
						"flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors",
						selected.includes(day)
							? "bg-primary text-primary-foreground"
							: "border bg-background text-muted-foreground hover:bg-muted",
					)}
				>
					{narrowDayLabel(day, locale)}
				</button>
			))}
		</div>
	);
}

// ─── Grade level ──────────────────────────────────────────────────────────────

const GRADES = [
	"K",
	"1",
	"2",
	"3",
	"4",
	"5",
	"6",
	"7",
	"8",
	"9",
	"10",
	"11",
	"12",
];

interface GradePickerProps {
	value: string;
	onChange: (value: string) => void;
}

/** Multi-select grade picker for K–12. Stores as "4,5,6". */
export function GradePicker({ value, onChange }: GradePickerProps) {
	const selected = value
		? value.split(",").map((g) => g.trim())
		: [];

	const toggle = (grade: string) => {
		const next = selected.includes(grade)
			? selected.filter((g) => g !== grade)
			: [...selected, grade];
		const ordered = GRADES.filter((g) => next.includes(g));
		onChange(ordered.join(","));
	};

	return (
		<div className="flex flex-wrap gap-1.5">
			{GRADES.map((grade) => (
				<button
					key={grade}
					type="button"
					onClick={() => toggle(grade)}
					className={cn(
						"flex h-8 min-w-[2rem] items-center justify-center rounded px-2 text-xs font-semibold transition-colors",
						selected.includes(grade)
							? "bg-primary text-primary-foreground"
							: "border bg-background text-muted-foreground hover:bg-muted",
					)}
				>
					{grade === "K" ? "K" : grade}
				</button>
			))}
		</div>
	);
}

/** Format a stored grade string ("4,5,6") for display ("4–6"). */
export function formatGradeDisplay(gradeLevel: string | null | undefined): string {
	if (!gradeLevel) return "All Ages";
	const grades = gradeLevel
		.split(",")
		.map((g) => g.trim())
		.filter(Boolean);
	if (grades.length === 0) return "All Ages";
	if (grades.length === 1) return grades[0];
	return `${grades[0]}–${grades[grades.length - 1]}`;
}

// ─── Meeting recurrence ───────────────────────────────────────────────────────

export const RECURRENCE_OPTIONS = [
	{ value: "weekly", label: "Weekly" },
	{ value: "biweekly", label: "Every 2 weeks" },
	{ value: "monthly", label: "Monthly" },
	{ value: "bimonthly", label: "Every 2 months" },
	{ value: "quarterly", label: "Quarterly" },
	{ value: "as-needed", label: "As needed" },
] as const;

interface RecurrenceSelectProps {
	value: string;
	onChange: (value: string) => void;
}

export function RecurrenceSelect({ value, onChange }: RecurrenceSelectProps) {
	return (
		<Select value={value || ""} onValueChange={onChange}>
			<SelectTrigger>
				<SelectValue placeholder="Select recurrence…" />
			</SelectTrigger>
			<SelectContent>
				{RECURRENCE_OPTIONS.map(({ value: v, label }) => (
					<SelectItem key={v} value={v}>
						{label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

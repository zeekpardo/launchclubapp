/**
 * Grade → 4.0-GPA conversion using the program's equivalency table.
 *
 * | Percentage | Letter | 4.0 GPA |
 * | 97–100     | A+     | 4.0     |
 * | 93–96      | A      | 4.0     |
 * | 90–92      | A−     | 3.5     |
 * | 87–89      | B+     | 3.25    |
 * | 83–86      | B      | 3.0     |
 * | 80–82      | B−     | 2.5     |
 * | 77–79      | C+     | 2.25    |
 * | 75–76      | C      | 2.0     |
 * | below 75   | F      | 1.0     |
 */

export const LETTER_OPTIONS = [
	"A+",
	"A",
	"A-",
	"B+",
	"B",
	"B-",
	"C+",
	"C",
	"F",
] as const;

export type LetterGrade = (typeof LETTER_OPTIONS)[number];

const LETTER_TO_GPA: Record<string, number> = {
	"A+": 4.0,
	A: 4.0,
	"A-": 3.5,
	"B+": 3.25,
	B: 3.0,
	"B-": 2.5,
	"C+": 2.25,
	C: 2.0,
	F: 1.0,
};

/** Normalize "a-", "A−" (unicode minus) etc. to a canonical letter key. */
function normalizeLetter(input: string): string {
	return input.trim().toUpperCase().replace(/−/g, "-");
}

export function letterToGpa(letter: string): number | null {
	const gpa = LETTER_TO_GPA[normalizeLetter(letter)];
	return gpa ?? null;
}

export function percentToGpa(percent: number): number | null {
	if (Number.isNaN(percent) || percent < 0 || percent > 100) return null;
	if (percent >= 93) return 4.0;
	if (percent >= 90) return 3.5;
	if (percent >= 87) return 3.25;
	if (percent >= 83) return 3.0;
	if (percent >= 80) return 2.5;
	if (percent >= 77) return 2.25;
	if (percent >= 75) return 2.0;
	return 1.0;
}

export type GradeInputMode = "gpa" | "percent" | "letter";

/** Convert a raw value in the given mode to a 4.0-scale GPA, or null. */
export function toGpa(mode: GradeInputMode, raw: string): number | null {
	const value = raw.trim();
	if (!value) return null;
	if (mode === "letter") return letterToGpa(value);
	const num = Number(value);
	if (Number.isNaN(num)) return null;
	if (mode === "percent") return percentToGpa(num);
	// mode === "gpa"
	if (num < 0 || num > 4) return null;
	return num;
}

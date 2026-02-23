"use client";

import { updateLocale } from "@i18n/lib/update-locale";
import { useLocale } from "next-intl";
import { useTransition } from "react";

const LANGUAGES = [
	{ code: "en", label: "English" },
	{ code: "es", label: "Español" },
] as const;

export function LanguageSwitcher() {
	const locale = useLocale();
	const [isPending, startTransition] = useTransition();

	const handleChange = (code: string) => {
		startTransition(() => {
			updateLocale(code as "en" | "es");
		});
	};

	return (
		<div className="flex justify-end">
			<div className="inline-flex rounded-md border bg-muted p-0.5 gap-0.5">
				{LANGUAGES.map(({ code, label }) => (
					<button
						key={code}
						type="button"
						disabled={isPending}
						onClick={() => handleChange(code)}
						className={`px-3 py-1 text-sm rounded transition-colors ${
							locale === code
								? "bg-background text-foreground shadow-sm font-medium"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						{label}
					</button>
				))}
			</div>
		</div>
	);
}

"use client";

import { cn } from "@repo/ui";
import { Input } from "@repo/ui/components/input";
import { SearchIcon, XIcon } from "lucide-react";

interface SearchInputProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	className?: string;
}

export function SearchInput({
	value,
	onChange,
	placeholder = "Search…",
	className,
}: SearchInputProps) {
	return (
		<div className={cn("relative", className)}>
			<SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				className="pl-9 pr-9"
				placeholder={placeholder}
				value={value}
				onChange={(e) => onChange(e.target.value)}
			/>
			{value && (
				<button
					type="button"
					onClick={() => onChange("")}
					className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
					aria-label="Clear search"
				>
					<XIcon className="h-4 w-4" />
				</button>
			)}
		</div>
	);
}

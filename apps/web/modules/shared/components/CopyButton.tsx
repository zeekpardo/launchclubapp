"use client";

import { Button } from "@repo/ui/components/button";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";

export function CopyButton({ url, title = "Copy link" }: { url: string; title?: string }) {
	const [copied, setCopied] = useState(false);
	const handleCopy = async () => {
		await navigator.clipboard.writeText(url);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};
	return (
		<Button variant="outline" size="icon" onClick={handleCopy} className="shrink-0" title={title}>
			{copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
		</Button>
	);
}

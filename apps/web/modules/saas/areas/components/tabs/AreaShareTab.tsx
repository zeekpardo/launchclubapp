"use client";

import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { toastSuccess } from "@repo/ui/components/toast";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";

interface Site {
	id: string;
	name: string;
	slug: string;
}

interface AreaShareTabProps {
	sites: Site[];
}

function CopyButton({ url }: { url: string }) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		await navigator.clipboard.writeText(url);
		setCopied(true);
		toastSuccess("Link copied to clipboard");
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<Button variant="outline" size="icon" onClick={handleCopy} className="shrink-0">
			{copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
		</Button>
	);
}

export function AreaShareTab({ sites }: AreaShareTabProps) {
	const origin = typeof window !== "undefined" ? window.location.origin : "";

	if (sites.length === 0) {
		return (
			<p className="text-sm text-muted-foreground">
				No sites yet. Add a site to get a shareable application link.
			</p>
		);
	}

	return (
		<div className="space-y-6">
			<div>
				<h3 className="font-semibold">Application Form Links</h3>
				<p className="mt-1 text-sm text-muted-foreground">
					Share these links with families to apply.
				</p>
			</div>

			<div className="space-y-4">
				{sites.map((site) => {
					const url = `${origin}/apply/${site.slug}`;
					return (
						<div key={site.id} className="space-y-1.5">
							<p className="text-sm font-medium">{site.name}</p>
							<div className="flex items-center gap-2">
								<Input readOnly value={url} className="font-mono text-xs" />
								<CopyButton url={url} />
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}

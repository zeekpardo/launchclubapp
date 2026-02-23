"use client";

import { authClient } from "@repo/auth/client";
import { useSession } from "@saas/auth/hooks/use-session";
import { ShieldAlertIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ImpersonationBanner() {
	const { session, user } = useSession();
	const router = useRouter();
	const [stopping, setStopping] = useState(false);

	if (!session?.impersonatedBy) {
		return null;
	}

	const handleStop = async () => {
		setStopping(true);
		await authClient.admin.stopImpersonating();
		router.push("/app");
		router.refresh();
	};

	return (
		<div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-4 bg-amber-500 px-4 py-2 text-amber-950 shadow-lg">
			<div className="flex items-center gap-2 text-sm font-medium">
				<ShieldAlertIcon className="size-4 shrink-0" />
				<span>
					Impersonating{" "}
					<strong>{user?.name ?? user?.email ?? "user"}</strong>
				</span>
			</div>
			<button
				type="button"
				onClick={handleStop}
				disabled={stopping}
				className="rounded-md bg-amber-950/15 px-3 py-1 text-sm font-semibold hover:bg-amber-950/25 disabled:opacity-60 transition-colors"
			>
				{stopping ? "Stopping…" : "Stop Impersonating"}
			</button>
		</div>
	);
}

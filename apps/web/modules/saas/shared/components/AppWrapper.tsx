"use client";

import { cn } from "@repo/ui";
import { NavBar } from "@saas/shared/components/NavBar";
import type { PropsWithChildren } from "react";
import { config } from "@/config";
import { SidebarProvider, useSidebar } from "../lib/sidebar-context";

function AppContent({ children }: PropsWithChildren) {
	const { isCollapsed } = useSidebar();
	const { useSidebarLayout } = config.saas;

	return (
		<div className="bg-background h-screen flex flex-col">
			<NavBar />
			<div
				className={cn("flex flex-1 min-h-0", {
					"md:ml-[280px]": useSidebarLayout && !isCollapsed,
					"md:ml-[80px]": useSidebarLayout && isCollapsed,
				})}
			>
				<main
					className={cn(
						"flex flex-col flex-1 min-h-0 overflow-y-auto py-6 bg-card px-4 md:p-8 border-t md:border-t-0 md:border-l",
					)}
				>
					<div className="w-full flex flex-col flex-1 min-h-0 px-0">
						{children}
					</div>
				</main>
			</div>
		</div>
	);
}

export function AppWrapper({ children }: PropsWithChildren) {
	return (
		<SidebarProvider>
			<AppContent>{children}</AppContent>
		</SidebarProvider>
	);
}

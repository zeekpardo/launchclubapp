"use client";

import { cn } from "@repo/ui";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

export function SettingsMenu({
	menuItems,
	className,
}: {
	menuItems: {
		title: string;
		avatar: ReactNode;
		items: {
			title: string;
			href: string;
			icon?: ReactNode;
		}[];
	}[];
	className?: string;
}) {
	const pathname = usePathname();
	const router = useRouter();

	const isActiveMenuItem = (href: string) => pathname.includes(href);

	// Flatten all items from all menu sections into a single array
	const allItems = menuItems.flatMap((item) => item.items);

	const activeItem = allItems.find((item) => isActiveMenuItem(item.href));

	return (
		<div className={cn(className)}>
			{/* Mobile: dropdown */}
			<div className="md:hidden">
				<Select
					value={activeItem?.href}
					onValueChange={(href) => router.push(href)}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="Navigate to..." />
					</SelectTrigger>
					<SelectContent>
						{allItems.map((item, index) => (
							<SelectItem key={index} value={item.href}>
								{item.title}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Desktop: tabs */}
			<div className="relative hidden border-b md:block">
				<nav className="flex gap-0">
					{allItems.map((item, index) => {
						const isActive = isActiveMenuItem(item.href);
						return (
							<Link
								key={index}
								href={item.href}
								className={cn(
									"relative border-b-2 px-4 py-2 text-sm transition-colors",
									isActive
										? "border-primary font-semibold text-primary"
										: "border-transparent font-medium text-foreground/60",
								)}
							>
								{item.title}
							</Link>
						);
					})}
				</nav>
			</div>
		</div>
	);
}

"use client";

import { Button, cn, Logo } from "@repo/ui";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@repo/ui/components/sheet";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@repo/ui/components/tooltip";
import { useSession } from "@saas/auth/hooks/use-session";
import { usePendingApplicationCount } from "@saas/applications/hooks/use-applications";
import { usePendingPurchaseRequestCount } from "@saas/groups/hooks/use-purchase-requests";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { OrganizationLogo } from "@saas/organizations/components/OrganizationLogo";
import { UserMenu } from "@saas/shared/components/UserMenu";
import {
	CalendarIcon,
	ClipboardListIcon,
	DollarSignIcon,
	HomeIcon,
	MenuIcon,
	PanelLeftCloseIcon,
	PanelLeftOpenIcon,
	SettingsIcon,
	UserIcon,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { config as webConfig } from "@/config";
import { useSidebar } from "../lib/sidebar-context";

export function NavBar() {
	const t = useTranslations();
	const pathname = usePathname();
	const { data: pendingCount = 0 } = usePendingApplicationCount();
	const { data: pendingPurchaseRequestCount = 0 } = usePendingPurchaseRequestCount();
	const { user } = useSession();
	const { activeOrganization, isOrganizationAdmin, activeOrganizationUserRole } = useActiveOrganization();
	const isGroupLeader = activeOrganizationUserRole === "member";
	const { isCollapsed, toggleCollapsed } = useSidebar();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	const { useSidebarLayout } = webConfig.saas;

	const basePath = activeOrganization
		? `/app/${activeOrganization.slug}`
		: "/app";

	const menuItems = [
		{
			label: t("app.menu.start"),
			href: basePath,
			icon: HomeIcon,
			isActive: pathname === basePath,
		},
		...(activeOrganization
			? [
					{
						label: t("app.menu.groups"),
						href: `${basePath}/groups`,
						icon: UsersIcon,
						isActive: pathname.startsWith(`${basePath}/groups`),
					},
					{
						label: t("app.menu.people"),
						href: `${basePath}/people`,
						icon: UserIcon,
						isActive: pathname.startsWith(`${basePath}/people`),
					},
					{
						label: t("app.menu.events"),
						href: `${basePath}/events`,
						icon: CalendarIcon,
						isActive: pathname.startsWith(`${basePath}/events`),
					},
					...(!isGroupLeader
					? [
							{
								label: t("app.menu.applications"),
								href: `${basePath}/applications`,
								icon: ClipboardListIcon,
								isActive: pathname.startsWith(`${basePath}/applications`),
								hasBadge: pendingCount > 0,
							},
							{
								label: t("app.menu.purchaseRequests"),
								href: `${basePath}/purchase-requests`,
								icon: DollarSignIcon,
								isActive: pathname.startsWith(`${basePath}/purchase-requests`),
								hasBadge: pendingPurchaseRequestCount > 0,
							},
						]
					: []),
			]
			: []),
		...(activeOrganization && isOrganizationAdmin
			? [
					{
						label: t("app.menu.organizationSettings"),
						href: `${basePath}/settings`,
						icon: SettingsIcon,
						isActive: pathname.startsWith(`${basePath}/settings/`),
					},
				]
			: []),
	];

	return (
		<nav
			className={cn("w-full", {
				"w-full md:fixed md:top-0 md:left-0 md:h-full md:w-[280px]":
					useSidebarLayout,
				"md:w-[80px]": useSidebarLayout && isCollapsed,
			})}
		>
			<div
				className={cn("container max-w-6xl py-4", {
					"py-4 md:flex md:h-full md:flex-col md:px-4 md:pb-0":
						useSidebarLayout,
				})}
			>
				<div className="flex flex-wrap items-center justify-between gap-6">
					<div
						className={cn("flex items-center gap-6 md:gap-2", {
							"md:flex md:w-full md:flex-col md:items-stretch md:align-stretch":
								useSidebarLayout,
						})}
					>
						<div className="flex items-center gap-2 md:w-full">
							<Link href="/app" className="flex items-center gap-2.5">
								{activeOrganization ? (
									<>
										<OrganizationLogo
											name={activeOrganization.name}
											logoUrl={activeOrganization.logo}
											className="size-10 rounded-md shrink-0"
										/>
										<span className="font-semibold text-sm truncate">{activeOrganization.name}</span>
									</>
								) : (
									<Logo withLabel={false} />
								)}
							</Link>
						</div>

					</div>

					<div
						className={cn(
							"mr-0 ml-auto flex items-center justify-end gap-4",
							{
								"md:hidden": useSidebarLayout,
							},
						)}
					>
						{/* Hamburger — mobile only */}
						<Button
							variant="ghost"
							size="icon"
							className="md:hidden"
							aria-label="Open menu"
							onClick={() => setMobileMenuOpen(true)}
						>
							<MenuIcon className="size-5" />
						</Button>

						<UserMenu />
					</div>
				</div>

				{/* Mobile sheet menu */}
				<Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
					<SheetContent side="left" className="w-72 p-0">
						<SheetHeader className="px-4 py-4 border-b">
							<SheetTitle className="flex items-center gap-2">
								<Logo withLabel={false} />
								{activeOrganization?.name && (
									<span className="text-sm font-semibold truncate">
										{activeOrganization.name}
									</span>
								)}
							</SheetTitle>
						</SheetHeader>
						<ul className="flex flex-col gap-1 p-3 text-sm">
							{menuItems.map((menuItem) => (
								<li key={menuItem.href}>
									<Link
										href={menuItem.href}
										onClick={() => setMobileMenuOpen(false)}
										className={cn(
											"flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors border border-transparent",
											menuItem.isActive
												? "font-semibold bg-card border-border"
												: "hover:bg-muted/50",
										)}
									>
										<span className="relative shrink-0">
											<menuItem.icon
												className={cn(
													"size-4",
													menuItem.isActive
														? "text-foreground"
														: "text-muted-foreground opacity-60",
												)}
											/>
											{"hasBadge" in menuItem && menuItem.hasBadge && (
												<span className="absolute -top-1 -right-1 size-2 rounded-full bg-red-500" />
											)}
										</span>
										<span
											className={cn(
												menuItem.isActive
													? "text-foreground"
													: "text-muted-foreground",
											)}
										>
											{menuItem.label}
										</span>
									</Link>
								</li>
							))}
						</ul>
					</SheetContent>
				</Sheet>

				{/* Desktop nav (hidden on mobile) */}
				<TooltipProvider delayDuration={0}>
					<ul
						className={cn(
							"hidden list-none text-sm",
							{
								"md:mx-0 md:my-6 md:flex md:flex-col md:items-stretch md:gap-1 md:px-0":
									useSidebarLayout,
								"md:items-center":
									useSidebarLayout && isCollapsed,
							},
						)}
					>
						{menuItems.map((menuItem) => {
							const menuItemContent = (
								<Link
									href={menuItem.href}
									className={cn(
										"flex items-center border border-transparent gap-3 whitespace-nowrap rounded-lg px-3 py-2 transition-colors",
										{
											"font-semibold bg-card border-border":
												menuItem.isActive,
											"hover:bg-muted/50":
												!menuItem.isActive,
											"md:w-full": useSidebarLayout,
											"md:justify-center md:px-2":
												useSidebarLayout && isCollapsed,
										},
									)}
									prefetch
								>
									<span className="relative shrink-0">
										<menuItem.icon
											className={cn(
												"size-4",
												menuItem.isActive
													? "text-foreground"
													: "text-muted-foreground opacity-60",
											)}
										/>
										{"hasBadge" in menuItem && menuItem.hasBadge && (
											<span className="absolute -top-1 -right-1 size-2 rounded-full bg-red-500" />
										)}
									</span>
									{(!isCollapsed || !useSidebarLayout) && (
										<span
											className={cn({
												"text-foreground":
													menuItem.isActive,
												"text-muted-foreground":
													!menuItem.isActive,
											})}
										>
											{menuItem.label}
										</span>
									)}
								</Link>
							);

							if (isCollapsed && useSidebarLayout) {
								return (
									<li key={menuItem.href}>
										<Tooltip>
											<TooltipTrigger asChild>
												{menuItemContent}
											</TooltipTrigger>
											<TooltipContent side="right">
												{menuItem.label}
											</TooltipContent>
										</Tooltip>
									</li>
								);
							}

							return (
								<li key={menuItem.href}>{menuItemContent}</li>
							);
						})}
					</ul>
				</TooltipProvider>

				<div
					className={cn("mt-auto mb-0 hidden flex-col gap-2 pb-4", {
						"md:flex": useSidebarLayout,
						"md:items-center": useSidebarLayout && isCollapsed,
					})}
				>
					{useSidebarLayout && (
						<div className="flex justify-end">
							<Button
								variant="ghost"
								size="icon"
								onClick={toggleCollapsed}
								aria-label={
									isCollapsed
										? "Expand sidebar"
										: "Collapse sidebar"
								}
							>
								{isCollapsed ? (
									<PanelLeftOpenIcon className="size-4" />
								) : (
									<PanelLeftCloseIcon className="size-4" />
								)}
							</Button>
						</div>
					)}
					<div
						className={cn({
							"md:flex md:justify-center":
								useSidebarLayout && isCollapsed,
						})}
					>
						<UserMenu showUserName={!isCollapsed} />
					</div>
				</div>
			</div>
		</nav>
	);
}

"use client";

import { authClient } from "@repo/auth/client";
import { config as authConfig } from "@repo/auth/config";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@repo/ui";
import { useSession } from "@saas/auth/hooks/use-session";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { OrganizationLogo } from "@saas/organizations/components/OrganizationLogo";
import { useOrganizationListQuery } from "@saas/organizations/lib/api";
import { ColorModeToggle } from "@shared/components/ColorModeToggle";
import { UserAvatar } from "@shared/components/UserAvatar";
import { useRouter } from "@shared/hooks/router";
import { clearCache } from "@shared/lib/cache";
import {
	BookIcon,
	HomeIcon,
	LogOutIcon,
	MoreVerticalIcon,
	SettingsIcon,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { config } from "@/config";

export function UserMenu({ showUserName }: { showUserName?: boolean }) {
	const t = useTranslations();
	const { user } = useSession();
	const router = useRouter();
	const { activeOrganization, setActiveOrganization } = useActiveOrganization();
	const { data: allOrganizations } = useOrganizationListQuery();

	const onLogout = () => {
		authClient.signOut({
			fetchOptions: {
				onSuccess: async () => {
					window.location.href = new URL(
						config.saas.redirectAfterLogout,
						window.location.origin,
					).toString();
				},
			},
		});
	};

	if (!user) {
		return null;
	}

	const { name, email, image } = user;

	return (
		<DropdownMenu modal={false}>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					className="flex cursor-pointer w-full items-center justify-between gap-2 rounded-lg outline-hidden focus-visible:ring-2 focus-visible:ring-primary md:w-[100%+1rem] md:px-2 md:py-1.5 md:hover:bg-primary/5"
					aria-label="User menu"
				>
					<span className="flex items-center gap-2">
						<UserAvatar name={name ?? ""} avatarUrl={image} />
						{showUserName && (
							<span className="text-left leading-tight">
								<span className="font-medium text-sm">
									{name}
								</span>
								<span className="block text-xs opacity-70">
									{email}
								</span>
							</span>
						)}
					</span>

					{showUserName && <MoreVerticalIcon className="size-4" />}
				</button>
			</DropdownMenuTrigger>

			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuLabel>
					{name}
					<span className="block font-normal text-xs opacity-70">
						{email}
					</span>
				</DropdownMenuLabel>

				{/* Org switcher */}
				{authConfig.organizations.enable &&
					!authConfig.organizations.hideOrganization &&
					allOrganizations &&
					allOrganizations.length > 0 && (
						<>
							<DropdownMenuSeparator />
							<DropdownMenuLabel className="text-foreground/60 text-xs font-normal">
								{t("organizations.organizationSelect.organizations")}
							</DropdownMenuLabel>
							<DropdownMenuRadioGroup
								value={activeOrganization?.slug ?? ""}
								onValueChange={async (slug) => {
									await clearCache();
									setActiveOrganization(slug);
								}}
							>
								{allOrganizations.map((org) => (
									<DropdownMenuRadioItem
										key={org.slug}
										value={org.slug}
										className="cursor-pointer pl-3"
									>
										<div className="flex items-center gap-2">
											<OrganizationLogo
												className="size-5 shrink-0"
												name={org.name}
												logoUrl={org.logo}
											/>
											<span className="truncate">{org.name}</span>
										</div>
									</DropdownMenuRadioItem>
								))}
							</DropdownMenuRadioGroup>
						</>
					)}

				<DropdownMenuSeparator />

				{/* Color mode selection */}
				<DropdownMenuItem
					className="flex items-center justify-between gap-4 hover:bg-transparent focus:bg-transparent"
					onSelect={(e) => e.preventDefault()}
				>
					<span>{t("app.userMenu.colorMode")}</span>
					<ColorModeToggle />
				</DropdownMenuItem>

				<DropdownMenuSeparator />

				<DropdownMenuItem asChild>
					<Link href="/app/settings/general">
						<SettingsIcon className="mr-2 size-4" />
						{t("app.userMenu.accountSettings")}
					</Link>
				</DropdownMenuItem>

				{config.docsLink && (
					<DropdownMenuItem asChild>
						<a href={config.docsLink}>
							<BookIcon className="mr-2 size-4" />
							{t("app.userMenu.documentation")}
						</a>
					</DropdownMenuItem>
				)}

				<DropdownMenuItem asChild>
					<Link href="/">
						<HomeIcon className="mr-2 size-4" />
						{t("app.userMenu.home")}
					</Link>
				</DropdownMenuItem>

				<DropdownMenuItem onClick={onLogout}>
					<LogOutIcon className="mr-2 size-4" />
					{t("app.userMenu.logout")}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

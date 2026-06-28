"use client";

import { Card } from "@repo/ui/components/card";
import { cn } from "@repo/ui/lib";
import { parseAsString, useQueryState } from "nuqs";
import { AllApplicationsList } from "./applications/AllApplicationsList";
import { OrganizationList } from "./organizations/OrganizationList";
import { AllPeopleList } from "./people/AllPeopleList";
import { UserList } from "./users/UserList";

const TABS = [
	{ key: "users", label: "Users" },
	{ key: "organizations", label: "Organizations" },
	{ key: "applications", label: "Applications" },
	{ key: "people", label: "People" },
] as const;

export function SuperAdminView() {
	const [activeTab, setActiveTab] = useQueryState(
		"adminTab",
		parseAsString.withDefault("users"),
	);

	return (
		<div className="space-y-6">
			<Card className="p-1">
				<div className="flex gap-1">
					{TABS.map((tab) => (
						<button
							key={tab.key}
							type="button"
							onClick={() => setActiveTab(tab.key)}
							className={cn(
								"rounded-md px-4 py-2 text-sm font-medium transition-colors",
								activeTab === tab.key
									? "bg-primary text-primary-foreground shadow-sm"
									: "text-foreground/70 hover:bg-muted hover:text-foreground",
							)}
						>
							{tab.label}
						</button>
					))}
				</div>
			</Card>

			{activeTab === "users" && <UserList />}
			{activeTab === "organizations" && <OrganizationList />}
			{activeTab === "applications" && <AllApplicationsList />}
			{activeTab === "people" && <AllPeopleList />}
		</div>
	);
}

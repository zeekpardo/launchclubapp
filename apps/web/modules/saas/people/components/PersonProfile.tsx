"use client";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";
import { ArrowLeftIcon, CheckCircle2Icon, XCircleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { usePerson } from "../hooks/use-people";
import { HouseholdPanel } from "./HouseholdPanel";
import { PersonForm } from "./PersonForm";

interface PersonProfileProps {
	personId: string;
}

export function PersonProfile({ personId }: PersonProfileProps) {
	const t = useTranslations();
	const params = useParams<{ organizationSlug: string }>();
	const { activeOrganization } = useActiveOrganization();
	const { data: person, isLoading } = usePerson(personId);

	const basePath = `/app/${params.organizationSlug}/people`;

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<Skeleton className="size-10 rounded-md" />
					<Skeleton className="h-8 w-40" />
				</div>
				<div className="grid gap-6 lg:grid-cols-3">
					<div className="space-y-6">
						<Skeleton className="h-40 rounded-xl" />
						<Skeleton className="h-48 rounded-xl" />
					</div>
					<div className="lg:col-span-2">
						<Skeleton className="h-96 rounded-xl" />
					</div>
				</div>
			</div>
		);
	}

	if (!person) {
		return <div className="text-muted-foreground">{t("launchclub.people.notFound")}</div>;
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between gap-4">
				<div className="flex items-center gap-4">
					<Button asChild variant="ghost" size="icon">
						<Link href={basePath}>
							<ArrowLeftIcon className="size-4" />
						</Link>
					</Button>
					<h1 className="text-3xl font-bold text-foreground">
						{person.firstName} {person.lastName}
					</h1>
				</div>
			</div>

			{/* 3-col grid */}
			<div className="grid gap-6 lg:grid-cols-3">
				{/* Main form — col-span-2 */}
				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle>{t("launchclub.people.edit")}</CardTitle>
					</CardHeader>
					<CardContent>
						<PersonForm
							person={person}
							organizationId={activeOrganization?.id ?? ""}
							onSuccess={() => {}}
							backHref={basePath}
						/>
					</CardContent>
				</Card>

				{/* Right sidebar */}
				<div className="lg:col-span-1 space-y-6">
					{/* Groups card */}
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-base">{t("launchclub.people.groups")}</CardTitle>
						</CardHeader>
						<CardContent>
							{!person.personGroups || person.personGroups.length === 0 ? (
								<p className="text-sm text-muted-foreground">{t("launchclub.people.noGroups")}</p>
							) : (
								<div className="space-y-2 max-h-48 overflow-y-auto">
									{person.personGroups.map((pg) => (
										<div
											key={pg.groupId}
											className="rounded-lg border p-2 space-y-1"
										>
											<div className="font-medium text-sm">{pg.group.name}</div>
											{pg.group.site && (
												<div className="text-xs text-muted-foreground">
													{pg.group.site.name}
												</div>
											)}
											<Badge status="info">{t(`launchclub.groups.members.role.${pg.role}` as Parameters<typeof t>[0])}</Badge>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>

					{/* Household panel */}
					<HouseholdPanel
						personId={personId}
						householdId={person.householdId}
					/>

					{/* Consents — children only */}
					{person.isChild && (
						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-base">Consents</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2">
								<ConsentRow label="Observation" granted={person.observationConsent} />
								<ConsentRow label="Terms & Conditions" granted={person.termsConsent} />
								<ConsentRow label="Photo / Video" granted={person.photoVideoConsent} />
							</CardContent>
						</Card>
					)}
				</div>
			</div>
		</div>
	);
}

function ConsentRow({ label, granted }: { label: string; granted: boolean }) {
	return (
		<div className={`flex items-center gap-2 text-sm font-medium ${granted ? "text-green-600" : "text-muted-foreground"}`}>
			{granted
				? <CheckCircle2Icon className="size-4 shrink-0" />
				: <XCircleIcon className="size-4 shrink-0" />}
			{label}
		</div>
	);
}

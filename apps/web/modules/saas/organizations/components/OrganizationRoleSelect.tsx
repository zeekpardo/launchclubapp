import type { OrganizationMemberRole } from "@repo/auth";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";

type LcSelectRole = "admin" | "site-leader" | "group-leader";

const LC_ROLE_OPTIONS: {
	value: LcSelectRole;
	label: string;
	description: string;
}[] = [
	{
		value: "admin",
		label: "Admin",
		description: "Full access across the organization.",
	},
	{
		value: "site-leader",
		label: "Site Leader",
		description: "Access to all groups and people within assigned sites.",
	},
	{
		value: "group-leader",
		label: "Group Leader",
		description: "Access only to assigned groups.",
	},
];

// Map the underlying Better Auth role to which select value to show.
// Since site-leader and group-leader both resolve to "member", we can't
// distinguish them after the fact — fall back to showing "member" as-is.
function _toSelectValue(role: OrganizationMemberRole): string {
	return role; // "admin" | "member" | "owner" — shown in trigger via SelectValue
}

// Map the chosen LC option back to the Better Auth role for the API call.
function toOrgRole(lcRole: LcSelectRole): OrganizationMemberRole {
	if (lcRole === "admin") return "admin";
	return "member";
}

export function OrganizationRoleSelect({
	value,
	onSelect,
	disabled,
}: {
	value?: OrganizationMemberRole;
	onSelect: (value: OrganizationMemberRole) => void;
	disabled?: boolean;
}) {
	return (
		<Select
			value={value}
			onValueChange={(val) => {
				// If the value is one of the LC roles, map it; otherwise pass through
				const isLcRole = LC_ROLE_OPTIONS.some((o) => o.value === val);
				if (isLcRole) {
					onSelect(toOrgRole(val as LcSelectRole));
				} else {
					onSelect(val as OrganizationMemberRole);
				}
			}}
			disabled={disabled}
		>
			<SelectTrigger className="min-w-[140px]">
				<SelectValue>
					{value === "owner"
						? "Owner"
						: value === "admin"
							? "Admin"
							: value === "member"
								? "Member"
								: value}
				</SelectValue>
			</SelectTrigger>
			<SelectContent>
				{LC_ROLE_OPTIONS.map((option) => (
					<SelectItem key={option.value} value={option.value}>
						<div className="flex flex-col">
							<span>{option.label}</span>
							<span className="text-muted-foreground text-xs">
								{option.description}
							</span>
						</div>
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

"use client";

import {
	Avatar,
	AvatarFallback,
} from "@repo/ui/components/avatar";
import { Button } from "@repo/ui/components/button";
import { Checkbox } from "@repo/ui/components/checkbox";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { cn } from "@repo/ui";
import { type GroupDetail } from "@saas/groups/hooks/use-groups";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { PrinterIcon } from "lucide-react";
import { useState } from "react";
import { AttendanceDialog } from "../AttendanceDialog";

interface GroupAttendanceTabProps {
	groupId: string;
	group: GroupDetail;
}

export function GroupAttendanceTab({ groupId, group }: GroupAttendanceTabProps) {
	const [attendanceDateRange, setAttendanceDateRange] = useState("30");
	const [customStart, setCustomStart] = useState("");
	const [customEnd, setCustomEnd] = useState("");
	const [showRemovedMembers, setShowRemovedMembers] = useState(false);
	const [attendanceEventId, setAttendanceEventId] = useState<string | null>(
		null,
	);

	const isCustom = attendanceDateRange === "custom";

	const attendanceSince = useMemo(() => {
		if (isCustom) return customStart ? new Date(customStart).toISOString() : undefined;
		if (attendanceDateRange === "all") return undefined;
		return new Date(Date.now() - Number.parseInt(attendanceDateRange) * 24 * 60 * 60 * 1000).toISOString();
	}, [attendanceDateRange, isCustom, customStart]);

	const attendanceUntil = useMemo(() => {
		if (isCustom && customEnd) {
			const d = new Date(customEnd);
			d.setHours(23, 59, 59, 999);
			return d.toISOString();
		}
		return undefined;
	}, [isCustom, customEnd]);

	const { data: events } = useQuery(
		orpc.events.list.queryOptions({ input: { groupId } }),
	);

	const { data: attendanceRecords } = useQuery(
		orpc.attendance.byGroup.queryOptions({
			input: {
				groupId,
				...(attendanceSince ? { since: attendanceSince } : {}),
				...(attendanceUntil ? { until: attendanceUntil } : {}),
			},
		}),
	);

	const sinceDate = useMemo(() => {
		if (isCustom) return customStart ? new Date(customStart) : null;
		if (attendanceDateRange === "all") return null;
		return new Date(Date.now() - Number.parseInt(attendanceDateRange) * 24 * 60 * 60 * 1000);
	}, [attendanceDateRange, isCustom, customStart]);

	const untilDate = useMemo(() => {
		if (isCustom && customEnd) {
			const d = new Date(customEnd);
			d.setHours(23, 59, 59, 999);
			return d;
		}
		return null;
	}, [isCustom, customEnd]);

	const now = new Date();
	const filteredEvents = (events ?? []).filter((e) => {
		const d = new Date(e.startsAt);
		if (sinceDate && d < sinceDate) return false;
		if (untilDate && d > untilDate) return false;
		return true;
	});
	const pastEvents = filteredEvents.filter(
		(e) => new Date(e.startsAt) <= now,
	);
	const attendanceMap = new Map<string, string>();
	for (const record of attendanceRecords ?? []) {
		attendanceMap.set(`${record.eventId}:${record.personId}`, record.status);
	}

	const currentMemberIds = new Set(group.personGroups.map(({ person }) => person.id));
	const removedPersons = useMemo(() => {
		const seen = new Map<string, { person: { id: string; firstName: string; lastName: string } }>();
		for (const record of attendanceRecords ?? []) {
			if (!currentMemberIds.has(record.person.id) && !seen.has(record.person.id)) {
				seen.set(record.person.id, { person: record.person });
			}
		}
		return Array.from(seen.values());
	}, [attendanceRecords, currentMemberIds]);

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold">Attendance Report</h2>
				<Button variant="outline" onClick={() => window.print()}>
					<PrinterIcon className="mr-2 h-4 w-4" />
					Print
				</Button>
			</div>

			<div className="space-y-4">
				<h3 className="text-lg font-semibold">Attendance History</h3>
				<div className="flex flex-wrap items-center gap-3">
					<Select
						value={attendanceDateRange}
						onValueChange={setAttendanceDateRange}
					>
						<SelectTrigger className="w-48">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="7">Last 7 Days</SelectItem>
							<SelectItem value="30">Last 30 Days</SelectItem>
							<SelectItem value="90">Last 3 Months</SelectItem>
							<SelectItem value="180">Last 6 Months</SelectItem>
							<SelectItem value="all">All Time</SelectItem>
							<SelectItem value="custom">Custom Range</SelectItem>
						</SelectContent>
					</Select>
					{isCustom && (
						<div className="flex items-center gap-2">
							<input
								type="date"
								value={customStart}
								onChange={(e) => setCustomStart(e.target.value)}
								className="rounded-md border px-3 py-1.5 text-sm"
								aria-label="Start date"
							/>
							<span className="text-sm text-muted-foreground">to</span>
							<input
								type="date"
								value={customEnd}
								onChange={(e) => setCustomEnd(e.target.value)}
								min={customStart}
								className="rounded-md border px-3 py-1.5 text-sm"
								aria-label="End date"
							/>
						</div>
					)}
					<div className="flex items-center space-x-2">
						<Checkbox
							id="show-removed"
							checked={showRemovedMembers}
							onCheckedChange={(v) => setShowRemovedMembers(!!v)}
						/>
						<label
							htmlFor="show-removed"
							className="cursor-pointer text-sm font-normal"
						>
							Show removed members
						</label>
					</div>
				</div>

				<div className="overflow-auto rounded-lg border">
					<table className="w-full caption-bottom text-sm">
						<thead className="[&_tr]:border-b">
							<tr className="border-b transition-colors hover:bg-muted/50">
								<th className="sticky left-0 z-10 min-w-[280px] bg-background h-12 px-4 text-left align-middle font-medium text-muted-foreground">
									FIRST NAME • LAST NAME
								</th>
								<th className="min-w-[80px] h-12 px-4 align-middle font-medium text-muted-foreground text-center">
									%
								</th>
								{filteredEvents.map((event) => (
									<th
										key={event.id}
										className="min-w-[120px] h-12 px-4 align-middle font-medium text-muted-foreground text-center"
									>
										<div className="text-xs font-semibold">
											{new Date(event.startsAt)
												.toLocaleDateString("en-US", {
													month: "short",
													day: "numeric",
												})
												.toUpperCase()}
										</div>
									</th>
								))}
							</tr>
						</thead>
						<tbody className="[&_tr:last-child]:border-0">
							{group.personGroups.map(({ person, joinedAt }) => {
								const initials = `${person.firstName.charAt(0)}${person.lastName.charAt(0)}`.toUpperCase();
								const presentCount = pastEvents.filter(
									(e) =>
										attendanceMap.get(`${e.id}:${person.id}`) === "PRESENT",
								).length;
								const pct =
									pastEvents.length > 0
										? Math.round(
												(presentCount / pastEvents.length) * 100,
											)
										: 0;
								return (
									<tr
										key={person.id}
										className="border-b transition-colors hover:bg-muted/50"
									>
										<td className="sticky left-0 z-10 bg-background p-4 align-middle">
											<div className="flex items-center gap-3">
												<Avatar className="h-10 w-10">
													<AvatarFallback className="text-xs">
														{initials}
													</AvatarFallback>
												</Avatar>
												<div>
													<div className="font-medium">
														{person.firstName} {person.lastName}
													</div>
													<div className="text-xs text-muted-foreground">
														Joined{" "}
														{new Date(joinedAt).toLocaleDateString("en-US", {
															month: "short",
															day: "numeric",
															year: "numeric",
														})}
													</div>
												</div>
											</div>
										</td>
										<td className="p-4 align-middle text-center">
											<span className="font-semibold">{pct}%</span>
										</td>
										{filteredEvents.map((event) => {
											const status = attendanceMap.get(
												`${event.id}:${person.id}`,
											);
											return (
												<td
													key={event.id}
													className="p-4 align-middle text-center"
												>
													{status ? (
														<span
															className={cn(
																"text-xs font-medium",
																status === "PRESENT" && "text-green-600",
																status === "ABSENT" && "text-red-500",
																status === "LATE" && "text-yellow-600",
																status === "EXCUSED" && "text-blue-500",
															)}
														>
															{status.charAt(0)}
														</span>
													) : (
														<span className="text-xs text-muted-foreground">
															-
														</span>
													)}
												</td>
											);
										})}
									</tr>
								);
							})}
							{showRemovedMembers && removedPersons.map(({ person }) => {
								const initials = `${person.firstName.charAt(0)}${person.lastName.charAt(0)}`.toUpperCase();
								const presentCount = pastEvents.filter(
									(e) => attendanceMap.get(`${e.id}:${person.id}`) === "PRESENT",
								).length;
								const pct = pastEvents.length > 0
									? Math.round((presentCount / pastEvents.length) * 100)
									: 0;
								return (
									<tr
										key={person.id}
										className="border-b opacity-60 transition-colors hover:bg-muted/50"
									>
										<td className="sticky left-0 z-10 bg-background p-4 align-middle">
											<div className="flex items-center gap-3">
												<Avatar className="h-10 w-10">
													<AvatarFallback className="text-xs">
														{initials}
													</AvatarFallback>
												</Avatar>
												<div>
													<div className="font-medium">
														{person.firstName} {person.lastName}
													</div>
													<div className="text-xs text-muted-foreground">
														Removed
													</div>
												</div>
											</div>
										</td>
										<td className="p-4 align-middle text-center">
											<span className="font-semibold">{pct}%</span>
										</td>
										{filteredEvents.map((event) => {
											const status = attendanceMap.get(`${event.id}:${person.id}`);
											return (
												<td key={event.id} className="p-4 align-middle text-center">
													{status ? (
														<span className={cn(
															"text-xs font-medium",
															status === "PRESENT" && "text-green-600",
															status === "ABSENT" && "text-red-500",
															status === "LATE" && "text-yellow-600",
															status === "EXCUSED" && "text-blue-500",
														)}>
															{status.charAt(0)}
														</span>
													) : (
														<span className="text-xs text-muted-foreground">-</span>
													)}
												</td>
											);
										})}
									</tr>
								);
							})}
							{group.personGroups.length === 0 && (
								<tr>
									<td
										colSpan={2 + filteredEvents.length}
										className="py-12 text-center text-muted-foreground"
									>
										No members
									</td>
								</tr>
							)}
							<tr className="border-t-2 bg-muted/50 font-semibold">
								<td className="sticky left-0 z-10 bg-muted/50 p-4 align-middle">
									Attendance totals:
								</td>
								<td className="p-4 align-middle" />
								{filteredEvents.map((event) => (
									<td key={event.id} className="p-4 align-middle text-center">
										<Button
											variant="link"
											size="sm"
											className="h-auto p-0 text-xs"
											onClick={() => setAttendanceEventId(event.id)}
										>
											Take Attendance
										</Button>
									</td>
								))}
							</tr>
						</tbody>
					</table>
				</div>
			</div>

			{attendanceEventId && (
				<AttendanceDialog
					eventId={attendanceEventId}
					groupId={groupId}
					open={!!attendanceEventId}
					onOpenChange={(open) => {
						if (!open) setAttendanceEventId(null);
					}}
				/>
			)}
		</div>
	);
}

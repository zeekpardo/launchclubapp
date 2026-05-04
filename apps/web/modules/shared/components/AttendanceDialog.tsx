"use client";

import { Button } from "@repo/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { Skeleton } from "@repo/ui/components/skeleton";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

interface AttendanceRecord {
	personId: string;
	status: AttendanceStatus;
	notes: string;
}

interface AttendanceDialogProps {
	eventId: string;
	groupId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function AttendanceDialog({
	eventId,
	groupId,
	open,
	onOpenChange,
}: AttendanceDialogProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const [records, setRecords] = useState<Record<string, AttendanceRecord>>({});

	const { data: group, isLoading } = useQuery(
		orpc.groups.get.queryOptions({
			input: { id: groupId },
		}),
	);

	const recordAttendance = useMutation(
		orpc.attendance.record.mutationOptions(),
	);

	const updateRecord = (
		personId: string,
		field: keyof Omit<AttendanceRecord, "personId">,
		value: string,
	) => {
		setRecords((prev) => ({
			...prev,
			[personId]: {
				personId,
				status: (prev[personId]?.status ?? "PRESENT") as AttendanceStatus,
				notes: prev[personId]?.notes ?? "",
				[field]: value,
			},
		}));
	};

	const handleSubmit = async () => {
		if (!group) return;
		const allRecords = group.personGroups.map((pg) => ({
			eventId,
			personId: pg.person.id,
			status: (records[pg.person.id]?.status ?? "PRESENT") as AttendanceStatus,
			notes: records[pg.person.id]?.notes,
		}));
		try {
			await recordAttendance.mutateAsync({ records: allRecords });
			await queryClient.invalidateQueries({
				queryKey: orpc.attendance.byGroup.key(),
			});
			toastSuccess(t("launchclub.attendance.notifications.saved"));
			onOpenChange(false);
		} catch {
			toastError(t("launchclub.attendance.notifications.error"));
		}
	};

	const statuses: AttendanceStatus[] = ["PRESENT", "ABSENT", "LATE", "EXCUSED"];

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{t("launchclub.attendance.record")}
					</DialogTitle>
				</DialogHeader>

				{isLoading ? (
					<div className="space-y-3">
						{Array.from({ length: 4 }).map((_, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: skeleton list
							<Skeleton key={i} className="h-12 w-full" />
						))}
					</div>
				) : (
					<div className="space-y-3">
						{group?.personGroups.map(({ person }) => (
							<div
								key={person.id}
								className="flex items-center gap-3"
							>
								<span className="w-36 truncate font-medium text-sm">
									{person.firstName} {person.lastName}
								</span>
								<Select
									value={
										records[person.id]?.status ?? "PRESENT"
									}
									onValueChange={(v) =>
										updateRecord(person.id, "status", v)
									}
								>
									<SelectTrigger className="w-32">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{statuses.map((s) => (
											<SelectItem key={s} value={s}>
												{t(
													`launchclub.attendance.status.${s}`,
												)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<Input
									className="flex-1"
									placeholder="Notes"
									value={records[person.id]?.notes ?? ""}
									onChange={(e) =>
										updateRecord(
											person.id,
											"notes",
											e.target.value,
										)
									}
								/>
							</div>
						))}
					</div>
				)}

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button
						onClick={handleSubmit}
						loading={recordAttendance.isPending}
					>
						{t("launchclub.attendance.save")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

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
import { Label } from "@repo/ui/components/label";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { useUpdateApplication } from "@saas/applications/hooks/use-applications";
import { useState } from "react";

interface ChildEdit {
	id: string;
	firstName: string;
	lastName: string;
	grade: string;
}

interface ApplicationEditDialogProps {
	applicationId: string;
	initial: {
		parentFirstName: string;
		parentLastName: string;
		parentEmail: string;
		parentPhone: string;
		children: ChildEdit[];
	};
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function ApplicationEditDialog({
	applicationId,
	initial,
	open,
	onOpenChange,
}: ApplicationEditDialogProps) {
	const updateApplication = useUpdateApplication();
	const [parentFirstName, setParentFirstName] = useState(
		initial.parentFirstName,
	);
	const [parentLastName, setParentLastName] = useState(
		initial.parentLastName,
	);
	const [parentEmail, setParentEmail] = useState(initial.parentEmail);
	const [parentPhone, setParentPhone] = useState(initial.parentPhone);
	const [children, setChildren] = useState<ChildEdit[]>(initial.children);

	const updateChild = (id: string, key: keyof ChildEdit, value: string) => {
		setChildren((prev) =>
			prev.map((c) => (c.id === id ? { ...c, [key]: value } : c)),
		);
	};

	const handleSave = async () => {
		try {
			await updateApplication.mutateAsync({
				id: applicationId,
				parentFirstName,
				parentLastName,
				parentEmail: parentEmail || null,
				parentPhone: parentPhone || null,
				children: children.map((c) => ({
					id: c.id,
					firstName: c.firstName,
					lastName: c.lastName,
					grade: c.grade || null,
				})),
			});
			toastSuccess("Application updated.");
			onOpenChange(false);
		} catch {
			toastError("Could not update the application. Please try again.");
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Edit application</DialogTitle>
				</DialogHeader>

				<div className="space-y-4 py-2">
					<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
						Parent / Guardian
					</p>
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<Label>First name</Label>
							<Input
								value={parentFirstName}
								onChange={(e) =>
									setParentFirstName(e.target.value)
								}
							/>
						</div>
						<div className="space-y-1.5">
							<Label>Last name</Label>
							<Input
								value={parentLastName}
								onChange={(e) =>
									setParentLastName(e.target.value)
								}
							/>
						</div>
						<div className="space-y-1.5">
							<Label>Email</Label>
							<Input
								type="email"
								value={parentEmail}
								onChange={(e) => setParentEmail(e.target.value)}
							/>
						</div>
						<div className="space-y-1.5">
							<Label>Phone</Label>
							<Input
								type="tel"
								value={parentPhone}
								onChange={(e) => setParentPhone(e.target.value)}
							/>
						</div>
					</div>

					{children.length > 0 && (
						<div className="space-y-3 pt-2 border-t">
							<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Children
							</p>
							{children.map((child) => (
								<div
									key={child.id}
									className="grid grid-cols-3 gap-3 rounded-lg border bg-muted/30 p-3"
								>
									<div className="space-y-1.5">
										<Label>First name</Label>
										<Input
											value={child.firstName}
											onChange={(e) =>
												updateChild(
													child.id,
													"firstName",
													e.target.value,
												)
											}
										/>
									</div>
									<div className="space-y-1.5">
										<Label>Last name</Label>
										<Input
											value={child.lastName}
											onChange={(e) =>
												updateChild(
													child.id,
													"lastName",
													e.target.value,
												)
											}
										/>
									</div>
									<div className="space-y-1.5">
										<Label>Grade</Label>
										<Input
											value={child.grade}
											onChange={(e) =>
												updateChild(
													child.id,
													"grade",
													e.target.value,
												)
											}
										/>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button
						onClick={handleSave}
						loading={updateApplication.isPending}
					>
						Save changes
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

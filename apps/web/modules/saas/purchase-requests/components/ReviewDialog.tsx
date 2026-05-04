"use client";

import { Button } from "@repo/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@repo/ui/components/dialog";
import { Label } from "@repo/ui/components/label";
import { Textarea } from "@repo/ui/components/textarea";
import { CheckCircle2Icon, XCircleIcon } from "lucide-react";
import { useState } from "react";

interface ReviewDialogProps {
	open: boolean;
	status: "APPROVED" | "DECLINED";
	loading?: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: (note: string) => Promise<void>;
}

export function ReviewDialog({
	open,
	status,
	loading,
	onOpenChange,
	onConfirm,
}: ReviewDialogProps) {
	const [note, setNote] = useState("");

	const isApproving = status === "APPROVED";

	const handleConfirm = async () => {
		await onConfirm(note);
		setNote("");
	};

	const handleOpenChange = (value: boolean) => {
		if (!value) setNote("");
		onOpenChange(value);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						{isApproving ? (
							<CheckCircle2Icon className="h-5 w-5 text-green-600" />
						) : (
							<XCircleIcon className="h-5 w-5 text-destructive" />
						)}
						{isApproving ? "Approve Request" : "Decline Request"}
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-2">
					<Label htmlFor="review-note">
						Comment{" "}
						<span className="text-muted-foreground font-normal">(optional)</span>
					</Label>
					<Textarea
						id="review-note"
						value={note}
						onChange={(e) => setNote(e.target.value)}
						placeholder={
							isApproving
								? "e.g. Approved for Q2 budget"
								: "e.g. Over budget — please reduce quantity"
						}
						rows={3}
					/>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => handleOpenChange(false)}>
						Cancel
					</Button>
					<Button
						loading={loading}
						variant={isApproving ? "primary" : "destructive"}
						onClick={handleConfirm}
					>
						{isApproving ? "Approve" : "Decline"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

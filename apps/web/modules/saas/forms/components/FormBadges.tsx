import { Badge } from "@repo/ui/components/badge";

export function FormTypeBadge({ type }: { type: string }) {
	if (type === "STUDENT") {
		return <Badge status="info" className="text-xs">Student</Badge>;
	}
	return <Badge status="warning" className="text-xs">Mentor</Badge>;
}

export function FormStatusBadge({ status }: { status: string }) {
	if (status === "PUBLISHED") {
		return <Badge status="success" className="text-xs">Published</Badge>;
	}
	return <Badge className="text-xs">Unpublished</Badge>;
}

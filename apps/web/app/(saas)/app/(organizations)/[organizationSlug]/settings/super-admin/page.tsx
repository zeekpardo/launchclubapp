import { getSession } from "@saas/auth/lib/server";
import { SuperAdminView } from "@saas/admin/component/SuperAdminView";
import { redirect } from "next/navigation";

export default async function SuperAdminSettingsPage() {
	const session = await getSession();

	if (session?.user?.role !== "admin") {
		redirect("/app");
	}

	return <SuperAdminView />;
}

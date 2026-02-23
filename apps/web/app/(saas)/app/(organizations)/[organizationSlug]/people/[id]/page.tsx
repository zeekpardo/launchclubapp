import { PersonProfile } from "@saas/people/components/PersonProfile";

export default async function PersonPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	return <PersonProfile personId={id} />;
}

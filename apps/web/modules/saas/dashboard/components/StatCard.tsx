import { Card, CardContent } from "@repo/ui/components/card";

interface StatCardProps {
	title: string;
	value: number | string;
	icon: React.ReactNode;
	description?: string;
}

export function StatCard({ title, value, icon, description }: StatCardProps) {
	return (
		<Card>
			<CardContent className="p-6">
				<div className="flex items-start justify-between">
					<div className="flex-1">
						<p className="text-sm font-medium text-muted-foreground">
							{title}
						</p>
						<p className="mt-2 text-3xl font-bold">{value}</p>
						{description && (
							<p className="mt-1 text-xs text-muted-foreground">
								{description}
							</p>
						)}
					</div>
					<div className="ml-4 text-muted-foreground">{icon}</div>
				</div>
			</CardContent>
		</Card>
	);
}

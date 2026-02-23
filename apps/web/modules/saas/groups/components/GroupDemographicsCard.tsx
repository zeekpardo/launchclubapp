"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const GENDER_COLORS: Record<string, string> = {
	Male: "#3b82f6",
	Female: "#ec4899",
	Unknown: "#94a3b8",
};

interface DemographicEntry {
	name: string;
	value: number;
}

interface GroupDemographicsCardProps {
	data: DemographicEntry[];
}

export function GroupDemographicsCard({ data }: GroupDemographicsCardProps) {
	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="text-muted-foreground text-sm font-medium">Demographics</CardTitle>
			</CardHeader>
			<CardContent className="pt-0">
				{data.length > 0 ? (
					<>
						<ResponsiveContainer width="100%" height={120}>
							<PieChart>
								<Pie
									data={data}
									cx="50%"
									cy="50%"
									innerRadius={25}
									outerRadius={50}
									dataKey="value"
								>
									{data.map((entry) => (
										<Cell
											key={entry.name}
											fill={GENDER_COLORS[entry.name] ?? "#94a3b8"}
										/>
									))}
								</Pie>
								<Tooltip formatter={(value, name) => [value, name]} />
							</PieChart>
						</ResponsiveContainer>
						<div className="mt-2 flex flex-wrap justify-center gap-3">
							{data.map((entry) => (
								<div key={entry.name} className="flex items-center gap-1">
									<div
										className="h-2 w-2 rounded-full"
										style={{ backgroundColor: GENDER_COLORS[entry.name] ?? "#94a3b8" }}
									/>
									<span className="text-xs">{entry.value} {entry.name}</span>
								</div>
							))}
						</div>
					</>
				) : (
					<div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
						No demographic data
					</div>
				)}
			</CardContent>
		</Card>
	);
}

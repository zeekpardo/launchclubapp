"use client";

import { cn } from "@repo/ui";
import {
	CalendarCheckIcon,
	ClipboardListIcon,
	DollarSignIcon,
	MapPinIcon,
	ShieldCheckIcon,
	UsersIcon,
} from "lucide-react";
import Image, { type StaticImageData } from "next/image";
import type { JSXElementConstructor, ReactNode } from "react";
import heroImage from "../../../../public/images/feature.svg";

export const featureTabs: Array<{
	id: string;
	title: string;
	icon: JSXElementConstructor<any>;
	subtitle?: string;
	description?: ReactNode;
	image?: StaticImageData;
	imageBorder?: boolean;
	stack?: {
		title: string;
		href: string;
		icon: JSXElementConstructor<any>;
	}[];
	highlights?: {
		title: string;
		description: string;
		icon: JSXElementConstructor<any>;
		demoLink?: string;
		docsLink?: string;
	}[];
}> = [
	{
		id: "groups",
		title: "Groups & Attendance",
		icon: UsersIcon,
		subtitle: "Keep every group organized and every session accounted for.",
		description:
			"Create and manage groups across multiple sites and areas. Assign staff, track members, and record attendance for every event — all in one place.",
		stack: [],
		image: heroImage,
		imageBorder: false,
		highlights: [
			{
				title: "Flexible hierarchy",
				description:
					"Organize programs across organizations, areas, sites, and groups — mirroring how your programs actually run.",
				icon: MapPinIcon,
			},
			{
				title: "Attendance tracking",
				description:
					"Mark attendance quickly for any event and monitor real-time attendance rates per group.",
				icon: CalendarCheckIcon,
			},
			{
				title: "People & households",
				description:
					"Maintain detailed profiles for every participant, linked to their household and assigned groups.",
				icon: UsersIcon,
			},
		],
	},
	{
		id: "operations",
		title: "Operations",
		icon: ClipboardListIcon,
		subtitle: "Streamline the admin work so your team can focus on the kids.",
		description:
			"From purchase requests to new participant applications, keep your approval workflows moving — with full visibility for everyone involved.",
		stack: [],
		image: heroImage,
		imageBorder: false,
		highlights: [
			{
				title: "Purchase approvals",
				description:
					"Staff submit purchase requests with justifications and product links. Admins approve or decline with a full audit trail.",
				icon: DollarSignIcon,
			},
			{
				title: "Application flow",
				description:
					"Share a public apply link and let families sign up directly. Review, approve, and assign applicants to groups — no paperwork.",
				icon: ClipboardListIcon,
			},
			{
				title: "Role-based access",
				description:
					"Admins, site managers, and group leaders each see exactly what they need — no more, no less.",
				icon: ShieldCheckIcon,
			},
		],
	},
];

export function Features() {
	return (
		<section id="features" className="scroll-my-20 py-12 lg:py-16 xl:py-24">
			<div className="container">
				<div className="mb-6 lg:mb-0 max-w-3xl">
					<small className="font-medium text-xs uppercase tracking-wider text-primary mb-4 block">
						Everything you need
					</small>
					<h2 className="text-3xl lg:text-4xl xl:text-5xl font-medium">
						Built for the people running programs, not just managing them
					</h2>
					<p className="mt-2 text-base lg:text-lg text-foreground/60">
						Everything your team needs to manage participants,
						track attendance, and run operations — in one place.
					</p>
				</div>
			</div>

			<div>
				<div className="container mt-8 lg:mt-12 grid grid-cols-1 gap-8 md:gap-12 lg:gap-16 xl:gap-24">
					{featureTabs.map((tab) => {
						const filteredStack = tab.stack || [];
						const filteredHighlights = tab.highlights || [];
						return (
							<div key={tab.id} className="">
								<div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
									<div>
										{tab.image && (
											<Image
												src={tab.image}
												alt={tab.title}
												className={cn(
													" h-auto w-full max-w-xl",
													{
														"rounded-2xl border-4":
															tab.imageBorder,
													},
												)}
											/>
										)}
									</div>

									<div>
										<h3 className="font-normal text-lg text-foreground leading-tight md:text-xl lg:text-2xl">
											<span className="font-medium">
												{tab.title}.{" "}
											</span>
											<span className="font-sans">
												{tab.subtitle}
											</span>
										</h3>

										{tab.description && (
											<p className="mt-4 text-foreground/60">
												{tab.description}
											</p>
										)}

										{filteredStack?.length > 0 && (
											<div className="mt-4 flex flex-wrap gap-6">
												{filteredStack.map(
													(tool, k) => (
														<a
															href={tool.href}
															target="_blank"
															key={`stack-tool-${k}`}
															className="flex items-center gap-2"
															rel="noreferrer"
														>
															<tool.icon className="size-6" />
															<strong className="block text-sm">
																{tool.title}
															</strong>
														</a>
													),
												)}
											</div>
										)}
									</div>
								</div>

								{filteredHighlights.length > 0 && (
									<div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:mt-12">
										{filteredHighlights.map(
											(highlight, k) => (
												<div
													key={`highlight-${k}`}
													className="flex flex-col items-stretch justify-between rounded-2xl p-4 lg:p-6 bg-card"
												>
													<div>
														<highlight.icon
															className="text-primary text-xl"
															width="1em"
															height="1em"
														/>
														<strong className="mt-2 block font-medium text-lg">
															{highlight.title}
														</strong>
														<p className="mt-1 text-sm">
															{
																highlight.description
															}
														</p>
													</div>
												</div>
											),
										)}
									</div>
								)}
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}

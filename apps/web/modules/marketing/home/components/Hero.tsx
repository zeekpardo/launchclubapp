import { LocaleLink } from "@i18n/routing";
import { Button } from "@repo/ui/components/button";
import { ArrowRightIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { config } from "@/config";
import heroImage from "../../../../public/images/hero-image.png";
import heroImageDark from "../../../../public/images/hero-image-dark.png";

export function Hero() {
	return (
		<div className="relative max-w-full overflow-x-hidden">
			<div className="container relative z-20 pt-24 pb-12 lg:pb-16">
				<div className="mb-4 flex justify-start">
					<div className="flex flex-wrap items-center justify-start rounded-full bg-muted p-px px-3 py-1 font-normal text-foreground text-sm">
						<span className="flex items-center gap-2 rounded-full font-semibold">
							New:
						</span>
						<span className="ml-1 block font-medium">
							Purchase request approvals are here
						</span>
					</div>
				</div>

				<h1 className="text-balance font-medium text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-tighter text-foreground">
					Run your youth programs, from sign-up to sign-off
				</h1>

				<p className="mt-2 text-foreground/60 text-sm sm:text-lg max-w-3xl">
					Manage every area, site, group, and person in one place.
					Track attendance, approve purchase requests, and process
					new applications. No spreadsheets.
				</p>

				<div className="mt-4 flex items-center justify-start gap-2">
					<Button size="lg" variant="primary" asChild>
						<Link href="/auth/login">
							Get started
							<ArrowRightIcon className="ml-2 size-4" />
						</Link>
					</Button>
					{config.docsLink && (
						<Button variant="ghost" size="lg" asChild>
							<LocaleLink href={config.docsLink}>
								Documentation
							</LocaleLink>
						</Button>
					)}
				</div>

				<div className="mx-auto mt-12 lg:mt-16 xl:mt-24 lg:flex-1 rounded-4xl bg-primary/5 p-4 border">
					<Image
						src={heroImage}
						alt="Our application"
						className="block rounded-xl dark:hidden"
						priority
					/>
					<Image
						src={heroImageDark}
						alt="Our application"
						className="hidden rounded-xl dark:block"
						priority
					/>
				</div>

				<div className="mt-12 lg:mt-16">
					<p className="text-foreground/40 text-xs font-medium uppercase tracking-wider mb-4">
						Built for
					</p>
					<div className="flex flex-wrap gap-3">
						{[
							"After-school programs",
							"Community clubs",
							"Youth leagues",
							"Summer camps",
							"Tutoring centers",
						].map((label) => (
							<span
								key={label}
								className="rounded-full border bg-muted px-3 py-1 text-xs font-medium text-foreground/60"
							>
								{label}
							</span>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

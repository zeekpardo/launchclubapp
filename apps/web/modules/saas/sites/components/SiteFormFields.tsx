"use client";

import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";

interface Area {
	id: string;
	name: string;
}

interface SiteFormValues {
	name: string;
	slug: string;
	areaId: string;
	addressLine1?: string;
	city?: string;
	stateProvince?: string;
	postalCode?: string;
	country?: string;
	phone?: string;
	email?: string;
}

interface SiteFormFieldsProps {
	control: Control<SiteFormValues>;
	areas: Area[] | undefined;
}

export function SiteFormFields({ control, areas }: SiteFormFieldsProps) {
	const t = useTranslations();

	return (
		<>
			<FormField
				control={control}
				name="name"
				render={({ field }) => (
					<FormItem>
						<FormLabel>{t("launchclub.sites.form.name")}</FormLabel>
						<FormControl>
							<Input {...field} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			<FormField
				control={control}
				name="slug"
				render={({ field }) => (
					<FormItem>
						<FormLabel>{t("launchclub.sites.form.slug")}</FormLabel>
						<FormControl>
							<Input {...field} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			<FormField
				control={control}
				name="areaId"
				render={({ field }) => (
					<FormItem>
						<FormLabel>{t("launchclub.sites.form.area")}</FormLabel>
						<Select
							onValueChange={field.onChange}
							defaultValue={field.value}
						>
							<FormControl>
								<SelectTrigger>
									<SelectValue
										placeholder={t(
											"launchclub.sites.form.area",
										)}
									/>
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								{areas?.map((area) => (
									<SelectItem key={area.id} value={area.id}>
										{area.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<FormMessage />
					</FormItem>
				)}
			/>

			<FormField
				control={control}
				name="addressLine1"
				render={({ field }) => (
					<FormItem>
						<FormLabel>
							{t("launchclub.sites.form.address")}
						</FormLabel>
						<FormControl>
							<Input {...field} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			<div className="grid grid-cols-2 gap-4">
				<FormField
					control={control}
					name="city"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								{t("launchclub.sites.form.city")}
							</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={control}
					name="stateProvince"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								{t("launchclub.sites.form.state")}
							</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<FormField
					control={control}
					name="postalCode"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								{t("launchclub.sites.form.zipCode")}
							</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={control}
					name="country"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Country</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>

			<FormField
				control={control}
				name="phone"
				render={({ field }) => (
					<FormItem>
						<FormLabel>
							{t("launchclub.sites.form.phone")}
						</FormLabel>
						<FormControl>
							<Input {...field} type="tel" />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			<FormField
				control={control}
				name="email"
				render={({ field }) => (
					<FormItem>
						<FormLabel>
							{t("launchclub.sites.form.email")}
						</FormLabel>
						<FormControl>
							<Input {...field} type="email" />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
		</>
	);
}

import type { config } from "@repo/payments/config";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

type ProductReferenceId = keyof typeof config.plans;

export function usePlanData() {
	const t = useTranslations();

	const planData: Record<
		ProductReferenceId,
		{
			title: string;
			description: ReactNode;
			features: ReactNode[];
		}
	> = {
		free: {
			title: t("pricing.products.free.title"),
			description: t("pricing.products.free.description"),
			features: [
				t("pricing.products.free.features.anotherFeature"),
				t("pricing.products.free.features.limitedSupport"),
			],
		},
		starter: {
			title: t("pricing.products.starter.title"),
			description: t("pricing.products.starter.description"),
			features: [
				t("pricing.products.starter.features.students"),
				t("pricing.products.starter.features.support"),
			],
		},
		growth: {
			title: t("pricing.products.growth.title"),
			description: t("pricing.products.growth.description"),
			features: [
				t("pricing.products.growth.features.students"),
				t("pricing.products.growth.features.support"),
			],
		},
		standard: {
			title: t("pricing.products.standard.title"),
			description: t("pricing.products.standard.description"),
			features: [
				t("pricing.products.standard.features.students"),
				t("pricing.products.standard.features.support"),
			],
		},
		plus: {
			title: t("pricing.products.plus.title"),
			description: t("pricing.products.plus.description"),
			features: [
				t("pricing.products.plus.features.students"),
				t("pricing.products.plus.features.support"),
			],
		},
		pro: {
			title: t("pricing.products.pro.title"),
			description: t("pricing.products.pro.description"),
			features: [
				t("pricing.products.pro.features.anotherFeature"),
				t("pricing.products.pro.features.fullSupport"),
			],
		},
		unlimited: {
			title: t("pricing.products.unlimited.title"),
			description: t("pricing.products.unlimited.description"),
			features: [
				t("pricing.products.unlimited.features.students"),
				t("pricing.products.unlimited.features.support"),
			],
		},
		enterprise: {
			title: t("pricing.products.enterprise.title"),
			description: t("pricing.products.enterprise.description"),
			features: [
				t("pricing.products.enterprise.features.unlimitedProjects"),
				t("pricing.products.enterprise.features.enterpriseSupport"),
			],
		},
	};

	return { planData };
}

"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { useTranslations } from "next-intl";
import { CustomFieldList } from "./CustomFieldList";

export function CustomFieldsSettingsPanel() {
  const t = useTranslations();
  const { activeOrganization } = useActiveOrganization();
  const organizationId = activeOrganization?.id ?? "";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("launchclub.customFields.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <CustomFieldList organizationId={organizationId} />
      </CardContent>
    </Card>
  );
}

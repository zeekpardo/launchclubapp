"use client";

import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import type { CustomFieldType } from "@repo/api/modules/custom-fields/types";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  useCustomFields,
  useCustomFieldValues,
  useSetCustomFieldValue,
} from "../hooks/use-custom-fields";
import { CustomFieldInput } from "./CustomFieldInput";

interface CustomFieldsPersonPanelProps {
  personId: string;
}

export function CustomFieldsPersonPanel({ personId }: CustomFieldsPersonPanelProps) {
  const t = useTranslations();
  const { activeOrganization } = useActiveOrganization();
  const organizationId = activeOrganization?.id ?? "";

  const { data: fields } = useCustomFields(organizationId);
  const { data: values } = useCustomFieldValues(organizationId, personId);
  const setValue = useSetCustomFieldValue(organizationId, personId);

  const [localValues, setLocalValues] = useState<Record<string, string | null>>({});
  const [dirty, setDirty] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (values) {
      const map: Record<string, string | null> = {};
      for (const v of values) {
        map[v.customFieldId] = v.value ?? null;
      }
      setLocalValues(map);
    }
  }, [values]);

  if (!fields || fields.length === 0) return null;

  function handleChange(customFieldId: string, value: string | null) {
    setLocalValues((prev) => ({ ...prev, [customFieldId]: value }));
    setDirty((prev) => ({ ...prev, [customFieldId]: true }));
  }

  async function handleSave(customFieldId: string) {
    try {
      await setValue.mutateAsync({
        organizationId,
        customFieldId,
        personId,
        value: localValues[customFieldId] ?? null,
      });
      setDirty((prev) => ({ ...prev, [customFieldId]: false }));
      toastSuccess(t("launchclub.customFields.notifications.valueSaved"));
    } catch {
      toastError(t("launchclub.customFields.notifications.error"));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {t("launchclub.customFields.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map((field) => (
          <div key={field.id} className="space-y-1">
            <label className="font-medium text-sm">
              {field.name}
              {field.required && <span className="ml-1 text-destructive">*</span>}
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <CustomFieldInput
                  type={field.type as CustomFieldType}
                  value={localValues[field.id]}
                  options={field.options}
                  onChange={(val) => handleChange(field.id, val)}
                  customFieldId={field.id}
                  personId={personId}
                />
              </div>
              {dirty[field.id] && field.type !== "FILE" && (
                <Button
                  size="sm"
                  onClick={() => handleSave(field.id)}
                  loading={setValue.isPending}
                >
                  {t("launchclub.customFields.form.save")}
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

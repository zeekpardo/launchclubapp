"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Button } from "@repo/ui/components/button";
import { Skeleton } from "@repo/ui/components/skeleton";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { MoreHorizontalIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useCustomFields, useDeleteCustomField } from "../hooks/use-custom-fields";
import { CustomFieldDialog } from "./CustomFieldDialog";
import { CUSTOM_FIELD_TYPES } from "@repo/api/modules/custom-fields/types";

type FieldType = (typeof CUSTOM_FIELD_TYPES)[number];

interface CustomField {
  id: string;
  name: string;
  type: FieldType;
  required: boolean;
  options: string[];
  order: number;
}

interface CustomFieldListProps {
  organizationId: string;
  /** Label shown above the list */
  title?: string;
  /** Description shown below the title */
  description?: string;
}

export function CustomFieldList({ organizationId, title, description }: CustomFieldListProps) {
  const t = useTranslations();
  const { data: fields, isLoading } = useCustomFields(organizationId);
  const deleteField = useDeleteCustomField(organizationId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | undefined>();

  function handleNew() {
    setEditingField(undefined);
    setDialogOpen(true);
  }

  function handleEdit(field: CustomField) {
    setEditingField(field);
    setDialogOpen(true);
  }

  async function handleDelete(id: string) {
    try {
      await deleteField.mutateAsync({ id });
      toastSuccess(t("launchclub.customFields.notifications.deleted"));
    } catch {
      toastError(t("launchclub.customFields.notifications.error"));
    }
  }

  return (
    <>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          {title && <h3 className="font-semibold text-sm">{title}</h3>}
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        <Button size="sm" onClick={handleNew} className="shrink-0">
          <PlusIcon className="mr-1.5 size-3.5" />
          {t("launchclub.customFields.new")}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : !fields || fields.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("launchclub.customFields.noFields")}
        </p>
      ) : (
        <div className="divide-y rounded-lg border">
          {fields.map((field) => (
            <div
              key={field.id}
              className="flex items-center justify-between px-3 py-2.5"
            >
              <div className="min-w-0">
                <span className="font-medium text-sm">{field.name}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {t(`launchclub.customFields.form.types.${field.type as FieldType}`)}
                </span>
                {field.required && (
                  <span className="ml-1.5 text-xs text-destructive font-medium">required</span>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-7 shrink-0">
                    <MoreHorizontalIcon className="size-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() =>
                      handleEdit({
                        id: field.id,
                        name: field.name,
                        type: field.type as FieldType,
                        required: field.required,
                        options: field.options,
                        order: field.order,
                      })
                    }
                  >
                    <PencilIcon className="mr-2 size-4" />
                    {t("launchclub.customFields.edit")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => handleDelete(field.id)}
                  >
                    <Trash2Icon className="mr-2 size-4" />
                    {t("launchclub.customFields.delete")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}

      <CustomFieldDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        organizationId={organizationId}
        field={editingField}
      />
    </>
  );
}

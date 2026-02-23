"use client";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Skeleton } from "@repo/ui/components/skeleton";
import { toastError } from "@repo/ui/components/toast";
import { PencilIcon, PlusIcon, TrashIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useCustomFields, useUpdateCustomField } from "../hooks/use-custom-fields";
import { ProfileFieldEditorPanel } from "./ProfileFieldEditorPanel";

interface ProfileField {
  id: string;
  name: string;
  type: string;
  required: boolean;
  collectInApplication: boolean;
}

interface AreaProfileFieldPickerProps {
  organizationId: string;
  organizationSlug: string;
  title?: string;
  description?: string;
}

export function AreaProfileFieldPicker({
  organizationId,
  organizationSlug,
  title,
  description,
}: AreaProfileFieldPickerProps) {
  const { data: allFields = [], isLoading } = useCustomFields(organizationId);
  const updateField = useUpdateCustomField(organizationId);
  const [selectedField, setSelectedField] = useState<ProfileField | null>(null);

  const linked = (allFields as ProfileField[]).filter((f) => f.collectInApplication);
  const available = (allFields as ProfileField[]).filter((f) => !f.collectInApplication);

  const handleAdd = async (fieldId: string) => {
    try {
      await updateField.mutateAsync({ id: fieldId, collectInApplication: true });
    } catch {
      toastError("Failed to add profile field.");
    }
  };

  const handleRemove = async (fieldId: string) => {
    if (selectedField?.id === fieldId) setSelectedField(null);
    try {
      await updateField.mutateAsync({ id: fieldId, collectInApplication: false });
    } catch {
      toastError("Failed to remove profile field.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          {title && <h3 className="font-semibold text-sm">{title}</h3>}
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="shrink-0" disabled={available.length === 0 && !isLoading}>
              <PlusIcon className="mr-1.5 size-3.5" />
              Add Profile Field
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {available.length === 0 ? (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                All fields are already added, or no fields exist.{" "}
                <Link
                  href={`/app/${organizationSlug}/settings/custom-fields`}
                  className="underline"
                >
                  Manage fields
                </Link>
              </div>
            ) : (
              available.map((f) => (
                <DropdownMenuItem key={f.id} onClick={() => handleAdd(f.id)}>
                  <span className="flex-1">{f.name}</span>
                  <span className="text-xs text-muted-foreground capitalize ml-2">
                    {f.type.toLowerCase()}
                  </span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : linked.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No profile fields added yet. Click "Add Profile Field" to pick from your{" "}
          <Link
            href={`/app/${organizationSlug}/settings/custom-fields`}
            className="underline hover:text-foreground"
          >
            existing custom fields
          </Link>
          .
        </p>
      ) : (
        <div className={`grid gap-4 ${selectedField ? "grid-cols-1 md:grid-cols-2" : ""}`}>
          <div className="space-y-2">
            {linked.map((field) => (
              <div
                key={field.id}
                className={`flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5 ${
                  selectedField?.id === field.id ? "ring-2 ring-primary" : ""
                }`}
              >
                <button
                  type="button"
                  className="flex-1 min-w-0 text-left"
                  onClick={() =>
                    setSelectedField(selectedField?.id === field.id ? null : field)
                  }
                >
                  <p className="text-sm font-medium truncate">{field.name}</p>
                </button>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge status="info" className="text-xs capitalize">
                    {field.type.toLowerCase()}
                  </Badge>
                  {field.required && (
                    <Badge status="error" className="text-xs">
                      Required
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() =>
                      setSelectedField(selectedField?.id === field.id ? null : field)
                    }
                  >
                    <PencilIcon className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-destructive hover:text-destructive"
                    onClick={() => handleRemove(field.id)}
                  >
                    <TrashIcon className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {selectedField && (
            <ProfileFieldEditorPanel
              field={selectedField}
              organizationId={organizationId}
              availableFields={available}
              onClose={() => setSelectedField(null)}
            />
          )}
        </div>
      )}
    </div>
  );
}

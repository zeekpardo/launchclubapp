"use client";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Button } from "@repo/ui/components/button";
import { Skeleton } from "@repo/ui/components/skeleton";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { GripVerticalIcon, MoreHorizontalIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useCustomFields, useDeleteCustomField, useReorderCustomFields } from "../hooks/use-custom-fields";
import { CustomFieldDialog } from "./CustomFieldDialog";
import { CUSTOM_FIELD_TYPES } from "@repo/api/modules/custom-fields/types";

type FieldType = (typeof CUSTOM_FIELD_TYPES)[number];

interface CustomField {
  id: string;
  name: string;
  nameEs?: string | null;
  type: FieldType;
  required: boolean;
  options: string[];
  order: number;
}

interface SortableRowProps {
  field: CustomField;
  onEdit: (field: CustomField) => void;
  onDelete: (id: string) => void;
}

function SortableRow({ field, onEdit, onDelete }: SortableRowProps) {
  const t = useTranslations();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between px-3 py-2.5 bg-background"
    >
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0 touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVerticalIcon className="size-4" />
        </button>
        <div className="min-w-0">
          <span className="font-medium text-sm">{field.name}</span>
          <span className="ml-2 text-xs text-muted-foreground">
            {t(`launchclub.customFields.form.types.${field.type as FieldType}`)}
          </span>
          {field.required && (
            <span className="ml-1.5 text-xs text-destructive font-medium">required</span>
          )}
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-7 shrink-0">
            <MoreHorizontalIcon className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(field)}>
            <PencilIcon className="mr-2 size-4" />
            {t("launchclub.customFields.edit")}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => onDelete(field.id)}
          >
            <Trash2Icon className="mr-2 size-4" />
            {t("launchclub.customFields.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

interface CustomFieldListProps {
  organizationId: string;
  title?: string;
  description?: string;
}

export function CustomFieldList({ organizationId, title, description }: CustomFieldListProps) {
  const t = useTranslations();
  const { data: fields, isLoading } = useCustomFields(organizationId);
  const deleteField = useDeleteCustomField(organizationId);
  const reorderFields = useReorderCustomFields(organizationId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | undefined>();
  const [localFields, setLocalFields] = useState<CustomField[]>([]);

  useEffect(() => {
    if (fields) {
      setLocalFields(fields as CustomField[]);
    }
  }, [fields]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

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

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localFields.findIndex((f) => f.id === active.id);
    const newIndex = localFields.findIndex((f) => f.id === over.id);
    const reordered = arrayMove(localFields, oldIndex, newIndex);
    setLocalFields(reordered);

    try {
      await reorderFields.mutateAsync({
        organizationId,
        ids: reordered.map((f) => f.id),
      });
    } catch {
      setLocalFields(fields as CustomField[]);
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
      ) : localFields.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("launchclub.customFields.noFields")}
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={localFields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            <div className="divide-y rounded-lg border overflow-hidden">
              {localFields.map((field) => (
                <SortableRow
                  key={field.id}
                  field={field}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
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

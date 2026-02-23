"use client";

import { Checkbox } from "@repo/ui/components/checkbox";
import { Input } from "@repo/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { Textarea } from "@repo/ui/components/textarea";
import type { CustomFieldType } from "@repo/api/modules/custom-fields/types";

interface CustomFieldInputProps {
  type: CustomFieldType;
  value: string | null | undefined;
  options?: string[];
  onChange: (value: string | null) => void;
  disabled?: boolean;
}

export function CustomFieldInput({
  type,
  value,
  options = [],
  onChange,
  disabled,
}: CustomFieldInputProps) {
  switch (type) {
    case "TEXTAREA":
      return (
        <Textarea
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={3}
        />
      );
    case "NUMBER":
      return (
        <Input
          type="number"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      );
    case "CHECKBOX":
      return (
        <Checkbox
          checked={value === "true"}
          onCheckedChange={(checked) => onChange(checked ? "true" : "false")}
          disabled={disabled}
        />
      );
    case "SELECT":
      return (
        <Select value={value ?? ""} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger>
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case "DATE":
      return (
        <Input
          type="date"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      );
    case "FILE":
      return (
        <div className="text-sm text-muted-foreground">
          {value ? (
            <a
              href={`/api/custom-fields/download?path=${encodeURIComponent(value)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              View file
            </a>
          ) : (
            <span>No file uploaded</span>
          )}
        </div>
      );
    default:
      return (
        <Input
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      );
  }
}

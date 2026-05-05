"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useCustomFields(organizationId: string) {
  return useQuery(
    orpc.customFields.list.queryOptions({
      input: { organizationId },
      enabled: !!organizationId,
    }),
  );
}

export function useCustomFieldValues(organizationId: string, personId: string) {
  return useQuery(
    orpc.customFields.listValues.queryOptions({
      input: { organizationId, personId },
      enabled: !!organizationId && !!personId,
    }),
  );
}

export function useCreateCustomField(organizationId: string) {
  const queryClient = useQueryClient();
  return useMutation(
    orpc.customFields.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          orpc.customFields.list.queryOptions({ input: { organizationId } }),
        );
      },
    }),
  );
}

export function useUpdateCustomField(organizationId: string) {
  const queryClient = useQueryClient();
  return useMutation(
    orpc.customFields.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          orpc.customFields.list.queryOptions({ input: { organizationId } }),
        );
      },
    }),
  );
}

export function useDeleteCustomField(organizationId: string) {
  const queryClient = useQueryClient();
  return useMutation(
    orpc.customFields.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          orpc.customFields.list.queryOptions({ input: { organizationId } }),
        );
      },
    }),
  );
}

export function useReorderCustomFields(organizationId: string) {
  const queryClient = useQueryClient();
  return useMutation(
    orpc.customFields.reorder.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          orpc.customFields.list.queryOptions({ input: { organizationId } }),
        );
      },
    }),
  );
}

export function useSetCustomFieldValue(organizationId: string, personId: string) {
  const queryClient = useQueryClient();
  return useMutation(
    orpc.customFields.setValue.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          orpc.customFields.listValues.queryOptions({ input: { organizationId, personId } }),
        );
      },
    }),
  );
}

"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type PurchaseRequest = NonNullable<
  ReturnType<typeof usePurchaseRequests>["data"]
>[number];

export function usePurchaseRequests(groupId: string) {
  return useQuery(
    orpc.purchaseRequests.list.queryOptions({
      input: { groupId },
      enabled: !!groupId,
    }),
  );
}

export function useAllPurchaseRequests() {
  const { activeOrganization } = useActiveOrganization();
  return useQuery(
    orpc.purchaseRequests.listAll.queryOptions({
      input: { organizationId: activeOrganization?.id ?? "" },
      enabled: !!activeOrganization?.id,
    }),
  );
}

export function usePendingPurchaseRequestCount() {
  const { activeOrganization } = useActiveOrganization();
  return useQuery(
    orpc.purchaseRequests.listAll.queryOptions({
      input: { organizationId: activeOrganization?.id ?? "" },
      enabled: !!activeOrganization?.id,
      select: (data) => data.filter((r) => r.status === "PENDING").length,
    }),
  );
}

export function useCreatePurchaseRequest(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation(
    orpc.purchaseRequests.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          orpc.purchaseRequests.list.queryOptions({ input: { groupId } }),
        );
      },
    }),
  );
}

export function useUpdatePurchaseRequest(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation(
    orpc.purchaseRequests.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          orpc.purchaseRequests.list.queryOptions({ input: { groupId } }),
        );
      },
    }),
  );
}

export function useDeletePurchaseRequest(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation(
    orpc.purchaseRequests.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          orpc.purchaseRequests.list.queryOptions({ input: { groupId } }),
        );
      },
    }),
  );
}

export function useReviewPurchaseRequest() {
  const queryClient = useQueryClient();
  const { activeOrganization } = useActiveOrganization();
  return useMutation(
    orpc.purchaseRequests.review.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          orpc.purchaseRequests.listAll.queryOptions({
            input: { organizationId: activeOrganization?.id ?? "" },
          }),
        );
      },
    }),
  );
}

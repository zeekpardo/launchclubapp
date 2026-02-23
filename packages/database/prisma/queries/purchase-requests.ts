import { db } from "../client";

const purchaseRequestInclude = {
  requestedBy: { select: { id: true, name: true, email: true } },
  reviewedBy: { select: { id: true, name: true } },
  group: { select: { id: true, name: true, site: { include: { area: true } } } },
} as const;

export async function getPurchaseRequestsByGroup(groupId: string) {
  return db.purchaseRequest.findMany({
    where: { groupId },
    include: purchaseRequestInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function getPurchaseRequestsByOrganization(organizationId: string) {
  return db.purchaseRequest.findMany({
    where: { group: { site: { area: { organizationId } } } },
    include: purchaseRequestInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function getPurchaseRequestById(id: string) {
  return db.purchaseRequest.findUnique({
    where: { id },
    include: purchaseRequestInclude,
  });
}

export async function createPurchaseRequest(data: {
  groupId: string;
  item: string;
  description?: string;
  url?: string;
  amount: number;
  category: string;
  justification: string;
  requestedById: string;
}) {
  return db.purchaseRequest.create({ data, include: purchaseRequestInclude });
}

export async function updatePurchaseRequest(
  id: string,
  data: Partial<{
    item: string;
    description: string | null;
    url: string | null;
    amount: number;
    category: string;
    justification: string;
  }>,
) {
  return db.purchaseRequest.update({
    where: { id },
    data,
    include: purchaseRequestInclude,
  });
}

export async function reviewPurchaseRequest(
  id: string,
  status: "APPROVED" | "DECLINED" | "PENDING",
  reviewedById: string,
  reviewNote?: string,
) {
  return db.purchaseRequest.update({
    where: { id },
    data:
      status === "PENDING"
        ? { status, reviewedById: null, reviewedAt: null, reviewNote: null }
        : { status, reviewedById, reviewedAt: new Date(), reviewNote },
    include: purchaseRequestInclude,
  });
}

export async function deletePurchaseRequest(id: string) {
  return db.purchaseRequest.delete({ where: { id } });
}

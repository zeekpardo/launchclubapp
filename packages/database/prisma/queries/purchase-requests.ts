import { db } from "../client";

const purchaseRequestInclude = {
  requestedBy: { select: { id: true, name: true, email: true } },
  reviewedBy: { select: { id: true, name: true } },
  group: { select: { id: true, name: true, site: { include: { area: true } } } },
  items: {
    orderBy: { createdAt: "asc" as const },
    select: {
      id: true,
      item: true,
      url: true,
      amount: true,
      quantity: true,
      category: true,
    },
  },
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
  name: string;
  description: string;
  dueDate?: Date | null;
  requestedById: string;
  items: Array<{
    item: string;
    url?: string;
    amount: number;
    quantity: number;
    category: string;
  }>;
}) {
  const { items, ...header } = data;
  return db.purchaseRequest.create({
    data: { ...header, items: { create: items } },
    include: purchaseRequestInclude,
  });
}

export async function updatePurchaseRequest(
  id: string,
  data: {
    name?: string;
    description?: string;
    dueDate?: Date | null;
    items?: Array<{
      item: string;
      url?: string | null;
      amount: number;
      quantity: number;
      category: string;
    }>;
  },
) {
  return db.$transaction(async (tx) => {
    if (data.items !== undefined) {
      await tx.purchaseRequestItem.deleteMany({ where: { purchaseRequestId: id } });
    }
    return tx.purchaseRequest.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.dueDate !== undefined ? { dueDate: data.dueDate } : {}),
        ...(data.items !== undefined ? { items: { create: data.items } } : {}),
      },
      include: purchaseRequestInclude,
    });
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

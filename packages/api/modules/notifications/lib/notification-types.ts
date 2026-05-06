export const NOTIFICATION_TYPES = {
  MENTION: {
    title: (authorName: string) => `${authorName} mentioned you`,
    message: (personName: string) =>
      `You were mentioned in a note about ${personName}`,
  },
  APPLICATION_SUBMITTED: {
    title: () => "New application submitted",
    message: (name: string) => `${name} submitted an application`,
  },
  PURCHASE_REQUEST_STATUS_CHANGED: {
    title: (status: string) => `Purchase request ${status.toLowerCase()}`,
    message: (name: string, status: string) =>
      `Your purchase request "${name}" was ${status.toLowerCase()}`,
  },
} as const;

export type NotificationType = keyof typeof NOTIFICATION_TYPES;

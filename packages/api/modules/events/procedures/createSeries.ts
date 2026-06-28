import { batchCreateEvents } from "@repo/database";
import { protectedProcedure } from "../../../orpc/procedures";
import { authorizeEventGroups } from "../lib/authorize";
import { type EventRecurrence, createEventSeriesSchema } from "../types";

const MAX_EVENTS = 200;

function toDateTime(date: string, time: string): Date {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, m] = time.split(":").map(Number);
  return new Date(y, mo - 1, d, h, m);
}

function getMonthlyWeekdayDate(from: Date): Date {
  const dayOfWeek = from.getDay();
  const nthOccurrence = Math.ceil(from.getDate() / 7);
  const next = new Date(from.getFullYear(), from.getMonth() + 1, 1);
  while (next.getDay() !== dayOfWeek) next.setDate(next.getDate() + 1);
  next.setDate(next.getDate() + (nthOccurrence - 1) * 7);
  return next;
}

function advanceDate(current: Date, recurrence: EventRecurrence): Date {
  const next = new Date(current);
  if (recurrence === "daily") {
    next.setDate(next.getDate() + 1);
  } else if (recurrence === "weekday") {
    do { next.setDate(next.getDate() + 1); } while (next.getDay() === 0 || next.getDay() === 6);
  } else if (recurrence === "weekly") {
    next.setDate(next.getDate() + 7);
  } else if (recurrence === "biweekly") {
    next.setDate(next.getDate() + 14);
  } else if (recurrence === "monthly_weekday") {
    return getMonthlyWeekdayDate(next);
  } else if (recurrence === "monthly_date") {
    next.setMonth(next.getMonth() + 1);
  } else if (recurrence === "yearly") {
    next.setFullYear(next.getFullYear() + 1);
  }
  return next;
}

function generateSeriesDates(
  startDate: string,
  endDate: string,
  startTime: string,
  endTime: string | undefined,
  recurrence: EventRecurrence,
): Array<{ startsAt: Date; endsAt?: Date }> {
  if (recurrence === "never") {
    return [
      {
        startsAt: toDateTime(startDate, startTime),
        endsAt: endTime ? toDateTime(startDate, endTime) : undefined,
      },
    ];
  }

  const [sy, sm, sd] = startDate.split("-").map(Number);
  const endLimit = new Date(endDate + "T23:59:59");
  const results: Array<{ startsAt: Date; endsAt?: Date }> = [];
  let current = new Date(sy, sm - 1, sd);

  while (current <= endLimit && results.length < MAX_EVENTS) {
    const y = current.getFullYear();
    const mo = String(current.getMonth() + 1).padStart(2, "0");
    const day = String(current.getDate()).padStart(2, "0");
    const dateStr = `${y}-${mo}-${day}`;

    results.push({
      startsAt: toDateTime(dateStr, startTime),
      endsAt: endTime ? toDateTime(dateStr, endTime) : undefined,
    });

    current = advanceDate(current, recurrence);
  }

  return results;
}

export const createEventSeriesProcedure = protectedProcedure
  .route({ method: "POST", path: "/events/series", tags: ["Events"] })
  .input(createEventSeriesSchema)
  .handler(async ({ input, context }) => {
    // Authorize EVERY target group (not just the first) since every event in
    // the series is attached to all of them.
    await authorizeEventGroups(context.user.id, context.user.role, input.groupIds);

    const dates = generateSeriesDates(
      input.startDate,
      input.endDate,
      input.startTime,
      input.endTime,
      input.recurrence,
    );

    const result = await batchCreateEvents(
      dates.map(({ startsAt, endsAt }) => ({
        groupIds: input.groupIds,
        name: input.name,
        description: input.description,
        eventType: input.eventType,
        guestName: input.guestName,
        guestCompany: input.guestCompany,
        guestIndustry: input.guestIndustry,
        startsAt,
        endsAt,
      })),
    );

    return { count: result.count };
  });

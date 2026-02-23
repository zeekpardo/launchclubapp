import { createEventProcedure } from "./procedures/create";
import { createEventSeriesProcedure } from "./procedures/createSeries";
import { deleteEventProcedure } from "./procedures/delete";
import { getEvent } from "./procedures/get";
import { listEvents } from "./procedures/list";
import { listEventsByOrg } from "./procedures/listByOrg";
import { updateEventProcedure } from "./procedures/update";

export const eventsRouter = {
  list: listEvents,
  listByOrg: listEventsByOrg,
  get: getEvent,
  create: createEventProcedure,
  createSeries: createEventSeriesProcedure,
  update: updateEventProcedure,
  delete: deleteEventProcedure,
};

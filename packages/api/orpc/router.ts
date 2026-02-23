import type { RouterClient } from "@orpc/server";
import { adminRouter } from "../modules/admin/router";
import { applicationsRouter } from "../modules/applications/router";
import { aiRouter } from "../modules/ai/router";
import { areasRouter } from "../modules/areas/router";
import { attendanceRouter } from "../modules/attendance/router";
import { contactRouter } from "../modules/contact/router";
import { eventsRouter } from "../modules/events/router";
import { groupsRouter } from "../modules/groups/router";
import { guardiansRouter } from "../modules/guardians/router";
import { householdsRouter } from "../modules/households/router";
import { resourcesRouter } from "../modules/resources/router";
import { purchaseRequestsRouter } from "../modules/purchase-requests/router";
import { customFieldsRouter } from "../modules/custom-fields/router";
import { formBuilderRouter } from "../modules/form-builder/router";
import { newsletterRouter } from "../modules/newsletter/router";
import { peopleRouter } from "../modules/people/router";
import { organizationsRouter } from "../modules/organizations/router";
import { paymentsRouter } from "../modules/payments/router";
import { sitesRouter } from "../modules/sites/router";
import { usersRouter } from "../modules/users/router";
import { publicProcedure } from "./procedures";

export const router = publicProcedure.router({
	admin: adminRouter,
	newsletter: newsletterRouter,
	contact: contactRouter,
	organizations: organizationsRouter,
	users: usersRouter,
	payments: paymentsRouter,
	ai: aiRouter,
	areas: areasRouter,
	sites: sitesRouter,
	groups: groupsRouter,
	applications: applicationsRouter,
	events: eventsRouter,
	attendance: attendanceRouter,
	households: householdsRouter,
	people: peopleRouter,
	guardians: guardiansRouter,
	resources: resourcesRouter,
	purchaseRequests: purchaseRequestsRouter,
	customFields: customFieldsRouter,
	formBuilder: formBuilderRouter,
});

export type ApiRouterClient = RouterClient<typeof router>;

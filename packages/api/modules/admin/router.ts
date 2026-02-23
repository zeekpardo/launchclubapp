import { findOrganization } from "./procedures/find-organization";
import { listAllApplications } from "./procedures/list-all-applications";
import { listAllPeople } from "./procedures/list-all-people";
import { listOrganizations } from "./procedures/list-organizations";
import { listUsers } from "./procedures/list-users";

export const adminRouter = {
	users: {
		list: listUsers,
	},
	organizations: {
		list: listOrganizations,
		find: findOrganization,
	},
	applications: {
		list: listAllApplications,
	},
	people: {
		list: listAllPeople,
	},
};

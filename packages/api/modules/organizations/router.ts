import { createLogoUploadUrl } from "./procedures/create-logo-upload-url";
import { createMember } from "./procedures/create-member";
import { generateOrganizationSlug } from "./procedures/generate-organization-slug";
import { getMemberRole } from "./procedures/get-member-role";
import { getMyLcRole } from "./procedures/get-my-lc-role";
import { listOrgGroups } from "./procedures/list-org-groups";
import { listOrgSites } from "./procedures/list-org-sites";
import { saveInvitationAssignment } from "./procedures/save-invitation-assignment";
import { updateMemberRole } from "./procedures/update-member-role";

export const organizationsRouter = {
	generateSlug: generateOrganizationSlug,
	createLogoUploadUrl,
	createMember,
	listSites: listOrgSites,
	listGroups: listOrgGroups,
	getMemberRole,
	getMyLcRole,
	saveInvitationAssignment,
	updateMemberRole,
};

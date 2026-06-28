import { mentorApplicationFileUploadUrl } from "./procedures/file-upload-url";
import { getMentorApplication } from "./procedures/get";
import { listMentorApplications } from "./procedures/list";
import { reviewMentorApplicationProcedure } from "./procedures/review";
import { submitMentorApplication } from "./procedures/submit";

export const mentorApplicationsRouter = {
	submit: submitMentorApplication,
	list: listMentorApplications,
	get: getMentorApplication,
	review: reviewMentorApplicationProcedure,
	fileUploadUrl: mentorApplicationFileUploadUrl,
};

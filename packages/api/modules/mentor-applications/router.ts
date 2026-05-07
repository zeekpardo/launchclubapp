import { submitMentorApplication } from "./procedures/submit";
import { listMentorApplications } from "./procedures/list";
import { getMentorApplication } from "./procedures/get";
import { reviewMentorApplicationProcedure } from "./procedures/review";
import { mentorApplicationFileUploadUrl } from "./procedures/file-upload-url";

export const mentorApplicationsRouter = {
  submit: submitMentorApplication,
  list: listMentorApplications,
  get: getMentorApplication,
  review: reviewMentorApplicationProcedure,
  fileUploadUrl: mentorApplicationFileUploadUrl,
};

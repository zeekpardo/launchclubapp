import { createAcademicPhotoUploadUrlProcedure } from "./procedures/create-photo-upload-url";
import { deleteAcademicRecordProcedure } from "./procedures/delete";
import { gpaTrendProcedure } from "./procedures/gpa-trend";
import { listAcademicRecordsProcedure } from "./procedures/list";
import { upsertAcademicRecordProcedure } from "./procedures/upsert";

export const academicRecordsRouter = {
	list: listAcademicRecordsProcedure,
	upsert: upsertAcademicRecordProcedure,
	delete: deleteAcademicRecordProcedure,
	photoUploadUrl: createAcademicPhotoUploadUrlProcedure,
	gpaTrend: gpaTrendProcedure,
};

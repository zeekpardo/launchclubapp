import { deleteAcademicRecordProcedure } from "./procedures/delete";
import { gpaTrendProcedure } from "./procedures/gpa-trend";
import { listAcademicRecordsProcedure } from "./procedures/list";
import { upsertAcademicRecordProcedure } from "./procedures/upsert";

export const academicRecordsRouter = {
	list: listAcademicRecordsProcedure,
	upsert: upsertAcademicRecordProcedure,
	delete: deleteAcademicRecordProcedure,
	gpaTrend: gpaTrendProcedure,
};

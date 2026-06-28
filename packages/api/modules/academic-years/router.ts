import { createAcademicYearProcedure } from "./procedures/create";
import { deleteAcademicYearProcedure } from "./procedures/delete";
import { listAcademicYearsProcedure } from "./procedures/list";
import { updateAcademicYearProcedure } from "./procedures/update";

export const academicYearsRouter = {
	list: listAcademicYearsProcedure,
	create: createAcademicYearProcedure,
	update: updateAcademicYearProcedure,
	delete: deleteAcademicYearProcedure,
};

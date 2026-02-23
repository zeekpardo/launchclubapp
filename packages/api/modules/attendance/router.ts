import { attendanceByGroup } from "./procedures/byGroup";
import { listAttendance } from "./procedures/list";
import { recordAttendance } from "./procedures/record";
import { attendanceReport } from "./procedures/report";

export const attendanceRouter = {
  byGroup: attendanceByGroup,
  list: listAttendance,
  record: recordAttendance,
  report: attendanceReport,
};

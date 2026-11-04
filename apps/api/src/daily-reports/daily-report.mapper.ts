import { defineSerializer } from '../common/index.js';

/** report_date 是 date 列（UTC 零点），输出成 YYYY-MM-DD */
export const dailyReportSerializer = defineSerializer({
  date: ['report_date'],
});

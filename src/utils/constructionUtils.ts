import { Project, MainCategory, SubTask, PeriodHeader, TaskStatus } from '../types';

/**
 * Format currency in THB
 */
export function formatTHB(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Generate Period Headers (Weeks or Months)
 */
export function generatePeriodHeaders(
  startDateStr: string,
  totalPeriods: number,
  periodType: 'weekly' | 'monthly'
): PeriodHeader[] {
  const headers: PeriodHeader[] = [];
  const start = new Date(startDateStr || new Date().toISOString().split('T')[0]);

  const thaiMonthsShort = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];

  for (let i = 1; i <= totalPeriods; i++) {
    if (periodType === 'weekly') {
      const weekStart = new Date(start);
      weekStart.setDate(start.getDate() + (i - 1) * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const startDay = weekStart.getDate();
      const startMonth = thaiMonthsShort[weekStart.getMonth()];
      const endDay = weekEnd.getDate();
      const endMonth = thaiMonthsShort[weekEnd.getMonth()];

      const sub = startMonth === endMonth 
        ? `${startDay}-${endDay} ${startMonth}` 
        : `${startDay} ${startMonth} - ${endDay} ${endMonth}`;

      headers.push({
        periodIndex: i,
        label: `สัปดาห์ที่ ${i}`,
        subLabel: sub,
      });
    } else {
      // Monthly
      const monthDate = new Date(start.getFullYear(), start.getMonth() + (i - 1), 1);
      const monthName = thaiMonthsShort[monthDate.getMonth()];
      const thaiYearShort = (monthDate.getFullYear() + 543).toString().slice(-2);

      headers.push({
        periodIndex: i,
        label: `${monthName} ${thaiYearShort}`,
        subLabel: `เดือนที่ ${i}`,
      });
    }
  }

  return headers;
}

/**
 * Calculate actual dates (Start Date, End Date, Duration Text) from start/end periods
 */
export function getPeriodDates(
  startDateStr: string,
  startPeriod: number,
  endPeriod: number,
  periodType: 'weekly' | 'monthly',
  subTaskStartDate?: string,
  subTaskEndDate?: string
) {
  if (subTaskStartDate && subTaskEndDate) {
    const sDate = new Date(subTaskStartDate);
    const eDate = new Date(subTaskEndDate);
    if (!isNaN(sDate.getTime()) && !isNaN(eDate.getTime())) {
      const diffTime = eDate.getTime() - sDate.getTime();
      const durationDays = Math.max(1, Math.round(diffTime / (24 * 60 * 60 * 1000)) + 1);

      const formatThaiDate = (d: Date) => {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const yearBE = d.getFullYear() + 543;
        return `${day}/${month}/${yearBE}`;
      };

      const formatISODate = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      return {
        startDate: formatThaiDate(sDate),
        endDate: formatThaiDate(eDate),
        startDateISO: formatISODate(sDate),
        endDateISO: formatISODate(eDate),
        durationDays,
        durationText: `${durationDays} วัน`,
      };
    }
  }

  const projStart = new Date(startDateStr || new Date().toISOString().split('T')[0]);
  if (isNaN(projStart.getTime())) {
    return {
      startDate: '-',
      endDate: '-',
      startDateISO: '',
      endDateISO: '',
      durationDays: 0,
      durationText: '-',
    };
  }

  let startDate: Date;
  let endDate: Date;
  let durationDays = 0;
  let durationText = '';

  if (periodType === 'weekly') {
    const startDaysOffset = (Math.max(1, startPeriod) - 1) * 7;
    startDate = new Date(projStart.getTime() + startDaysOffset * 24 * 60 * 60 * 1000);

    const endDaysOffset = Math.max(1, endPeriod) * 7 - 1;
    endDate = new Date(projStart.getTime() + endDaysOffset * 24 * 60 * 60 * 1000);

    durationDays = (Math.max(1, endPeriod) - Math.max(1, startPeriod) + 1) * 7;
    durationText = `${durationDays} วัน`;
  } else {
    const startMonthOffset = Math.max(1, startPeriod) - 1;
    startDate = new Date(projStart.getFullYear(), projStart.getMonth() + startMonthOffset, 1);

    const endMonthOffset = Math.max(1, endPeriod);
    endDate = new Date(projStart.getFullYear(), projStart.getMonth() + endMonthOffset, 0);

    const diffTime = endDate.getTime() - startDate.getTime();
    durationDays = Math.max(1, Math.round(diffTime / (24 * 60 * 60 * 1000)) + 1);
    durationText = `${durationDays} วัน`;
  }

  const formatThaiDate = (d: Date) => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const yearBE = d.getFullYear() + 543;
    return `${day}/${month}/${yearBE}`;
  };

  const formatISODate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return {
    startDate: formatThaiDate(startDate),
    endDate: formatThaiDate(endDate),
    startDateISO: formatISODate(startDate),
    endDateISO: formatISODate(endDate),
    durationDays,
    durationText,
  };
}

/**
 * Calculate start/end periods given project start date, selected start/end date ISO, and period type
 */
export function convertDatesToPeriods(
  projectStartDateStr: string,
  startDateISO: string,
  endDateISO: string,
  periodType: 'weekly' | 'monthly'
) {
  const projStart = new Date(projectStartDateStr || new Date().toISOString().split('T')[0]);
  const startDate = new Date(startDateISO);
  const endDate = new Date(endDateISO);

  if (isNaN(projStart.getTime()) || isNaN(startDate.getTime())) {
    return { startPeriod: 1, endPeriod: 2 };
  }

  let startPeriod = 1;
  let endPeriod = 1;

  if (periodType === 'weekly') {
    const startDiffDays = Math.round((startDate.getTime() - projStart.getTime()) / (24 * 60 * 60 * 1000));
    startPeriod = Math.max(1, Math.floor(startDiffDays / 7) + 1);

    if (!isNaN(endDate.getTime())) {
      const endDiffDays = Math.round((endDate.getTime() - projStart.getTime()) / (24 * 60 * 60 * 1000));
      endPeriod = Math.max(startPeriod, Math.floor(endDiffDays / 7) + 1);
    } else {
      endPeriod = startPeriod;
    }
  } else {
    const startMonthOffset = (startDate.getFullYear() - projStart.getFullYear()) * 12 + (startDate.getMonth() - projStart.getMonth());
    startPeriod = Math.max(1, startMonthOffset + 1);

    if (!isNaN(endDate.getTime())) {
      const endMonthOffset = (endDate.getFullYear() - projStart.getFullYear()) * 12 + (endDate.getMonth() - projStart.getMonth());
      endPeriod = Math.max(startPeriod, endMonthOffset + 1);
    } else {
      endPeriod = startPeriod;
    }
  }

  return { startPeriod, endPeriod };
}

/**
 * Calculate SubTask status based on progress and current period
 */
export function calculateTaskStatus(task: SubTask): TaskStatus {
  if (task.actualProgress >= 100) return 'completed';
  if (task.actualProgress > 0) {
    if (task.actualProgress < task.plannedProgress - 10) return 'delayed';
    return 'in_progress';
  }
  if (task.plannedProgress > 0 && task.actualProgress === 0) return 'delayed';
  return 'not_started';
}

/**
 * Calculate Parent Category Progress & Total Weight
 */
export function getCategoryMetrics(category: MainCategory) {
  if (!category.subTasks || category.subTasks.length === 0) {
    return { actualProgress: 0, plannedProgress: 0, budget: 0 };
  }

  const budget = category.subTasks.reduce((sum, task) => sum + (task.budget || 0), 0);

  let weightedActual = 0;
  let weightedPlanned = 0;
  let totalW = 0;

  category.subTasks.forEach((task) => {
    const w = (task.budget || 0) > 0 ? (task.budget || 0) : 1;
    totalW += w;
    weightedActual += (task.actualProgress || 0) * w;
    weightedPlanned += (task.plannedProgress || 0) * w;
  });

  const actualProgress = totalW > 0 ? weightedActual / totalW : 0;
  const plannedProgress = totalW > 0 ? weightedPlanned / totalW : 0;

  return {
    actualProgress: Math.round(actualProgress * 10) / 10,
    plannedProgress: Math.round(plannedProgress * 10) / 10,
    budget,
  };
}

/**
 * Calculate Overall Project Progress Metrics
 */
export function getProjectSummary(project: Project) {
  let totalWeight = 0;
  let weightedActualProgress = 0;
  let weightedPlannedProgress = 0;
  let totalCalculatedBudget = 0;
  let totalSubTasksCount = 0;
  let completedTasksCount = 0;
  let delayedTasksCount = 0;
  let inProgressTasksCount = 0;

  project.categories.forEach((cat) => {
    cat.subTasks.forEach((task) => {
      totalSubTasksCount++;
      const w = (task.budget || 0) > 0 ? (task.budget || 0) : 1;
      totalWeight += w;
      weightedActualProgress += (task.actualProgress || 0) * w;
      weightedPlannedProgress += (task.plannedProgress || 0) * w;
      totalCalculatedBudget += task.budget || 0;

      const status = calculateTaskStatus(task);
      if (status === 'completed') completedTasksCount++;
      else if (status === 'delayed') delayedTasksCount++;
      else if (status === 'in_progress') inProgressTasksCount++;
    });
  });

  const overallActualProgress = totalWeight > 0 ? weightedActualProgress / totalWeight : 0;
  const overallPlannedProgress = totalWeight > 0 ? weightedPlannedProgress / totalWeight : 0;

  return {
    totalWeight: 100,
    overallActualProgress: Math.min(100, Math.max(0, Math.round(overallActualProgress * 10) / 10)),
    overallPlannedProgress: Math.min(100, Math.max(0, Math.round(overallPlannedProgress * 10) / 10)),
    totalCalculatedBudget,
    totalSubTasksCount,
    completedTasksCount,
    delayedTasksCount,
    inProgressTasksCount,
    progressDiff: Math.round((overallActualProgress - overallPlannedProgress) * 10) / 10,
  };
}

/**
 * Calculate S-Curve Accumulated Data for Graph
 */
export function calculateSCurveData(project: Project) {
  const periodCount = project.totalPeriods || 12;
  const periodHeaders = generatePeriodHeaders(project.startDate, periodCount, project.periodType);

  let cumulativePlannedWeight = 0;
  let cumulativeActualWeight = 0;

  let totalWeight = 0;
  project.categories.forEach((cat) => {
    cat.subTasks.forEach((task) => {
      totalWeight += (task.budget || 0) > 0 ? (task.budget || 0) : 1;
    });
  });
  if (totalWeight === 0) totalWeight = 100;

  const curveData = periodHeaders.map((header) => {
    const idx = header.periodIndex;

    let periodPlannedVal = 0;
    let periodActualVal = 0;

    project.categories.forEach((cat) => {
      cat.subTasks.forEach((task) => {
        const taskSpan = Math.max(1, (task.endPeriod - task.startPeriod + 1));
        const taskW = (task.budget || 0) > 0 ? (task.budget || 0) : 1;

        if (idx >= task.startPeriod && idx <= task.endPeriod) {
          const plannedPerPeriod = (taskW * (task.plannedProgress / 100)) / taskSpan;
          periodPlannedVal += plannedPerPeriod;

          const actualPerPeriod = (taskW * (task.actualProgress / 100)) / taskSpan;
          periodActualVal += actualPerPeriod;
        }
      });
    });

    cumulativePlannedWeight += periodPlannedVal;
    cumulativeActualWeight += periodActualVal;

    const plannedPercent = Math.min(100, Math.round((cumulativePlannedWeight / totalWeight) * 100 * 10) / 10);
    const actualPercent = Math.min(100, Math.round((cumulativeActualWeight / totalWeight) * 100 * 10) / 10);

    return {
      periodLabel: header.label,
      subLabel: header.subLabel,
      plannedProgress: plannedPercent,
      actualProgress: actualPercent,
      periodPlannedDelta: Math.round(periodPlannedVal * 10) / 10,
      periodActualDelta: Math.round(periodActualVal * 10) / 10,
    };
  });

  return curveData;
}

/**
 * CSV Export Generator
 */
export function exportToCSV(project: Project) {
  let csv = '\uFEFF'; // UTF-8 BOM for Excel Thai language support
  csv += `โครงการ: ${project.name}\n`;
  csv += `รหัส: ${project.code}, เจ้าของ: ${project.clientName}, ผู้รับเหมา: ${project.contractor}\n`;
  csv += `งบประมาณรวม: ${project.totalBudget} บาท, วันเริ่มงาน: ${project.startDate}\n\n`;

  csv += `รหัส,หัวข้อ / รายการงาน,ช่วงเวลา (เริ่มต้น - สิ้นสุด),งบประมาณ (บาท),ผู้รับผิดชอบ,แผนงาน (%),ผลงานจริง (%),สถานะ\n`;

  project.categories.forEach((cat) => {
    const catMetrics = getCategoryMetrics(cat);
    csv += `"${cat.code}","${cat.title}","-",${catMetrics.budget},"-",${catMetrics.plannedProgress},${catMetrics.actualProgress},"หมวดหลัก"\n`;

    cat.subTasks.forEach((task) => {
      const periodLabel = `${project.periodType === 'weekly' ? 'สัปดาห์' : 'เดือน'} ${task.startPeriod} - ${task.endPeriod}`;
      csv += `"${task.code}","  ${task.title}","${periodLabel}",${task.budget},"${task.assignee || '-'}",${task.plannedProgress},${task.actualProgress},"${task.status}"\n`;
    });
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${project.name.replace(/\s+/g, '_')}_แผนงานก่อสร้าง.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

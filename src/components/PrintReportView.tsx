import React, { useState, useRef, useEffect } from 'react';
import { Project } from '../types';
import { 
  getProjectSummary, 
  formatThaiDate, generatePeriodHeaders, generateDailyHeadersForMonth, 
  getCategoryMetrics, 
  formatTHB,
  getPeriodDates,
  calculateSCurveData,
  calculateDaysVarianceForPeriod,
  calculateGanttBarPosition,
  calculateTaskStatus,
  getMonthGroupsForWeekly, getProjectMonthName, getWeekGroupsForDaily
} from '../utils/constructionUtils';
import { SCurveChart } from './SCurveChart';

interface PrintReportViewProps {
  project: Project;
  onClosePrint: () => void;
}

export const PrintReportView: React.FC<PrintReportViewProps> = ({
  project,
  onClosePrint,
}) => {
  
  const [printPeriodType, setPrintPeriodType] = useState<'weekly' | 'monthly' | 'single_month'>(project.periodType || 'weekly');
  
  const [showBudget, setShowBudget] = useState(true);
  const [showPlanned, setShowPlanned] = useState(true);
  const [showActual, setShowActual] = useState(true);
  const [printSelectedMonthIndex, setPrintSelectedMonthIndex] = useState<number>(1);
  const [showSCurve, setShowSCurve] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const [gridRect, setGridRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

  useEffect(() => {
    if (!containerRef.current || !showSCurve) return;

    const update = () => {
      if (!containerRef.current) return;
      const firstCell = containerRef.current.querySelector('.period-cell-first-first');
      const lastCell = containerRef.current.querySelector('.period-cell-first-last');
      const lastRowEl = containerRef.current.querySelector('.last-task-row');
      
      if (firstCell && lastCell && lastRowEl) {
        const containerBounds = containerRef.current.getBoundingClientRect();
        const firstBounds = firstCell.getBoundingClientRect();
        const lastBounds = lastCell.getBoundingClientRect();
        const lastRowBounds = lastRowEl.getBoundingClientRect();
        
        setGridRect({
          left: ((firstBounds.left - containerBounds.left) / containerBounds.width) * 100,
          top: ((firstBounds.top - containerBounds.top) / containerBounds.height) * 100,
          width: ((lastBounds.right - firstBounds.left) / containerBounds.width) * 100,
          height: ((lastRowBounds.bottom - firstBounds.top) / containerBounds.height) * 100,
        });
      }
    };

    // Run immediately and after paint
    update();
    const timeoutId = setTimeout(update, 100);

    const observer = new ResizeObserver(() => {
      update();
    });
    observer.observe(containerRef.current);

    window.addEventListener('beforeprint', update);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
      window.removeEventListener('beforeprint', update);
    };
  }, [showSCurve, showBudget, showPlanned, showActual, printPeriodType]);
  
  const summary = getProjectSummary(project);
  const projYearBE = (() => {
    const d = new Date(project.startDate || new Date().toISOString().split('T')[0]);
    return isNaN(d.getTime()) ? new Date().getFullYear() + 543 : d.getFullYear() + 543;
  })();

  
  const periodHeaders = printPeriodType === 'single_month'
    ? generateDailyHeadersForMonth(project.startDate, printSelectedMonthIndex)
    : generatePeriodHeaders(project.startDate, project.totalPeriods, printPeriodType as any);

  const curveData = calculateSCurveData(project, printPeriodType === "single_month" ? "monthly" : printPeriodType);
  const colSpanBeforePeriods = 5 + (showBudget ? 1 : 0) + (showPlanned ? 1 : 0) + (showActual ? 1 : 0);

  const headerImageUrl = "https://lh3.googleusercontent.com/d/1JDcmdmipc6mfv9cXLIYIyUozIo-M7RIY=s1200";
  const footerImageUrl = "https://lh3.googleusercontent.com/d/1DMp-DsbtKczK8HLrBbQkGdBQ4hN5E2ge=s1200";

  const formatFullThaiDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear() + 543;
    return `${day} ${month} ${year}`;
  };

  return (
    <div className="bg-slate-200 print:bg-white print:p-0 min-h-screen text-slate-900 p-2 sm:p-4 overflow-auto flex flex-col items-center">
      
      {/* Top Action Controls (hidden when printing) */}
      <div className="print:hidden w-full max-w-[420mm] mb-4 bg-white border border-slate-300 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 text-slate-800 shadow-sm" style={{ maxWidth: '420mm' }}>

        <div>
          <h3 className="font-bold text-sm">หน้าพรีวิวสำหรับพิมพ์รายงาน (Landscape Print Preview)</h3>
          <p className="text-xs text-slate-500">
            กระดาษแนวนอนอัตโนมัติ เลือกขนาดและรูปแบบหัวตาราง ได้ตามต้องการ พร้อมหัวตารางและท้ายตารางตามลิงก์ที่ระบุ
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 text-xs text-slate-700">
            <span className="font-bold text-slate-800 mr-1">แสดงคอลัมน์ / ข้อมูล:</span>
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-900">
              <input 
                type="checkbox" 
                checked={showBudget} 
                onChange={(e) => setShowBudget(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-300 bg-white text-indigo-500 focus:ring-indigo-500 "
              />
              มูลค่างาน
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-900">
              <input 
                type="checkbox" 
                checked={showPlanned} 
                onChange={(e) => setShowPlanned(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-300 bg-white text-indigo-500 focus:ring-indigo-500 "
              />
              แผน %
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-900">
              <input 
                type="checkbox" 
                checked={showActual} 
                onChange={(e) => setShowActual(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-300 bg-white text-indigo-500 focus:ring-indigo-500 "
              />
              ผลงานจริง %
            </label>
            <span className="text-slate-300 px-0.5">|</span>
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-900 font-semibold text-rose-600">
              <input 
                type="checkbox" 
                checked={showSCurve} 
                onChange={(e) => setShowSCurve(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-300 bg-white text-rose-500 focus:ring-rose-500 "
              />
              กราฟ S-Curve
            </label>
          </div>

                              <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700/80">
            <button
              onClick={() => setPrintPeriodType('weekly')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                printPeriodType === 'weekly' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              รายสัปดาห์
            </button>
            <button
              onClick={() => setPrintPeriodType('monthly')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                printPeriodType === 'monthly' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              ตารางทั้งโครงการ
            </button>
            <button
              onClick={() => setPrintPeriodType('single_month')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                printPeriodType === 'single_month' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              รายวัน (ทีละเดือน)
            </button>
            
            {printPeriodType === 'single_month' && (
              <select
                value={printSelectedMonthIndex}
                onChange={(e) => setPrintSelectedMonthIndex(Number(e.target.value))}
                className="bg-white border border-slate-300 text-slate-800 text-[11px] rounded px-2 py-1 ml-1 cursor-pointer focus:ring-1 focus:ring-indigo-500"
              >
                {Array.from({ length: project.periodType === 'weekly' ? Math.ceil(project.totalPeriods / 4) : project.totalPeriods }).map((_, idx) => (
                  <option key={idx} value={idx + 1}>{getProjectMonthName(project.startDate, idx + 1)}</option>
                ))}
              </select>
            )}
          </div>
          <button
            onClick={() => window.print()}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition shadow flex items-center gap-1.5"
          >
            <span>🖨️</span> พิมพ์เอกสาร / PDF
          </button>
          <button
            onClick={onClosePrint}
            className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium text-xs px-3.5 py-2 rounded-lg transition"
          >
            ปิดหน้าพรีวิว
          </button>
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: A3 landscape;
            margin: 5mm 10mm !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body, html, #root, .bg-slate-200, .print-sheet, .overflow-x-auto {
            overflow: visible !important;
            overflow-x: visible !important;
            height: auto !important;
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
          }
          table {
            overflow: visible !important;
            page-break-inside: auto !important;
            break-inside: auto !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: auto !important;
          }
          ::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
          }
          body, html {
            background: white !important;
            color: black !important;
            font-size: 8px !important;
          }
          .print\:hidden {
            display: none !important;
          }
          .print-sheet {
            width: 100% !important;
            max-width: 100% !important;
            min-height: 297mm !important;
            margin: 0 !important;
            padding: 5mm !important;
            box-shadow: none !important;
            border: none !important;
            outline: none !important;
            border-radius: 0 !important;
            background: white !important;
          }
          table, th, td, tr, thead, tbody {
            background-color: transparent !important;
            background: transparent !important;
            color: black !important;
          }
          th, td {
            border: 1px solid #000 !important;
            color: black !important;
          }
          img {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
        @media screen {
          .print-sheet {
            width: 420mm;
            min-height: 297mm;
            padding: 20mm;
          }
        }
      `}</style>

      {/* Printable Sheet */}
      <div className="print-sheet mx-auto bg-white print:rounded-none print:shadow-none print:border-none rounded-xl shadow-2xl text-slate-900 font-sans flex flex-col">
        
        {/* Header Image from Google Drive */}
        <div className="mb-6 w-full flex justify-start">
          <img 
            src={headerImageUrl} 
            alt="หัวตารางรายงาน" 
            className="max-h-24 object-contain object-left"
            style={{ width: '20cm', maxWidth: '100%' }}
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>

        {/* Document Info Header */}
        <div className="border-b border-slate-300 pb-2 mb-3 flex justify-between gap-2 text-[11px] text-slate-800">
          <div className="space-y-1 w-1/3">
            <div>สถานที่ก่อสร้าง : {project.location || '-'}</div>
            <div>ผู้ว่าจ้าง : {project.clientName || '-'}</div>
            <div>ผู้รับจ้าง : {project.contractor || '-'}</div>
          </div>
          <div className="space-y-1 w-1/3 text-center">
            <div className="font-bold text-sm">แผนงานการปฏิบัติงาน</div>
            <div className="font-bold text-base">{project.name}</div>
            {printPeriodType === 'single_month' && (
              <div className="font-bold text-sm text-slate-700 mt-1">ประจำเดือน {getProjectMonthName(project.startDate, printSelectedMonthIndex)}</div>
            )}
          </div>
          <div className="w-1/3 flex justify-end text-xs">
            <div className="flex flex-col gap-1 text-left leading-tight">
              <div className="flex"><span className="w-[120px]">สัญญาจ้างเลขที่ :</span><span>{project.code || '-'}</span></div>
              <div className="flex"><span className="w-[120px]">เริ่มสัญญาจ้างวันที่ :</span><span>วันที่ {formatFullThaiDate(project.startDate)}</span></div>
              <div className="flex"><span className="w-[120px]">สิ้นสุดสัญญาจ้างวันที่ :</span><span>วันที่ {project.endDate ? formatFullThaiDate(project.endDate) : '-'}</span></div>
            </div>
          </div>
        </div>

        {/* Schedule Table */}
        <div className="overflow-x-auto mb-3">
          <div className="relative inline-block min-w-full" ref={containerRef}>
            <table className="w-full text-[10px] text-left border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-200 text-slate-800 font-bold border-b border-slate-300 text-center">
                  <th rowSpan={2} className="p-1 border border-slate-300 w-8 align-middle">ลำดับ<br/>งาน</th>
                  <th rowSpan={2} className="p-1 border border-slate-300 align-middle text-left whitespace-nowrap">รายละเอียดงานก่อสร้าง</th>
                  <th colSpan={3} className="p-1 border border-slate-300 align-middle bg-slate-300/50">กำหนดการก่อสร้าง (ปี พ.ศ. {projYearBE})</th>
                  {showBudget && <th rowSpan={2} className="p-1 border border-slate-300 w-20 text-center align-middle leading-tight normal-case">มูลค่างาน<br/>ตามสัญญา<br/><span className="font-normal text-[8px] text-slate-500">(THB)</span></th>}
                  {showPlanned && <th rowSpan={2} className="p-1 border border-slate-300 w-10 align-middle text-blue-700">แผน %</th>}
                  {showActual && <th rowSpan={2} className="p-1 border border-slate-300 w-12 align-middle text-emerald-700">ผลงาน<br/>จริง %</th>}
                  
                  {printPeriodType === 'weekly' || printPeriodType === 'single_month' ? (
                    (printPeriodType === 'weekly' ? getMonthGroupsForWeekly(periodHeaders) : getWeekGroupsForDaily(periodHeaders)).map((group, idx) => (
                      <th key={idx} colSpan={group.colSpan} className="p-0.5 border border-slate-300 text-center font-bold text-amber-800 bg-amber-50/20 text-[8px] align-middle">
                        {group.label}
                      </th>
                    ))
                  ) : (
                    periodHeaders.map((h) => (
                      <th key={h.periodIndex} rowSpan={2} className="p-0.5 border border-slate-300 text-center font-mono text-[8px] min-w-[28px] align-middle">
                        {h.label}
                      </th>
                    ))
                  )}
                </tr>

                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 text-center">
                  <th className="p-0.5 border border-slate-300 w-16 align-middle font-normal bg-slate-200/50 whitespace-nowrap">วันเริ่มงาน</th>
                  <th className="p-0.5 border border-slate-300 w-16 align-middle font-normal bg-slate-200/50 whitespace-nowrap">วันสิ้นสุดงาน</th>
                  <th className="p-0.5 border border-slate-300 w-12 align-middle font-normal bg-slate-200/50">ระยะเวลา</th>
                  {(printPeriodType === 'weekly' || printPeriodType === 'single_month') && periodHeaders.map((h) => (
                    <th key={h.periodIndex} className={`p-0.5 border border-slate-300 text-center font-mono text-[7px] min-w-[24px] ${h.isOutOfMonth ? "text-slate-400 font-normal" : ""}`}>
                      {printPeriodType === 'single_month' ? h.subLabel : h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {project.categories.map((cat, catIdx) => {
                  const catM = getCategoryMetrics(cat);
                  let catDatesDisplay = { startDateISO: '', endDateISO: '', durationText: '-' };
                  if (cat.startDate || cat.endDate) {
                    catDatesDisplay = {
                      startDateISO: cat.startDate || '',
                      endDateISO: cat.endDate || '',
                      durationText: (cat.startDate && cat.endDate) ? `${Math.ceil((new Date(cat.endDate).getTime() - new Date(cat.startDate).getTime()) / (1000 * 3600 * 24)) + 1} วัน` : '-'
                    };
                  } else if (cat.subTasks.length > 0) {
                    const minSP = Math.min(...cat.subTasks.map((st) => st.startPeriod));
                    const maxEP = Math.max(...cat.subTasks.map((st) => st.endPeriod));
                    catDatesDisplay = getPeriodDates(project.startDate, minSP, maxEP, project.periodType);
                  } else {
                    catDatesDisplay = { startDateISO: '', endDateISO: '', durationText: '-' };
                  }

                  const lastCatIdx = project.categories.length - 1;
                  const lastCat = project.categories[lastCatIdx];
                  const isHiddenDefaultCategory = cat.code === '1.0' && cat.title === 'งานทั่วไป' && project.categories.length === 1;
                  const lastCatHasSubTasks = lastCat && lastCat.subTasks.length > 0;
                  const isLastTaskRowForCat = catIdx === lastCatIdx && !lastCatHasSubTasks;

                  return (
                    <React.Fragment key={cat.id}>
                      {!isHiddenDefaultCategory && (
                      <tr className={`bg-slate-100 font-bold border-b border-slate-300 ${isLastTaskRowForCat ? 'last-task-row' : ''}`}>
                        <td className="p-1 border border-slate-300 text-center">{`${catIdx + 1}.0`}</td>
                        <td className="p-1 border border-slate-300 whitespace-nowrap">{cat.title}</td>
                        <td className="p-1 border border-slate-300 text-center text-[9px] whitespace-nowrap">{formatThaiDate(catDatesDisplay.startDateISO)}</td>
                        <td className="p-1 border border-slate-300 text-center text-[9px] whitespace-nowrap">{formatThaiDate(catDatesDisplay.endDateISO)}</td>
                        <td className="p-1 border border-slate-300 text-center text-[9px] whitespace-nowrap">{catDatesDisplay.durationText}</td>
                        {showBudget && <td className="p-1 border border-slate-300 text-right">{formatTHB(catM.budget)}</td>}
                        {showPlanned && <td className="p-1 border border-slate-300 text-center text-blue-700">{catM.plannedProgress}%</td>}
                        {showActual && <td className="p-1 border border-slate-300 text-center text-emerald-700">{catM.actualProgress}%</td>}
                        {periodHeaders.map((h, hIdx) => {
                          const isFirstFirst = catIdx === 0 && hIdx === 0;
                          const isFirstLast = catIdx === 0 && hIdx === periodHeaders.length - 1;
                          return (
                            <td 
                              key={h.periodIndex} 
                              className={`p-0.5 border border-slate-300 ${h.isOutOfMonth ? 'bg-slate-100/50' : 'bg-slate-50'} relative h-4 ${
                                isFirstFirst ? 'period-cell-first-first' : ''
                              } ${
                                isFirstLast ? 'period-cell-first-last' : ''
                              }`}
                            >
                              {printPeriodType === 'monthly' && (
                                <div className="absolute inset-0 flex pointer-events-none">
                                  <div className="flex-1 border-r border-dashed border-slate-300/70 h-full"></div>
                                  <div className="flex-1 border-r border-dashed border-slate-300/70 h-full"></div>
                                  <div className="flex-1 border-r border-dashed border-slate-300/70 h-full"></div>
                                  <div className="flex-1 h-full"></div>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                      )}

                    {/* Subtask Rows */}
                    {cat.subTasks.map((st, stIdx) => {
                          const computedSubCode = isHiddenDefaultCategory ? `${stIdx + 1}` : `${catIdx + 1}.${stIdx + 1}`;
                      const currentDates = getPeriodDates(project.startDate, st.startPeriod, st.endPeriod, project.periodType);
                      const startObj = new Date(st.startDate || currentDates.startDateISO);
                      const endObj = new Date(st.endDate || currentDates.endDateISO);
                      const diffTime = endObj.getTime() - startObj.getTime();
                      const durationDays = Math.max(1, Math.round(diffTime / (24 * 60 * 60 * 1000)) + 1);

                      const isLastTaskRowForSubTask = catIdx === lastCatIdx && stIdx === cat.subTasks.length - 1;

                      return (
                        <tr key={st.id} className={`border-b border-slate-200 ${isLastTaskRowForSubTask ? 'last-task-row' : ''}`}>
                          <td className="p-1 border border-slate-300 text-center font-mono text-[9px]">{computedSubCode}</td>
                          <td className="p-1 border border-slate-300 pl-3 whitespace-nowrap">{st.title}</td>
                          <td className="p-1 border border-slate-300 text-center font-mono text-[9px] whitespace-nowrap">{formatThaiDate(st.startDate || currentDates.startDateISO)}</td>
                          <td className="p-1 border border-slate-300 text-center font-mono text-[9px] whitespace-nowrap">{formatThaiDate(st.endDate || currentDates.endDateISO)}</td>
                          <td className="p-1 border border-slate-300 text-center text-[9px] whitespace-nowrap">{durationDays} วัน</td>
                          {showBudget && <td className="p-1 border border-slate-300 text-right">{formatTHB(st.budget)}</td>}
                          {showPlanned && <td className="p-1 border border-slate-300 text-center">{st.plannedProgress}%</td>}
                          {showActual && <td className="p-1 border border-slate-300 text-center font-bold text-emerald-700">{st.actualProgress}%</td>}
                          
                          {periodHeaders.map((h) => {
                            const taskStartDateISO = st.startDate || currentDates.startDateISO;
                            const taskEndDateISO = st.endDate || currentDates.endDateISO;
                            const status = calculateTaskStatus(st);

                            const barPos = calculateGanttBarPosition(
                              taskStartDateISO,
                              taskEndDateISO,
                              h.startDateISO || '',
                              h.endDateISO || ''
                            );

                            const isTaskStartInCol = taskStartDateISO >= (h.startDateISO || '') && taskStartDateISO <= (h.endDateISO || '');
                            const isTaskEndInCol = taskEndDateISO >= (h.startDateISO || '') && taskEndDateISO <= (h.endDateISO || '');

                            return (
                              <td 
                                key={h.periodIndex} 
                                className={`p-0.5 border border-slate-300 text-center ${h.isOutOfMonth ? "bg-slate-50/50" : "bg-white"} relative h-4`}
                              >
                                {printPeriodType === 'monthly' && (
                                  <div className="absolute inset-0 flex pointer-events-none">
                                    <div className="flex-1 border-r border-dashed border-slate-300/70 h-full"></div>
                                    <div className="flex-1 border-r border-dashed border-slate-300/70 h-full"></div>
                                    <div className="flex-1 border-r border-dashed border-slate-300/70 h-full"></div>
                                    <div className="flex-1 h-full"></div>
                                  </div>
                                )}
                                {barPos.hasBar && (
                                  <div
                                    style={{
                                      left: `${barPos.leftPercent}%`,
                                      width: `${barPos.widthPercent}%`,
                                    }}
                                    className={`h-[10px] absolute top-1/2 -translate-y-1/2 z-10 flex items-center justify-center text-[7px] font-bold ${
                                      status === 'completed'
                                        ? 'bg-emerald-600 text-white'
                                        : status === 'delayed'
                                        ? 'bg-rose-600 text-white'
                                        : 'bg-slate-700 text-white'
                                    } ${isTaskStartInCol ? 'rounded-l-[2px]' : ''} ${isTaskEndInCol ? 'rounded-r-[2px]' : ''}`}
                                  >
                                    {isTaskStartInCol && showActual && (
                                      <span className="truncate px-0.5 text-[7px] absolute left-0 w-full text-center">
                                        {st.actualProgress}%
                                      </span>
                                    )}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
              {showSCurve && printPeriodType !== "single_month" && (
                <>
                  {/* Planned Cumulative Row */}
                  <tr className={`bg-blue-50/40 font-bold border-t-2 ${showActual ? '' : 'border-b-2'} border-slate-300 break-inside-avoid`}>
                    <td colSpan={colSpanBeforePeriods} className="p-1 border border-slate-300 text-right pr-2 text-[10px] font-bold text-blue-800">
                      แผนงานสะสม (%)
                    </td>
                    {periodHeaders.map((h, idx) => {
                      const val = curveData[idx]?.plannedProgress ?? 0;
                      return (
                        <td key={h.periodIndex} className="p-1 border border-slate-300 text-center text-[9px] font-mono font-bold text-blue-700 bg-blue-50/20">
                          {val}%
                        </td>
                      );
                    })}
                  </tr>

                  {showActual && (
                    <>
                      {/* Actual Cumulative Row */}
                      <tr className="bg-emerald-50/40 font-bold border-b border-slate-300 break-inside-avoid">
                        <td colSpan={colSpanBeforePeriods} className="p-1 border border-slate-300 text-right pr-2 text-[10px] font-bold text-emerald-800">
                          ผลงานจริงสะสม (%)
                        </td>
                        {periodHeaders.map((h, idx) => {
                          const val = curveData[idx]?.actualProgress ?? 0;
                          return (
                            <td 
                              key={h.periodIndex} 
                              className="p-1 border border-slate-300 text-center text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50/20"
                            >
                              {val}%
                            </td>
                          );
                        })}
                      </tr>

                      {/* Variance Row (Ahead/Behind Plan) */}
                      <tr className="bg-rose-50/30 font-bold border-b border-slate-300 break-inside-avoid">
                        <td colSpan={colSpanBeforePeriods} className="p-1 border border-slate-300 text-right pr-2 text-[10px] font-bold text-rose-800">
                          เร็ว/ช้ากว่าแผน (%)
                        </td>
                        {periodHeaders.map((h, idx) => {
                          const actualVal = curveData[idx]?.actualProgress ?? 0;
                          const plannedVal = curveData[idx]?.plannedProgress ?? 0;
                          const diff = Math.round((actualVal - plannedVal) * 10) / 10;
                          
                          let displayVal = '';
                          let textColorClass = '';
                          
                          if (diff < 0) {
                            displayVal = `${diff}%`; // Will show with minus sign e.g., -5.3%
                            textColorClass = 'text-red-600 font-extrabold';
                          } else if (diff > 0) {
                            displayVal = `+${diff}%`;
                            textColorClass = 'text-emerald-700 font-extrabold';
                          } else {
                            displayVal = '0%';
                            textColorClass = 'text-slate-500 font-bold';
                          }
                          
                          return (
                            <td 
                              key={h.periodIndex} 
                              className={`p-1 border border-slate-300 text-center text-[9px] font-mono ${textColorClass} bg-rose-50/10`}
                            >
                              {displayVal}
                            </td>
                          );
                        })}
                      </tr>

                      {/* Variance Row (Ahead/Behind Plan - Days) */}
                      <tr className="bg-rose-50/20 font-bold border-b-2 border-slate-300 break-inside-avoid">
                        <td colSpan={colSpanBeforePeriods} className="p-1 border border-slate-300 text-right pr-2 text-[10px] font-bold text-rose-800">
                          เร็ว/ช้ากว่าแผน (วัน)
                        </td>
                        {periodHeaders.map((h, idx) => {
                          const actualVal = curveData[idx]?.actualProgress ?? 0;
                          const daysVar = calculateDaysVarianceForPeriod(actualVal, idx, curveData, printPeriodType);
                          
                          let displayVal = '';
                          let textColorClass = '';
                          
                          if (daysVar < 0) {
                            displayVal = `${daysVar} วัน`; // Will show with minus sign e.g., -5.3 วัน
                            textColorClass = 'text-red-600 font-extrabold';
                          } else if (daysVar > 0) {
                            displayVal = `+${daysVar} วัน`;
                            textColorClass = 'text-emerald-700 font-extrabold';
                          } else {
                            displayVal = '0 วัน';
                            textColorClass = 'text-slate-500 font-bold';
                          }
                          
                          const isLastCell = idx === periodHeaders.length - 1;
                          return (
                            <td 
                              key={h.periodIndex} 
                              className={`p-1 border border-slate-300 text-center text-[9px] font-mono ${textColorClass} bg-rose-50/5 ${isLastCell ? 'period-cell-bottom-last' : ''}`}
                            >
                              {displayVal}
                            </td>
                          );
                        })}
                      </tr>
                    </>
                  )}
                </>
              )}
            </tbody>
          </table>

          {showSCurve && gridRect && (
            <svg
              className="absolute pointer-events-none"
              style={{
                left: `${gridRect.left}%`,
                top: `${gridRect.top}%`,
                width: `${gridRect.width}%`,
                height: `${gridRect.height}%`,
                overflow: 'visible',
              }}
            >
              {(() => {
                const getX = (i: number) => `${((i + 0.5) / periodHeaders.length) * 100}%`;
                const getY = (val: number) => `${100 - val}%`;

                return (
                  <>
                    {/* Planned Progress Line Segments */}
                    {periodHeaders.slice(0, -1).map((_, idx) => {
                      const val1 = curveData[idx]?.plannedProgress ?? 0;
                      const val2 = curveData[idx + 1]?.plannedProgress ?? 0;
                      return (
                        <line
                          key={`p-line-${idx}`}
                          x1={getX(idx)}
                          y1={getY(val1)}
                          x2={getX(idx + 1)}
                          y2={getY(val2)}
                          stroke="#2563eb"
                          strokeWidth="2.5"
                        />
                      );
                    })}

                    {/* Actual Progress Line Segments */}
                    {showActual && periodHeaders.slice(0, -1).map((_, idx) => {
                      const val1 = curveData[idx]?.actualProgress ?? 0;
                      const val2 = curveData[idx + 1]?.actualProgress ?? 0;
                      return (
                        <line
                          key={`a-line-${idx}`}
                          x1={getX(idx)}
                          y1={getY(val1)}
                          x2={getX(idx + 1)}
                          y2={getY(val2)}
                          stroke="#10b981"
                          strokeWidth="2.5"
                        />
                      );
                    })}

                    {/* Planned Dots and Labels */}
                    {periodHeaders.map((_, idx) => {
                      const val = curveData[idx]?.plannedProgress ?? 0;
                      const x = getX(idx);
                      const y = getY(val);
                      return (
                        <g key={`p-point-${idx}`}>
                          <circle cx={x} cy={y} r="3" fill="#2563eb" stroke="#ffffff" strokeWidth="1" />
                          <text
                            x={x}
                            y={y}
                            dy="-6"
                            textAnchor="middle"
                            className="text-[8px] font-extrabold fill-blue-700"
                            style={{
                              paintOrder: 'stroke',
                              stroke: '#ffffff',
                              strokeWidth: '2.5px',
                              strokeLinecap: 'round',
                              strokeLinejoin: 'round'
                            }}
                          >
                            {val}%
                          </text>
                        </g>
                      );
                    })}

                    {/* Actual Dots and Labels */}
                    {showActual && periodHeaders.map((_, idx) => {
                      const val = curveData[idx]?.actualProgress ?? 0;
                      const x = getX(idx);
                      const y = getY(val);
                      return (
                        <g key={`a-point-${idx}`}>
                          <circle cx={x} cy={y} r="3" fill="#10b981" stroke="#ffffff" strokeWidth="1" />
                          <text
                            x={x}
                            y={y}
                            dy="10"
                            textAnchor="middle"
                            className="text-[8px] font-extrabold fill-emerald-700"
                            style={{
                              paintOrder: 'stroke',
                              stroke: '#ffffff',
                              strokeWidth: '2.5px',
                              strokeLinecap: 'round',
                              strokeLinejoin: 'round'
                            }}
                          >
                            {val}%
                          </text>
                        </g>
                      );
                    })}

                    {/* 100% and 0% labels on the right edge of the grid */}
                    <text 
                      x="100.5%" 
                      y={getY(100)} 
                      dominantBaseline="middle" 
                      className="text-[9px] font-extrabold fill-blue-700"
                      style={{
                        paintOrder: 'stroke',
                        stroke: '#ffffff',
                        strokeWidth: '2.5px',
                        strokeLinecap: 'round',
                        strokeLinejoin: 'round'
                      }}
                    >
                      100%
                    </text>
                    <text 
                      x="100.5%" 
                      y={getY(0)} 
                      dominantBaseline="middle" 
                      className="text-[9px] font-extrabold fill-slate-600"
                      style={{
                        paintOrder: 'stroke',
                        stroke: '#ffffff',
                        strokeWidth: '2.5px',
                        strokeLinecap: 'round',
                        strokeLinejoin: 'round'
                      }}
                    >
                      0%
                    </text>
                  </>
                );
              })()}
            </svg>
          )}
        </div>
      </div>

                {/* Optional Full S-Curve Chart */}
        {showSCurve && (
          <div className="mt-8 break-inside-avoid page-break-inside-avoid print:bg-white print:text-black" style={{ maxHeight: '10cm' }}>
            <div className="scale-[0.8] origin-top">
              <SCurveChart project={project} viewMode={printPeriodType} hideToolbar={true} hideTable={true} hideYAxisLabels={false} />
            </div>
          </div>
        )}

        

      </div>

    </div>
  );
};

import React, { useState } from 'react';
import { Project } from '../types';
import { 
  getProjectSummary, 
  generatePeriodHeaders, 
  getCategoryMetrics, 
  formatTHB,
  getPeriodDates
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
  const [pageSize, setPageSize] = useState<'A4' | 'A3'>('A4');
  const [printPeriodType, setPrintPeriodType] = useState<'weekly' | 'monthly'>(project.periodType || 'weekly');
  
  const [showBudget, setShowBudget] = useState(true);
  const [showPlanned, setShowPlanned] = useState(true);
  const [showActual, setShowActual] = useState(true);
  const [showSCurve, setShowSCurve] = useState(false);
  
  const summary = getProjectSummary(project);
  const periodHeaders = generatePeriodHeaders(project.startDate, project.totalPeriods, printPeriodType);

  const headerImageUrl = "https://lh3.googleusercontent.com/d/1JDcmdmipc6mfv9cXLIYIyUozIo-M7RIY=s1200";
  const footerImageUrl = "https://lh3.googleusercontent.com/d/1DMp-DsbtKczK8HLrBbQkGdBQ4hN5E2ge=s1200";

  const formatThaiDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const months = ['มค.', 'กพ.', 'มีค.', 'เมย.', 'พค.', 'มิย.', 'กค.', 'สค.', 'กย.', 'ตค.', 'พย.', 'ธค.'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = (date.getFullYear() + 543).toString().slice(-2);
    return `${day} ${month} ${year}`;
  };

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
    <div className="bg-slate-950 min-h-screen text-slate-900 p-4 sm:p-8 overflow-auto">
      
      {/* Top Action Controls (hidden when printing) */}
      <div className="print:hidden max-w-[297mm] mx-auto mb-6 bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-white" style={pageSize === 'A3' ? { maxWidth: '420mm' } : {}}>

        <div>
          <h3 className="font-bold text-sm">หน้าพรีวิวสำหรับพิมพ์รายงาน (Landscape Print Preview)</h3>
          <p className="text-xs text-slate-400">
            กระดาษแนวนอนอัตโนมัติ เลือกขนาดและรูปแบบหัวตาราง ได้ตามต้องการ พร้อมหัวตารางและท้ายตารางตามลิงก์ที่ระบุ
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-3 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 text-xs text-slate-300">
            <span className="font-bold text-white mr-1">แสดงคอลัมน์:</span>
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
              <input 
                type="checkbox" 
                checked={showBudget} 
                onChange={(e) => setShowBudget(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-slate-700 border-slate-600 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-800"
              />
              มูลค่างาน
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
              <input 
                type="checkbox" 
                checked={showPlanned} 
                onChange={(e) => setShowPlanned(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-slate-700 border-slate-600 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-800"
              />
              แผน %
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
              <input 
                type="checkbox" 
                checked={showActual} 
                onChange={(e) => setShowActual(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-slate-700 border-slate-600 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-800"
              />
              ผลงานจริง %
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                <input 
                  type="checkbox" 
                  checked={showSCurve} 
                  onChange={(e) => setShowSCurve(e.target.checked)}
                  className="w-3.5 h-3.5 rounded bg-slate-700 border-slate-600 text-rose-500 focus:ring-rose-500 focus:ring-offset-slate-800"
                />
                กราฟ S-Curve
              </label>
            </div>

          <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
            <span className="text-slate-400">รูปแบบเวลา:</span>
            <button
              onClick={() => setPrintPeriodType('weekly')}
              className={`px-2.5 py-1 rounded-md font-bold transition ${
                printPeriodType === 'weekly' ? 'bg-indigo-500 text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              รายสัปดาห์
            </button>
            <button
              onClick={() => setPrintPeriodType('monthly')}
              className={`px-2.5 py-1 rounded-md font-bold transition ${
                printPeriodType === 'monthly' ? 'bg-indigo-500 text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              รายเดือน
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
            <span className="text-slate-400">ขนาดกระดาษ:</span>
            <button
              onClick={() => setPageSize('A4')}
              className={`px-2.5 py-1 rounded-md font-bold transition ${
                pageSize === 'A4' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:text-white'
              }`}
            >
              A4 Landscape
            </button>
            <button
              onClick={() => setPageSize('A3')}
              className={`px-2.5 py-1 rounded-md font-bold transition ${
                pageSize === 'A3' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:text-white'
              }`}
            >
              A3 Landscape
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition shadow flex items-center gap-1.5"
          >
            <span>🖨️</span> พิมพ์เอกสาร / PDF
          </button>
          <button
            onClick={onClosePrint}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3.5 py-2 rounded-lg transition"
          >
            ปิดหน้าพรีวิว
          </button>
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: ${pageSize === 'A3' ? 'A3 landscape' : 'A4 landscape'};
            margin: 4mm;
          }
          body, html {
            width: 100% !important;
            height: 100% !important;
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            font-size: 9px !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print-sheet {
            width: 100% !important;
            max-width: none !important;
            min-height: auto !important;
            margin: 0 !important;
            padding: 2mm !important;
            box-shadow: none !important;
          }
          table {
            font-size: 8.5px !important;
            width: 100% !important;
          }
          th, td {
            padding: 1.5px 2px !important;
          }
          img {
            max-height: 45px !important;
            object-fit: contain;
          }
        }
        @media screen {
          .print-sheet {
            width: ${pageSize === 'A3' ? '420mm' : '297mm'};
            min-height: ${pageSize === 'A3' ? '297mm' : '210mm'};
            padding: 6mm 8mm;
          }
        }
      `}</style>

      {/* Printable Sheet */}
      <div className="print-sheet mx-auto bg-white rounded-xl shadow-2xl text-slate-900 font-sans flex flex-col">
        
        {/* Header Image from Google Drive */}
        <div className="mb-2 w-full flex justify-start">
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
          </div>
          <div className="w-1/3 flex justify-end">
            <table className="text-left leading-tight">
              <tbody>
                <tr>
                  <td className="pr-2 pb-1">สัญญาจ้างเลขที่ :</td>
                  <td className="pb-1">{project.code || '-'}</td>
                </tr>
                <tr>
                  <td className="pr-2 pb-1">เริ่มสัญญาจ้างวันที่ :</td>
                  <td className="pb-1">วันที่ {formatFullThaiDate(project.startDate)}</td>
                </tr>
                <tr>
                  <td className="pr-2">สิ้นสุดสัญญาจ้างวันที่ :</td>
                  <td>วันที่ {project.endDate ? formatFullThaiDate(project.endDate) : '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Schedule Table */}
        <div className="overflow-x-auto mb-3">
          <table className="w-full text-[10px] text-left border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-200 text-slate-800 font-bold border-b border-slate-300 text-center">
                <th rowSpan={2} className="p-1 border border-slate-300 w-8 align-middle">ลำดับงาน</th>
                <th rowSpan={2} className="p-1 border border-slate-300 align-middle text-left">รายการงาน / หมวดงาน</th>
                <th rowSpan={2} className="p-1 border border-slate-300 w-16 align-middle">วันเริ่ม</th>
                <th rowSpan={2} className="p-1 border border-slate-300 w-16 align-middle">วันสิ้นสุด</th>
                <th rowSpan={2} className="p-1 border border-slate-300 w-12 align-middle">ระยะเวลา</th>
                {showBudget && <th rowSpan={2} className="p-1 border border-slate-300 w-20 text-right align-middle">งบประมาณ</th>}
                {showPlanned && <th rowSpan={2} className="p-1 border border-slate-300 w-10 align-middle text-blue-700">แผน %</th>}
                {showActual && <th rowSpan={2} className="p-1 border border-slate-300 w-10 align-middle text-emerald-700">จริง %</th>}
                {periodHeaders.map((h) => (
                  <th key={h.periodIndex} className="p-0.5 border border-slate-300 text-center font-mono text-[8px] min-w-[28px]">
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {project.categories.map((cat) => {
                const catM = getCategoryMetrics(cat);
                const minStartPeriod = cat.subTasks.length > 0 ? Math.min(...cat.subTasks.map((st) => st.startPeriod)) : 1;
                const maxEndPeriod = cat.subTasks.length > 0 ? Math.max(...cat.subTasks.map((st) => st.endPeriod)) : project.totalPeriods;
                const catDates = getPeriodDates(project.startDate, minStartPeriod, maxEndPeriod, project.periodType);

                return (
                  <React.Fragment key={cat.id}>
                    {/* Category Row */}
                    <tr className="bg-slate-100 font-bold border-b border-slate-300">
                      <td className="p-1 border border-slate-300 text-center">{cat.code}</td>
                      <td className="p-1 border border-slate-300">{cat.title}</td>
                      <td className="p-1 border border-slate-300 text-center text-[9px]">{formatThaiDate(catDates.startDateISO)}</td>
                      <td className="p-1 border border-slate-300 text-center text-[9px]">{formatThaiDate(catDates.endDateISO)}</td>
                      <td className="p-1 border border-slate-300 text-center text-[9px]">{catDates.durationText}</td>
                      {showBudget && <td className="p-1 border border-slate-300 text-right">{formatTHB(catM.budget)}</td>}
                      {showPlanned && <td className="p-1 border border-slate-300 text-center text-blue-700">{catM.plannedProgress}%</td>}
                      {showActual && <td className="p-1 border border-slate-300 text-center text-emerald-700">{catM.actualProgress}%</td>}
                      {periodHeaders.map((h) => (
                        <td key={h.periodIndex} className="p-0.5 border border-slate-300 bg-slate-50 relative h-4">
                          {printPeriodType === 'monthly' && (
                            <div className="absolute inset-0 flex pointer-events-none">
                              <div className="flex-1 border-r border-dashed border-slate-300/70 h-full"></div>
                              <div className="flex-1 border-r border-dashed border-slate-300/70 h-full"></div>
                              <div className="flex-1 border-r border-dashed border-slate-300/70 h-full"></div>
                              <div className="flex-1 h-full"></div>
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* Subtask Rows */}
                    {cat.subTasks.map((st) => {
                      const currentDates = getPeriodDates(project.startDate, st.startPeriod, st.endPeriod, project.periodType);
                      const startObj = new Date(st.startDate || currentDates.startDateISO);
                      const endObj = new Date(st.endDate || currentDates.endDateISO);
                      const diffTime = endObj.getTime() - startObj.getTime();
                      const durationDays = Math.max(1, Math.round(diffTime / (24 * 60 * 60 * 1000)) + 1);

                      return (
                        <tr key={st.id} className="border-b border-slate-200">
                          <td className="p-1 border border-slate-300 text-center font-mono text-[9px]">{st.code}</td>
                          <td className="p-1 border border-slate-300 pl-3">{st.title}</td>
                          <td className="p-1 border border-slate-300 text-center font-mono text-[9px]">{formatThaiDate(st.startDate || currentDates.startDateISO)}</td>
                          <td className="p-1 border border-slate-300 text-center font-mono text-[9px]">{formatThaiDate(st.endDate || currentDates.endDateISO)}</td>
                          <td className="p-1 border border-slate-300 text-center text-[9px]">{durationDays} วัน</td>
                          {showBudget && <td className="p-1 border border-slate-300 text-right">{formatTHB(st.budget)}</td>}
                          {showPlanned && <td className="p-1 border border-slate-300 text-center">{st.plannedProgress}%</td>}
                          {showActual && <td className="p-1 border border-slate-300 text-center font-bold text-emerald-700">{st.actualProgress}%</td>}
                          
                          {periodHeaders.map((h) => {
                            const inRange = h.periodIndex >= st.startPeriod && h.periodIndex <= st.endPeriod;
                            
                            if (!inRange) {
                              return (
                                <td key={h.periodIndex} className="p-0.5 border border-slate-300 text-center bg-white relative h-4">
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
                            }
                            
                            if (h.periodIndex === st.startPeriod) {
                              const colSpan = Math.max(1, st.endPeriod - st.startPeriod + 1);
                              return (
                                <td key={h.periodIndex} colSpan={colSpan} className="p-0.5 border border-slate-300 bg-white text-center align-middle relative h-4">
                                  {printPeriodType === 'monthly' && (
                                    <div className="absolute inset-0 flex pointer-events-none z-0">
                                      {Array.from({ length: colSpan }).map((_, idx) => (
                                        <div key={idx} className="flex-1 flex border-r border-slate-300 last:border-r-0 h-full">
                                          <div className="flex-1 border-r border-dashed border-slate-300/70 h-full"></div>
                                          <div className="flex-1 border-r border-dashed border-slate-300/70 h-full"></div>
                                          <div className="flex-1 border-r border-dashed border-slate-300/70 h-full"></div>
                                          <div className="flex-1 h-full"></div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  <div className="bg-slate-800 text-white w-full rounded-[2px] flex items-center justify-center text-[8px] font-bold truncate mx-auto h-[10px] relative z-10">
                                    {showActual ? `${st.actualProgress}%` : ''}
                                  </div>
                                </td>
                              );
                            }
                            return null;
                          })}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {showSCurve && (
            <div className="mt-6 border-t border-slate-300 pt-4 break-inside-avoid">
                <SCurveChart project={project} viewMode={printPeriodType} hideToolbar />
            </div>
        )}

        {/* Footer Image from Google Drive */}
        <div className="mt-auto pt-4 w-full flex justify-end">
          <img 
            src={footerImageUrl} 
            alt="ท้ายตารางรายงาน" 
            className="max-h-20 object-contain object-right"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>

      </div>

    </div>
  );
};

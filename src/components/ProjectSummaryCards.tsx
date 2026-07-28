import React from 'react';
import { Project } from '../types';
import { getProjectSummary, formatTHB } from '../utils/constructionUtils';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  BarChart3, 
  DollarSign, 
  MapPin, 
  UserCheck, 
  Layers
} from 'lucide-react';

interface ProjectSummaryCardsProps {
  project: Project;
  onOpenEditProjectModal: () => void;
}

export const ProjectSummaryCards: React.FC<ProjectSummaryCardsProps> = ({
  project,
  onOpenEditProjectModal,
}) => {
  const summary = getProjectSummary(project);

  const getStatusBadge = () => {
    if (summary.progressDiff > 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5" />
          เร็วกว่าแผน +{summary.progressDiff}%
        </span>
      );
    } else if (summary.progressDiff < 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
          <AlertTriangle className="w-3.5 h-3.5" />
          ล่าช้ากว่าแผน {summary.progressDiff}%
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
        <Clock className="w-3.5 h-3.5" />
        เป็นไปตามแผนงาน
      </span>
    );
  };

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-white pt-5 pb-6 px-4 sm:px-6 lg:px-8 shadow-inner">
      <div className="max-w-7xl mx-auto space-y-4">
        
        {/* Project Header Info Card */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono text-xs font-bold rounded-md">
                {project.code}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">
                {project.name}
              </h2>
              {getStatusBadge()}
            </div>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
              <div className="flex items-center gap-1 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>สถานที่: <strong className="text-white">{project.location || 'ไม่ระบุ'}</strong></span>
              </div>
              <div className="flex items-center gap-1 text-slate-300">
                <UserCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>เจ้าของ: <strong className="text-white">{project.clientName || '-'}</strong></span>
              </div>
              <div className="flex items-center gap-1 text-slate-300">
                <Building2Icon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>ผู้รับเหมา: <strong className="text-white">{project.contractor || '-'}</strong></span>
              </div>
              <div className="flex items-center gap-1 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>ระยะเวลา: <strong className="text-amber-300">{project.startDate || '-'}</strong> ถึง <strong className="text-amber-300">{project.endDate || '-'}</strong> {project.totalDays ? `(${project.totalDays} วัน)` : ''}</span>
              </div>
            </div>
          </div>

          <button
            id="edit-project-info-summary-btn"
            onClick={onOpenEditProjectModal}
            className="self-start md:self-center text-xs font-semibold text-slate-300 hover:text-white bg-slate-700/70 hover:bg-slate-700 border border-slate-600/80 px-3 py-1.5 rounded-lg transition"
          >
            แก้ไขรายละเอียด
          </button>
        </div>

        {/* Key Metrics Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Overall Progress Bar */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-slate-400">
              <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <BarChart3 className="w-4 h-4" />
                ความก้าวหน้ารวม (Progress)
              </span>
              <span className="text-[11px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-200">
                แผน {summary.overallPlannedProgress}%
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-white tracking-tight">
                {summary.overallActualProgress}%
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {summary.overallActualProgress >= summary.overallPlannedProgress ? '+' : ''}
                {summary.progressDiff}% ต่างจากแผน
              </span>
            </div>

            {/* Progress Bar Visual */}
            <div className="relative w-full bg-slate-700 h-2.5 rounded-full overflow-hidden">
              {/* Planned bar indicator line */}
              <div 
                className="absolute top-0 bottom-0 bg-blue-500/40 z-10 transition-all duration-300"
                style={{ width: `${summary.overallPlannedProgress}%` }}
                title={`แผนงาน: ${summary.overallPlannedProgress}%`}
              />
              {/* Actual bar indicator */}
              <div 
                className={`h-full z-20 transition-all duration-500 rounded-full ${
                  summary.progressDiff >= 0 ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
                style={{ width: `${summary.overallActualProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>ผลงานจริง (แถบสี)</span>
              <span>แผนงาน {summary.overallPlannedProgress}%</span>
            </div>
          </div>

          {/* Card 2: Total Budget */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <DollarSign className="w-4 h-4" />
                งบประมาณโครงการ
              </span>
              <span className="text-[11px] bg-emerald-500/20 text-emerald-300 font-medium px-1.5 py-0.5 rounded">
                จัดสรรแล้ว {Math.round((summary.totalCalculatedBudget / (project.totalBudget || 1)) * 100)}%
              </span>
            </div>

            <div className="text-2xl font-black text-white tracking-tight">
              {formatTHB(project.totalBudget)}
            </div>

            <div className="text-xs text-slate-400 flex justify-between">
              <span>รวมหมวดย่อย:</span>
              <span className="text-slate-200 font-medium">{formatTHB(summary.totalCalculatedBudget)}</span>
            </div>
          </div>

          {/* Card 3: Weight Validation (Total Task Weight %) */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-slate-400">
              <span className="flex items-center gap-1.5 text-purple-400 font-semibold">
                <Layers className="w-4 h-4" />
                ค่าน้ำหนักงานรวม (Weight)
              </span>
              {summary.totalWeight === 100 ? (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">
                  สมบูรณ์ 100%
                </span>
              ) : (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">
                  {summary.totalWeight < 100 ? 'ยังไม่ครบ 100%' : 'เกิน 100%'}
                </span>
              )}
            </div>

            <div className="flex items-baseline justify-between">
              <span className={`text-2xl font-black ${summary.totalWeight === 100 ? 'text-white' : 'text-amber-400'}`}>
                {summary.totalWeight}%
              </span>
              <span className="text-xs text-slate-400">
                จากเป้าหมาย 100%
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              {summary.totalWeight === 100 
                ? 'คำนวณตามสัดส่วนค่าน้ำหนักถูกต้อง'
                : `ควรปรับค่าน้ำหนักงานของรายการย่อยให้รวมเป็น 100%`}
            </p>
          </div>

          {/* Card 4: Task Status Breakdown */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-slate-400">
              <span className="flex items-center gap-1.5 text-blue-400 font-semibold">
                <Clock className="w-4 h-4" />
                สถานะงาน ({summary.totalSubTasksCount} รายการ)
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1 pt-1 text-center">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded p-1">
                <div className="text-lg font-bold text-emerald-400">{summary.completedTasksCount}</div>
                <div className="text-[10px] text-slate-300">เสร็จสิ้น</div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded p-1">
                <div className="text-lg font-bold text-blue-400">{summary.inProgressTasksCount}</div>
                <div className="text-[10px] text-slate-300">กำลังทำ</div>
              </div>
              <div className="bg-rose-500/10 border border-rose-500/20 rounded p-1">
                <div className="text-lg font-bold text-rose-400">{summary.delayedTasksCount}</div>
                <div className="text-[10px] text-slate-300">ล่าช้า</div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

function Building2Icon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
      <path d="M9 22v-4h6v4"/>
      <path d="M8 6h.01"/>
      <path d="M16 6h.01"/>
      <path d="M12 6h.01"/>
      <path d="M12 10h.01"/>
      <path d="M12 14h.01"/>
      <path d="M16 10h.01"/>
      <path d="M16 14h.01"/>
      <path d="M8 10h.01"/>
      <path d="M8 14h.01"/>
    </svg>
  );
}

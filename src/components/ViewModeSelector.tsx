import React from 'react';
import { ViewMode, Project } from '../types';
import { CalendarDays, ListTodo, TrendingUp } from 'lucide-react';

interface ViewModeSelectorProps {
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  activeProject: Project;
}

export const ViewModeSelector: React.FC<ViewModeSelectorProps> = ({
  viewMode,
  onChangeViewMode,
  activeProject,
}) => {
  return (
    <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700/80">
      <button
        id="view-mode-weekly-btn"
        onClick={() => onChangeViewMode('weekly')}
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          viewMode === 'weekly'
            ? 'bg-amber-500 text-slate-950 shadow-sm'
            : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
        }`}
      >
        <CalendarDays className="w-3.5 h-3.5" />
        <span>ตารางรายสัปดาห์</span>
        {activeProject.periodType === 'weekly' && (
          <span className="ml-0.5 px-1.5 py-0.5 bg-slate-900/40 text-[10px] rounded font-mono">
            {activeProject.totalPeriods}W
          </span>
        )}
      </button>

      <button
        id="view-mode-monthly-btn"
        onClick={() => onChangeViewMode('monthly')}
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          viewMode === 'monthly'
            ? 'bg-amber-500 text-slate-950 shadow-sm'
            : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
        }`}
      >
        <ListTodo className="w-3.5 h-3.5" />
        <span>ตารางรายเดือน</span>
        {activeProject.periodType === 'monthly' && (
          <span className="ml-0.5 px-1.5 py-0.5 bg-slate-900/40 text-[10px] rounded font-mono">
            {activeProject.totalPeriods}M
          </span>
        )}
      </button>

      <button
        id="view-mode-scurve-btn"
        onClick={() => onChangeViewMode('scurve')}
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          viewMode === 'scurve'
            ? 'bg-amber-500 text-slate-950 shadow-sm'
            : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
        }`}
      >
        <TrendingUp className="w-3.5 h-3.5" />
        <span>กราฟ S-Curve</span>
      </button>
    </div>
  );
};

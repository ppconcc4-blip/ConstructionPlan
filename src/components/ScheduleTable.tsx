import React, { useState, useRef, useEffect } from 'react';
import { Project, MainCategory, SubTask, ViewMode } from '../types';
import { ViewModeSelector } from './ViewModeSelector';
import { ConfirmModal } from './ConfirmModal';
import { 
  formatThaiDate, generatePeriodHeaders, generateDailyHeadersForMonth, 
  getCategoryMetrics, 
  calculateTaskStatus, 
  formatTHB,
  getPeriodDates,
  convertDatesToPeriods,
  calculateGanttBarPosition,
  getMonthGroupsForWeekly, getProjectMonthName, getWeekGroupsForDaily
} from '../utils/constructionUtils';
import { 
  Plus, 
  FolderPlus, 
  PlusCircle, 
  ChevronRight, 
  ChevronDown, 
  Edit2, 
  Trash2, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  User,
  Sliders,
  Sparkles,
  Check,
  X,
  Calendar,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface ScheduleTableProps {
  project: Project;
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  onAddMainCategory: () => void;
  onEditMainCategory: (category: MainCategory) => void;
  onDeleteMainCategory: (categoryId: string) => void;
  onAddSubTask: (categoryId: string) => void;
  onAddDirectSubTask?: () => void;
  onMoveMainCategory?: (categoryId: string, direction: 'up' | 'down') => void;
  onMoveSubTask?: (categoryId: string, subTaskId: string, direction: 'up' | 'down') => void;
  onEditSubTask: (categoryId: string, subTask: SubTask) => void;
  onDeleteSubTask: (categoryId: string, subTaskId: string) => void;
  onQuickUpdateProgress: (categoryId: string, subTaskId: string, newProgress: number) => void;
  onUpdateSubTask?: (categoryId: string, subTaskId: string, updates: Partial<SubTask>) => void;
  onUpdateMainCategory?: (categoryId: string, updates: Partial<MainCategory>) => void;
  showSCurveInTable?: boolean;
  onToggleSCurveInTable?: () => void;
}

export const ScheduleTable: React.FC<ScheduleTableProps> = ({
  project,
  viewMode,
  onChangeViewMode,
  onAddMainCategory,
  onEditMainCategory,
  onDeleteMainCategory,
  onAddSubTask,
  onAddDirectSubTask,
  onMoveMainCategory,
  onMoveSubTask,
  onEditSubTask,
  onDeleteSubTask,
  onQuickUpdateProgress,
  onUpdateSubTask,
  onUpdateMainCategory,
  showSCurveInTable,
  onToggleSCurveInTable,
}) => {
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [showBudget, setShowBudget] = useState(true);
  const [showPlanned, setShowPlanned] = useState(true);
  const [showActual, setShowActual] = useState(true);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(1);

  // Inline category title editing state
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCatTitle, setEditingCatTitle] = useState<string>('');
  
  // Custom confirm modal state
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const handleDeleteCategoryClick = (catId: string, title: string) => {
    setConfirmState({
      isOpen: true,
      title: 'ยืนยันลบหัวข้อหลัก',
      message: `คุณแน่ใจหรือไม่ที่จะลบหัวข้อหลัก "${title}" พร้อมรายการย่อยทั้งหมด? การดำเนินการนี้จะไม่สามารถกู้คืนข้อมูลได้`,
      onConfirm: () => onDeleteMainCategory(catId),
    });
  };

  const handleDeleteSubTaskClick = (catId: string, subTaskId: string, title: string) => {
    setConfirmState({
      isOpen: true,
      title: 'ยืนยันลบรายการย่อย',
      message: `คุณแน่ใจหรือไม่ที่จะลบรายการย่อย "${title}"? การดำเนินการนี้จะไม่สามารถกู้คืนข้อมูลได้`,
      onConfirm: () => onDeleteSubTask(catId, subTaskId),
    });
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const slider = scrollRef.current;
    if (!slider) return;

    let isDown = false;
    let startX: number;
    let scrollLeft: number;

    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if target or its parent is a button or input
      if (
        target.closest('input') ||
        target.closest('button') ||
        target.closest('select') ||
        target.closest('textarea')
      ) {
        return;
      }
      isDown = true;
      slider.classList.add('cursor-grabbing');
      startX = e.pageX - slider.offsetLeft;
      scrollLeft = slider.scrollLeft;
    };
    const onMouseLeave = () => {
      isDown = false;
      slider.classList.remove('cursor-grabbing');
    };
    const onMouseUp = () => {
      isDown = false;
      slider.classList.remove('cursor-grabbing');
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - slider.offsetLeft;
      const walk = (x - startX) * 2; // scroll-fast
      slider.scrollLeft = scrollLeft - walk;
    };

    slider.addEventListener('mousedown', onMouseDown);
    slider.addEventListener('mouseleave', onMouseLeave);
    slider.addEventListener('mouseup', onMouseUp);
    slider.addEventListener('mousemove', onMouseMove);

    return () => {
      slider.removeEventListener('mousedown', onMouseDown);
      slider.removeEventListener('mouseleave', onMouseLeave);
      slider.removeEventListener('mouseup', onMouseUp);
      slider.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  const handleSaveInlineCatTitle = (catId: string) => {
    if (editingCatTitle.trim() && onUpdateMainCategory) {
      onUpdateMainCategory(catId, { title: editingCatTitle.trim() });
    }
    setEditingCategoryId(null);
  };

  // Date and duration edit handlers for subtasks
  const handleStartDateChange = (catId: string, subTask: SubTask, newStartDateISO: string) => {
    if (!newStartDateISO || !onUpdateSubTask) return;
    const currentDates = getPeriodDates(
      project.startDate,
      subTask.startPeriod,
      subTask.endPeriod,
      project.periodType,
      subTask.startDate,
      subTask.endDate
    );
    
    const startDateObj = new Date(newStartDateISO);
    const endDateObj = new Date(currentDates.endDateISO);

    let targetEndDateISO = currentDates.endDateISO;
    if (isNaN(endDateObj.getTime()) || endDateObj < startDateObj) {
      const dur = Math.max(1, currentDates.durationDays || 7);
      const newEnd = new Date(startDateObj.getTime() + (dur - 1) * 24 * 60 * 60 * 1000);
      targetEndDateISO = newEnd.toISOString().split('T')[0];
    }

    const { startPeriod, endPeriod } = convertDatesToPeriods(
      project.startDate,
      newStartDateISO,
      targetEndDateISO,
      project.periodType
    );

    onUpdateSubTask(catId, subTask.id, { 
      startPeriod, 
      endPeriod,
      startDate: newStartDateISO,
      endDate: targetEndDateISO
    });
  };

  const handleEndDateChange = (catId: string, subTask: SubTask, newEndDateISO: string) => {
    if (!newEndDateISO || !onUpdateSubTask) return;
    const currentDates = getPeriodDates(
      project.startDate,
      subTask.startPeriod,
      subTask.endPeriod,
      project.periodType,
      subTask.startDate,
      subTask.endDate
    );

    const { startPeriod, endPeriod } = convertDatesToPeriods(
      project.startDate,
      currentDates.startDateISO,
      newEndDateISO,
      project.periodType
    );

    onUpdateSubTask(catId, subTask.id, { 
      startPeriod: subTask.startPeriod, 
      endPeriod,
      startDate: currentDates.startDateISO,
      endDate: newEndDateISO
    });
  };

  const handleDurationChange = (catId: string, subTask: SubTask, durationDays: number) => {
    if (isNaN(durationDays) || durationDays < 1 || !onUpdateSubTask) return;
    const currentDates = getPeriodDates(
      project.startDate,
      subTask.startPeriod,
      subTask.endPeriod,
      project.periodType
    );

    const startObj = new Date(currentDates.startDateISO);
    if (isNaN(startObj.getTime())) return;

    const newEndObj = new Date(startObj.getTime() + (durationDays - 1) * 24 * 60 * 60 * 1000);
    const newEndDateISO = newEndObj.toISOString().split('T')[0];

    const { endPeriod } = convertDatesToPeriods(
      project.startDate,
      currentDates.startDateISO,
      newEndDateISO,
      project.periodType
    );

    onUpdateSubTask(catId, subTask.id, { startPeriod: subTask.startPeriod, endPeriod });
  };

  
  const periodHeaders = viewMode === 'single_month'
    ? generateDailyHeadersForMonth(project.startDate, selectedMonthIndex)
    : generatePeriodHeaders(project.startDate, project.totalPeriods, viewMode as any);


  const projYearBE = (() => {
    const d = new Date(project.startDate || new Date().toISOString().split('T')[0]);
    return isNaN(d.getTime()) ? new Date().getFullYear() + 543 : d.getFullYear() + 543;
  })();

  const toggleCategoryCollapse = (catId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            เสร็จสิ้น
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            <Clock className="w-3 h-3 text-blue-600" />
            กำลังทำ
          </span>
        );
      case 'delayed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            ล่าช้า
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-300">
            ยังไม่เริ่ม
          </span>
        );
    }
  };

  const getCategoryColorBorder = (color?: string) => {
    switch (color) {
      case 'emerald': return 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/20';
      case 'blue': return 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/20';
      case 'amber': return 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/20';
      case 'purple': return 'border-purple-500 bg-purple-50/60 dark:bg-purple-950/20';
      case 'rose': return 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/20';
      case 'cyan': return 'border-cyan-500 bg-cyan-50/60 dark:bg-cyan-950/20';
      case 'indigo': return 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/20';
      default: return 'border-amber-500 bg-slate-800/80';
    }
  };

  return (
    <div className="space-y-4">
      
      {/* View Mode & Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-3 text-white">
        
        {/* View Mode Selector */}
        <div className="flex-1">
          <div className="flex items-center">
            <ViewModeSelector 
              viewMode={viewMode}
              onChangeViewMode={onChangeViewMode}
              activeProject={project}
            />

        {viewMode === 'single_month' && (
          <div className="flex items-center ml-4 gap-2">
            <span className="text-xs text-slate-400 font-medium">เลือกเดือน:</span>
            <select
              value={selectedMonthIndex}
              onChange={(e) => setSelectedMonthIndex(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-amber-500"
            >
              {Array.from({ length: project.periodType === 'weekly' ? Math.ceil(project.totalPeriods / 4) : project.totalPeriods }).map((_, idx) => (
                <option key={idx} value={idx + 1}>{getProjectMonthName(project.startDate, idx + 1)}</option>
              ))}
            </select>
          </div>
        )}
          </div>
        </div>

        {/* Filter & Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          
          <div className="flex items-center gap-3 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700/80 text-xs text-slate-300">
            <span className="font-bold text-white mr-1">แสดงคอลัมน์:</span>
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition">
              <input 
                type="checkbox" 
                checked={showBudget} 
                onChange={(e) => setShowBudget(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-slate-700 border-slate-600 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-800"
              />
              มูลค่างาน
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition">
              <input 
                type="checkbox" 
                checked={showPlanned} 
                onChange={(e) => setShowPlanned(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800"
              />
              แผน %
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition">
              <input 
                type="checkbox" 
                checked={showActual} 
                onChange={(e) => setShowActual(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-slate-700 border-slate-600 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-800"
              />
              ผลงานจริง %
            </label>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <div className="flex items-center gap-2 bg-slate-800 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-300">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-white outline-none cursor-pointer appearance-none pr-4"
              >
                <option value="all" className="bg-slate-800">สถานะทั้งหมด</option>
                <option value="in_progress" className="bg-slate-800">กำลังทำ</option>
                <option value="delayed" className="bg-slate-800">ล่าช้า</option>
                <option value="completed" className="bg-slate-800">เสร็จสิ้น</option>
                <option value="not_started" className="bg-slate-800">ยังไม่เริ่ม</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-3 pointer-events-none" />
            </div>
          </div>

          {/* Prompt Main Category Button (+ เพิ่มหัวข้อหลัก) */}
          <button
            id="add-main-category-top-btn"
            onClick={onAddMainCategory}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-md shadow-amber-500/10 active:scale-95 whitespace-nowrap"
          >
            <FolderPlus className="w-4 h-4 stroke-[2.5]" />
            <span>+ เพิ่มหัวข้อหลัก</span>
          </button>

        </div>

      </div>

      {/* Main Gantt & Schedule Table Container */}
      <div className="bg-[#fcfbf8] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto" ref={scrollRef}>
          <table className="w-full text-left border-collapse min-w-[1000px]">
            
            {/* Table Header Row */}
            <thead>
              <tr className="bg-slate-800 text-slate-200 text-xs font-semibold uppercase tracking-wider border-b border-slate-700">
                {/* Fixed Info Columns */}
                <th rowSpan={2} className="sticky left-0 z-30 bg-slate-800 py-2.5 px-2 w-14 text-center border-r border-slate-700 align-middle">
                  ลำดับ<br />งาน
                </th>

                <th rowSpan={2} className="sticky left-14 z-30 bg-slate-800 py-2.5 px-4 min-w-[220px] border-r border-slate-700 align-middle text-left shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]">
                  รายละเอียดงานก่อสร้าง
                </th>

                {/* Construction Schedule Group Header */}
                <th colSpan={3} className="py-1.5 px-2 text-center border-r border-slate-700 border-b border-slate-700/80 bg-slate-800/90 text-amber-300 normal-case font-bold">
                  กำหนดการก่อสร้าง (ปี พ.ศ. {projYearBE})
                </th>

                {showBudget && (
                  <th rowSpan={2} className="py-2.5 px-3 w-28 text-center border-r border-slate-700 align-middle normal-case">
                    มูลค่างาน<br />ตามสัญญา<br />
                    <span className="text-[10px] text-slate-400 font-normal">(THB)</span>
                  </th>
                )}

                {showPlanned && (
                  <th rowSpan={2} className="py-2.5 px-2 w-16 text-center border-r border-slate-700 align-middle text-blue-400">
                    แผน %
                  </th>
                )}

                {showActual && (
                  <th rowSpan={2} className="py-2.5 px-2 w-28 text-center border-r border-slate-700 align-middle text-emerald-400">
                    ผลงานจริง %
                  </th>
                )}

                {/* Period Dynamic Timeline Headers (Weeks or Months) */}

                {viewMode === 'weekly' || viewMode === 'single_month' ? (
                  (viewMode === 'weekly' ? getMonthGroupsForWeekly(periodHeaders) : getWeekGroupsForDaily(periodHeaders)).map((group, idx) => (
                    <th
                      key={idx}
                      colSpan={group.colSpan}
                      className="py-1.5 px-1 text-center bg-slate-800/95 border-b border-r border-slate-700/80 text-amber-300 normal-case font-bold text-[11px]"
                    >
                      {group.label}
                    </th>
                  ))
                ) : (

                  periodHeaders.map((header) => (
                    <th
                      key={header.periodIndex}
                      rowSpan={2}
                      className="py-2 px-1 text-center min-w-[50px] max-w-[75px] border-r border-slate-700/60 bg-slate-800/90 align-middle"
                    >
                      <div className="font-bold text-amber-400 text-[11px]">{header.label}</div>
                      {header.subLabel && (
                        <div className="text-[9px] text-slate-400 font-normal truncate mt-0.5">
                          {header.subLabel}
                        </div>
                      )}
                    </th>
                  ))
                )}

                <th rowSpan={2} className="py-2.5 px-2 w-16 text-center align-middle">
                  จัดการ
                </th>
              </tr>

              {/* Sub-header row for กำหนดการก่อสร้าง */}
              <tr className="bg-slate-800/95 text-slate-300 text-[11px] font-medium border-b border-slate-700">
                <th className="py-1.5 px-2 w-24 text-center border-r border-slate-700 normal-case font-normal">
                  วันเริ่มงาน
                </th>
                <th className="py-1.5 px-2 w-24 text-center border-r border-slate-700 normal-case font-normal">
                  วันสิ้นสุดงาน
                </th>
                <th className="py-1.5 px-2 w-20 text-center border-r border-slate-700 normal-case font-normal">
                  ระยะเวลา
                </th>
                {viewMode === 'weekly' && periodHeaders.map((header) => (
                  <th
                    key={header.periodIndex}
                    className="py-1 px-1 text-center min-w-[50px] max-w-[75px] border-r border-slate-700/60 bg-slate-800/90 align-middle font-bold text-amber-400 text-[10px]"
                  >
                    <div>{header.label}</div>
                    {header.subLabel && (
                      <div className="text-[9px] text-slate-400 font-normal truncate mt-0.5">
                        {header.subLabel}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              
              {project.categories.length === 0 ? (
                <tr>
                  <td colSpan={6 + (showBudget ? 1 : 0) + (showPlanned ? 1 : 0) + (showActual ? 1 : 0) + periodHeaders.length} className="py-12 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="p-3 bg-amber-500/10 text-amber-500 rounded-full w-12 h-12 mx-auto flex items-center justify-center">
                        <FolderPlus className="w-6 h-6" />
                      </div>
                      <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">
                        ยังไม่มีหัวข้อหลักในโครงการนี้
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        เริ่มสร้างแผนงานโดยการคลิกปุ่ม "+ เพิ่มหัวข้อหลัก" เพื่อเพิ่มหมวดงานแรกของคุณ
                      </p>
                      
                      <div className="flex items-center gap-3 justify-center mt-2">
                        <button
                          id="empty-state-add-category-btn"
                          onClick={onAddMainCategory}
                          className="inline-flex items-center gap-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow"
                        >
                          <FolderPlus className="w-4 h-4" />
                          <span>+ เพิ่มหัวข้อหลัก</span>
                        </button>
                        <button
                          onClick={onAddDirectSubTask}
                          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition shadow"
                        >
                          <span>+ เพิ่มรายการย่อย (เริ่มทันที)</span>
                        </button>
                      </div>

                    </div>
                  </td>
                </tr>
              ) : (
                project.categories.map((cat, catIdx) => {
                  const catMetrics = getCategoryMetrics(cat);
                  const isCollapsed = collapsedCategories[cat.id];
                  const isHiddenDefaultCategory = cat.code === '1.0' && cat.title === 'งานทั่วไป' && project.categories.length === 1;

                  // Calculate start/end dates and duration for category
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

                  // Filter subtasks
                  const filteredSubTasks = cat.subTasks.filter((task) => {
                    const status = calculateTaskStatus(task);
                    const matchesStatus = statusFilter === 'all' || status === statusFilter;

                    return matchesStatus;
                  });

                  return (
                    <React.Fragment key={cat.id}>
                      
                      {/* MAIN CATEGORY ROW (หัวข้อหลัก) */}
                      <tr className={`group border-l-4 ${getCategoryColorBorder(cat.color)} bg-[#f4f2ea] dark:bg-slate-800/90 font-semibold text-slate-900 dark:text-white transition`}>
                        
                        {/* Category Code */}
                        <td className="sticky left-0 z-20 bg-[#f4f2ea] dark:bg-slate-800 py-3 px-3 text-center font-mono font-bold text-amber-500 dark:text-amber-400 border-r border-slate-200 dark:border-slate-800">
                          {cat.code}
                        </td>

                        {/* Category Title + Collapse Button + Add Subtask Button (+ เพิ่มรายการย่อย) */}
                        <td className="sticky left-14 z-20 bg-[#f4f2ea] dark:bg-slate-800 py-3 px-4 border-r border-slate-200 dark:border-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <button
                                id={`toggle-collapse-${cat.id}`}
                                onClick={() => toggleCategoryCollapse(cat.id)}
                                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition text-slate-500 dark:text-slate-400 shrink-0"
                              >
                                {isCollapsed ? (
                                  <ChevronRight className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>
                              
                              {editingCategoryId === cat.id ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    value={editingCatTitle}
                                    onChange={(e) => setEditingCatTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveInlineCatTitle(cat.id);
                                      if (e.key === 'Escape') setEditingCategoryId(null);
                                    }}
                                    className="bg-white dark:bg-slate-800 border border-amber-500 rounded px-2 py-0.5 text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleSaveInlineCatTitle(cat.id)}
                                    className="p-1 text-emerald-500 hover:bg-emerald-500/20 rounded transition"
                                    title="บันทึกชื่อ"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setEditingCategoryId(null)}
                                    className="p-1 text-slate-400 hover:bg-slate-500/20 rounded transition"
                                    title="ยกเลิก"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-sm font-bold truncate tracking-tight">
                                    {cat.title}
                                  </span>
                                  <button
                                    onClick={() => onEditMainCategory(cat)}
                                    className="p-1 text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 rounded transition shrink-0"
                                    title="แก้ไขหัวข้อหลัก"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    id={`delete-category-${cat.id}`}
                                    onClick={() => handleDeleteCategoryClick(cat.id, cat.title)}
                                    className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded transition shrink-0"
                                    title="ลบหัวข้อหลัก"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}

                              <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full font-mono shrink-0">
                                {cat.subTasks.length} รายการ
                              </span>
                            </div>

                          </div>
                        </td>

                        {/* Category Start Date */}
                        <td className="py-3 px-2 text-center font-mono text-[11px] text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">
                          {formatThaiDate(catDatesDisplay.startDateISO)}
                        </td>

                        {/* Category End Date */}
                        <td className="py-3 px-2 text-center font-mono text-[11px] text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">
                          {formatThaiDate(catDatesDisplay.endDateISO)}
                        </td>

                        {/* Category Duration */}
                        <td className="py-3 px-2 text-center text-[11px] font-medium text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">
                          {catDatesDisplay.durationText}
                        </td>

                        {/* Category Total Budget */}
                        {showBudget && (
                          <td className="py-3 px-3 text-center font-medium text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">
                            {formatTHB(catMetrics.budget)}
                          </td>
                        )}

                        {/* Category Planned Progress % */}
                        {showPlanned && (
                          <td className="py-3 px-2 text-center font-bold text-blue-600 dark:text-blue-400 border-r border-slate-200 dark:border-slate-800">
                            {catMetrics.plannedProgress}%
                          </td>
                        )}

                        {/* Category Actual Progress % */}
                        {showActual && (
                          <td className="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-800">
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                                {catMetrics.actualProgress}%
                              </span>
                            </div>
                          </td>
                        )}

                        {/* Category Span Cells in Timeline */}
                        {periodHeaders.map((header) => {
                          // Check if any subtask covers this period
                          const isPeriodActive = cat.subTasks.some(
                            (st) => header.periodIndex >= st.startPeriod && header.periodIndex <= st.endPeriod
                          );

                          return (
                            <td
                              key={header.periodIndex}
                              className={`py-2 px-1 text-center border-r border-slate-200 dark:border-slate-800/60 relative ${
                                isPeriodActive ? 'bg-amber-500/10 dark:bg-amber-500/20' : ''
                              }`}
                            >
                              {viewMode === 'monthly' && (
                                <div className="absolute inset-0 flex pointer-events-none">
                                  <div className="flex-1 border-r border-dashed border-slate-300 dark:border-slate-700 h-full"></div>
                                  <div className="flex-1 border-r border-dashed border-slate-300 dark:border-slate-700 h-full"></div>
                                  <div className="flex-1 border-r border-dashed border-slate-300 dark:border-slate-700 h-full"></div>
                                  <div className="flex-1 h-full"></div>
                                </div>
                              )}
                              {isPeriodActive && (
                                <div className="h-2 bg-amber-500/60 rounded-full w-full relative z-10" />
                              )}
                            </td>
                          );
                        })}

                        {/* Category Edit Action */}
                        <td className="py-3 px-2 text-center">
                          <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {onMoveMainCategory && (
                              <>
                                <button
                                  onClick={() => onMoveMainCategory(cat.id, 'up')}
                                  disabled={catIdx === 0}
                                  className={`p-1 rounded transition ${catIdx === 0 ? 'text-slate-600' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                                  title="เลื่อนขึ้น"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => onMoveMainCategory(cat.id, 'down')}
                                  disabled={catIdx === project.categories.length - 1}
                                  className={`p-1 rounded transition ${catIdx === project.categories.length - 1 ? 'text-slate-600' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                                  title="เลื่อนลง"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                            <button
                              id={`edit-category-${cat.id}`}
                              onClick={() => onEditMainCategory(cat)}
                              className="p-1 text-slate-400 hover:text-amber-500 rounded transition"
                              title="แก้ไขหัวข้อหลัก"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                      </tr>

                      {/* SUBTASK ROWS (รายการย่อย) */}
                      {!isCollapsed && filteredSubTasks.map((subTask, stIdx) => {
                        const status = calculateTaskStatus(subTask);
                        const subTaskDates = getPeriodDates(
                          project.startDate, 
                          subTask.startPeriod, 
                          subTask.endPeriod, 
                          project.periodType,
                          subTask.startDate,
                          subTask.endDate
                        );

                        return (
                          <tr
                            key={subTask.id}
                            className="group bg-[#fcfbf7]/90 dark:bg-slate-900/60 hover:bg-[#f3f0e6] dark:hover:bg-slate-800/50 transition text-slate-700 dark:text-slate-300"
                          >
                            {/* SubTask Code */}
                            <td className="sticky left-0 z-20 bg-[#fcfbf7] dark:bg-slate-900 group-hover:bg-[#f3f0e6] dark:group-hover:bg-slate-800 py-2.5 px-3 text-center font-mono text-[11px] text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800/80">
                              {subTask.code}
                            </td>

                            {/* SubTask Title & Assignee */}
                            <td className="sticky left-14 z-20 bg-[#fcfbf7] dark:bg-slate-900 group-hover:bg-[#f3f0e6] dark:group-hover:bg-slate-800 py-2.5 px-4 border-r border-slate-200 dark:border-slate-800/80 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                              <div className="pl-4 border-l-2 border-slate-300 dark:border-slate-700 space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                                    {subTask.title}
                                  </div>
                                  <button
                                    id={`edit-subtask-title-btn-${subTask.id}`}
                                    onClick={() => onEditSubTask(cat.id, subTask)}
                                    className="p-0.5 text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 rounded transition shrink-0"
                                    title="แก้ไขรายการย่อย (เปิดป๊อปอัพ)"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    id={`delete-subtask-${subTask.id}`}
                                    onClick={() => handleDeleteSubTaskClick(cat.id, subTask.id, subTask.title)}
                                    className="p-0.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded transition shrink-0"
                                    title="ลบรายการย่อย"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>

                                <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                                  <span className="font-mono bg-slate-200 dark:bg-slate-800 px-1.5 py-0.2 rounded text-slate-600 dark:text-slate-300">
                                    {viewMode === 'weekly' ? 'สัปดาห์' : 'เดือน'} {subTask.startPeriod} - {subTask.endPeriod}
                                  </span>
                                  {subTask.assignee && (
                                    <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                                      <User className="w-3 h-3 text-blue-400" />
                                      {subTask.assignee}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* SubTask Start Date Picker */}
                            <td className="py-2 px-1.5 text-center border-r border-slate-200 dark:border-slate-800/80">
                              <input
                                type="date"
                                value={subTaskDates.startDateISO}
                                onChange={(e) => handleStartDateChange(cat.id, subTask, e.target.value)}
                                className="w-28 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-1 py-1 text-[11px] font-mono text-slate-700 dark:text-slate-200 focus:outline-none focus:border-amber-500 shadow-none cursor-pointer text-center"
                                title="คลิกเลือกวันเริ่มงานในปฏิทิน"
                              />
                            </td>

                            {/* SubTask End Date Picker */}
                            <td className="py-2 px-1.5 text-center border-r border-slate-200 dark:border-slate-800/80">
                              <input
                                type="date"
                                value={subTaskDates.endDateISO}
                                onChange={(e) => handleEndDateChange(cat.id, subTask, e.target.value)}
                                className="w-28 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-1 py-1 text-[11px] font-mono text-slate-700 dark:text-slate-200 focus:outline-none focus:border-amber-500 shadow-none cursor-pointer text-center"
                                title="คลิกเลือกวันสิ้นสุดงานในปฏิทิน (คำนวณวันออโต้)"
                              />
                            </td>

                            {/* SubTask Duration Input */}
                            <td className="py-2 px-1 text-center border-r border-slate-200 dark:border-slate-800/80">
                              <div className="flex items-center justify-center gap-1">
                                <input
                                  type="number"
                                  min="1"
                                  value={subTaskDates.durationDays}
                                  onChange={(e) => handleDurationChange(cat.id, subTask, Number(e.target.value))}
                                  className="w-12 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-1 py-1 text-[11px] font-bold text-center text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 shadow-none"
                                  title="ใส่ระยะเวลาจำนวนวัน (คิดวันสิ้นสุดออโต้)"
                                />
                                <span className="text-[10px] text-slate-400 font-medium shrink-0">วัน</span>
                              </div>
                            </td>

                            {/* Budget */}
                            {showBudget && (
                              <td className="py-2.5 px-3 text-center text-[11px] text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800/80">
                                {formatTHB(subTask.budget)}
                              </td>
                            )}

                            {/* Planned Progress % */}
                            {showPlanned && (
                              <td className="py-2.5 px-2 text-center font-semibold text-blue-600 dark:text-blue-400 border-r border-slate-200 dark:border-slate-800/80">
                                {subTask.plannedProgress}%
                              </td>
                            )}

                            {/* Quick Update Actual Progress % Slider & Numeric Input */}
                            {showActual && (
                              <td className="py-2 px-2 text-center border-r border-slate-200 dark:border-slate-800/80 min-w-[120px]">
                                <div className="flex flex-col items-center justify-center gap-1">
                                  <div className="flex items-center justify-center gap-1">
                                    <input
                                      id={`quick-progress-input-${subTask.id}`}
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={subTask.actualProgress}
                                      onChange={(e) => {
                                        const val = Math.min(100, Math.max(0, Number(e.target.value)));
                                        onQuickUpdateProgress(cat.id, subTask.id, val);
                                      }}
                                      className="w-12 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-1 py-0.5 text-xs font-bold text-center text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-emerald-500 shadow-none"
                                    />
                                    <span className="text-[10px] font-bold text-slate-400">%</span>
                                  </div>

                                  <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={subTask.actualProgress}
                                    onChange={(e) => onQuickUpdateProgress(cat.id, subTask.id, Number(e.target.value))}
                                    className="w-20 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                    title={`ลากเปอเซ็นผลงานจริง (${subTask.actualProgress}%)`}
                                  />
                                </div>
                              </td>
                            )}

                             {/* Timeline Matrix Cell Bar */}
                            {periodHeaders.map((header) => {
                              const barPos = calculateGanttBarPosition(
                                subTaskDates.startDateISO,
                                subTaskDates.endDateISO,
                                header.startDateISO || '',
                                header.endDateISO || ''
                              );

                              const isTaskStartInCol = subTaskDates.startDateISO >= (header.startDateISO || '') && subTaskDates.startDateISO <= (header.endDateISO || '');
                              const isTaskEndInCol = subTaskDates.endDateISO >= (header.startDateISO || '') && subTaskDates.endDateISO <= (header.endDateISO || '');

                              return (
                                <td
                                  key={header.periodIndex}
                                  className={`py-2 px-0 text-center border-r border-slate-200 dark:border-slate-800/60 relative ${
                                    barPos.hasBar ? 'bg-amber-500/5 dark:bg-amber-500/10' : ''
                                  }`}
                                >
                                  {viewMode === 'monthly' && (
                                    <div className="absolute inset-0 flex pointer-events-none">
                                      <div className="flex-1 border-r border-dashed border-slate-300 dark:border-slate-700 h-full"></div>
                                      <div className="flex-1 border-r border-dashed border-slate-300 dark:border-slate-700 h-full"></div>
                                      <div className="flex-1 border-r border-dashed border-slate-300 dark:border-slate-700 h-full"></div>
                                      <div className="flex-1 h-full"></div>
                                    </div>
                                  )}
                                  {barPos.hasBar && (
                                    <div
                                      style={{
                                        left: `${barPos.leftPercent}%`,
                                        width: `${barPos.widthPercent}%`,
                                      }}
                                      className={`h-4 absolute top-1/2 -translate-y-1/2 z-10 flex items-center justify-center text-[9px] font-bold ${
                                        status === 'completed'
                                          ? 'bg-emerald-500 text-white'
                                          : status === 'delayed'
                                          ? 'bg-rose-500 text-white'
                                          : 'bg-blue-500 text-white'
                                      } ${isTaskStartInCol ? 'rounded-l-md' : ''} ${isTaskEndInCol ? 'rounded-r-md' : ''}`}
                                      title={`${subTask.title}: ผลงาน ${subTask.actualProgress}% (${subTaskDates.startDate} - ${subTaskDates.endDate})`}
                                    >
                                      {isTaskStartInCol && (
                                        <span className="truncate px-1 text-[8px] absolute left-0 w-full text-center">
                                          {subTask.actualProgress}%
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </td>
                              );
                            })}

                            {/* Subtask Action Buttons */}
                            <td className="py-2.5 px-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  id={`edit-subtask-${subTask.id}`}
                                  onClick={() => onEditSubTask(cat.id, subTask)}
                                  className="p-1 text-slate-400 hover:text-amber-500 rounded transition"
                                  title="แก้ไขรายการย่อย"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>

                          </tr>
                        );
                      })}

                      {/* Add Subtask Row button under each category when expanded */}
                      {!isCollapsed && (
                        <tr className="bg-slate-100/50 dark:bg-slate-800/30">
                          <td colSpan={6 + (showBudget ? 1 : 0) + (showPlanned ? 1 : 0) + (showActual ? 1 : 0) + periodHeaders.length} className="py-2 px-6">
                            <button
                              id={`add-subtask-bottom-${cat.id}`}
                              onClick={() => onAddSubTask(cat.id)}
                              className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-bold text-xs py-1 px-3 rounded-lg hover:bg-amber-500/10 transition border border-dashed border-amber-500/40"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              <span>+ เพิ่มรายการย่อย ในหมวด "{cat.title}"</span>
                            </button>
                          </td>
                        </tr>
                      )}

                    </React.Fragment>
                  );
                })
              )}

            </tbody>

          </table>
        </div>

        {/* Table Footer with Prominent "+ เพิ่มหัวข้อหลัก" Action */}
        <div className="p-4 bg-slate-800/90 border-t border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-white">
          <div className="text-xs text-slate-300">
            แสดง {project.categories.length} หัวข้อหลัก รวมรายการย่อยทั้งหมด{' '}
            <strong className="text-amber-400">
              {project.categories.reduce((acc, cat) => acc + cat.subTasks.length, 0)}
            </strong>{' '}
            รายการ
          </div>

          
          <div className="flex gap-2">
            <button
              id="add-main-category-bottom-btn"
              onClick={onAddMainCategory}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition shadow-md shadow-amber-500/20 active:scale-95"
            >
              <FolderPlus className="w-4 h-4 stroke-[2.5]" />
              <span>+ เพิ่มหัวข้อหลักใหม่</span>
            </button>
            {project.categories.length > 0 && onAddDirectSubTask && (
              <button
                onClick={onAddDirectSubTask}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-500 font-bold text-xs px-4 py-2 rounded-xl transition shadow-md active:scale-95"
              >
                <span>+ เพิ่มรายการย่อย</span>
              </button>
            )}
          </div>

        </div>

      </div>

      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
      />
    </div>
  );
};

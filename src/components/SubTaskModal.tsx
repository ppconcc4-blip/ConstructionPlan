import React, { useState, useEffect } from 'react';
import { SubTask } from '../types';
import { X, FilePlus, Calendar, Percent, DollarSign, User, Clock } from 'lucide-react';
import { getPeriodDates, convertDatesToPeriods } from '../utils/constructionUtils';

interface SubTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (subTaskData: Partial<SubTask>) => void;
  editingSubTask?: SubTask | null;
  parentCategoryTitle?: string;
  totalPeriods: number;
  periodType: 'weekly' | 'monthly';
  projectStartDate?: string;
  nextCodeDefault?: string;
}

export const SubTaskModal: React.FC<SubTaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingSubTask,
  parentCategoryTitle = 'หมวดงานหลัก',
  totalPeriods,
  periodType,
  projectStartDate = '',
  nextCodeDefault = '1.1',
}) => {
  const [code, setCode] = useState(nextCodeDefault);
  const [title, setTitle] = useState('');
  const [startPeriod, setStartPeriod] = useState(1);
  const [endPeriod, setEndPeriod] = useState(2);
  const [startDateISO, setStartDateISO] = useState('');
  const [endDateISO, setEndDateISO] = useState('');
  const [durationDays, setDurationDays] = useState(14);
  const [budget, setBudget] = useState(0);
  const [assignee, setAssignee] = useState('');
  const [plannedProgress, setPlannedProgress] = useState(100);
  const [actualProgress, setActualProgress] = useState(0);

  useEffect(() => {
    const baseProjStart = projectStartDate || new Date().toISOString().split('T')[0];

    if (editingSubTask) {
      setCode(editingSubTask.code || '');
      setTitle(editingSubTask.title || '');
      const sP = editingSubTask.startPeriod || 1;
      const eP = editingSubTask.endPeriod || 1;
      setStartPeriod(sP);
      setEndPeriod(eP);

      const computedDates = getPeriodDates(baseProjStart, sP, eP, periodType, editingSubTask.startDate, editingSubTask.endDate);
      setStartDateISO(computedDates.startDateISO);
      setEndDateISO(computedDates.endDateISO);
      setDurationDays(computedDates.durationDays || 7);

      setBudget(editingSubTask.budget || 0);
      setAssignee(editingSubTask.assignee || '');
      setPlannedProgress(editingSubTask.plannedProgress ?? 100);
      setActualProgress(editingSubTask.actualProgress ?? 0);
    } else {
      setCode(nextCodeDefault);
      setTitle('');
      const sP = 1;
      const eP = Math.min(totalPeriods, 2);
      setStartPeriod(sP);
      setEndPeriod(eP);

      const computedDates = getPeriodDates(baseProjStart, sP, eP, periodType);
      setStartDateISO(computedDates.startDateISO);
      setEndDateISO(computedDates.endDateISO);
      setDurationDays(computedDates.durationDays || 14);

      setBudget(200000);
      setAssignee('');
      setPlannedProgress(100);
      setActualProgress(0);
    }
  }, [editingSubTask, nextCodeDefault, totalPeriods, isOpen, projectStartDate, periodType]);

  if (!isOpen) return null;

  const handleStartDateChange = (newStartISO: string) => {
    if (!newStartISO) return;
    setStartDateISO(newStartISO);

    const baseProjStart = projectStartDate || new Date().toISOString().split('T')[0];
    const startObj = new Date(newStartISO);
    let endObj = new Date(endDateISO);

    if (isNaN(endObj.getTime()) || endObj < startObj) {
      endObj = new Date(startObj.getTime() + (durationDays - 1) * 24 * 60 * 60 * 1000);
    }

    const targetEndISO = endObj.toISOString().split('T')[0];
    setEndDateISO(targetEndISO);

    const diffMs = endObj.getTime() - startObj.getTime();
    const newDur = Math.max(1, Math.round(diffMs / (24 * 60 * 60 * 1000)) + 1);
    setDurationDays(newDur);

    const { startPeriod: sP, endPeriod: eP } = convertDatesToPeriods(
      baseProjStart,
      newStartISO,
      targetEndISO,
      periodType
    );
    setStartPeriod(sP);
    setEndPeriod(eP);
  };

  const handleEndDateChange = (newEndISO: string) => {
    if (!newEndISO) return;
    setEndDateISO(newEndISO);

    const baseProjStart = projectStartDate || new Date().toISOString().split('T')[0];
    const startObj = new Date(startDateISO);
    const endObj = new Date(newEndISO);

    if (!isNaN(startObj.getTime()) && !isNaN(endObj.getTime()) && endObj >= startObj) {
      const diffMs = endObj.getTime() - startObj.getTime();
      const newDur = Math.max(1, Math.round(diffMs / (24 * 60 * 60 * 1000)) + 1);
      setDurationDays(newDur);
    }

    const { startPeriod: sP, endPeriod: eP } = convertDatesToPeriods(
      baseProjStart,
      startDateISO,
      newEndISO,
      periodType
    );
    setStartPeriod(sP);
    setEndPeriod(eP);
  };

  const handlePeriodSelectChange = (newSP: number, newEP: number) => {
    setStartPeriod(newSP);
    setEndPeriod(newEP);

    const baseProjStart = projectStartDate || new Date().toISOString().split('T')[0];
    const computedDates = getPeriodDates(baseProjStart, newSP, newEP, periodType);
    setStartDateISO(computedDates.startDateISO);
    setEndDateISO(computedDates.endDateISO);
    setDurationDays(computedDates.durationDays || 7);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      code: code.trim() || '1.1',
      title: title.trim(),
      startPeriod: Number(startPeriod),
      endPeriod: Math.max(Number(startPeriod), Number(endPeriod)),
      startDate: startDateISO,
      endDate: endDateISO,
      budget: Math.max(0, Number(budget)),
      assignee: assignee.trim(),
      plannedProgress: Math.min(100, Math.max(0, Number(plannedProgress))),
      actualProgress: Math.min(100, Math.max(0, Number(actualProgress))),
    });
    onClose();
  };

  const periodUnitLabel = periodType === 'weekly' ? 'สัปดาห์' : 'เดือน';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150 my-8">
        
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
              <FilePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {editingSubTask ? 'แก้ไขรายการย่อย (Sub-task)' : '+ เพิ่มรายการย่อยใหม่'}
              </h3>
              <p className="text-xs text-amber-400/90 font-medium truncate max-w-xs">
                ภายใต้: {parentCategoryTitle}
              </p>
            </div>
          </div>

          <button
            id="close-subtask-modal-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {/* Code & Title */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1 space-y-1">
              <label className="block text-xs font-medium text-slate-300">
                รหัสรายการ
              </label>
              <input
                id="subtask-code-input"
                type="text"
                required
                placeholder="1.1"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-amber-300 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="col-span-2 space-y-1">
              <label className="block text-xs font-medium text-slate-300">
                ชื่อรายการย่อย <span className="text-rose-400">*</span>
              </label>
              <input
                id="subtask-title-input"
                type="text"
                required
                placeholder="เช่น งานตอกเสาเข็ม หรือ งานเทคอนกรีตฐานราก"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Timeline & Date Selection */}
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                กำหนดช่วงเวลาการทำงาน (ระบุเป็นวันที่)
              </label>
              {durationDays > 0 && (
                <span className="text-[11px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  {durationDays} วัน
                </span>
              )}
            </div>

            {/* Date Picker Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[11px] text-slate-300 font-medium block">
                  เริ่มต้นวันที่ (Start Date) <span className="text-rose-400">*</span>
                </span>
                <input
                  id="subtask-start-date-input"
                  type="date"
                  required
                  value={startDateISO}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-slate-300 font-medium block">
                  สิ้นสุดวันที่ (End Date) <span className="text-rose-400">*</span>
                </span>
                <input
                  id="subtask-end-date-input"
                  type="date"
                  required
                  value={endDateISO}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Calculated Gantt Period summary and dropdown fallback */}
            <div className="flex items-center justify-between text-[11px] bg-slate-900/80 rounded-lg px-3 py-2 border border-slate-700/60 flex-wrap gap-2">
              <div className="text-slate-400">
                ตรงกับช่วงเวลา Gantt:
              </div>
              <div className="flex items-center gap-2">
                <select
                  id="subtask-start-period-select"
                  value={startPeriod}
                  onChange={(e) => {
                    const newSP = Number(e.target.value);
                    const newEP = Math.max(newSP, endPeriod);
                    handlePeriodSelectChange(newSP, newEP);
                  }}
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-xs font-bold text-amber-300 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  {Array.from({ length: totalPeriods }, (_, i) => i + 1).map((p) => (
                    <option key={p} value={p}>
                      {periodUnitLabel}ที่ {p}
                    </option>
                  ))}
                </select>
                <span className="text-slate-500">ถึง</span>
                <select
                  id="subtask-end-period-select"
                  value={endPeriod}
                  onChange={(e) => {
                    const newEP = Number(e.target.value);
                    const newSP = Math.min(startPeriod, newEP);
                    handlePeriodSelectChange(newSP, newEP);
                  }}
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-xs font-bold text-amber-300 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  {Array.from({ length: totalPeriods }, (_, i) => i + 1)
                    .filter((p) => p >= startPeriod)
                    .map((p) => (
                      <option key={p} value={p}>
                        {periodUnitLabel}ที่ {p}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {/* Budget */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-300 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              งบประมาณ (บาท)
            </label>
            <input
              id="subtask-budget-input"
              type="number"
              min="0"
              step="0.01"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Progress % Controls */}
          <div className="grid grid-cols-2 gap-3 bg-slate-800/40 p-3 rounded-xl border border-slate-700/60">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-300">
                แผนงาน (Planned %)
              </label>
              <input
                id="subtask-planned-progress-input"
                type="number"
                min="0"
                max="100"
                value={plannedProgress}
                onChange={(e) => setPlannedProgress(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-blue-300 font-semibold focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-300">
                ผลงานจริง (Actual %)
              </label>
              <input
                id="subtask-actual-progress-input"
                type="number"
                min="0"
                max="100"
                value={actualProgress}
                onChange={(e) => setActualProgress(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-emerald-300 font-semibold focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Assignee */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-300 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-blue-400" />
              ผู้รับผิดชอบ / ช่างผู้ดำเนินการ
            </label>
            <input
              id="subtask-assignee-input"
              type="text"
              placeholder="เช่น ช่างวิศวกรโครงสร้าง หรือ ทีมคอนกรีต CPAC"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              id="cancel-subtask-modal-btn"
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
            >
              ยกเลิก
            </button>
            <button
              id="submit-subtask-modal-btn"
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg shadow transition"
            >
              {editingSubTask ? 'บันทึกการแก้ไข' : 'เพิ่มรายการย่อย'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

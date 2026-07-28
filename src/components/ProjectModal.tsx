import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import { X, Building2, Calendar, FileText, DollarSign, MapPin, UserCheck, Layers, Clock, Trash2 } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (projectData: Partial<Project>, templateType?: 'blank' | 'residential' | 'commercial') => void;
  editingProject?: Project | null;
  onDeleteProject?: (projectId: string) => void;
}

// Calculate End Date string (YYYY-MM-DD) from Start Date string and Days
const calcEndDate = (startStr: string, days: number): string => {
  if (!startStr) return '';
  const d = new Date(startStr);
  if (isNaN(d.getTime())) return '';
  const daysToAdd = Math.max(0, days - 1);
  const target = new Date(d.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  return target.toISOString().split('T')[0];
};

// Calculate Days difference from Start Date string to End Date string (inclusive)
const calcDaysFromDates = (startStr: string, endStr: string): number => {
  if (!startStr || !endStr) return 1;
  const d1 = new Date(startStr);
  const d2 = new Date(endStr);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 1;
  const diffTime = d2.getTime() - d1.getTime();
  const diffDays = Math.round(diffTime / (24 * 60 * 60 * 1000));
  return Math.max(1, diffDays + 1);
};

// Calculate total periods (weeks or months) from days
const calcPeriodsFromDays = (days: number, pType: 'weekly' | 'monthly'): number => {
  if (pType === 'weekly') {
    return Math.max(1, Math.ceil(days / 7));
  } else {
    return Math.max(1, Math.ceil(days / 30));
  }
};

// Calculate days from total periods and periodType
const calcDaysFromPeriods = (periods: number, pType: 'weekly' | 'monthly'): number => {
  if (pType === 'weekly') {
    return Math.max(1, periods * 7);
  } else {
    return Math.max(1, periods * 30);
  }
};

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingProject,
  onDeleteProject,
}) => {
  const [name, setName] = useState('');
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
  const [code, setCode] = useState('PP-2026-001');
  const [clientName, setClientName] = useState('');
  const [contractor, setContractor] = useState('บริษัท พีพี. คอนสตรัคชั่น แอนด์ แมนเนจเม้นท์ จำกัด');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [totalDays, setTotalDays] = useState<number>(112);
  const [endDate, setEndDate] = useState<string>('');
  const [periodType, setPeriodType] = useState<'weekly' | 'monthly'>('weekly');
  const [totalPeriods, setTotalPeriods] = useState<number>(16);
  const [totalBudget, setTotalBudget] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [templateType, setTemplateType] = useState<'blank' | 'residential' | 'commercial'>('residential');

  useEffect(() => {
    if (editingProject) {
      const start = editingProject.startDate || new Date().toISOString().split('T')[0];
      const pType = editingProject.periodType || 'weekly';
      const periods = editingProject.totalPeriods || 16;
      const days = editingProject.totalDays || calcDaysFromPeriods(periods, pType);
      const end = editingProject.endDate || calcEndDate(start, days);

      setName(editingProject.name || '');
      setCode(editingProject.code || '');
      setClientName(editingProject.clientName || '');
      setContractor(editingProject.contractor || '');
      setLocation(editingProject.location || '');
      setStartDate(start);
      setTotalDays(days);
      setEndDate(end);
      setPeriodType(pType);
      setTotalPeriods(periods);
      setTotalBudget(editingProject.totalBudget ?? 0);
      setDescription(editingProject.description || '');
    } else {
      // Reset defaults for new project
      const today = new Date().toISOString().split('T')[0];
      const randomNum = Math.floor(100 + Math.random() * 900);
      const defaultPType = 'weekly';
      const defaultPeriods = 16;
      const defaultDays = calcDaysFromPeriods(defaultPeriods, defaultPType);
      const defaultEnd = calcEndDate(today, defaultDays);

      setName('');
      setCode(`PP-${new Date().getFullYear()}-${randomNum}`);
      setClientName('');
      setContractor('บริษัท พีพี. คอนสตรัคชั่น แอนด์ แมนเนจเม้นท์ จำกัด');
      setLocation('');
      setStartDate(today);
      setTotalDays(defaultDays);
      setEndDate(defaultEnd);
      setPeriodType(defaultPType);
      setTotalPeriods(defaultPeriods);
      setTotalBudget(0);
      setDescription('');
      setTemplateType('residential');
    }
  }, [editingProject, isOpen]);

  if (!isOpen) return null;

  // Handler when Start Date changes
  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart);
    if (newStart && totalDays > 0) {
      const calculatedEnd = calcEndDate(newStart, totalDays);
      setEndDate(calculatedEnd);
    }
  };

  // Handler when user inputs Total Days (กรอกจำนวนวัน -> คำนวณวันสิ้นสุด)
  const handleTotalDaysChange = (inputDays: number) => {
    const days = Math.max(1, inputDays);
    setTotalDays(days);
    if (startDate) {
      const calculatedEnd = calcEndDate(startDate, days);
      setEndDate(calculatedEnd);
    }
    const calculatedPeriods = calcPeriodsFromDays(days, periodType);
    setTotalPeriods(calculatedPeriods);
  };

  // Handler when user selects End Date (เลือกวันสิ้นสุด -> คำนวณจำนวนวัน)
  const handleEndDateChange = (newEnd: string) => {
    setEndDate(newEnd);
    if (startDate && newEnd) {
      const calculatedDays = calcDaysFromDates(startDate, newEnd);
      setTotalDays(calculatedDays);
      const calculatedPeriods = calcPeriodsFromDays(calculatedDays, periodType);
      setTotalPeriods(calculatedPeriods);
    }
  };

  // Handler when user changes Total Periods directly
  const handleTotalPeriodsChange = (inputPeriods: number) => {
    const periods = Math.max(1, inputPeriods);
    setTotalPeriods(periods);
    const calculatedDays = calcDaysFromPeriods(periods, periodType);
    setTotalDays(calculatedDays);
    if (startDate) {
      const calculatedEnd = calcEndDate(startDate, calculatedDays);
      setEndDate(calculatedEnd);
    }
  };

  // Handler when Period Type changes
  const handlePeriodTypeChange = (newPType: 'weekly' | 'monthly') => {
    setPeriodType(newPType);
    const calculatedPeriods = calcPeriodsFromDays(totalDays, newPType);
    setTotalPeriods(calculatedPeriods);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave(
      {
        name: name.trim(),
        code: code.trim() || `PRJ-${Date.now()}`,
        clientName: clientName.trim(),
        contractor: contractor.trim(),
        location: location.trim(),
        startDate: startDate || new Date().toISOString().split('T')[0],
        endDate: endDate || calcEndDate(startDate, totalDays),
        totalDays: Number(totalDays) || 1,
        periodType,
        totalPeriods: Number(totalPeriods) || 12,
        totalBudget: Number(totalBudget) || 0,
        description: description.trim(),
      },
      editingProject ? undefined : templateType
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {editingProject ? 'แก้ไขข้อมูลโครงการก่อสร้าง' : 'สร้างโครงการก่อสร้างใหม่ (New Project)'}
              </h3>
              <p className="text-xs text-slate-400">
                {editingProject ? 'อัปเดตรายละเอียดและงบประมาณโครงการ' : 'กำหนดชื่อ วันเริ่มต้น ช่วงเวลา และแม่แบบเริ่มต้น'}
              </p>
            </div>
          </div>

          <button
            id="close-project-modal-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Template Selection for New Projects */}
          {!editingProject && (
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3.5 space-y-2">
              <label className="block text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                <Layers className="w-4 h-4" />
                เลือกแม่แบบเริ่มต้น (Project Template)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTemplateType('residential');
                    setPeriodType('weekly');
                    setTotalPeriods(16);
                    const days = 16 * 7;
                    setTotalDays(days);
                    if (startDate) setEndDate(calcEndDate(startDate, days));
                    if (!name) setName('โครงการก่อสร้างบ้านพักอาศัย 2 ชั้น');
                  }}
                  className={`p-2.5 rounded-lg border text-left transition ${
                    templateType === 'residential'
                      ? 'bg-amber-500/20 border-amber-500 text-white font-semibold'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700/50'
                  }`}
                >
                  <div className="text-xs font-bold">บ้านพักอาศัย (รายสัปดาห์)</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">16 สัปดาห์ (112 วัน) พร้อมหมวดงาน 5 หมวด</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTemplateType('commercial');
                    setPeriodType('monthly');
                    setTotalPeriods(12);
                    const days = 12 * 30;
                    setTotalDays(days);
                    if (startDate) setEndDate(calcEndDate(startDate, days));
                    if (!name) setName('โครงการอาคารพาณิชย์/สำนักงาน 4 ชั้น');
                  }}
                  className={`p-2.5 rounded-lg border text-left transition ${
                    templateType === 'commercial'
                      ? 'bg-amber-500/20 border-amber-500 text-white font-semibold'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700/50'
                  }`}
                >
                  <div className="text-xs font-bold">อาคารพาณิชย์ (รายเดือน)</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">12 เดือน (360 วัน) พร้อมแผนงานโครงสร้าง MEP</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTemplateType('blank');
                    if (!name) setName('โครงการใหม่ (สร้างตารางว่าง)');
                  }}
                  className={`p-2.5 rounded-lg border text-left transition ${
                    templateType === 'blank'
                      ? 'bg-amber-500/20 border-amber-500 text-white font-semibold'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700/50'
                  }`}
                >
                  <div className="text-xs font-bold">ว่างเปล่า (Blank Project)</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">เริ่มสร้างหัวข้อหลักและรายการย่อยเอง</div>
                </button>
              </div>
            </div>
          )}

          {/* Project Name & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="block text-xs font-medium text-slate-300">
                ชื่อโครงการ <span className="text-rose-400">*</span>
              </label>
              <input
                id="project-name-input"
                type="text"
                required
                placeholder="เช่น โครงการก่อสร้างอาคารสำนักงาน 3 ชั้น"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-300">
                เลขที่สัญญา (Contract No.)
              </label>
              <input
                id="project-code-input"
                type="text"
                placeholder="123/2569"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-amber-300 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Client & Contractor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-300 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                เจ้าของโครงการ (Client)
              </label>
              <input
                id="project-client-input"
                type="text"
                placeholder="ชื่อบริษัท หรือ ชื่อบุคคล"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-300 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                ผู้รับเหมาก่อสร้าง (Contractor)
              </label>
              <input
                id="project-contractor-input"
                type="text"
                placeholder="บริษัท พีพี. คอนสตรัคชั่น แอนด์ แมนเนจเม้นท์ จำกัด"
                value={contractor}
                onChange={(e) => setContractor(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Location & Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-300 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                สถานที่ก่อสร้าง (Location)
              </label>
              <input
                id="project-location-input"
                type="text"
                placeholder="เช่น อ.เมือง จ.เชียงใหม่"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-300 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                งบประมาณรวม (บาท)
              </label>
              <input
                id="project-budget-input"
                type="number"
                min="0"
                step="0.01"
                value={totalBudget}
                onChange={(e) => setTotalBudget(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Interactive Date & Duration Section */}
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                กำหนดวันเริ่มต้น ระยะเวลา และวันสิ้นสุดโครงการ
              </label>
              <div className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-medium flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                {totalDays} วัน ({totalPeriods} {periodType === 'weekly' ? 'สัปดาห์' : 'เดือน'})
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Start Date */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-300">
                  วันเริ่มต้น (Start Date) <span className="text-rose-400">*</span>
                </label>
                <input
                  id="project-start-date-input"
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Total Days Input (Interactive Days -> End Date) */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-300 flex items-center justify-between">
                  <span>จำนวนวัน (Total Days)</span>
                  <span className="text-[10px] text-amber-400 font-normal">กรอกเพื่อคำนวณวันสิ้นสุด</span>
                </label>
                <div className="relative">
                  <input
                    id="project-total-days-input"
                    type="number"
                    min="1"
                    max="3650"
                    value={totalDays}
                    onChange={(e) => handleTotalDaysChange(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-semibold text-amber-300 focus:outline-none focus:border-amber-500 pr-12"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400 pointer-events-none">
                    วัน
                  </span>
                </div>
              </div>

              {/* End Date Input (Interactive End Date -> Days) */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-300 flex items-center justify-between">
                  <span>วันสิ้นสุด (End Date)</span>
                  <span className="text-[10px] text-blue-400 font-normal">เลือกเพื่อคำนวณจำนวนวัน</span>
                </label>
                <input
                  id="project-end-date-input"
                  type="date"
                  value={endDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-700/50">
              {/* Period Type */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-300">
                  รูปแบบแผนงาน (Schedule Format)
                </label>
                <select
                  id="project-period-type-select"
                  value={periodType}
                  onChange={(e) => handlePeriodTypeChange(e.target.value as 'weekly' | 'monthly')}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="weekly">รายสัปดาห์ (Weekly View)</option>
                  <option value="monthly">รายเดือน (Monthly View)</option>
                </select>
              </div>

              {/* Total Periods */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-300">
                  จำนวนช่วงเวลา ({periodType === 'weekly' ? 'สัปดาห์' : 'เดือน'})
                </label>
                <input
                  id="project-total-periods-input"
                  type="number"
                  min="1"
                  max="104"
                  required
                  value={totalPeriods}
                  onChange={(e) => handleTotalPeriodsChange(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-between bg-slate-900/60 px-3 py-2 rounded-lg border border-slate-700/50">
              <span>💡 <strong>คำนวณอัตโนมัติ:</strong> คุณสามารถกรอก <em>จำนวนวัน</em> เพื่อให้ระบบคำนวณวันสิ้นสุด หรือเลือก <em>วันสิ้นสุด</em> เพื่อให้ระบบคำนวณจำนวนวันให้อัตโนมัติ</span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-300 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              รายละเอียดเพิ่มเติม / หมายเหตุ
            </label>
            <textarea
              id="project-description-input"
              rows={2}
              placeholder="ข้อกำหนดพิเศษ, เงื่อนไขสัญญาก่อสร้าง..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          {/* Modal Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <div>
              {editingProject && onDeleteProject && (
                <button
                  id="delete-project-modal-btn"
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setConfirmState({
                      isOpen: true,
                      title: 'ยืนยันลบโครงการ',
                      message: `คุณแน่ใจหรือไม่ว่าต้องการลบโครงการ "${editingProject.name}"? ข้อมูลทั้งหมดและแผนงานจะถูกลบออกอย่างถาวร`,
                      onConfirm: () => {
                        onDeleteProject(editingProject.id);
                        onClose();
                      }
                    });
                  }}
                  className="px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  ลบโครงการนี้
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                id="cancel-project-modal-btn"
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
              >
                ยกเลิก
              </button>
              <button
                id="submit-project-modal-btn"
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg shadow-md transition"
              >
                {editingProject ? 'บันทึกการแก้ไข' : 'สร้างโครงการก่อสร้าง'}
              </button>
            </div>
          </div>

        </form>
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

import React, { useState } from 'react';
import { Project } from '../types';
import { CompanyLogo } from './CompanyLogo';
import { 
  Building2, 
  PlusCircle, 
  ChevronDown, 
  Printer, 
  Download, 
  Upload, 
  FolderCheck,
  Edit,
  Trash2
} from 'lucide-react';
import { formatTHB, getProjectSummary } from '../utils/constructionUtils';
import { ConfirmModal } from './ConfirmModal';

interface NavbarProps {
  projects: Project[];
  activeProject: Project;
  onSelectProject: (project: Project) => void;
  onOpenNewProjectModal: () => void;
  onOpenEditProjectModal: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
  onImportJSON: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPrint: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  projects,
  activeProject,
  onSelectProject,
  onOpenNewProjectModal,
  onOpenEditProjectModal,
  onDeleteProject,
  onExportCSV,
  onExportJSON,
  onImportJSON,
  onPrint,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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
  const summary = getProjectSummary(activeProject);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      {/* Top Banner Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* Logo & App Name */}
          <div className="flex items-center space-x-3">
            <div className="bg-slate-800/80 border border-slate-700/80 px-3.5 py-2 rounded-xl shadow-md backdrop-blur-sm">
              <CompanyLogo variant="dark" />
            </div>
          </div>

          {/* Project Dropdown Selector & New Project Button */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Project Selector Dropdown */}
            <div className="relative">
              <label className="block text-[10px] font-medium text-slate-400 mb-0.5 uppercase tracking-wider">
                เลือกโครงการที่ทำไว้แล้ว ({projects.length})
              </label>
              <button
                id="project-selector-dropdown-btn"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center justify-between gap-3 bg-slate-800/90 hover:bg-slate-700/80 border border-slate-700/80 hover:border-slate-600 text-slate-100 text-sm font-medium px-3.5 py-2 rounded-lg transition-all min-w-[240px] max-w-[340px] shadow-sm text-left"
              >
                <div className="truncate">
                  <div className="font-semibold text-amber-400 text-sm truncate">
                    {activeProject.name}
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <span>{activeProject.code}</span>
                    <span>•</span>
                    <span>{activeProject.periodType === 'weekly' ? `${activeProject.totalPeriods} สัปดาห์` : `${activeProject.totalPeriods} เดือน`}</span>
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsDropdownOpen(false)} 
                  />
                  <div className="absolute left-0 mt-1.5 w-80 sm:w-96 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden py-1">
                    <div className="px-3 py-2 border-b border-slate-700/80 bg-slate-800/50 flex justify-between items-center text-xs text-slate-400 font-semibold">
                      <span>โครงการทั้งหมด ({projects.length})</span>
                      <span className="text-[11px] text-amber-400">คลิกเพื่อสลับ</span>
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-700/50">
                      {projects.map((proj) => {
                        const isSelected = proj.id === activeProject.id;
                        return (
                          <div
                            key={proj.id}
                            className={`px-3 py-2.5 transition-colors flex items-center justify-between group ${
                              isSelected 
                                ? 'bg-amber-500/10 border-l-4 border-amber-500' 
                                : 'hover:bg-slate-700/50'
                            }`}
                          >
                            <button
                              id={`select-project-${proj.id}`}
                              onClick={() => {
                                onSelectProject(proj);
                                setIsDropdownOpen(false);
                              }}
                              className="flex-1 text-left mr-2 min-w-0"
                            >
                              <div className={`text-sm font-medium truncate ${isSelected ? 'text-amber-300 font-semibold' : 'text-slate-200'}`}>
                                {proj.name}
                              </div>
                              <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                                <span className="bg-slate-700/80 px-1.5 py-0.5 rounded text-[10px] text-slate-300 font-mono">{proj.code}</span>
                                <span>{proj.periodType === 'weekly' ? `${proj.totalPeriods} สัปดาห์` : `${proj.totalPeriods} เดือน`}</span>
                                <span>•</span>
                                <span className="text-slate-300">{formatTHB(proj.totalBudget)}</span>
                              </div>
                            </button>

                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                              <button
                                id={`edit-project-${proj.id}`}
                                title="แก้ไขข้อมูลโครงการ"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenEditProjectModal(proj);
                                  setIsDropdownOpen(false);
                                }}
                                className="p-1.5 hover:bg-slate-600 text-slate-400 hover:text-white rounded transition"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                id={`delete-project-${proj.id}`}
                                title="ลบโครงการนี้"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmState({
                                    isOpen: true,
                                    title: 'ยืนยันลบโครงการ',
                                    message: `คุณแน่ใจหรือไม่ว่าต้องการลบโครงการ "${proj.name}"? ข้อมูลทั้งหมดและแผนงานจะถูกลบออกอย่างถาวร`,
                                    onConfirm: () => {
                                      onDeleteProject(proj.id);
                                      setIsDropdownOpen(false);
                                    }
                                  });
                                }}
                                className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="p-2 border-t border-slate-700/80 bg-slate-900/60">
                      <button
                        id="dropdown-create-new-project-btn"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onOpenNewProjectModal();
                        }}
                        className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs py-2 px-3 rounded-lg transition shadow-md"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>สร้างโครงการใหม่</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Main Action: New Project Button */}
            <div className="self-end">
              <button
                id="create-new-project-main-btn"
                onClick={onOpenNewProjectModal}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-sm px-4 py-2 rounded-lg transition-all shadow-md shadow-amber-500/10 active:scale-95"
              >
                <PlusCircle className="w-4 h-4 stroke-[2.5]" />
                <span className="whitespace-nowrap">เพิ่มโครงการใหม่</span>
              </button>
            </div>

          </div>

        </div>

        {/* Export Tools Subbar */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-end gap-3">
          
          {/* Export / Print Tools */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="export-csv-btn"
              onClick={onExportCSV}
              title="ดาวน์โหลดไฟล์ Excel / CSV"
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">ส่งออก</span> CSV/Excel
            </button>

            <button
              id="export-json-btn"
              onClick={onExportJSON}
              title="ส่งออกไฟล์สำรองข้อมูล JSON"
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-700 transition"
            >
              <FolderCheck className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">สำรอง</span> JSON
            </button>

            <label
              id="import-json-label"
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-700 transition cursor-pointer"
              title="นำเข้าไฟล์โครงการ JSON"
            >
              <Upload className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">นำเข้า</span> JSON
              <input
                type="file"
                accept=".json"
                onChange={onImportJSON}
                className="hidden"
              />
            </label>

            <button
              id="print-report-btn"
              onClick={onPrint}
              title="พิมพ์ตารางแผนงานเป็น PDF หรือ พิมพ์ออกกระดาษ"
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-700 transition"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>พิมพ์รายงาน</span>
            </button>
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
    </header>
  );
};

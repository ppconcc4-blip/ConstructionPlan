import React, { useState, useEffect } from 'react';
import { MainCategory } from '../types';
import { X, FolderPlus, Palette } from 'lucide-react';

interface MainCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (categoryData: Partial<MainCategory>) => void;
  editingCategory?: MainCategory | null;
  nextCodeDefault?: string;
}

const COLOR_OPTIONS = [
  { name: 'emerald', label: 'เขียวมรกต', bg: 'bg-emerald-500' },
  { name: 'blue', label: 'น้ำเงิน', bg: 'bg-blue-500' },
  { name: 'amber', label: 'เหลืองทอง', bg: 'bg-amber-500' },
  { name: 'purple', label: 'ม่วง', bg: 'bg-purple-500' },
  { name: 'rose', label: 'แดงกุหลาบ', bg: 'bg-rose-500' },
  { name: 'cyan', label: 'ฟ้าคราม', bg: 'bg-cyan-500' },
  { name: 'indigo', label: 'ครามเข้ม', bg: 'bg-indigo-500' },
];

export const MainCategoryModal: React.FC<MainCategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingCategory,
  nextCodeDefault = '1.0',
}) => {
  const [code, setCode] = useState(nextCodeDefault);
  const [title, setTitle] = useState('');
  const [color, setColor] = useState('blue');

  useEffect(() => {
    if (editingCategory) {
      setCode(editingCategory.code || '');
      setTitle(editingCategory.title || '');
      setColor(editingCategory.color || 'blue');
    } else {
      setCode(nextCodeDefault);
      setTitle('');
      setColor('blue');
    }
  }, [editingCategory, nextCodeDefault, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      code: code.trim() || '1.0',
      title: title.trim(),
      color,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {editingCategory ? 'แก้ไขหัวข้อหลัก (Main Category)' : '+ เพิ่มหัวข้อหลักใหม่'}
              </h3>
              <p className="text-xs text-slate-400">
                หมวดงานใหญ่ของโครงการ เช่น งานโครงสร้าง, งานสถาปัตยกรรม
              </p>
            </div>
          </div>

          <button
            id="close-category-modal-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1 space-y-1">
              <label className="block text-xs font-medium text-slate-300">
                รหัสหัวข้อ
              </label>
              <input
                id="main-category-code-input"
                type="text"
                required
                placeholder="1.0"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-amber-300 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="col-span-2 space-y-1">
              <label className="block text-xs font-medium text-slate-300">
                ชื่อหัวข้อหลัก <span className="text-rose-400">*</span>
              </label>
              <input
                id="main-category-title-input"
                type="text"
                required
                placeholder="เช่น งานโครงสร้างอาคาร ค.ส.ล."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Color Tag Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              สีประจำหมวดงาน
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setColor(c.name)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition ${
                    color === c.name
                      ? 'bg-slate-700 border-amber-400 font-semibold text-white ring-1 ring-amber-400/50'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full ${c.bg}`} />
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              id="cancel-category-modal-btn"
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
            >
              ยกเลิก
            </button>
            <button
              id="submit-category-modal-btn"
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg shadow transition"
            >
              {editingCategory ? 'บันทึกการแก้ไข' : 'เพิ่มหัวข้อหลัก'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

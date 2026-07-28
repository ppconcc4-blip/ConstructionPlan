import React, { useState, useEffect } from 'react';
import { Project, MainCategory, SubTask, ViewMode } from './types';
import { INITIAL_PROJECTS } from './data/sampleProjects';
import { Navbar } from './components/Navbar';
import { ProjectSummaryCards } from './components/ProjectSummaryCards';
import { ScheduleTable } from './components/ScheduleTable';
import { SCurveChart } from './components/SCurveChart';
import { ProjectModal } from './components/ProjectModal';
import { MainCategoryModal } from './components/MainCategoryModal';
import { SubTaskModal } from './components/SubTaskModal';
import { PrintReportView } from './components/PrintReportView';
import { exportToCSV } from './utils/constructionUtils';

const LOCAL_STORAGE_KEY = 'construction_projects_v1';

export default function App() {
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p) => {
            if (p.id === 'prj-residential-2floors' && p.name === 'โครงการก่อสร้างบ้านพักอาศัย ค.ส.ล. 2 ชั้น (Modern Tropical)') {
              return { ...p, name: 'โครงการตัวอย่าง1' };
            }
            if (p.id === 'prj-commercial-building' && p.name === 'โครงการก่อสร้างอาคารพาณิชย์ 4 ชั้น (Bangkok Business Center)') {
              return { ...p, name: 'โครงการตัวอย่าง2' };
            }
            return p;
          });
        }
      }
    } catch (e) {
      console.error('Failed to load projects from localStorage:', e);
    }
    return INITIAL_PROJECTS;
  });

  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    return projects[0]?.id || INITIAL_PROJECTS[0].id;
  });

  const [viewMode, setViewMode] = useState<ViewMode>('weekly');
  const [showSCurveInTable, setShowSCurveInTable] = useState(false);

  // Modals state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [isMainCategoryModalOpen, setIsMainCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MainCategory | null>(null);

  const [isSubTaskModalOpen, setIsSubTaskModalOpen] = useState(false);
  const [targetCategoryIdForSubTask, setTargetCategoryIdForSubTask] = useState<string | null>(null);
  const [editingSubTask, setEditingSubTask] = useState<SubTask | null>(null);

  const [isPrintViewOpen, setIsPrintViewOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(projects));
    } catch (e) {
      console.error('Failed to save projects to localStorage:', e);
    }
  }, [projects]);

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0] || INITIAL_PROJECTS[0];

  // Align default viewMode with project periodType when project changes
  const handleSelectProject = (project: Project) => {
    setActiveProjectId(project.id);
    setViewMode(project.periodType || 'weekly');
  };

  // Create or Update Project
  const handleSaveProject = (
    projectData: Partial<Project>,
    templateType?: 'blank' | 'residential' | 'commercial'
  ) => {
    if (editingProject) {
      // Update existing
      setProjects((prev) =>
        prev.map((p) =>
          p.id === editingProject.id
            ? {
                ...p,
                ...projectData,
                updatedAt: new Date().toISOString(),
              }
            : p
        )
      );
    } else {
      // Create new
      const newId = `prj-${Date.now()}`;
      let initialCategories: MainCategory[] = [];

      if (templateType === 'residential') {
        initialCategories = INITIAL_PROJECTS[0].categories;
      } else if (templateType === 'commercial') {
        initialCategories = INITIAL_PROJECTS[1].categories;
      }

      const newProject: Project = {
        id: newId,
        name: projectData.name || 'โครงการใหม่',
        code: projectData.code || `PP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        clientName: projectData.clientName || '',
        contractor: projectData.contractor || 'บริษัท พีพี. คอนสตรัคชั่น แอนด์ แมนเนจเม้นท์ จำกัด',
        location: projectData.location || '',
        startDate: projectData.startDate || new Date().toISOString().split('T')[0],
        periodType: projectData.periodType || 'weekly',
        totalPeriods: projectData.totalPeriods || 16,
        totalBudget: projectData.totalBudget ?? 0,
        description: projectData.description || '',
        projectMode: projectData.projectMode || 'planning', // โหมดเริ่มสร้างแผนงาน เป็นสถานะตั้งต้น
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        categories: initialCategories,
      };

      setProjects((prev) => [newProject, ...prev]);
      setActiveProjectId(newId);
      setViewMode(newProject.periodType);
    }
  };

  const handleDeleteProject = (projectId: string) => {
    console.log('handleDeleteProject called with:', projectId);
    setProjects((prev) => {
      const remaining = prev.filter((p) => p.id !== projectId);
      console.log('Projects after filter:', remaining);
      if (remaining.length > 0) {
        if (activeProjectId === projectId) {
          setActiveProjectId(remaining[0].id);
        }
        return remaining;
      }
      return []; // Return empty array instead of INITIAL_PROJECTS
    });
  };

  // Main Category Handlers (+ เพิ่มหัวข้อหลัก)
  const handleOpenAddMainCategory = () => {
    setEditingCategory(null);
    setIsMainCategoryModalOpen(true);
  };

  const handleOpenEditMainCategory = (category: MainCategory) => {
    setEditingCategory(category);
    setIsMainCategoryModalOpen(true);
  };

  const handleSaveMainCategory = (categoryData: Partial<MainCategory>) => {
    if (!activeProject) return;

    if (editingCategory) {
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== activeProjectId) return p;
          return {
            ...p,
            categories: p.categories.map((c) =>
              c.id === editingCategory.id ? { ...c, ...categoryData } : c
            ),
            updatedAt: new Date().toISOString(),
          };
        })
      );
    } else {
      const newCategory: MainCategory = {
        id: `cat-${Date.now()}`,
        code: categoryData.code || `${activeProject.categories.length + 1}.0`,
        title: categoryData.title || 'หัวข้อหลักใหม่',
        color: categoryData.color || 'blue',
        subTasks: [],
      };

      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== activeProjectId) return p;
          return {
            ...p,
            categories: [...p.categories, newCategory],
            updatedAt: new Date().toISOString(),
          };
        })
      );
    }
  };

  const handleDeleteMainCategory = (categoryId: string) => {
    console.log('handleDeleteMainCategory called with:', categoryId);
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== activeProjectId) return p;
        const newCategories = p.categories.filter((c) => c.id !== categoryId);
        console.log('Categories after filter:', newCategories);
        return {
          ...p,
          categories: newCategories,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  // SubTask Handlers (+ เพิ่มรายการย่อย)
  const handleOpenAddSubTask = (categoryId: string) => {
    setTargetCategoryIdForSubTask(categoryId);
    setEditingSubTask(null);
    setIsSubTaskModalOpen(true);
  };

  const handleOpenEditSubTask = (categoryId: string, subTask: SubTask) => {
    setTargetCategoryIdForSubTask(categoryId);
    setEditingSubTask(subTask);
    setIsSubTaskModalOpen(true);
  };

  const handleSaveSubTask = (subTaskData: Partial<SubTask>) => {
    if (!activeProject || !targetCategoryIdForSubTask) return;

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== activeProjectId) return p;

        return {
          ...p,
          categories: p.categories.map((c) => {
            if (c.id !== targetCategoryIdForSubTask) return c;

            if (editingSubTask) {
              // Edit existing subtask
              return {
                ...c,
                subTasks: c.subTasks.map((st) =>
                  st.id === editingSubTask.id ? { ...st, ...subTaskData } : st
                ),
              };
            } else {
              // Add new subtask
              const newSubTask: SubTask = {
                id: `sub-${Date.now()}`,
                code: subTaskData.code || `${c.code.split('.')[0]}.${c.subTasks.length + 1}`,
                title: subTaskData.title || 'รายการย่อยใหม่',
                startPeriod: subTaskData.startPeriod || 1,
                endPeriod: subTaskData.endPeriod || 2,
                weight: subTaskData.weight || 5,
                plannedProgress: subTaskData.plannedProgress ?? 100,
                actualProgress: subTaskData.actualProgress ?? 0,
                budget: subTaskData.budget || 100000,
                assignee: subTaskData.assignee || '',
                status: (subTaskData.actualProgress ?? 0) >= 100 ? 'completed' : (subTaskData.actualProgress ?? 0) > 0 ? 'in_progress' : 'not_started',
              };

              return {
                ...c,
                subTasks: [...c.subTasks, newSubTask],
              };
            }
          }),
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const handleDeleteSubTask = (categoryId: string, subTaskId: string) => {
    console.log('handleDeleteSubTask called with:', categoryId, subTaskId);
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== activeProjectId) return p;
        const updatedCategories = p.categories.map((c) => {
          if (c.id !== categoryId) return c;
          const newSubTasks = c.subTasks.filter((st) => st.id !== subTaskId);
          console.log('SubTasks after filter:', newSubTasks);
          return {
            ...c,
            subTasks: newSubTasks,
          };
        });
        return {
          ...p,
          categories: updatedCategories,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const handleQuickUpdateProgress = (
    categoryId: string,
    subTaskId: string,
    newProgress: number
  ) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== activeProjectId) return p;
        return {
          ...p,
          categories: p.categories.map((c) => {
            if (c.id !== categoryId) return c;
            return {
              ...c,
              subTasks: c.subTasks.map((st) => {
                if (st.id !== subTaskId) return st;
                const status = newProgress >= 100 ? 'completed' : newProgress > 0 ? 'in_progress' : 'not_started';
                return {
                  ...st,
                  actualProgress: newProgress,
                  status,
                };
              }),
            };
          }),
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const handleUpdateSubTask = (
    categoryId: string,
    subTaskId: string,
    updates: Partial<SubTask>
  ) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== activeProjectId) return p;
        return {
          ...p,
          categories: p.categories.map((c) => {
            if (c.id !== categoryId) return c;
            return {
              ...c,
              subTasks: c.subTasks.map((st) => {
                if (st.id !== subTaskId) return st;
                const newProgress = updates.actualProgress ?? st.actualProgress;
                const status = newProgress >= 100 ? 'completed' : newProgress > 0 ? 'in_progress' : 'not_started';
                return {
                  ...st,
                  ...updates,
                  status: updates.status || status,
                };
              }),
            };
          }),
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const handleUpdateMainCategory = (
    categoryId: string,
    updates: Partial<MainCategory>
  ) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== activeProjectId) return p;
        return {
          ...p,
          categories: p.categories.map((c) => {
            if (c.id !== categoryId) return c;
            return {
              ...c,
              ...updates,
            };
          }),
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const handleToggleProjectMode = (mode: 'planning' | 'tracking') => {
    if (!activeProject) return;
    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProjectId
          ? { ...p, projectMode: mode, updatedAt: new Date().toISOString() }
          : p
      )
    );
  };

  // Export / Import Helpers
  const handleExportCSV = () => {
    if (activeProject) {
      exportToCSV(activeProject);
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(projects, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `สำรองข้อมูล_โครงการก่อสร้าง_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported) && imported.length > 0) {
          setProjects(imported);
          setActiveProjectId(imported[0].id);
          alert('นำเข้าข้อมูลโครงการสำเร็จแล้ว!');
        } else if (imported.id && imported.categories) {
          // Single project import
          setProjects((prev) => [imported, ...prev]);
          setActiveProjectId(imported.id);
          alert(`นำเข้าโครงการ "${imported.name}" สำเร็จ!`);
        }
      } catch (err) {
        alert('เกิดข้อผิดพลาดในการอ่านไฟล์ JSON โปรดตรวจสอบรูปแบบไฟล์');
      }
    };
    reader.readAsText(file);
  };

  if (isPrintViewOpen && activeProject) {
    return (
      <PrintReportView
        project={activeProject}
        onClosePrint={() => setIsPrintViewOpen(false)}
      />
    );
  }

  const activeCategoryForSubTask = activeProject?.categories.find(
    (c) => c.id === targetCategoryIdForSubTask
  );

  const nextMainCategoryCodeDefault = `${(activeProject?.categories.length || 0) + 1}.0`;
  const nextSubTaskCodeDefault = activeCategoryForSubTask 
    ? `${activeCategoryForSubTask.code.split('.')[0]}.${activeCategoryForSubTask.subTasks.length + 1}`
    : '1.1';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col selection:bg-amber-500 selection:text-slate-950">
      
      {/* Top Navbar Header */}
      <Navbar
        projects={projects}
        activeProject={activeProject}
        onSelectProject={handleSelectProject}
        onOpenNewProjectModal={() => {
          setEditingProject(null);
          setIsProjectModalOpen(true);
        }}
        onOpenEditProjectModal={(proj) => {
          setEditingProject(proj);
          setIsProjectModalOpen(true);
        }}
        onDeleteProject={handleDeleteProject}
        onExportCSV={handleExportCSV}
        onExportJSON={handleExportJSON}
        onImportJSON={handleImportJSON}
        onPrint={() => setIsPrintViewOpen(true)}
      />

      {/* Main Content Dashboard */}
      <main className="flex-1 pb-16">
        
        {/* KPI & Executive Summary */}
        <ProjectSummaryCards
          project={activeProject}
          onOpenEditProjectModal={() => {
            setEditingProject(activeProject);
            setIsProjectModalOpen(true);
          }}
        />

        {/* Dynamic View: Weekly / Monthly Schedule Table OR S-Curve Graph */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          {viewMode === 'scurve' ? (
            <SCurveChart 
              project={activeProject} 
              viewMode={viewMode}
              onChangeViewMode={setViewMode}
            />
          ) : (
            <div className="space-y-6">
              <ScheduleTable
                project={activeProject}
                viewMode={viewMode}
                onChangeViewMode={setViewMode}
                onAddMainCategory={handleOpenAddMainCategory}
                onEditMainCategory={handleOpenEditMainCategory}
                onDeleteMainCategory={handleDeleteMainCategory}
                onAddSubTask={handleOpenAddSubTask}
                onEditSubTask={handleOpenEditSubTask}
                onDeleteSubTask={handleDeleteSubTask}
                onQuickUpdateProgress={handleQuickUpdateProgress}
                onUpdateSubTask={handleUpdateSubTask}
                onUpdateMainCategory={handleUpdateMainCategory}
                showSCurveInTable={showSCurveInTable}
                onToggleSCurveInTable={() => setShowSCurveInTable(!showSCurveInTable)}
              />
              {showSCurveInTable && (
                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
                  <SCurveChart 
                    project={activeProject} 
                    viewMode={viewMode}
                    onChangeViewMode={setViewMode}
                  />
                </div>
              )}
            </div>
          )}
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 text-slate-500 py-6 text-center text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>ระบบวางแผนงานก่อสร้าง (Construction Schedule Planner)</strong> — ออกแบบสำหรับวิศวกร ผู้รับเหมา และเจ้าของโครงการ
          </div>
          <div className="text-[11px] text-slate-600">
            สลับมุมมอง รายสัปดาห์ / รายเดือน / กราฟ S-Curve • พิมพ์รายงาน A4
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSave={handleSaveProject}
        editingProject={editingProject}
        onDeleteProject={handleDeleteProject}
      />

      <MainCategoryModal
        isOpen={isMainCategoryModalOpen}
        onClose={() => setIsMainCategoryModalOpen(false)}
        onSave={handleSaveMainCategory}
        editingCategory={editingCategory}
        nextCodeDefault={nextMainCategoryCodeDefault}
      />

      <SubTaskModal
        isOpen={isSubTaskModalOpen}
        onClose={() => setIsSubTaskModalOpen(false)}
        onSave={handleSaveSubTask}
        editingSubTask={editingSubTask}
        parentCategoryTitle={activeCategoryForSubTask?.title || 'หมวดหลัก'}
        totalPeriods={activeProject?.totalPeriods || 16}
        periodType={activeProject?.periodType || 'weekly'}
        projectStartDate={activeProject?.startDate || ''}
        nextCodeDefault={nextSubTaskCodeDefault}
      />

    </div>
  );
}

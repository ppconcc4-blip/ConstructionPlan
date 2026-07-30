export type ViewMode = 'weekly' | 'monthly' | 'single_month' | 'scurve';

export type TaskStatus = 'not_started' | 'in_progress' | 'completed' | 'delayed';

export interface SubTask {
  id: string;
  code: string; // e.g. "1.1", "1.2"
  title: string;
  startPeriod: number; // 1-indexed (e.g. Week 1 or Month 1)
  endPeriod: number;   // 1-indexed (e.g. Week 4 or Month 2)
  startDate?: string;  // YYYY-MM-DD
  endDate?: string;    // YYYY-MM-DD
  weight: number;      // % weight of the project (e.g. 5%)
  plannedProgress: number; // 0 - 100%
  actualProgress: number;  // 0 - 100%
  budget: number;      // Budget in THB
  assignee?: string;   // e.g. "ช่างวิศวกรโครงสร้าง", "บริษัท เอสซีจี"
  notes?: string;
  status: TaskStatus;
}

export interface MainCategory {
  id: string;
  code: string; // e.g. "1.0", "2.0"
  title: string;
  color?: string; // Theme color tag
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  subTasks: SubTask[];
}

export interface Project {
  id: string;
  name: string; // ชื่อโครงการ
  code: string; // เลขที่สัญญา e.g. "123/2569"
  contractNo?: string; // สัญญาจ้างเลขที่
  contractDate?: string; // ลงวันที่ (สัญญา)
  clientName: string; // เจ้าของโครงการ
  contractor: string; // ผู้รับเหมา
  location: string;   // สถานที่ก่อสร้าง
  startDate: string;  // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  totalDays?: number; // จำนวนวันรวม
  periodType: 'weekly' | 'monthly'; // default period scaling
  totalPeriods: number; // Total weeks or total months (e.g., 16 weeks or 12 months)
  totalBudget: number; // งบประมาณรวม (บาท)
  description?: string;
  projectMode?: 'planning' | 'tracking'; // 'planning' = เริ่มสร้างแผนงาน, 'tracking' = ติดตามงานก่อสร้าง
  createdAt: string;
  updatedAt: string;
  categories: MainCategory[];
}

export interface PeriodHeader {
  periodIndex: number; // 1, 2, 3...
  label: string;       // "W1", "W2" or "ม.ค. 69", "ก.พ. 69"
  subLabel?: string;   // e.g. "01-07 ก.ค."
  startDateISO?: string; // YYYY-MM-DD
  endDateISO?: string;   // YYYY-MM-DD
  isOutOfMonth?: boolean;
}

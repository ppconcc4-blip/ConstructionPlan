import React from 'react';
import { Project, ViewMode } from '../types';
import { ViewModeSelector } from './ViewModeSelector';
import { calculateSCurveData, getProjectSummary } from '../utils/constructionUtils';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Area, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { TrendingUp, AlertTriangle, CheckCircle2, Calendar } from 'lucide-react';

interface SCurveChartProps {
  project: Project;
  viewMode: ViewMode;
  onChangeViewMode?: (mode: ViewMode) => void;
  hideToolbar?: boolean;
}

export const SCurveChart: React.FC<SCurveChartProps> = ({ 
  project, 
  viewMode,
  onChangeViewMode,
  hideToolbar = false
}) => {
  const curveData = calculateSCurveData(project);
  const summary = getProjectSummary(project);

  return (
    <div className="space-y-6">
      
      {!hideToolbar && (
        /* View Mode Toolbar */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white">
          <div className="flex-1">
            <ViewModeSelector 
              viewMode={viewMode}
              onChangeViewMode={onChangeViewMode!}
              activeProject={project}
            />
          </div>
        </div>
      )}

      {/* Chart Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">
                กราฟ S-Curve ความก้าวหน้าสะสม (Planned vs Actual Progress)
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              เปรียบเทียบผลงานสะสมจริง (เส้นสีเขียว) กับแผนงานตามสัญญา (เส้นสีฟ้า)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-800 border border-slate-700/80 rounded-xl px-3 py-2 text-center">
              <div className="text-[10px] text-slate-400">แผนงานสะสม</div>
              <div className="text-sm font-black text-blue-400">{summary.overallPlannedProgress}%</div>
            </div>
            <div className="bg-slate-800 border border-slate-700/80 rounded-xl px-3 py-2 text-center">
              <div className="text-[10px] text-slate-400">ผลงานจริงสะสม</div>
              <div className="text-sm font-black text-emerald-400">{summary.overallActualProgress}%</div>
            </div>
            <div className="bg-slate-800 border border-slate-700/80 rounded-xl px-3 py-2 text-center">
              <div className="text-[10px] text-slate-400">ส่วนต่าง (Variance)</div>
              <div className={`text-sm font-black ${summary.progressDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {summary.progressDiff >= 0 ? '+' : ''}{summary.progressDiff}%
              </div>
            </div>
          </div>
        </div>

        {/* Recharts Area Container */}
        <div className="w-full h-[380px] pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={curveData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
              <defs>
                <linearGradient id="plannedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              
              <XAxis 
                dataKey="periodLabel" 
                stroke="#94a3b8" 
                fontSize={11}
                tickLine={false}
              />
              
              <YAxis 
                stroke="#94a3b8" 
                fontSize={11} 
                domain={[0, 100]} 
                tickFormatter={(val) => `${val}%`}
              />

              <Tooltip 
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  color: '#fff',
                  fontSize: '12px',
                }}
                formatter={(value: any, name: any) => [
                  `${value}%`,
                  name === 'plannedProgress' ? 'แผนงานสะสม' : 'ผลงานจริงสะสม'
                ]}
                labelFormatter={(label, items) => {
                  const subLabel = items && items[0] && items[0].payload ? items[0].payload.subLabel : '';
                  return `${label} ${subLabel ? `(${subLabel})` : ''}`;
                }}
              />

              <Legend 
                verticalAlign="top" 
                height={36} 
                formatter={(value) => (
                  <span className="text-xs text-slate-300 font-medium">
                    {value === 'plannedProgress' ? 'แผนงานสะสม S-Curve (%)' : 'ผลงานจริงสะสม S-Curve (%)'}
                  </span>
                )}
              />

              {/* Planned Line */}
              <Area 
                type="monotone" 
                dataKey="plannedProgress" 
                stroke="#3b82f6" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#plannedGradient)" 
              />

              {/* Actual Line */}
              <Line 
                type="monotone" 
                dataKey="actualProgress" 
                stroke="#10b981" 
                strokeWidth={3.5} 
                dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#0f172a' }}
                activeDot={{ r: 7 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly / Monthly Data Table breakdown */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-xl overflow-hidden">
        <h4 className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          ตารางสรุปผลงานราย{project.periodType === 'weekly' ? 'สัปดาห์' : 'เดือน'} (Periodic S-Curve Table)
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-800 text-slate-300 font-semibold border-b border-slate-700">
                <th className="py-2.5 px-3">ช่วงเวลา</th>
                <th className="py-2.5 px-3 text-center">แผนงานประจำงวด (%)</th>
                <th className="py-2.5 px-3 text-center">ผลงานจริงประจำงวด (%)</th>
                <th className="py-2.5 px-3 text-center">แผนงานสะสม (%)</th>
                <th className="py-2.5 px-3 text-center">ผลงานจริงสะสม (%)</th>
                <th className="py-2.5 px-3 text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {curveData.map((d, idx) => {
                const diff = Math.round((d.actualProgress - d.plannedProgress) * 10) / 10;
                return (
                  <tr key={idx} className="hover:bg-slate-800/50 transition">
                    <td className="py-2 px-3 font-medium text-slate-200">
                      {d.periodLabel} <span className="text-[10px] text-slate-400">({d.subLabel})</span>
                    </td>
                    <td className="py-2 px-3 text-center text-blue-300 font-mono">
                      {d.periodPlannedDelta}%
                    </td>
                    <td className="py-2 px-3 text-center text-emerald-300 font-mono font-semibold">
                      {d.periodActualDelta}%
                    </td>
                    <td className="py-2 px-3 text-center text-blue-400 font-bold">
                      {d.plannedProgress}%
                    </td>
                    <td className="py-2 px-3 text-center text-emerald-400 font-extrabold">
                      {d.actualProgress}%
                    </td>
                    <td className="py-2 px-3 text-center">
                      {diff >= 0 ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300">
                          +{diff}%
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-300">
                          {diff}%
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

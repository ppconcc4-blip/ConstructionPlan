import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  Cloud, 
  CloudRain, 
  CloudLightning, 
  CloudOff, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  LogOut, 
  LogIn, 
  ExternalLink,
  Info,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { 
  googleSignIn, 
  googleSignOut, 
  uploadBackupToDrive, 
  downloadBackupFromDrive, 
  TARGET_FOLDER_ID,
  initAuth
} from '../utils/googleDriveSync';
import { Project } from '../types';

interface GoogleDriveSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onRestoreProjects: (restored: Project[]) => void;
}

export const GoogleDriveSyncModal: React.FC<GoogleDriveSyncModalProps> = ({
  isOpen,
  onClose,
  projects,
  onRestoreProjects,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [autoSync, setAutoSync] = useState<boolean>(() => {
    return localStorage.getItem('gd_auto_sync') === 'true';
  });

  // Track user login state from firebase auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser: User, accessToken: string) => {
        setUser(currentUser);
        setToken(accessToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setIsSyncing(true);
    setSyncStatus('idle');
    setStatusMessage('');
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        setSyncStatus('success');
        setStatusMessage('เชื่อมต่อบัญชี Google สำเร็จแล้ว');
      }
    } catch (err: any) {
      setSyncStatus('error');
      setStatusMessage(`เข้าสู่ระบบไม่สำเร็จ: ${err.message || err}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSignOut = async () => {
    const confirmLogout = window.confirm('ต้องการยกเลิกการเชื่อมต่อกับ Google Drive หรือไม่?');
    if (!confirmLogout) return;

    try {
      await googleSignOut();
      setUser(null);
      setToken(null);
      setSyncStatus('idle');
      setStatusMessage('ยกเลิกการเชื่อมต่อแล้ว');
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleBackup = async () => {
    if (!token) return;
    setIsSyncing(true);
    setSyncStatus('idle');
    setStatusMessage('กำลังบันทึกข้อมูลไปยัง Google Drive...');
    
    const result = await uploadBackupToDrive(token, projects);
    if (result.success) {
      setSyncStatus('success');
      setStatusMessage('สำรองข้อมูลไปยัง Google Drive เรียบร้อยแล้ว!');
      localStorage.setItem('gd_last_sync_time', new Date().toLocaleString('th-TH'));
    } else {
      setSyncStatus('error');
      setStatusMessage(`บันทึกไม่สำเร็จ: ${result.error}`);
    }
    setIsSyncing(false);
  };

  const handleLoad = async () => {
    if (!token) return;
    const confirmLoad = window.confirm(
      'คำเตือน! การโหลดข้อมูลจาก Google Drive จะเขียนทับข้อมูลโครงการในเครื่องปัจจุบันทั้งหมด ต้องการดำเนินการต่อหรือไม่?'
    );
    if (!confirmLoad) return;

    setIsSyncing(true);
    setSyncStatus('idle');
    setStatusMessage('กำลังดาวน์โหลดข้อมูลจาก Google Drive...');

    const result = await downloadBackupFromDrive(token);
    if (result.success && result.projects) {
      onRestoreProjects(result.projects);
      setSyncStatus('success');
      setStatusMessage('ดาวน์โหลดและกู้คืนข้อมูลโครงการสำเร็จแล้ว!');
    } else {
      setSyncStatus('error');
      setStatusMessage(`ดาวน์โหลดไม่สำเร็จ: ${result.error}`);
    }
    setIsSyncing(false);
  };

  const handleToggleAutoSync = () => {
    const newValue = !autoSync;
    setAutoSync(newValue);
    localStorage.setItem('gd_auto_sync', String(newValue));
    if (newValue && token) {
      // Trigger a first manual backup if turning auto-sync ON
      uploadBackupToDrive(token, projects);
    }
  };

  const lastSyncTime = localStorage.getItem('gd_last_sync_time');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden transform transition-all duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/40 flex justify-between items-center">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-sm">ระบบเชื่อมต่อ Google Drive</h3>
              <p className="text-[10px] text-slate-400">เก็บข้อมูลบนคลาวด์ออนไลน์และซิงก์ข้ามเครื่อง</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors text-xs font-bold px-2 py-1 rounded hover:bg-slate-800/80"
          >
            ปิด
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          
          {/* Connection Status Section */}
          <div className="p-4 bg-slate-800/40 border border-slate-800/80 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">สถานะการเชื่อมต่อ</span>
              {user ? (
                <span className="inline-flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  <Check className="w-3 h-3 stroke-[2.5]" /> เชื่อมต่อแล้ว
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-rose-500/15 border border-rose-500/25 text-rose-400 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  <CloudOff className="w-3 h-3" /> ยังไม่ได้เชื่อมต่อ
                </span>
              )}
            </div>

            {user ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Avatar" className="w-9 h-9 rounded-full border border-slate-700 referrerPolicy='no-referrer'" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-amber-400">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-200 truncate">{user.displayName || 'ผู้ใช้โครงการ'}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    title="ออกจากระบบ Google"
                    className="p-2 hover:bg-rose-500/15 text-slate-400 hover:text-rose-400 rounded-lg transition"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-2">
                <button
                  onClick={handleSignIn}
                  disabled={isSyncing}
                  className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 text-white font-semibold text-xs py-2.5 px-4 rounded-xl shadow-lg shadow-blue-500/5 transition active:scale-[0.98]"
                >
                  <LogIn className="w-4 h-4" />
                  <span>เข้าสู่ระบบด้วย Google</span>
                </button>
              </div>
            )}
          </div>

          {/* Drive Folder Link Info */}
          <div className="p-3.5 bg-slate-800/20 border border-slate-800/50 rounded-xl space-y-2 text-xs">
            <div className="flex items-center space-x-2 text-amber-400 font-semibold">
              <Info className="w-4 h-4 shrink-0" />
              <span>โฟลเดอร์สำหรับเก็บข้อมูลของคุณ</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              ระบบจะอัปโหลดไฟล์ <code className="text-amber-300 font-mono">construction_projects_backup.json</code> ไปยังโฟลเดอร์ที่คุณระบุโดยตรง:
            </p>
            <div className="flex items-center justify-between gap-2 p-2 bg-slate-950/80 rounded border border-slate-800/80 font-mono text-[10px] text-slate-300">
              <span className="truncate">Google Drive Folder ID: {TARGET_FOLDER_ID}</span>
              <a 
                href={`https://drive.google.com/drive/folders/${TARGET_FOLDER_ID}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 flex items-center gap-1 underline font-sans font-medium shrink-0"
              >
                เปิดไดรฟ์ <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Sync actions */}
          {user && (
            <div className="space-y-3.5">
              
              {/* Auto Sync Toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-800/30 border border-slate-800/60 rounded-xl">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-200">เปิดระบบบันทึกคลาวด์อัตโนมัติ (Auto-Sync)</span>
                  <span className="text-[10px] text-slate-400">อัปเดตข้อมูลขึ้นคลาวด์ทันทีที่มีการแก้ไขในแอป</span>
                </div>
                <button
                  onClick={handleToggleAutoSync}
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {autoSync ? (
                    <ToggleRight className="w-9 h-9 text-blue-500" />
                  ) : (
                    <ToggleLeft className="w-9 h-9 text-slate-600" />
                  )}
                </button>
              </div>

              {/* Sync Manual Controls */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleBackup}
                  disabled={isSyncing}
                  className="flex flex-col items-center justify-center p-3.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-800 hover:border-slate-700/80 rounded-xl transition"
                >
                  <RefreshCw className={`w-4 h-4 text-blue-400 mb-1.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span className="text-xs font-semibold text-slate-200">อัปโหลดข้อมูลตอนนี้</span>
                  <span className="text-[9px] text-slate-400 mt-0.5">ส่งข้อมูลปัจจุบันขึ้นไดรฟ์</span>
                </button>

                <button
                  onClick={handleLoad}
                  disabled={isSyncing}
                  className="flex flex-col items-center justify-center p-3.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-800 hover:border-slate-700/80 rounded-xl transition"
                >
                  <CloudRain className="w-4 h-4 text-purple-400 mb-1.5" />
                  <span className="text-xs font-semibold text-slate-200">ดาวน์โหลดเพื่อดึงข้อมูล</span>
                  <span className="text-[9px] text-slate-400 mt-0.5">ดึงข้อมูลสำรองในไดรฟ์มาใช้</span>
                </button>
              </div>
            </div>
          )}

          {/* Sync Status Banner */}
          {syncStatus !== 'idle' && (
            <div className={`p-3 rounded-xl border flex items-start space-x-2.5 ${
              syncStatus === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/25 text-rose-400'
            }`}>
              {syncStatus === 'success' ? (
                <Check className="w-4 h-4 mt-0.5 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              )}
              <div className="text-[11px] leading-relaxed">
                <p className="font-semibold">{syncStatus === 'success' ? 'สำเร็จ' : 'เกิดข้อผิดพลาด'}</p>
                <p>{statusMessage}</p>
              </div>
            </div>
          )}

          {lastSyncTime && user && (
            <div className="text-center text-[10px] text-slate-400">
              ซิงก์ข้อมูลล่าสุดเมื่อ: {lastSyncTime}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

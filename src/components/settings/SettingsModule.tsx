import React from 'react';
import { Settings as SettingsIcon, ShieldCheck, Database, Building2, Users, Bell, Mail, ToggleLeft } from 'lucide-react';
import { User } from '../../types';

interface SettingsModuleProps {
  darkMode: boolean;
  currentUser?: User | null;
  onOpenNotificationSettings?: () => void;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({ 
  darkMode, 
  currentUser,
  onOpenNotificationSettings 
}) => {
  const isAdmin = currentUser?.role === 'Administrator';

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className={`text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Enterprise Settings & User Roles
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Company profile, financial year configuration, notification rules, and role-based access control.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Profile Card */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Company Profile</h3>
              <p className="text-xs text-slate-400">AMK Carton Mills Ltd - HQ</p>
            </div>
          </div>
          <div className="space-y-3 text-xs text-slate-300">
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">GSTIN</span>
              <span className="font-mono font-bold">27AAMCA8891P1ZU</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Financial Year</span>
              <span className="font-bold">2026 - 2027</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Base Currency</span>
              <span className="font-bold">INR (₹)</span>
            </div>
          </div>
        </div>

        {/* User Roles Card */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>User Roles & Permissions</h3>
              <p className="text-xs text-slate-400">Role-based access security</p>
            </div>
          </div>
          <div className="space-y-2 text-xs">
            {['Administrator', 'Inventory Manager', 'Purchase Manager', 'Production Manager', 'Accountant'].map((role, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
                <span className="font-bold">{role}</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">Full Access</span>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications Card */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Notifications</h3>
              <p className="text-xs text-slate-400">Global alert & email settings</p>
            </div>
          </div>
          
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-emerald-500" />
                  <span className="font-bold">Notification Rules</span>
                </div>
                {isAdmin ? (
                  <button 
                    onClick={onOpenNotificationSettings}
                    className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition-colors"
                  >
                    Configure
                  </button>
                ) : (
                  <span className="text-[10px] text-slate-500 font-medium">Admin Only</span>
                )}
              </div>
              <p className="text-[10px] text-slate-400">
                Define rules for RFQs, POs, and stock movements. Only Administrators can modify these global rules.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ToggleLeft className="w-4 h-4 text-indigo-400" />
                <span className="font-bold">Global Notifications</span>
              </div>
              <div className="relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-emerald-600 transition-colors duration-200 ease-in-out">
                <span className="translate-x-5 pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out" />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-blue-400" />
                <span className="font-bold">Email Preferences</span>
              </div>
              <button className="px-3 py-1 rounded-lg bg-slate-700 text-slate-300 text-[10px] font-bold hover:bg-slate-600 transition-colors">
                Manage
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

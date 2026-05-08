import React from 'react';
import { 
  LayoutDashboard, 
  Mic, 
  CheckSquare, 
  GitBranch,
  AlertTriangle 
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'livemeeting', label: 'Live Meeting', icon: Mic },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'decisions', label: 'Decisions', icon: GitBranch },
];

export function Sidebar({ activeTab, setActiveTab }) {
  return (
    <div className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-blue-500" />
          <span className="text-xl font-semibold text-white">RiskIntel</span>
        </div>
        <p className="text-xs text-slate-500 mt-1">Task Risk Intelligence</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all ${
                activeTab === item.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-slate-800">
        <div className="text-xs text-slate-600">RiskIntel v2.0</div>
      </div>
    </div>
  );
}
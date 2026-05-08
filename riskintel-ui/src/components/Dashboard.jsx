import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { 
  TrendingUp, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  ArrowUpRight,
  Users,
  Target,
  Calendar
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';

const API_URL = 'http://localhost:3000';

const COLORS = ['#ef4444', '#f59e0b', '#10b981'];

export function Dashboard() {
  const [stats, setStats] = useState({ total: 0, completed: 0, highRisk: 0 });
  const [tasks, setTasks] = useState([]);
  const [trendData, setTrendData] = useState([
    { name: 'Mon', tasks: 4, completed: 2 },
    { name: 'Tue', tasks: 6, completed: 3 },
    { name: 'Wed', tasks: 8, completed: 5 },
    { name: 'Thu', tasks: 5, completed: 4 },
    { name: 'Fri', tasks: 7, completed: 3 },
    { name: 'Sat', tasks: 3, completed: 2 },
    { name: 'Sun', tasks: 2, completed: 1 },
  ]);
  const [riskData, setRiskData] = useState([
    { name: 'High Risk', value: 0, color: '#ef4444' },
    { name: 'Medium Risk', value: 0, color: '#f59e0b' },
    { name: 'Low Risk', value: 0, color: '#10b981' },
  ]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const statsRes = await fetch(`${API_URL}/api/dashboard/stats`);
      const statsData = await statsRes.json();
      setStats(statsData);

      const tasksRes = await fetch(`${API_URL}/api/tasks`);
      const tasksData = await tasksRes.json();
      setTasks(tasksData.slice(0, 5));

      const high = tasksData.filter(t => t.risk_score > 70).length;
      const medium = tasksData.filter(t => t.risk_score > 40 && t.risk_score <= 70).length;
      const low = tasksData.filter(t => t.risk_score <= 40).length;
      setRiskData([
        { name: 'High Risk', value: high, color: '#ef4444' },
        { name: 'Medium Risk', value: medium, color: '#f59e0b' },
        { name: 'Low Risk', value: low, color: '#10b981' },
      ]);
    } catch (error) {
      console.error('Failed to load data');
    }
  };

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Welcome back. Here's what's happening with your tasks.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-slate-400">Live</span>
          </div>
        </div>
      </div>

      {/* KPI Cards - Premium Style */}
      <div className="grid grid-cols-4 gap-5">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-800 p-5 hover:border-slate-700 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm">Total Tasks</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.total}</p>
              <p className="text-xs text-green-500 mt-2 flex items-center gap-1">+12% from last week</p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-800 p-5 hover:border-slate-700 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm">Completed</p>
              <p className="text-3xl font-bold text-green-500 mt-1">{stats.completed}</p>
              <p className="text-xs text-green-500 mt-2 flex items-center gap-1">+{completionRate}% completion rate</p>
            </div>
            <div className="p-3 bg-green-500/10 rounded-xl">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-800 p-5 hover:border-slate-700 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm">High Risk Tasks</p>
              <p className="text-3xl font-bold text-red-500 mt-1">{stats.highRisk}</p>
              <p className="text-xs text-red-400 mt-2">Needs immediate attention</p>
            </div>
            <div className="p-3 bg-red-500/10 rounded-xl">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-800 p-5 hover:border-slate-700 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm">Team Health</p>
              <p className="text-3xl font-bold text-white mt-1">{completionRate}%</p>
              <p className="text-xs text-slate-400 mt-2">Overall success rate</p>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-xl">
              <Users className="h-5 w-5 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Trend Chart */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-white font-medium">Task Activity</h3>
              <p className="text-slate-500 text-xs mt-1">Last 7 days</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                <span className="text-xs text-slate-400">Created</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-slate-400">Completed</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Area type="monotone" dataKey="tasks" stroke="#3b82f6" fill="url(#colorTasks)" strokeWidth={2} />
              <Area type="monotone" dataKey="completed" stroke="#10b981" fill="url(#colorCompleted)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Distribution */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-white font-medium">Risk Distribution</h3>
              <p className="text-slate-500 text-xs mt-1">Current task risk breakdown</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={riskData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {riskData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value) => <span className="text-slate-400 text-sm">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Tasks Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-white font-medium">Recent Tasks</h3>
            <p className="text-slate-500 text-xs mt-1">Tasks that need attention</p>
          </div>
          <button className="text-sm text-blue-500 hover:text-blue-400">View all →</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left py-3 text-slate-400 font-medium text-sm">Task</th>
                <th className="text-left py-3 text-slate-400 font-medium text-sm">Owner</th>
                <th className="text-left py-3 text-slate-400 font-medium text-sm">Status</th>
                <th className="text-left py-3 text-slate-400 font-medium text-sm">Risk</th>
                <th className="text-left py-3 text-slate-400 font-medium text-sm"></th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
                  <td className="py-3 text-white text-sm">{task.title}</td>
                  <td className="py-3 text-slate-300 text-sm">{task.owner}</td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      task.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {task.status || 'Pending'}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-16 h-1.5 rounded-full bg-slate-700 overflow-hidden`}>
                        <div 
                          className={`h-full rounded-full ${
                            task.risk_score > 70 ? 'bg-red-500' : task.risk_score > 40 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${task.risk_score}%` }}
                        />
                      </div>
                      <span className={`text-xs ${
                        task.risk_score > 70 ? 'text-red-400' : task.risk_score > 40 ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {task.risk_score}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3">
                    <button className="text-xs text-blue-500 hover:text-blue-400">View →</button>
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No tasks yet. Start a live meeting.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
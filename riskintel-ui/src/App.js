import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LayoutDashboard, Brain, Users, Settings, HelpCircle, LogOut, Bell, Search,
  AlertTriangle, Activity, Mic, TrendingUp, ShieldAlert, CheckCircle, FileText,
  RefreshCw, Loader2, X, Upload, PenTool, GitBranch, Send
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

const API_URL = 'http://localhost:3000';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [inputMethod, setInputMethod] = useState('transcript');
  const [transcript, setTranscript] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showRiskBreakdown, setShowRiskBreakdown] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const [manualTask, setManualTask] = useState({
    title: '', description: '', owner: '', ownerEmail: '', priority: 'medium', deadline: ''
  });
  
  const [stats, setStats] = useState({ total: 0, completed: 0, highRisk: 0, completionRate: 0 });
  const [allTasks, setAllTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([
    { name: 'Sarah Kim', reliability: 92, completedTasks: 48, email: 'sarah@nexus.ai' },
    { name: 'Marcus Wright', reliability: 38, completedTasks: 12, email: 'marcus@nexus.ai' },
    { name: 'Priya Singh', reliability: 88, completedTasks: 22, email: 'priya@nexus.ai' },
    { name: 'Rahul', reliability: 75, completedTasks: 30, email: 'rahul@nexus.ai' }
  ]);
  const [learningMetrics, setLearningMetrics] = useState({ accuracy: 87, totalPredictions: 0 });
  const [decisions, setDecisions] = useState([]);
  const [meetings, setMeetings] = useState([]);

  // Load all data
  const loadAllData = async () => {
    setLoading(true);
    try {
      const statsRes = await axios.get(`${API_URL}/api/dashboard/stats`);
      setStats(statsRes.data);
      
      const tasksRes = await axios.get(`${API_URL}/api/tasks`);
      setAllTasks(tasksRes.data);
      
      // Create notifications for high-risk tasks
      const highRiskTasks = tasksRes.data.filter(t => t.risk_score > 70 && t.status !== 'completed');
      const newNotifications = highRiskTasks.map(t => ({
        id: t.id,
        message: `⚠️ High risk task: "${t.title}" assigned to ${t.owner}`,
        read: false,
        time: new Date().toISOString()
      }));
      setNotifications(newNotifications);
      
      setLearningMetrics({ accuracy: 87, totalPredictions: tasksRes.data.length });
      
      const savedDecisions = localStorage.getItem('riskintel_decisions');
      if (savedDecisions) {
        setDecisions(JSON.parse(savedDecisions));
      }
      
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Process transcript
  const processTranscript = async () => {
    if (!transcript.trim()) {
      alert('Please enter meeting transcript');
      return;
    }
    
    setProcessing(true);
    try {
      console.log('Sending transcript:', transcript);
      
      const response = await axios.post(`${API_URL}/api/meeting/transcript`, {
        transcript: transcript,
        title: `Meeting ${new Date().toLocaleString()}`
      });
      
      console.log('Response:', response.data);
      
      if (response.data && response.data.success) {
        // Extract decisions from transcript
        const decisionKeywords = ['decided', 'agreed', 'chose', 'selected', 'approved', 'finalized', 'resolved'];
        const newDecisions = [];
        const lines = transcript.split('\n');
        
        for (const line of lines) {
          for (const keyword of decisionKeywords) {
            if (line.toLowerCase().includes(keyword)) {
              newDecisions.push({
                id: Date.now() + Math.random(),
                text: line.trim(),
                meeting_title: `Meeting ${new Date().toLocaleString()}`,
                date: new Date().toISOString(),
                discussion_count: 1,
                resolved: false
              });
              break;
            }
          }
        }
        
        if (newDecisions.length > 0) {
          const savedDecisions = localStorage.getItem('riskintel_decisions');
          const existingDecisions = savedDecisions ? JSON.parse(savedDecisions) : [];
          localStorage.setItem('riskintel_decisions', JSON.stringify([...newDecisions, ...existingDecisions]));
          setDecisions([...newDecisions, ...existingDecisions]);
        }
        
        setResult({ 
          success: true, 
          message: `✅ Created ${response.data.tasks?.length || 0} tasks! Found ${newDecisions.length} decisions.` 
        });
        await loadAllData();
      } else {
        setResult({ success: false, message: 'Failed to process meeting' });
      }
      setTimeout(() => setResult(null), 5000);
      
    } catch (error) {
      console.error('Error:', error);
      setResult({ success: false, message: error.response?.data?.error || error.message });
    } finally {
      setProcessing(false);
      setTranscript('');
      setShowMeetingModal(false);
    }
  };
  
  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', blob, 'recording.webm');
        setProcessing(true);
        try {
          await axios.post(`${API_URL}/api/meeting/record`, formData);
          setResult({ success: true, message: 'Recording processed!' });
          loadAllData();
        } catch (err) {
          setResult({ success: false, message: 'Failed' });
        } finally {
          setProcessing(false);
          setShowMeetingModal(false);
        }
        stream.getTracks().forEach(track => track.stop());
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      alert('Microphone access required');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('audio', file);
    setProcessing(true);
    try {
      await axios.post(`${API_URL}/api/meeting/upload`, formData);
      setResult({ success: true, message: 'File processed!' });
      loadAllData();
    } catch (err) {
      setResult({ success: false, message: 'Upload failed' });
    } finally {
      setProcessing(false);
      setShowMeetingModal(false);
    }
  };

  // Create manual task
  const createManualTask = async () => {
    if (!manualTask.title) {
      alert('Enter task title');
      return;
    }
    setProcessing(true);
    try {
      await axios.post(`${API_URL}/api/tasks/manual`, manualTask);
      setResult({ success: true, message: 'Task created!' });
      setManualTask({ title: '', description: '', owner: '', ownerEmail: '', priority: 'medium', deadline: '' });
      loadAllData();
    } catch (error) {
      const newTask = {
        id: Date.now(),
        title: manualTask.title,
        description: manualTask.description,
        owner: manualTask.owner || 'Unknown',
        risk_score: 30,
        status: 'pending'
      };
      setAllTasks(prev => [newTask, ...prev]);
      setResult({ success: true, message: 'Task created locally!' });
    } finally {
      setProcessing(false);
      setShowMeetingModal(false);
    }
  };

  // Search handler
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      alert('Enter a name to search');
      return;
    }
    const matchedTasks = allTasks.filter(t => 
      t.owner?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const matchedMembers = teamMembers.filter(m => 
      m.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    let message = `🔍 Search results for "${searchQuery}":\n\n`;
    if (matchedMembers.length > 0) {
      message += `👥 Employees:\n`;
      matchedMembers.forEach(e => {
        message += `  • ${e.name} (${e.email}) - ${e.reliability}% reliability\n`;
      });
    }
    if (matchedTasks.length > 0) {
      message += `\n📋 Tasks:\n`;
      matchedTasks.forEach(t => {
        message += `  • ${t.title} - Owner: ${t.owner} (${t.risk_score}% risk)\n`;
      });
    }
    if (matchedMembers.length === 0 && matchedTasks.length === 0) {
      message += `No results found.`;
    }
    alert(message);
    setSearchQuery('');
  };

  // Task actions
  const reassignTask = async (taskId, newOwner) => {
    try {
      await axios.put(`${API_URL}/api/tasks/${taskId}`, { owner: newOwner });
      await loadAllData();
      alert(`Task reassigned to ${newOwner}`);
    } catch (error) {
      alert('Error reassigning task');
    }
  };

  const extendDeadline = (taskId) => {
    window.open(`${API_URL}/api/task/delay?id=${taskId}&days=2`, '_blank');
  };

  const sendEmailReminder = async (taskId) => {
    const task = allTasks.find(t => t.id === taskId);
    if (!task) {
      alert('Task not found');
      return;
    }
    
    const emailContent = `TO: ${task.ownerEmail || `${task.owner}@example.com`}
SUBJECT: Task Reminder: ${task.title}

Hello ${task.owner},

You have a task that needs your attention:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 TASK DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Task: ${task.title}
Risk Score: ${task.risk_score}%
Status: ${task.status || 'Pending'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ QUICK ACTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Mark as Done: http://localhost:3000/api/task/done?id=${task.id}
Delay 2 Days: http://localhost:3000/api/task/delay?id=${task.id}&days=2

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This is an automated reminder from RiskIntel.`;

    try {
      await navigator.clipboard.writeText(emailContent);
      alert(`✅ Email content copied to clipboard!\n\nPaste it into your email client.`);
    } catch (err) {
      alert(`📧 Email content:\n\n${emailContent}`);
    }
  };

  const markNotificationRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  useEffect(() => {
    loadAllData();
    const interval = setInterval(loadAllData, 30000);
    return () => clearInterval(interval);
  }, []);

  const highRiskTasks = allTasks.filter(t => t.risk_score > 70);
  const riskDistribution = [
    { name: 'High Risk', value: highRiskTasks.length, color: '#dc2626' },
    { name: 'Medium Risk', value: allTasks.filter(t => t.risk_score > 40 && t.risk_score <= 70).length, color: '#f59e0b' },
    { name: 'Low Risk', value: allTasks.filter(t => t.risk_score <= 40).length, color: '#10b981' }
  ];
  
  const chartData = [
    { month: 'May', meetings: 20 }, { month: 'Jun', meetings: 30 },
    { month: 'Jul', meetings: 45 }, { month: 'Aug', meetings: 38 },
    { month: 'Sep', meetings: 52 }, { month: 'Oct', meetings: 48 },
    { month: 'Nov', meetings: 42 }, { month: 'Dec', meetings: 35 }
  ];

  const mostReliable = [...teamMembers].sort((a, b) => b.reliability - a.reliability).slice(0, 3);
  const unreadCount = notifications.filter(n => !n.read).length;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'risk', label: 'Risk Intelligence', icon: Brain },
    { id: 'team', label: 'Team Reliability', icon: Users },
    { id: 'decisions', label: 'Decisions', icon: GitBranch },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'help', label: 'Help Center', icon: HelpCircle },
  ];

  // Risk Breakdown Modal
  const RiskBreakdownModal = ({ task, onClose }) => {
    const total = task.risk_score || 50;
    return (
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
        <div style={{ backgroundColor: 'white', borderRadius: '24px', width: '100%', maxWidth: '400px', padding: '24px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a' }}>Risk Breakdown</h2>
            <button onClick={onClose} style={{ padding: '8px', cursor: 'pointer', background: 'none', border: 'none', fontSize: '20px' }}>✕</button>
          </div>
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#dc2626' }}>{total}%</div>
            <p style={{ color: '#64748b' }}>Total Risk Score</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
              <span>Owner Reliability</span><span style={{ color: '#dc2626', fontWeight: 'bold' }}>+35%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
              <span>Weak Language</span><span style={{ color: '#dc2626', fontWeight: 'bold' }}>+20%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
              <span>Task Type (API)</span><span style={{ color: '#dc2626', fontWeight: 'bold' }}>+15%</span>
            </div>
          </div>
          <div style={{ marginTop: '16px', padding: '12px', background: '#e0f2fe', borderRadius: '8px' }}>
            <p style={{ fontSize: '12px', color: '#0369a1' }}>💡 Suggestion: Reassign to Sarah Kim (92% reliability)</p>
          </div>
        </div>
      </div>
    );
  };

  // Meeting Modal
  const MeetingModal = () => (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'white', borderRadius: '24px', width: '100%', maxWidth: '600px', padding: '24px', border: '1px solid #e2e8f0', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a' }}>Process Meeting</h2>
          <button onClick={() => setShowMeetingModal(false)} style={{ padding: '8px', cursor: 'pointer', background: 'none', border: 'none', fontSize: '20px' }}>✕</button>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {['transcript', 'record', 'upload', 'manual'].map((method) => (
            <button 
              key={method}
              onClick={() => setInputMethod(method)}
              style={{ 
                flex: 1, 
                padding: '10px', 
                borderRadius: '12px',
                backgroundColor: inputMethod === method ? '#064e3b' : '#f1f5f9',
                color: inputMethod === method ? 'white' : '#475569',
                cursor: 'pointer',
                border: 'none',
                fontWeight: inputMethod === method ? 'bold' : 'normal'
              }}
            >
              {method === 'transcript' && '📝 Paste'}
              {method === 'record' && '🎙️ Record'}
              {method === 'upload' && '📁 Upload'}
              {method === 'manual' && '✏️ Manual'}
            </button>
          ))}
        </div>
        
        {inputMethod === 'transcript' && (
          <>
            <textarea 
              value={transcript} 
              onChange={(e) => setTranscript(e.target.value)} 
              placeholder="Paste transcript here...&#10;&#10;Example:&#10;Rahul will complete API by Friday.&#10;Marcus needs to fix the bug.&#10;We decided to use React for the frontend."
              style={{ width: '100%', height: '250px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', color: '#0f172a', fontSize: '14px' }}
            />
            <button onClick={processTranscript} disabled={processing} style={{ width: '100%', marginTop: '16px', backgroundColor: '#064e3b', color: 'white', padding: '12px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', border: 'none' }}>
              {processing ? 'Processing...' : 'Process Meeting'}
            </button>
          </>
        )}
        
        {inputMethod === 'record' && (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            {!isRecording ? (
              <button onClick={startRecording} style={{ backgroundColor: '#dc2626', color: 'white', padding: '16px 32px', borderRadius: '9999px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', border: 'none' }}>
                🎙️ Start Recording
              </button>
            ) : (
              <button onClick={stopRecording} style={{ backgroundColor: '#6b7280', color: 'white', padding: '16px 32px', borderRadius: '9999px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', border: 'none' }}>
                ⏹️ Stop Recording
              </button>
            )}
          </div>
        )}
        
        {inputMethod === 'upload' && (
          <div style={{ border: '2px dashed #e2e8f0', borderRadius: '12px', padding: '48px', textAlign: 'center' }}>
            <input type="file" accept="audio/*" onChange={handleFileUpload} style={{ display: 'none' }} id="audioUpload" />
            <label htmlFor="audioUpload" style={{ cursor: 'pointer', backgroundColor: '#064e3b', color: 'white', padding: '8px 24px', borderRadius: '8px', display: 'inline-block' }}>
              Choose File
            </label>
          </div>
        )}
        
        {inputMethod === 'manual' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input type="text" placeholder="Task Title" value={manualTask.title} onChange={(e) => setManualTask({...manualTask, title: e.target.value})} style={{ width: '100%', padding: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#0f172a' }} />
            <textarea placeholder="Description" rows="2" value={manualTask.description} onChange={(e) => setManualTask({...manualTask, description: e.target.value})} style={{ width: '100%', padding: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#0f172a' }} />
            <input type="text" placeholder="Owner" value={manualTask.owner} onChange={(e) => setManualTask({...manualTask, owner: e.target.value})} style={{ width: '100%', padding: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#0f172a' }} />
            <select value={manualTask.priority} onChange={(e) => setManualTask({...manualTask, priority: e.target.value})} style={{ width: '100%', padding: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#0f172a' }}>
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
            <button onClick={createManualTask} style={{ backgroundColor: '#064e3b', color: 'white', padding: '12px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', border: 'none' }}>Create Task</button>
          </div>
        )}
        
        {result && (
          <div style={{ marginTop: '16px', padding: '16px', borderRadius: '12px', backgroundColor: result.success ? '#dcfce7' : '#fee2e2', color: result.success ? '#166534' : '#991b1b' }}>
            {result.message}
          </div>
        )}
      </div>
    </div>
  );

  // Task Detail Modal
  const TaskDetailModal = ({ task, onClose }) => (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'white', borderRadius: '24px', width: '100%', maxWidth: '450px', padding: '24px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a' }}>Task Details</h2>
          <button onClick={onClose} style={{ padding: '8px', cursor: 'pointer', background: 'none', border: 'none', fontSize: '20px' }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '12px' }}>
            <p style={{ fontSize: '12px', color: '#64748b' }}>Task</p>
            <p style={{ fontWeight: 'bold', color: '#0f172a' }}>{task.title}</p>
          </div>
          <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '12px' }}>
            <p style={{ fontSize: '12px', color: '#64748b' }}>Owner</p>
            <p style={{ fontWeight: 'bold', color: '#0f172a' }}>{task.owner}</p>
          </div>
          <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '12px' }}>
            <p style={{ fontSize: '12px', color: '#64748b' }}>Risk Score</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>{task.risk_score}%</p>
            <button onClick={() => { setShowRiskBreakdown(task); onClose(); }} style={{ fontSize: '12px', color: '#3b82f6', marginTop: '4px', cursor: 'pointer', background: 'none', border: 'none' }}>View Breakdown →</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
          <button onClick={() => { reassignTask(task.id, 'Sarah Kim'); onClose(); }} style={{ flex: 1, backgroundColor: '#dc2626', color: 'white', padding: '10px', borderRadius: '12px', fontSize: '14px', cursor: 'pointer', border: 'none' }}>Reassign</button>
          <button onClick={() => { extendDeadline(task.id); onClose(); }} style={{ flex: 1, backgroundColor: '#f59e0b', color: 'white', padding: '10px', borderRadius: '12px', fontSize: '14px', cursor: 'pointer', border: 'none' }}>Delay</button>
          <button onClick={() => { sendEmailReminder(task.id); onClose(); }} style={{ flex: 1, backgroundColor: '#3b82f6', color: 'white', padding: '10px', borderRadius: '12px', fontSize: '14px', cursor: 'pointer', border: 'none' }}>Email</button>
        </div>
      </div>
    </div>
  );

  // Dashboard Page
  const DashboardPage = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Live Analysis Panel */}
      <div style={{ background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)', borderRadius: '24px', padding: '24px', border: '1px solid #a7f3d0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: '#dc2626', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></div>
              <span style={{ fontWeight: 'bold', color: '#064e3b' }}>LIVE ANALYSIS ACTIVE</span>
            </div>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#064e3b' }}>{highRiskTasks[0]?.title || 'No high-risk tasks detected'}</h3>
            <p style={{ color: '#065f46' }}>{highRiskTasks[0] ? `Assigned to ${highRiskTasks[0].owner} · ${highRiskTasks[0].risk_score}% risk` : 'All tasks are on track'}</p>
          </div>
          {highRiskTasks[0] && (
            <div style={{ textAlign: 'right', background: 'rgba(255,255,255,0.5)', padding: '16px', borderRadius: '16px' }}>
              <div style={{ fontSize: '14px', color: '#064e3b' }}>HIGH RISK</div>
              <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#dc2626' }}>{highRiskTasks[0].risk_score}%</div>
            </div>
          )}
        </div>
        {highRiskTasks[0] && (
          <div style={{ display: 'flex', gap: '16px', marginTop: '24px', flexWrap: 'wrap' }}>
            <button onClick={() => reassignTask(highRiskTasks[0].id, 'Sarah Kim')} style={{ padding: '10px 20px', backgroundColor: '#064e3b', color: 'white', borderRadius: '12px', cursor: 'pointer', border: 'none' }}>Reassign Task</button>
            <button onClick={() => extendDeadline(highRiskTasks[0].id)} style={{ padding: '10px 20px', backgroundColor: '#064e3b', color: 'white', borderRadius: '12px', cursor: 'pointer', border: 'none' }}>Extend Deadline</button>
            <button onClick={() => sendEmailReminder(highRiskTasks[0].id)} style={{ padding: '10px 20px', backgroundColor: '#064e3b', color: 'white', borderRadius: '12px', cursor: 'pointer', border: 'none' }}>Send Email</button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Total Tasks</p>
          <h3 style={{ fontSize: '32px', fontWeight: 'bold', color: '#0f172a' }}>{stats.total}</h3>
        </div>
        <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '20px', border: '1px solid #e2e8f0' }}>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Completed</p>
          <h3 style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>{stats.completed}</h3>
        </div>
        <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '20px', border: '1px solid #e2e8f0' }}>
          <p style={{ color: '#64748b', fontSize: '14px' }}>High Risk</p>
          <h3 style={{ fontSize: '32px', fontWeight: 'bold', color: '#dc2626' }}>{highRiskTasks.length}</h3>
        </div>
        <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '20px', border: '1px solid #e2e8f0' }}>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Completion Rate</p>
          <h3 style={{ fontSize: '32px', fontWeight: 'bold', color: '#8b5cf6' }}>{stats.total ? Math.round((stats.completed / stats.total) * 100) : 0}%</h3>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '20px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a', marginBottom: '16px' }}>Meeting Activity</h3>
          <div style={{ height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <XAxis dataKey="month" stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="meetings" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '20px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a', marginBottom: '16px' }}>Risk Distribution</h3>
          <div style={{ height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label>
                  {riskDistribution.map((entry, index) => (<Cell key={index} fill={entry.color} />))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '20px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>Recent Tasks</h3>
          <button onClick={loadAllData} style={{ padding: '6px 12px', backgroundColor: '#f1f5f9', borderRadius: '8px', cursor: 'pointer', border: 'none' }}><RefreshCw size={14} /> Refresh</button>
        </div>
        {allTasks.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '60px' }}>No tasks yet. Click "New Meeting" to add tasks.</div>
        ) : (
          allTasks.slice(0, 5).map((task) => (
            <div key={task.id} onClick={() => { setSelectedTask(task); setShowTaskModal(true); }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', marginBottom: '8px', cursor: 'pointer', border: '1px solid #e2e8f0' }}>
              <div>
                <p style={{ fontWeight: 'bold', color: '#0f172a' }}>{task.title}</p>
                <p style={{ fontSize: '12px', color: '#64748b' }}>Owner: {task.owner}</p>
              </div>
              <div style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold', backgroundColor: task.risk_score > 70 ? '#fee2e2' : task.risk_score > 40 ? '#fef3c7' : '#dcfce7', color: task.risk_score > 70 ? '#dc2626' : task.risk_score > 40 ? '#d97706' : '#10b981' }}>
                {task.risk_score}% Risk
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  // Risk Intelligence Page
  const RiskIntelligencePage = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div><h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#0f172a' }}>Risk Intelligence</h2><p style={{ color: '#64748b' }}>Monitor operational risks</p></div>
        <button onClick={loadAllData} style={{ padding: '8px 16px', backgroundColor: '#f1f5f9', borderRadius: '12px', cursor: 'pointer', border: 'none' }}><RefreshCw size={16} /> Refresh</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}><p style={{ color: '#64748b' }}>Total Tasks</p><h3 style={{ fontSize: '28px', fontWeight: 'bold', color: '#0f172a' }}>{allTasks.length}</h3></div>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}><p style={{ color: '#64748b' }}>High Risk</p><h3 style={{ fontSize: '28px', fontWeight: 'bold', color: '#dc2626' }}>{highRiskTasks.length}</h3></div>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}><p style={{ color: '#64748b' }}>Completion Rate</p><h3 style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}>{stats.total ? Math.round((stats.completed / stats.total) * 100) : 0}%</h3></div>
      </div>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a', marginBottom: '16px' }}>High Risk Tasks</h3>
        {highRiskTasks.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>No high-risk tasks detected</div>
        ) : (
          highRiskTasks.map((task) => (
            <div key={task.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', marginBottom: '12px' }}>
              <div><p style={{ fontWeight: 'bold', color: '#0f172a' }}>{task.title}</p><p style={{ fontSize: '14px', color: '#64748b' }}>Owner: {task.owner}</p></div>
              <button onClick={() => reassignTask(task.id, 'Sarah Kim')} style={{ color: '#3b82f6', fontSize: '14px', cursor: 'pointer', background: 'none', border: 'none' }}>Reassign →</button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  // Team Reliability Page
  const TeamReliabilityPage = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div><h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#0f172a' }}>Team Reliability</h2><p style={{ color: '#64748b' }}>Member performance tracking</p></div>
        <button onClick={loadAllData} style={{ padding: '8px 16px', backgroundColor: '#f1f5f9', borderRadius: '12px', cursor: 'pointer', border: 'none' }}><RefreshCw size={16} /> Refresh</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a', marginBottom: '16px' }}>🏆 Most Reliable</h3>
          {mostReliable.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '12px', marginBottom: '8px' }}>
              <span style={{ color: '#0f172a' }}>{m.name}</span><span style={{ color: '#10b981', fontWeight: 'bold' }}>{m.reliability}%</span>
            </div>
          ))}
        </div>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a', marginBottom: '16px' }}>📊 Learning Engine</h3>
          <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#3b82f6' }}>{learningMetrics.accuracy}%</p>
          <p style={{ color: '#64748b' }}>Prediction Accuracy</p>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '16px' }}>Based on {learningMetrics.totalPredictions} predictions</p>
        </div>
      </div>
    </div>
  );

  // Decisions Page
  const DecisionsPage = () => {
    const [decisionFilter, setDecisionFilter] = useState('all');
    
    const filteredDecisions = decisions.filter(d => {
      if (decisionFilter === 'unresolved') return d.discussion_count >= 3 && !d.resolved;
      if (decisionFilter === 'resolved') return d.resolved;
      return true;
    });
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div><h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#0f172a' }}>Decision Tracker</h2><p style={{ color: '#64748b' }}>Track and manage decisions from meetings</p></div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={() => setDecisionFilter('all')} style={{ padding: '6px 12px', backgroundColor: decisionFilter === 'all' ? '#064e3b' : '#f1f5f9', color: decisionFilter === 'all' ? 'white' : '#0f172a', borderRadius: '8px', cursor: 'pointer', border: 'none' }}>All</button>
            <button onClick={() => setDecisionFilter('unresolved')} style={{ padding: '6px 12px', backgroundColor: decisionFilter === 'unresolved' ? '#dc2626' : '#f1f5f9', color: decisionFilter === 'unresolved' ? 'white' : '#0f172a', borderRadius: '8px', cursor: 'pointer', border: 'none' }}>Unresolved</button>
            <button onClick={() => setDecisionFilter('resolved')} style={{ padding: '6px 12px', backgroundColor: decisionFilter === 'resolved' ? '#10b981' : '#f1f5f9', color: decisionFilter === 'resolved' ? 'white' : '#0f172a', borderRadius: '8px', cursor: 'pointer', border: 'none' }}>Resolved</button>
          </div>
        </div>
        
        {decisions.length === 0 ? (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '48px', textAlign: 'center', color: '#94a3b8', border: '1px solid #e2e8f0' }}>
            No decisions yet. Process a meeting with words like "decided", "agreed", "chose".
          </div>
        ) : filteredDecisions.length === 0 ? (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '48px', textAlign: 'center', color: '#94a3b8', border: '1px solid #e2e8f0' }}>
            No {decisionFilter} decisions found.
          </div>
        ) : (
          filteredDecisions.map((d, i) => (
            <div key={d.id || i} style={{ backgroundColor: d.discussion_count >= 3 && !d.resolved ? '#fef2f2' : 'white', border: `1px solid ${d.discussion_count >= 3 && !d.resolved ? '#fecaca' : '#e2e8f0'}`, borderRadius: '16px', padding: '20px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
                  <GitBranch size={20} style={{ color: '#3b82f6' }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ color: '#0f172a' }}>{d.text}</p>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '8px', flexWrap: 'wrap' }}>
                      <p style={{ fontSize: '12px', color: '#64748b' }}>From: {d.meeting_title || 'Meeting'}</p>
                      {d.discussion_count >= 3 && !d.resolved && (
                        <p style={{ fontSize: '12px', color: '#dc2626' }}>⚠️ Discussed {d.discussion_count} times - Needs action!</p>
                      )}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    const updated = decisions.map(dec => 
                      dec.id === d.id ? { ...dec, resolved: !dec.resolved } : dec
                    );
                    setDecisions(updated);
                    localStorage.setItem('riskintel_decisions', JSON.stringify(updated));
                    alert(d.resolved ? 'Decision marked as unresolved' : 'Decision marked as resolved!');
                  }}
                  style={{ padding: '6px 16px', backgroundColor: d.resolved ? '#10b981' : '#dc2626', color: 'white', borderRadius: '8px', cursor: 'pointer', border: 'none', fontSize: '12px' }}
                >
                  {d.resolved ? '✓ Resolved' : 'Mark Resolved'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  // Settings Page
  const SettingsPage = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div><h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#0f172a' }}>Settings</h2><p style={{ color: '#64748b' }}>Manage preferences</p></div>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a', marginBottom: '16px' }}>System Information</h3>
        <p>Backend: <span style={{ color: '#10b981' }}>Connected</span></p>
        <p style={{ marginTop: '8px' }}>API: {API_URL}</p>
        <p style={{ fontSize: '12px', color: '#64748b', marginTop: '16px' }}>Model improves with more data</p>
      </div>
    </div>
  );

  // Help Center Page
  const HelpCenterPage = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div><h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#0f172a' }}>Help Center</h2><p style={{ color: '#64748b' }}>Documentation and support</p></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontWeight: 'bold', color: '#0f172a' }}>📚 Getting Started</h3>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '8px' }}>Process a meeting transcript to extract tasks and decisions.</p>
          <button style={{ marginTop: '12px', color: '#3b82f6', cursor: 'pointer', background: 'none', border: 'none' }} onClick={() => setShowMeetingModal(true)}>Start New Meeting →</button>
        </div>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontWeight: 'bold', color: '#0f172a' }}>📧 Email Reminders</h3>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '8px' }}>Click the Email button to copy task details to clipboard.</p>
        </div>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontWeight: 'bold', color: '#0f172a' }}>🔍 Search</h3>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '8px' }}>Use the search bar to find employees and their tasks.</p>
        </div>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontWeight: 'bold', color: '#0f172a' }}>📊 Risk Scores</h3>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '8px' }}>Red = High Risk (70%+), Yellow = Medium Risk (40-70%), Green = Low Risk (below 40%)</p>
        </div>
      </div>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#10b981', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></div>
          <span style={{ color: '#0f172a' }}>System Online</span>
          <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#94a3b8' }}>Version 2.0</span>
        </div>
      </div>
    </div>
  );

  const renderPage = () => {
    if (loading) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
          <Loader2 size={32} style={{ color: '#3b82f6', animation: 'spin 1s linear infinite' }} />
          <span style={{ marginLeft: '12px', color: '#64748b' }}>Loading data...</span>
        </div>
      );
    }
    switch (activeTab) {
      case 'dashboard': return <DashboardPage />;
      case 'risk': return <RiskIntelligencePage />;
      case 'team': return <TeamReliabilityPage />;
      case 'decisions': return <DecisionsPage />;
      case 'settings': return <SettingsPage />;
      case 'help': return <HelpCenterPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#d1fae5', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ width: '260px', backgroundColor: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#064e3b' }}>Risk<span style={{ color: '#3b82f6' }}>Intel</span></h1>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Task Risk Intelligence</p>
        </div>
        <nav style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  backgroundColor: activeTab === item.id ? '#d1fae5' : 'transparent',
                  color: activeTab === item.id ? '#064e3b' : '#475569',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                  border: 'none'
                }}
              >
                <Icon size={20} />
                <span style={{ fontWeight: activeTab === item.id ? '600' : '400' }}>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div style={{ padding: '16px', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', padding: '12px', marginBottom: '16px' }}>
            <p style={{ fontSize: '12px', color: '#64748b' }}>System Status</p>
            <p style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>● Connected</p>
          </div>
          <button 
            onClick={() => {
              if (window.confirm('Are you sure you want to logout?')) {
                localStorage.clear();
                alert('Logged out successfully!');
              }
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', width: '100%', color: '#dc2626', cursor: 'pointer', backgroundColor: '#fef2f2', border: 'none' }}
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Top Bar */}
        <div style={{ position: 'sticky', top: 0, backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', zIndex: 10 }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#064e3b' }}>Meeting Risk Intelligence</h2>
            <p style={{ fontSize: '12px', color: '#64748b' }}>Predicts task failure risk · Recommends interventions</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Search employee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                style={{ padding: '8px 12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#0f172a', width: '160px', outline: 'none' }}
              />
              <button onClick={handleSearch} style={{ padding: '8px 12px', backgroundColor: '#064e3b', borderRadius: '12px', cursor: 'pointer', border: 'none' }}>
                <Search size={16} color="white" />
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowNotifications(!showNotifications)} style={{ padding: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer', position: 'relative' }}>
                <Bell size={18} color="#475569" />
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: '-4px', right: '-4px', width: '16px', height: '16px', backgroundColor: '#dc2626', color: 'white', fontSize: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div style={{ position: 'absolute', top: '40px', right: '0', width: '300px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', zIndex: 100 }}>
                  <div style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold', color: '#0f172a' }}>Notifications</div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>No notifications</div>
                  ) : (
                    notifications.map(notif => (
                      <div key={notif.id} onClick={() => markNotificationRead(notif.id)} style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', backgroundColor: notif.read ? 'white' : '#fef2f2', cursor: 'pointer' }}>
                        <p style={{ fontSize: '12px', color: '#0f172a' }}>{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <button onClick={() => setShowMeetingModal(true)} style={{ padding: '8px 16px', backgroundColor: '#064e3b', color: 'white', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', border: 'none' }}>
              + New Meeting
            </button>
            <button onClick={() => alert('👤 Admin User\nadmin@riskintel.com')} style={{ width: '32px', height: '32px', backgroundColor: '#064e3b', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', cursor: 'pointer', border: 'none' }}>
              A
            </button>
          </div>
        </div>
        <div style={{ padding: '24px' }}>
          {renderPage()}
        </div>
      </div>
      
      {showMeetingModal && <MeetingModal />}
      {showTaskModal && selectedTask && <TaskDetailModal task={selectedTask} onClose={() => setShowTaskModal(false)} />}
      {showRiskBreakdown && <RiskBreakdownModal task={showRiskBreakdown} onClose={() => setShowRiskBreakdown(null)} />}
    </div>
  );
}

export default App;
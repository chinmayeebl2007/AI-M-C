import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { RefreshCw, User, Calendar, AlertTriangle } from 'lucide-react';

const API_URL = 'http://localhost:3000';

export function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const res = await fetch(`${API_URL}/api/tasks`);
      const data = await res.json();
      setTasks(data);
    } catch (error) {
      console.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const reassignTask = async (taskId, newOwner) => {
    await fetch(`${API_URL}/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ owner: newOwner })
    });
    loadTasks();
  };

  const getRiskColor = (score) => {
    if (score > 70) return 'border-red-500/30 bg-red-500/5';
    if (score > 40) return 'border-amber-500/30 bg-amber-500/5';
    return 'border-green-500/30 bg-green-500/5';
  };

  const getRiskBadge = (score) => {
    if (score > 70) return <Badge className="bg-red-500/20 text-red-400">High Risk · {score}%</Badge>;
    if (score > 40) return <Badge className="bg-amber-500/20 text-amber-400">Medium Risk · {score}%</Badge>;
    return <Badge className="bg-green-500/20 text-green-400">Low Risk · {score}%</Badge>;
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Tasks</h1>
          <p className="text-slate-400 mt-1">Manage and reassign tasks</p>
        </div>
        <Button onClick={loadTasks} variant="outline" className="border-slate-700">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-8 text-center text-slate-500">Loading tasks...</CardContent>
          </Card>
        ) : tasks.length === 0 ? (
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-8 text-center text-slate-500">No tasks yet. Start a live meeting.</CardContent>
          </Card>
        ) : (
          tasks.map((task) => (
            <Card key={task.id} className={`bg-slate-900 border ${getRiskColor(task.risk_score)}`}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-white font-semibold text-lg">{task.title}</h3>
                      {getRiskBadge(task.risk_score)}
                    </div>
                    <div className="flex gap-4 mt-3 text-sm text-slate-400">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Owner: {task.owner}
                      </div>
                      {task.deadline && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Due: {new Date(task.deadline).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  {task.risk_score > 70 && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => reassignTask(task.id, 'Sarah Kim')}
                      >
                        Reassign to Sarah
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
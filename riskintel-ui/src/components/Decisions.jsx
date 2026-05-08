import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { GitBranch, AlertCircle } from 'lucide-react';

const API_URL = 'http://localhost:3000';

export function Decisions() {
  const [decisions, setDecisions] = useState([]);

  useEffect(() => {
    loadDecisions();
  }, []);

  const loadDecisions = async () => {
    try {
      const res = await fetch(`${API_URL}/api/decisions`);
      const data = await res.json();
      setDecisions(data);
    } catch (error) {
      console.error('Failed to load decisions');
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Decisions Tracker</h1>
        <p className="text-slate-400 mt-1">Track decisions made across meetings</p>
      </div>

      <div className="grid gap-4">
        {decisions.length === 0 ? (
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-8 text-center text-slate-500">No decisions tracked yet</CardContent>
          </Card>
        ) : (
          decisions.map((decision) => (
            <Card key={decision.id} className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <GitBranch className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-white">{decision.text}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge className="bg-slate-800 text-slate-400">From: {decision.meeting_title || 'Unknown'}</Badge>
                      {decision.discussion_count >= 3 && (
                        <Badge className="bg-amber-500/20 text-amber-400">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Discussed {decision.discussion_count} times
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
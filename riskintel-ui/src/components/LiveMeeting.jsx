import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Mic, 
  Square, 
  AlertTriangle,
  CheckCircle,
  GitBranch
} from 'lucide-react';

const WS_URL = 'ws://localhost:3000';

export function LiveMeeting() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [riskAlerts, setRiskAlerts] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  
  const mediaRecorderRef = useRef(null);
  const wsRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const connectWebSocket = () => {
    wsRef.current = new WebSocket(WS_URL);
    
    wsRef.current.onopen = () => {
      setConnectionStatus('connected');
    };
    
    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'transcript') {
        setTranscript(prev => [...prev, { text: data.text, timestamp: Date.now() }]);
      }
      
      if (data.type === 'task') {
        setTasks(prev => [...prev, data.task]);
      }
      
      if (data.type === 'decision') {
        setDecisions(prev => [...prev, { text: data.text, timestamp: Date.now() }]);
      }
      
      if (data.type === 'risk_alert') {
        setRiskAlerts(prev => [...prev, data]);
        setTimeout(() => {
          setRiskAlerts(prev => prev.filter(a => a !== data));
        }, 5000);
      }
    };
    
    wsRef.current.onerror = () => {
      setConnectionStatus('error');
    };
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && event.data.size > 0) {
          wsRef.current.send(event.data);
        }
      };
      
      mediaRecorder.start(1000);
      setIsRecording(true);
      
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'start' }));
      }
    } catch (error) {
      console.error('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'stop' }));
    }
    setIsRecording(false);
  };

  const saveMeeting = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ 
        type: 'save', 
        title: `Meeting ${new Date().toLocaleString()}` 
      }));
    }
  };

  const getTaskBadge = (riskScore) => {
    if (riskScore > 70) return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">High Risk</Badge>;
    if (riskScore > 40) return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Medium Risk</Badge>;
    return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Low Risk</Badge>;
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Live Meeting</h1>
        <p className="text-slate-400 mt-1">Real-time transcription and risk detection</p>
      </div>

      <div className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${
          connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 
          connectionStatus === 'error' ? 'bg-red-500' : 'bg-slate-500'
        }`} />
        <span className="text-xs text-slate-400">
          {connectionStatus === 'connected' ? 'Live' : connectionStatus === 'error' ? 'Connection Error' : 'Connecting...'}
        </span>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-8 text-center">
          <div className="flex justify-center gap-4">
            {!isRecording ? (
              <Button 
                onClick={startRecording} 
                className="bg-red-500 hover:bg-red-600 text-white px-8 py-6 rounded-full"
                disabled={connectionStatus !== 'connected'}
              >
                <Mic className="h-5 w-5 mr-2" />
                Start Recording
              </Button>
            ) : (
              <Button 
                onClick={stopRecording} 
                variant="outline" 
                className="border-red-500 text-red-500 px-8 py-6 rounded-full"
              >
                <Square className="h-5 w-5 mr-2" />
                Stop Recording
              </Button>
            )}
          </div>
          {isRecording && (
            <div className="mt-4 flex justify-center gap-1">
              {[...Array(20)].map((_, i) => (
                <div 
                  key={i} 
                  className="w-1 bg-blue-500 rounded-full animate-pulse"
                  style={{ height: `${20 + Math.random() * 40}px` }}
                />
              ))}
            </div>
          )}
          <p className="text-slate-400 text-sm mt-4">
            {isRecording ? 'Recording in progress... Speak now' : 'Click start to begin live transcription'}
          </p>
        </CardContent>
      </Card>

      {riskAlerts.length > 0 && (
        <div className="space-y-2">
          {riskAlerts.map((alert, idx) => (
            <Card key={idx} className="bg-red-500/10 border-red-500/30">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <div className="flex-1">
                  <p className="text-red-400 text-sm font-medium">High Risk Detected</p>
                  <p className="text-slate-300 text-xs">{alert.text?.substring(0, 100)}</p>
                </div>
                <Badge className="bg-red-500/20 text-red-400">{alert.riskScore}% Risk</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Tabs defaultValue="transcript" className="space-y-4">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="transcript" className="data-[state=active]:bg-slate-700">
            📝 Live Transcript
          </TabsTrigger>
          <TabsTrigger value="tasks" className="data-[state=active]:bg-slate-700">
            📋 Tasks ({tasks.length})
          </TabsTrigger>
          <TabsTrigger value="decisions" className="data-[state=active]:bg-slate-700">
            ✅ Decisions ({decisions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transcript" className="space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {transcript.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">Waiting for speech...</p>
                ) : (
                  transcript.slice().reverse().map((item, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-slate-800/50">
                      <p className="text-slate-300 text-sm">{item.text}</p>
                      <p className="text-slate-500 text-xs mt-1">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
              <div className="space-y-3">
                {tasks.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No tasks extracted yet</p>
                ) : (
                  tasks.map((task, idx) => (
                    <div key={idx} className="flex justify-between items-center p-4 rounded-lg bg-slate-800/50">
                      <div>
                        <p className="text-white font-medium">{task.title}</p>
                        <p className="text-slate-400 text-xs mt-1">Owner: {task.owner}</p>
                      </div>
                      {getTaskBadge(task.riskScore)}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="decisions" className="space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
              <div className="space-y-3">
                {decisions.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No decisions detected yet</p>
                ) : (
                  decisions.map((decision, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-4 rounded-lg bg-slate-800/50">
                      <GitBranch className="h-4 w-4 text-blue-400 mt-0.5" />
                      <div>
                        <p className="text-slate-300 text-sm">{decision.text}</p>
                        <p className="text-slate-500 text-xs mt-1">
                          {new Date(decision.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {!isRecording && transcript.length > 0 && (
        <div className="flex justify-end">
          <Button onClick={saveMeeting} className="bg-blue-600 hover:bg-blue-700">
            <CheckCircle className="h-4 w-4 mr-2" />
            Save Meeting & Process
          </Button>
        </div>
      )}
    </div>
  );
}
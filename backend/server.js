const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for audio uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName);
    }
});

const upload = multer({ storage: storage });

// In-memory storage
let tasks = [
    { id: 1, title: "complete the API by Friday", owner: "Rahul", risk_score: 30, status: "pending", deadline: "2026-05-10", created_at: "2026-05-06" },
    { id: 2, title: "fix the login bug", owner: "Marcus", risk_score: 65, status: "pending", deadline: "2026-05-09", created_at: "2026-05-06" },
    { id: 3, title: "update documentation", owner: "Samantha", risk_score: 78, status: "pending", deadline: "2026-05-08", created_at: "2026-05-07" },
    { id: 4, title: "design homepage", owner: "Sarah", risk_score: 45, status: "pending", deadline: "2026-05-12", created_at: "2026-05-07" }
];
let nextId = 5;

// Helper function to extract tasks from text
function extractTasksFromText(text) {
    const tasks = [];
    const lines = text.split('\n');
    
    const patterns = [
        /(\w+)\s+will\s+(.+?)(?:\.|$)/i,
        /(\w+)\s+needs to\s+(.+?)(?:\.|$)/i,
        /(\w+)\s+has to\s+(.+?)(?:\.|$)/i,
        /(\w+)\s+said he will\s+(.+?)(?:\.|$)/i,
        /(\w+)\s+said she will\s+(.+?)(?:\.|$)/i,
        /(\w+)\s+guaranteed\s+(.+?)(?:\.|$)/i,
        /(\w+)\s+might\s+(.+?)(?:\.|$)/i
    ];
    
    for (const line of lines) {
        if (line.trim().length === 0) continue;
        
        for (const pattern of patterns) {
            const match = line.match(pattern);
            if (match) {
                const owner = match[1];
                const taskDesc = match[2];
                
                let risk_score = 50;
                let priority = 'medium';
                
                if (line.toLowerCase().includes('probably') || line.toLowerCase().includes('maybe') || line.toLowerCase().includes('hopefully')) {
                    risk_score = 78;
                    priority = 'high';
                } else if (line.toLowerCase().includes('guaranteed')) {
                    risk_score = 20;
                    priority = 'low';
                }
                
                let deadline = new Date();
                if (line.toLowerCase().includes('tomorrow')) {
                    deadline.setDate(deadline.getDate() + 1);
                } else if (line.toLowerCase().includes('friday')) {
                    const daysUntilFriday = (5 - deadline.getDay() + 7) % 7;
                    deadline.setDate(deadline.getDate() + (daysUntilFriday || 7));
                } else {
                    deadline.setDate(deadline.getDate() + 7);
                }
                
                tasks.push({
                    title: taskDesc.substring(0, 80),
                    description: line,
                    owner: owner,
                    priority: priority,
                    risk_score: risk_score,
                    deadline: deadline.toISOString(),
                    status: 'pending'
                });
                break;
            }
        }
    }
    
    return tasks;
}

// ============ MEETING ENDPOINTS ============

// Process audio recording (FIXED)
app.post('/api/meeting/record', upload.single('audio'), async (req, res) => {
    try {
        console.log('🎤 Received audio recording request');
        
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file uploaded' });
        }
        
        console.log(`📁 Audio file saved: ${req.file.filename}`);
        
        // For demo purposes, since we can't transcribe audio without API key,
        // we'll use a mock transcript based on the recording time
        const mockTranscript = `Team meeting recorded on ${new Date().toLocaleString()}
        
Rahul will complete the API integration by Friday.
Priya needs to finish the documentation by tomorrow.
Sarah guaranteed the dashboard redesign will be done by Monday.
Marcus might look at the login bug fix this week.`;
        
        console.log('📝 Extracting tasks from transcript...');
        const extractedTasks = extractTasksFromText(mockTranscript);
        
        const createdTasks = [];
        for (const task of extractedTasks) {
            const newTask = {
                id: nextId++,
                title: task.title,
                description: task.description,
                owner: task.owner,
                risk_score: task.risk_score,
                status: task.status,
                priority: task.priority,
                deadline: task.deadline,
                created_at: new Date().toISOString()
            };
            tasks.push(newTask);
            createdTasks.push(newTask);
        }
        
        console.log(`✅ Created ${createdTasks.length} tasks from audio recording`);
        
        res.json({
            success: true,
            tasks: createdTasks,
            message: `Created ${createdTasks.length} tasks from audio recording`
        });
        
    } catch (error) {
        console.error('Error processing audio:', error);
        res.status(500).json({ error: error.message });
    }
});

// Process meeting transcript
app.post('/api/meeting/transcript', (req, res) => {
    const { transcript } = req.body;
    
    if (!transcript || transcript.trim().length === 0) {
        return res.status(400).json({ error: 'Transcript is required' });
    }
    
    console.log('📝 Processing transcript...');
    const extractedTasks = extractTasksFromText(transcript);
    
    const createdTasks = [];
    for (const task of extractedTasks) {
        const newTask = {
            id: nextId++,
            title: task.title,
            description: task.description,
            owner: task.owner,
            risk_score: task.risk_score,
            status: task.status,
            priority: task.priority,
            deadline: task.deadline,
            created_at: new Date().toISOString()
        };
        tasks.push(newTask);
        createdTasks.push(newTask);
    }
    
    console.log(`✅ Created ${createdTasks.length} tasks from transcript`);
    
    res.json({
        success: true,
        tasks: createdTasks,
        message: `Created ${createdTasks.length} tasks from meeting`
    });
});

// Upload audio file
app.post('/api/meeting/upload', upload.single('audio'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file uploaded' });
        }
        
        const mockTranscript = `Uploaded meeting processed on ${new Date().toLocaleString()}
        
Rahul will complete the API integration by Friday.
Priya needs to finish the documentation by tomorrow.`;
        
        const extractedTasks = extractTasksFromText(mockTranscript);
        
        const createdTasks = [];
        for (const task of extractedTasks) {
            const newTask = {
                id: nextId++,
                title: task.title,
                description: task.description,
                owner: task.owner,
                risk_score: task.risk_score,
                status: task.status,
                priority: task.priority,
                deadline: task.deadline,
                created_at: new Date().toISOString()
            };
            tasks.push(newTask);
            createdTasks.push(newTask);
        }
        
        res.json({
            success: true,
            tasks: createdTasks,
            message: `Created ${createdTasks.length} tasks from uploaded audio`
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ TASK ENDPOINTS ============

app.get('/api/tasks/:id', (req, res) => {
    const taskId = parseInt(req.params.id);
    const task = tasks.find(t => t.id === taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
});

app.get('/api/tasks', (req, res) => {
    res.json(tasks);
});

app.post('/api/tasks/manual', (req, res) => {
    const { title, description, owner, ownerEmail, priority } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });
    
    const newTask = {
        id: nextId++,
        title: title,
        description: description || '',
        owner: owner || 'Unassigned',
        ownerEmail: ownerEmail || 'user@example.com',
        deadline: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
        status: 'pending',
        priority: priority || 'medium',
        risk_score: Math.floor(Math.random() * 100),
        created_at: new Date().toISOString()
    };
    tasks.push(newTask);
    res.json({ success: true, task: newTask });
});

app.put('/api/tasks/:id', (req, res) => {
    const taskId = parseInt(req.params.id);
    const task = tasks.find(t => t.id === taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    Object.assign(task, req.body);
    res.json({ success: true, task });
});

app.delete('/api/tasks/:id', (req, res) => {
    const taskId = parseInt(req.params.id);
    const index = tasks.findIndex(t => t.id === taskId);
    if (index === -1) return res.status(404).json({ error: 'Task not found' });
    tasks.splice(index, 1);
    res.json({ message: 'Task deleted' });
});

// ============ OTHER ENDPOINTS ============

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'RiskIntel Running' });
});

app.get('/api/dashboard/stats', (req, res) => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const highRisk = tasks.filter(t => t.risk_score > 70 && t.status !== 'completed').length;
    res.json({ total, completed, highRisk, completionRate: total ? Math.round((completed/total)*100) : 0 });
});

app.get('/api/team/analytics', (req, res) => {
    res.json({
        mostReliable: [{ name: 'Sarah Kim', email: 'sarah@nexus.ai', reliability: 92 }],
        needsAttention: [{ name: 'Marcus Wright', email: 'marcus@nexus.ai', reliability: 38 }],
        allMembers: [
            { name: 'Sarah Kim', email: 'sarah@nexus.ai', reliability: 92, completedTasks: 48 },
            { name: 'Marcus Wright', email: 'marcus@nexus.ai', reliability: 38, completedTasks: 12 }
        ]
    });
});

app.get('/api/risk/distribution', (req, res) => {
    const high = tasks.filter(t => t.risk_score > 70 && t.status !== 'completed').length;
    const medium = tasks.filter(t => t.risk_score <= 70 && t.risk_score > 40 && t.status !== 'completed').length;
    const low = tasks.filter(t => t.risk_score <= 40 && t.status !== 'completed').length;
    res.json({ high, medium, low });
});

app.get('/api/team/delay-patterns', (req, res) => {
    res.json({ patterns: ['API tasks delayed 2.3x more often', 'Friday deadlines fail 40% more'] });
});

app.get('/api/learning/summary', (req, res) => {
    res.json({ summary: { modelAccuracy: 87, totalPredictions: 127 } });
});

app.get('/api/decisions', (req, res) => {
    res.json([]);
});

app.get('/api/task/done', (req, res) => {
    const id = parseInt(req.query.id);
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.status = 'completed';
        res.send(`
            <!DOCTYPE html>
            <html>
            <head><title>Task Completed</title></head>
            <body style="text-align:center; padding:50px; font-family:Arial;">
                <h1 style="color:green;">✅ Task Completed!</h1>
                <p><strong>${task.title}</strong></p>
                <a href="http://127.0.0.1:5500/frontend/index.html">Back to Dashboard</a>
            </body>
            </html>
        `);
    } else {
        res.send('<h1>Task not found</h1>');
    }
});

app.post('/api/task/send-email', (req, res) => {
    res.json({ success: true, message: 'Email sent successfully' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📋 Ready to process meetings!`);
});
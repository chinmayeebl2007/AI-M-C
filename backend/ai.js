// backend/ai.js - UPGRADED with Confidence Scores & Ambiguity Detection
const fs = require('fs');

// Confidence thresholds
const CONFIDENCE = {
    HIGH: { min: 80, label: 'High', color: 'green' },
    MEDIUM: { min: 50, label: 'Medium', color: 'yellow' },
    LOW: { min: 0, label: 'Low', color: 'red' }
};

// Detect ambiguous language
function detectAmbiguity(text) {
    const ambiguityPatterns = [
        { pattern: /\b(?:maybe|perhaps|possibly)\b/i, weight: 25, reason: 'Uncertain modal' },
        { pattern: /\b(?:someone|somebody|anyone)\b/i, weight: 20, reason: 'Unspecified owner' },
        { pattern: /\b(?:sometime|eventually|later)\b/i, weight: 20, reason: 'Vague timeline' },
        { pattern: /\b(?:if\s+possible|if\s+needed)\b/i, weight: 15, reason: 'Conditional commitment' },
        { pattern: /\b(?:we\s+should|we\s+could|we\s+might)\b/i, weight: 15, reason: 'Collective vague commitment' },
        { pattern: /\b(?:asap|soon)\b/i, weight: 10, reason: 'Imprecise deadline' },
        { pattern: /\b(?:thing|stuff|something)\b/i, weight: 10, reason: 'Vague object' },
        { pattern: /\b(?:need to|have to)\s+(?!.*\b(?:by|before)\b)/i, weight: 15, reason: 'Action without timeline' }
    ];
    
    let totalAmbiguity = 0;
    const reasons = [];
    
    for (const pattern of ambiguityPatterns) {
        if (pattern.pattern.test(text)) {
            totalAmbiguity += pattern.weight;
            reasons.push(pattern.reason);
        }
    }
    
    return {
        score: Math.min(totalAmbiguity, 100),
        reasons: reasons.slice(0, 3),
        level: totalAmbiguity > 50 ? 'high' : (totalAmbiguity > 20 ? 'medium' : 'low')
    };
}

// Calculate confidence score for extracted task
function calculateConfidence(extractedTask, originalText) {
    let confidence = 70; // Base confidence
    
    // Owner clarity
    if (extractedTask.owner && extractedTask.owner !== 'Unknown') {
        confidence += 15;
    } else {
        confidence -= 20;
    }
    
    // Deadline clarity
    if (extractedTask.suggestedDeadline) {
        confidence += 10;
    } else {
        confidence -= 15;
    }
    
    // Action verb presence
    const actionVerbs = ['prepare', 'create', 'fix', 'build', 'design', 'write', 'update', 'complete', 'finish', 'deliver'];
    const hasActionVerb = actionVerbs.some(v => extractedTask.title.toLowerCase().includes(v));
    if (hasActionVerb) {
        confidence += 10;
    } else {
        confidence -= 10;
    }
    
    // Description length
    if (extractedTask.description && extractedTask.description.length > 30) {
        confidence += 5;
    }
    
    // Ambiguity penalty
    const ambiguity = detectAmbiguity(originalText);
    confidence -= ambiguity.score * 0.3;
    
    // Final bounds
    confidence = Math.min(95, Math.max(15, Math.round(confidence)));
    
    let level = 'low';
    if (confidence >= 70) level = 'high';
    else if (confidence >= 50) level = 'medium';
    
    return {
        score: confidence,
        level: level,
        label: CONFIDENCE[level.toUpperCase()]?.label || 'Medium',
        ambiguityDetected: ambiguity.reasons
    };
}

// Extract tasks with confidence scores
// backend/ai.js - REPLACE extractTasksFromText

function extractTasksFromText(transcript) {
    if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
        console.log('❌ Invalid transcript');
        return [];
    }
    
    const tasks = [];
    const seen = new Set();
    const lines = transcript.split(/\r?\n/);
    
    for (let line of lines) {
        line = line.trim();
        if (line.length < 10) continue;
        
        // Remove bullet points
        let clean = line.replace(/^[-•*▶]\s*/, '');
        clean = clean.replace(/^\d+[\.\)]\s*/, '');
        
        // Pattern 1: "Name will do task"
        let match = clean.match(/^([A-Z][a-z]+)\s+will\s+(.+?)(?:\.|$)/i);
        
        // Pattern 2: "Name needs to do task"
        if (!match) {
            match = clean.match(/^([A-Z][a-z]+)\s+(?:needs to|has to)\s+(.+?)(?:\.|$)/i);
        }
        
        // Pattern 3: "Task by deadline assigned to Name"
        if (!match) {
            match = clean.match(/^(.+?)\s+by\s+(tomorrow|today|friday|monday)\s+assigned to\s+([A-Z][a-z]+)/i);
            if (match) {
                const title = match[1].trim();
                const key = title.substring(0, 30).toLowerCase();
                if (!seen.has(key)) {
                    seen.add(key);
                    tasks.push({
                        title: title.substring(0, 100),
                        description: line,
                        owner: match[3],
                        ownerEmail: `${match[3].toLowerCase()}@example.com`,
                        priority: 'medium',
                        status: 'pending',
                        suggestedDeadline: match[2]
                    });
                }
                continue;
            }
        }
        
        if (match && match[2]) {
            const owner = match[1];
            let title = match[2].trim();
            title = title.replace(/^(to|the|a|an)\s+/i, '');
            const key = title.substring(0, 30).toLowerCase();
            
            if (!seen.has(key) && title.length > 5 && title.length < 120) {
                seen.add(key);
                tasks.push({
                    title: title.substring(0, 100),
                    description: line,
                    owner: owner,
                    ownerEmail: `${owner.toLowerCase()}@example.com`,
                    priority: 'medium',
                    status: 'pending',
                    suggestedDeadline: null
                });
            }
        }
    }
    
    // Fallback - only if no tasks found
    if (tasks.length === 0) {
        const sentences = transcript.split(/[.!?]/);
        for (let sentence of sentences) {
            sentence = sentence.trim();
            if (sentence.length > 15 && sentence.length < 120) {
                const actionWords = ['will', 'need', 'fix', 'create', 'build', 'design', 'update', 'complete'];
                let hasAction = false;
                for (const w of actionWords) {
                    if (sentence.toLowerCase().includes(w)) {
                        hasAction = true;
                        break;
                    }
                }
                if (hasAction) {
                    tasks.push({
                        title: sentence.substring(0, 80),
                        description: sentence,
                        owner: 'Unknown',
                        ownerEmail: 'unknown@example.com',
                        priority: 'medium',
                        status: 'pending',
                        suggestedDeadline: null
                    });
                }
            }
        }
    }
    
    console.log(`✅ Extracted ${tasks.length} tasks`);
    return tasks;
}

// ============ TRANSCRIBE ============

// backend/ai.js - REPLACE transcribeAudio function only

// backend/ai.js - Replace transcribeAudio function
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const execPromise = util.promisify(exec);

async function transcribeAudio(audioPath) {
    console.log('🎤 Starting transcription...');
    
    // Method 1: OpenAI Whisper API (if API key present)
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
        try {
            const OpenAI = require('openai');
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            const audioFile = fs.createReadStream(audioPath);
            
            const response = await openai.audio.transcriptions.create({
                file: audioFile,
                model: 'whisper-1',
                language: 'en',
                response_format: 'text'
            });
            
            console.log('✅ Whisper API transcription complete');
            return response;
        } catch (err) {
            console.log('⚠️ Whisper API failed:', err.message);
        }
    }
    
    // Method 2: Local Whisper.cpp (if installed)
    const whisperPath = path.join(__dirname, '../whisper.cpp/main');
    const modelPath = path.join(__dirname, '../whisper.cpp/models/ggml-base.en.bin');
    
    if (fs.existsSync(whisperPath) && fs.existsSync(modelPath)) {
        try {
            const outputPath = audioPath.replace(/\.[^/.]+$/, '.txt');
            await execPromise(`"${whisperPath}" -m "${modelPath}" -f "${audioPath}" -otxt`);
            
            if (fs.existsSync(outputPath)) {
                const transcript = fs.readFileSync(outputPath, 'utf8');
                console.log('✅ Local Whisper transcription complete');
                return transcript;
            }
        } catch (err) {
            console.log('⚠️ Local Whisper failed:', err.message);
        }
    }
    
    // Method 3: Return error - no fake transcription
    throw new Error('No transcription method available. Add OPENAI_API_KEY to .env or install whisper.cpp');
}

module.exports = { transcribeAudio, extractTasksFromText, analyzeMeeting, generateSummary };

// ============ ANALYZE MEETING ============

async function analyzeMeeting(transcript) {
    const topics = ['api', 'design', 'documentation', 'website'].filter(t => transcript.toLowerCase().includes(t));
    const namePattern = /\b([A-Z][a-z]+)\b/g;
    const names = [...new Set(transcript.match(namePattern) || [])];
    const commonNames = ['Sarah', 'Marcus', 'Priya', 'Rahul', 'Samantha', 'Alex', 'Jordan'];
    const attendees = names.filter(n => commonNames.includes(n));
    
    return {
        summary: `Meeting covered ${topics.length} topics`,
        keyDecisions: topics.map(t => `${t} discussed`),
        topics: topics,
        attendees: attendees.length > 0 ? attendees : ['Team Member'],
        sentiment: 'neutral',
        actionItems: 0
    };
}

async function generateSummary(transcript) {
    const sentences = transcript.match(/[^.!?]+[.!?]+/g) || [];
    return sentences.slice(0, 2).join(' ') || 'Meeting transcript processed.';
}
// backend/ai.js - Add these new functions

// Detect ambiguity in text
function detectAmbiguity(text) {
    const ambiguityPatterns = [
        { pattern: /\b(?:maybe|perhaps|possibly)\b/i, weight: 25, reason: 'Uncertain modal' },
        { pattern: /\b(?:someone|somebody|anyone)\b/i, weight: 20, reason: 'Unspecified owner' },
        { pattern: /\b(?:sometime|eventually|later)\b/i, weight: 20, reason: 'Vague timeline' },
        { pattern: /\b(?:if\s+possible|if\s+needed)\b/i, weight: 15, reason: 'Conditional commitment' },
        { pattern: /\b(?:we\s+should|we\s+could|we\s+might)\b/i, weight: 15, reason: 'Collective vague commitment' },
        { pattern: /\b(?:asap|soon)\b/i, weight: 10, reason: 'Imprecise deadline' },
        { pattern: /\b(?:thing|stuff|something)\b/i, weight: 10, reason: 'Vague object' }
    ];
    
    let totalAmbiguity = 0;
    const reasons = [];
    
    for (const pattern of ambiguityPatterns) {
        if (pattern.pattern.test(text)) {
            totalAmbiguity += pattern.weight;
            reasons.push(pattern.reason);
        }
    }
    
    return {
        score: Math.min(totalAmbiguity, 100),
        reasons: reasons.slice(0, 3),
        level: totalAmbiguity > 50 ? 'high' : (totalAmbiguity > 20 ? 'medium' : 'low')
    };
}

// Calculate confidence score for extracted task
function calculateConfidence(extractedTask, originalText) {
    let confidence = 70; // Base confidence
    
    // Owner clarity
    if (extractedTask.owner && extractedTask.owner !== 'Unknown') {
        confidence += 15;
    } else {
        confidence -= 20;
    }
    
    // Deadline clarity
    if (extractedTask.suggestedDeadline) {
        confidence += 10;
    } else {
        confidence -= 15;
    }
    
    // Action verb presence
    const actionVerbs = ['prepare', 'create', 'fix', 'build', 'design', 'write', 'update', 'complete', 'finish', 'deliver'];
    const hasActionVerb = actionVerbs.some(v => extractedTask.title.toLowerCase().includes(v));
    if (hasActionVerb) {
        confidence += 10;
    } else {
        confidence -= 10;
    }
    
    // Ambiguity penalty
    const ambiguity = detectAmbiguity(originalText);
    confidence -= ambiguity.score * 0.3;
    
    // Final bounds
    confidence = Math.min(95, Math.max(15, Math.round(confidence)));
    
    let level = 'low';
    if (confidence >= 70) level = 'high';
    else if (confidence >= 50) level = 'medium';
    
    return {
        score: confidence,
        level: level,
        ambiguityDetected: ambiguity.reasons,
        ambiguityScore: ambiguity.score
    };
}

// Improved extractTasksFromText with confidence and ambiguity
async function extractTasksFromText(transcript) {
    console.log('📝 Extracting tasks with confidence scoring...');
    
    if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
        return [];
    }
    
    const tasks = [];
    const lines = transcript.split(/\r?\n/);
    const processedTitles = new Set();
    
    for (let line of lines) {
        if (!line || typeof line !== 'string') continue;
        
        const originalLine = line;
        let cleanLine = line.trim().replace(/^[-•*▶▸▹➢➤❯›]\s*/, '');
        cleanLine = cleanLine.replace(/^\d+[\.\)]\s*/, '');
        
        if (cleanLine.length < 8) continue;
        
        let extracted = false;
        let title = '';
        let owner = 'Unknown';
        let deadline = null;
        let priority = 'medium';
        
        // Pattern 1: "Name will do task by deadline"
        const pattern1 = /(\w+)\s+will\s+(.+?)(?:\s+by\s+(tomorrow|today|friday|monday|eod|next week))?/i;
        let match = cleanLine.match(pattern1);
        if (match) {
            owner = match[1];
            title = match[2].trim();
            deadline = match[3] || null;
            extracted = true;
        }
        
        // Pattern 2: "Name needs to do task"
        if (!extracted) {
            const pattern2 = /(\w+)\s+(?:needs to|has to|should|must)\s+(.+?)(?:\.|$)/i;
            match = cleanLine.match(pattern2);
            if (match) {
                owner = match[1];
                title = match[2].trim();
                extracted = true;
            }
        }
        
        // Pattern 3: "Task by deadline assigned to Name"
        if (!extracted) {
            const pattern3 = /(.+?)\s+by\s+(tomorrow|today|friday|monday|eod|next week)\s*(?:\(?assigned to\s*(\w+)\)?)?/i;
            match = cleanLine.match(pattern3);
            if (match) {
                title = match[1].trim();
                deadline = match[2];
                owner = match[3] || 'Unknown';
                extracted = true;
            }
        }
        
        if (extracted && title && title.length > 5) {
            title = title.substring(0, 100).replace(/^[.,!?]/, '');
            
            // Priority detection
            if (originalLine.toLowerCase().includes('urgent') || originalLine.toLowerCase().includes('critical')) {
                priority = 'high';
            }
            
            // Calculate risk score based on language
            let riskScore = 30;
            if (originalLine.toLowerCase().includes('probably') || originalLine.toLowerCase().includes('try')) {
                riskScore = 78;
                priority = 'high';
            } else if (originalLine.toLowerCase().includes('maybe')) {
                riskScore = 65;
                priority = 'high';
            }
            
            // Calculate confidence
            const confidence = calculateConfidence({ title, owner, suggestedDeadline: deadline }, originalLine);
            
            // Check for duplicates
            const titleKey = title.substring(0, 30).toLowerCase();
            if (!processedTitles.has(titleKey)) {
                processedTitles.add(titleKey);
                tasks.push({
                    title: title,
                    description: originalLine.substring(0, 300),
                    owner: owner,
                    ownerEmail: `${owner.toLowerCase()}@example.com`,
                    priority: priority,
                    status: 'pending',
                    suggestedDeadline: deadline,
                    riskScore: riskScore,
                    confidence: confidence.score,
                    confidenceLevel: confidence.level,
                    ambiguityScore: confidence.ambiguityScore,
                    ambiguityReasons: confidence.ambiguityDetected
                });
            }
        }
    }
    
    // Fallback: sentence-based extraction if no tasks found
    if (tasks.length === 0) {
        console.log('⚠️ No tasks found with pattern matching, using fallback...');
        const sentences = transcript.match(/[^.!?]+[.!?]+/g) || [];
        for (const sentence of sentences) {
            const actionWords = ['will', 'need to', 'has to', 'must', 'prepare', 'create', 'fix', 'build'];
            let hasAction = false;
            for (const word of actionWords) {
                if (sentence.toLowerCase().includes(word)) {
                    hasAction = true;
                    break;
                }
            }
            if (hasAction && sentence.length > 15 && sentence.length < 200) {
                const confidence = calculateConfidence({ title: sentence.substring(0, 60), owner: 'Unknown' }, sentence);
                tasks.push({
                    title: sentence.substring(0, 70),
                    description: sentence.trim(),
                    owner: 'Unknown',
                    ownerEmail: 'unknown@example.com',
                    priority: 'medium',
                    status: 'pending',
                    suggestedDeadline: null,
                    riskScore: 30,
                    confidence: confidence.score,
                    confidenceLevel: confidence.level,
                    ambiguityScore: confidence.ambiguityScore,
                    ambiguityReasons: confidence.ambiguityDetected
                });
            }
        }
    }
    
    console.log(`✅ Extracted ${tasks.length} tasks (Avg confidence: ${Math.round(tasks.reduce((s, t) => s + t.confidence, 0) / tasks.length) || 0}%)`);
    return tasks;
}
module.exports = { transcribeAudio, extractTasksFromText, analyzeMeeting, generateSummary, calculateConfidence, detectAmbiguity };
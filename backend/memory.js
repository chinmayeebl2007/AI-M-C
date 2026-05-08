// backend/memory.js - Cross-Meeting Memory Module
// This stores and retrieves information across meetings

let meetingHistory = [];
let taskHistory = [];
let patternMemory = {};

// Save meeting to memory
async function saveToMemory(meeting) {
    try {
        meetingHistory.push({
            id: meeting.id,
            title: meeting.title,
            date: meeting.date,
            transcript: meeting.transcript,
            insights: meeting.insights,
            extractedTasks: meeting.extractedTasks,
            keywords: extractKeywords(meeting.transcript)
        });
        
        // Update pattern memory
        updatePatterns(meeting);
        
        console.log(`💾 Meeting ${meeting.id} saved to memory`);
        return true;
    } catch (error) {
        console.error('Error saving to memory:', error);
        return false;
    }
}

// Extract keywords from text
function extractKeywords(text) {
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'this', 'that', 'these', 'those', 'it', 'they', 'we', 'you', 'he', 'she', 'it', 'them'];
    
    const words = text.toLowerCase().split(/\W+/);
    const wordCount = {};
    
    for (const word of words) {
        if (word.length > 3 && !stopWords.includes(word)) {
            wordCount[word] = (wordCount[word] || 0) + 1;
        }
    }
    
    const sorted = Object.entries(wordCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([word]) => word);
    
    return sorted;
}

// Get all meeting history
async function getMeetingHistory() {
    return meetingHistory;
}

// Search past meetings for similar content
async function searchPastMeetings(query) {
    const queryLower = query.toLowerCase();
    const results = [];
    
    for (const meeting of meetingHistory) {
        let relevanceScore = 0;
        
        // Check transcript
        if (meeting.transcript.toLowerCase().includes(queryLower)) {
            relevanceScore += 10;
        }
        
        // Check keywords
        for (const keyword of meeting.keywords) {
            if (queryLower.includes(keyword) || keyword.includes(queryLower)) {
                relevanceScore += 5;
            }
        }
        
        // Check extracted tasks
        for (const task of meeting.extractedTasks || []) {
            if (task.title.toLowerCase().includes(queryLower)) {
                relevanceScore += 8;
            }
            if (task.description && task.description.toLowerCase().includes(queryLower)) {
                relevanceScore += 5;
            }
        }
        
        if (relevanceScore > 0) {
            results.push({
                meeting: {
                    id: meeting.id,
                    title: meeting.title,
                    date: meeting.date,
                    transcriptPreview: meeting.transcript.substring(0, 300)
                },
                relevanceScore: relevanceScore,
                matchedTasks: meeting.extractedTasks?.filter(t => 
                    t.title.toLowerCase().includes(queryLower) || 
                    (t.description && t.description.toLowerCase().includes(queryLower))
                ) || []
            });
        }
    }
    
    // Sort by relevance
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    return results;
}

// Update pattern memory across meetings
function updatePatterns(meeting) {
    // Track recurring topics
    if (meeting.insights && meeting.insights.topics) {
        for (const topic of meeting.insights.topics) {
            patternMemory[topic] = (patternMemory[topic] || 0) + 1;
        }
    }
    
    // Track recurring task types
    if (meeting.extractedTasks) {
        for (const task of meeting.extractedTasks) {
            const taskType = identifyTaskType(task.title);
            if (taskType) {
                patternMemory[`task_${taskType}`] = (patternMemory[`task_${taskType}`] || 0) + 1;
            }
        }
    }
}

// Identify task type from title
function identifyTaskType(title) {
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('design') || titleLower.includes('ui') || titleLower.includes('ux')) {
        return 'design';
    }
    if (titleLower.includes('bug') || titleLower.includes('fix') || titleLower.includes('debug')) {
        return 'bug_fix';
    }
    if (titleLower.includes('document') || titleLower.includes('doc') || titleLower.includes('write')) {
        return 'documentation';
    }
    if (titleLower.includes('api') || titleLower.includes('integration')) {
        return 'api';
    }
    if (titleLower.includes('report') || titleLower.includes('ppt') || titleLower.includes('presentation')) {
        return 'presentation';
    }
    if (titleLower.includes('review') || titleLower.includes('approve')) {
        return 'review';
    }
    if (titleLower.includes('meeting') || titleLower.includes('call')) {
        return 'meeting';
    }
    
    return null;
}

// Get cross-meeting insights for a new transcript
async function getCrossMeetingInsights(transcript, pastMeetings) {
    const newKeywords = extractKeywords(transcript);
    const insights = {
        similarPastMeetings: [],
        recurringTopics: [],
        similarTasks: [],
        warnings: [],
        suggestions: []
    };
    
    // Find similar past meetings
    for (const meeting of pastMeetings) {
        const commonKeywords = meeting.keywords.filter(k => newKeywords.includes(k));
        if (commonKeywords.length > 2) {
            insights.similarPastMeetings.push({
                id: meeting.id,
                title: meeting.title,
                date: meeting.date,
                commonKeywords: commonKeywords,
                similarityScore: commonKeywords.length / Math.max(newKeywords.length, meeting.keywords.length)
            });
        }
    }
    
    // Sort by similarity
    insights.similarPastMeetings.sort((a, b) => b.similarityScore - a.similarityScore);
    insights.similarPastMeetings = insights.similarPastMeetings.slice(0, 3);
    
    // Get recurring topics
    insights.recurringTopics = Object.entries(patternMemory)
        .filter(([key, count]) => count > 1 && !key.startsWith('task_'))
        .map(([topic, count]) => ({ topic, occurrences: count }))
        .sort((a, b) => b.occurrences - a.occurrences)
        .slice(0, 5);
    
    // Check for tasks that might be repeating
    const newTasks = await extractTasksFromTranscript(transcript);
    for (const newTask of newTasks) {
        for (const pastMeeting of pastMeetings) {
            if (pastMeeting.extractedTasks) {
                for (const pastTask of pastMeeting.extractedTasks) {
                    if (areSimilarTasks(newTask.title, pastTask.title)) {
                        insights.similarTasks.push({
                            currentTask: newTask.title,
                            pastTask: pastTask.title,
                            pastMeeting: pastMeeting.title,
                            pastDate: pastMeeting.date,
                            wasCompleted: pastTask.status === 'completed'
                        });
                        
                        if (!pastTask.status || pastTask.status !== 'completed') {
                            insights.warnings.push(`Task "${newTask.title}" was discussed in "${pastMeeting.title}" but never completed. Consider follow-up.`);
                        }
                        break;
                    }
                }
            }
        }
    }
    
    // Generate suggestions based on patterns
    const delayedTaskTypes = [];
    for (const [key, count] of Object.entries(patternMemory)) {
        if (key.startsWith('task_') && count > 2) {
            delayedTaskTypes.push(key.replace('task_', ''));
        }
    }
    
    if (delayedTaskTypes.length > 0) {
        insights.suggestions.push(`Based on past meetings, ${delayedTaskTypes.join(', ')} tasks often get delayed. Consider adding buffer time.`);
    }
    
    return insights;
}

// Extract tasks from transcript (simplified)
async function extractTasksFromTranscript(transcript) {
    // Simple extraction for insights generation
    const tasks = [];
    const sentences = transcript.split(/[.!?]+/);
    
    const taskKeywords = ['will', 'need to', 'has to', 'should', 'must', 'prepare', 'create', 'fix', 'build', 'design'];
    
    for (const sentence of sentences) {
        const sentenceLower = sentence.toLowerCase();
        let isTask = false;
        for (const keyword of taskKeywords) {
            if (sentenceLower.includes(keyword)) {
                isTask = true;
                break;
            }
        }
        
        if (isTask && sentence.length > 10) {
            tasks.push({
                title: sentence.trim().substring(0, 100),
                description: sentence.trim()
            });
        }
    }
    
    return tasks;
}

// Check if two tasks are similar
function areSimilarTasks(task1, task2) {
    const t1 = task1.toLowerCase();
    const t2 = task2.toLowerCase();
    
    const words1 = t1.split(' ');
    const words2 = t2.split(' ');
    
    let commonWords = 0;
    for (const word of words1) {
        if (word.length > 3 && words2.includes(word)) {
            commonWords++;
        }
    }
    
    const similarity = commonWords / Math.max(words1.length, words2.length);
    return similarity > 0.4;
}

// Get task completion patterns
function getCompletionPatterns() {
    const patterns = {
        byOwner: {},
        byTaskType: {},
        byDayOfWeek: {},
        overallCompletionRate: 0
    };
    
    let totalTasks = 0;
    let completedTasks = 0;
    
    for (const task of taskHistory) {
        totalTasks++;
        if (task.status === 'completed') {
            completedTasks++;
            
            // By owner
            patterns.byOwner[task.owner] = (patterns.byOwner[task.owner] || 0) + 1;
            
            // By task type
            const taskType = identifyTaskType(task.title);
            if (taskType) {
                patterns.byTaskType[taskType] = (patterns.byTaskType[taskType] || 0) + 1;
            }
            
            // By day of week
            const completionDay = new Date(task.completedAt || task.deadline).getDay();
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            patterns.byDayOfWeek[dayNames[completionDay]] = (patterns.byDayOfWeek[dayNames[completionDay]] || 0) + 1;
        }
    }
    
    patterns.overallCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    return patterns;
}

// Add task to history
function addTaskToHistory(task) {
    taskHistory.push(task);
}

module.exports = {
    saveToMemory,
    getMeetingHistory,
    searchPastMeetings,
    getCrossMeetingInsights,
    getCompletionPatterns,
    addTaskToHistory,
    extractKeywords
};
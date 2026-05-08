// backend/prediction.js - Deadline Prediction Module
// Predicts task deadlines based on task type, owner history, and past patterns

let taskHistory = [];
let predictionModel = {
    taskTypeAverages: {},
    ownerAverages: {},
    dayOfWeekPreference: {},
    overallAverage: 3 // days
};

// Initialize with some default averages
function initPredictionModel() {
    predictionModel.taskTypeAverages = {
        'design': 5,
        'bug_fix': 2,
        'documentation': 3,
        'api': 4,
        'presentation': 3,
        'review': 1,
        'meeting': 1,
        'default': 3
    };
    
    predictionModel.ownerAverages = {};
    predictionModel.dayOfWeekPreference = {
        'Monday': 0,
        'Tuesday': 0,
        'Wednesday': 0,
        'Thursday': 0,
        'Friday': 0,
        'Saturday': 0,
        'Sunday': 0
    };
    
    console.log('📊 Prediction model initialized');
}

// Identify task type from title/description
function identifyTaskType(task) {
    const text = `${task.title} ${task.description || ''}`.toLowerCase();
    
    if (text.includes('design') || text.includes('ui') || text.includes('ux') || text.includes('wireframe')) {
        return 'design';
    }
    if (text.includes('bug') || text.includes('fix') || text.includes('debug') || text.includes('issue')) {
        return 'bug_fix';
    }
    if (text.includes('document') || text.includes('doc') || text.includes('write') || text.includes('update readme')) {
        return 'documentation';
    }
    if (text.includes('api') || text.includes('integration') || text.includes('endpoint')) {
        return 'api';
    }
    if (text.includes('report') || text.includes('ppt') || text.includes('presentation') || text.includes('slide')) {
        return 'presentation';
    }
    if (text.includes('review') || text.includes('approve') || text.includes('check')) {
        return 'review';
    }
    if (text.includes('meeting') || text.includes('call') || text.includes('sync')) {
        return 'meeting';
    }
    
    return 'default';
}

// Get owner's average completion time
function getOwnerAverage(owner, taskType) {
    const ownerTasks = taskHistory.filter(t => t.owner === owner && t.status === 'completed');
    
    if (ownerTasks.length === 0) {
        return predictionModel.taskTypeAverages[taskType] || predictionModel.taskTypeAverages.default;
    }
    
    let totalDays = 0;
    let count = 0;
    
    for (const task of ownerTasks) {
        if (task.completedAt && task.createdAt) {
            const created = new Date(task.createdAt);
            const completed = new Date(task.completedAt);
            const daysTaken = Math.ceil((completed - created) / (1000 * 60 * 60 * 24));
            totalDays += daysTaken;
            count++;
        }
    }
    
    if (count > 0) {
        return totalDays / count;
    }
    
    return predictionModel.taskTypeAverages[taskType] || predictionModel.taskTypeAverages.default;
}

// Predict deadline for a task
async function predictDeadline(task, pastMeetings) {
    const taskType = identifyTaskType(task);
    const baseDays = predictionModel.taskTypeAverages[taskType] || predictionModel.taskTypeAverages.default;
    
    // Adjust based on owner history
    let ownerMultiplier = 1.0;
    if (task.owner) {
        const ownerAvg = getOwnerAverage(task.owner, taskType);
        if (ownerAvg > baseDays) {
            ownerMultiplier = ownerAvg / baseDays;
        }
    }
    
    // Adjust based on task complexity (word count)
    const descriptionLength = (task.description || task.title).length;
    let complexityMultiplier = 1.0;
    if (descriptionLength > 200) {
        complexityMultiplier = 1.5;
    } else if (descriptionLength > 100) {
        complexityMultiplier = 1.2;
    }
    
    // Check if similar task existed in past meetings
    let repeatMultiplier = 1.0;
    if (pastMeetings && pastMeetings.length > 0) {
        let repeatCount = 0;
        for (const meeting of pastMeetings) {
            if (meeting.extractedTasks) {
                for (const pastTask of meeting.extractedTasks) {
                    if (areTasksSimilar(task.title, pastTask.title)) {
                        repeatCount++;
                    }
                }
            }
        }
        if (repeatCount > 2) {
            repeatMultiplier = 1.3;
        } else if (repeatCount > 1) {
            repeatMultiplier = 1.15;
        }
    }
    
    // Calculate predicted days
    let predictedDays = Math.ceil(baseDays * ownerMultiplier * complexityMultiplier * repeatMultiplier);
    predictedDays = Math.min(predictedDays, 14); // Cap at 14 days
    predictedDays = Math.max(predictedDays, 1); // Minimum 1 day
    
    // Calculate deadline date
    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + predictedDays);
    
    // Calculate suggested date (optimistic)
    const suggestedDate = new Date();
    suggestedDate.setDate(suggestedDate.getDate() + Math.ceil(baseDays));
    
    // Calculate confidence score
    let confidence = 70; // Base confidence
    
    if (task.owner && taskHistory.filter(t => t.owner === task.owner).length > 5) {
        confidence += 15;
    }
    if (taskType !== 'default') {
        confidence += 10;
    }
    if (descriptionLength > 50) {
        confidence += 5;
    }
    confidence = Math.min(confidence, 95);
    
    // Generate insight message
    let insightMessage = '';
    if (ownerMultiplier > 1.2) {
        insightMessage = `⚠️ ${task.owner} typically takes ${Math.round(ownerMultiplier * baseDays)} days for similar tasks. Consider adding buffer.`;
    } else if (repeatMultiplier > 1.1) {
        insightMessage = `🔄 This task has been discussed in previous meetings. Estimated ${predictedDays} days.`;
    } else {
        insightMessage = `📊 Based on similar tasks, estimated ${predictedDays} days.`;
    }
    
    return {
        predictedDays: predictedDays,
        deadlineDate: deadlineDate.toISOString(),
        suggestedDate: suggestedDate.toISOString(),
        confidence: confidence,
        taskType: taskType,
        factors: {
            baseDays: baseDays,
            ownerMultiplier: ownerMultiplier,
            complexityMultiplier: complexityMultiplier,
            repeatMultiplier: repeatMultiplier
        },
        insight: insightMessage
    };
}

// Check if two tasks are similar
function areTasksSimilar(title1, title2) {
    const t1 = title1.toLowerCase();
    const t2 = title2.toLowerCase();
    
    const words1 = t1.split(' ');
    const words2 = t2.split(' ');
    
    let commonWords = 0;
    for (const word of words1) {
        if (word.length > 3 && words2.includes(word)) {
            commonWords++;
        }
    }
    
    return commonWords > 0;
}

// Update prediction model with completed task
async function updatePredictionModel(task) {
    if (task.status === 'completed' && task.completedAt) {
        taskHistory.push(task);
        
        const taskType = identifyTaskType(task);
        const created = new Date(task.createdAt);
        const completed = new Date(task.completedAt);
        const daysTaken = Math.ceil((completed - created) / (1000 * 60 * 60 * 24));
        
        // Update task type average
        const currentAvg = predictionModel.taskTypeAverages[taskType] || predictionModel.taskTypeAverages.default;
        const taskCount = taskHistory.filter(t => identifyTaskType(t) === taskType).length;
        const newAvg = (currentAvg * (taskCount - 1) + daysTaken) / taskCount;
        predictionModel.taskTypeAverages[taskType] = Math.round(newAvg * 10) / 10;
        
        // Update owner average
        if (task.owner) {
            const ownerTasks = taskHistory.filter(t => t.owner === task.owner && t.status === 'completed');
            let ownerTotal = 0;
            for (const t of ownerTasks) {
                const tCreated = new Date(t.createdAt);
                const tCompleted = new Date(t.completedAt);
                ownerTotal += Math.ceil((tCompleted - tCreated) / (1000 * 60 * 60 * 24));
            }
            predictionModel.ownerAverages[task.owner] = ownerTotal / ownerTasks.length;
        }
        
        console.log(`📊 Model updated: ${taskType} tasks now avg ${predictionModel.taskTypeAverages[taskType]} days`);
    }
}

// Get deadline recommendations for a project
async function getProjectDeadlines(projectTasks) {
    const recommendations = [];
    
    for (const task of projectTasks) {
        if (task.status !== 'completed') {
            const prediction = await predictDeadline(task, []);
            recommendations.push({
                taskId: task.id,
                title: task.title,
                currentDeadline: task.deadline,
                suggestedDeadline: prediction.deadlineDate,
                confidence: prediction.confidence,
                insight: prediction.insight
            });
        }
    }
    
    return recommendations;
}

// Analyze if a deadline is realistic
async function analyzeDeadlineRealism(task, proposedDeadline) {
    const prediction = await predictDeadline(task, []);
    const proposedDate = new Date(proposedDeadline);
    const predictedDate = new Date(prediction.deadlineDate);
    
    const daysDifference = Math.ceil((proposedDate - predictedDate) / (1000 * 60 * 60 * 24));
    
    let assessment = '';
    let isRealistic = true;
    
    if (daysDifference < -3) {
        assessment = `⚠️ This deadline is ${Math.abs(daysDifference)} days EARLIER than typical. High risk of delay.`;
        isRealistic = false;
    } else if (daysDifference < -1) {
        assessment = `⚠️ This deadline is slightly aggressive. Consider adding buffer.`;
        isRealistic = false;
    } else if (daysDifference > 3) {
        assessment = `✅ This deadline is generous. Low risk.`;
    } else {
        assessment = `✅ This deadline seems realistic based on past tasks.`;
    }
    
    return {
        isRealistic: isRealistic,
        assessment: assessment,
        suggestedDeadline: prediction.deadlineDate,
        predictedDays: prediction.predictedDays,
        confidence: prediction.confidence
    };
}

// Get task completion statistics
function getCompletionStats() {
    const stats = {
        totalTasks: taskHistory.length,
        completedTasks: taskHistory.filter(t => t.status === 'completed').length,
        averageCompletionTime: 0,
        byTaskType: {},
        byOwner: {}
    };
    
    let totalDays = 0;
    let completedCount = 0;
    
    for (const task of taskHistory) {
        if (task.status === 'completed' && task.completedAt) {
            const created = new Date(task.createdAt);
            const completed = new Date(task.completedAt);
            const daysTaken = Math.ceil((completed - created) / (1000 * 60 * 60 * 24));
            totalDays += daysTaken;
            completedCount++;
            
            const taskType = identifyTaskType(task);
            stats.byTaskType[taskType] = stats.byTaskType[taskType] || { count: 0, totalDays: 0 };
            stats.byTaskType[taskType].count++;
            stats.byTaskType[taskType].totalDays += daysTaken;
            
            if (task.owner) {
                stats.byOwner[task.owner] = stats.byOwner[task.owner] || { count: 0, totalDays: 0 };
                stats.byOwner[task.owner].count++;
                stats.byOwner[task.owner].totalDays += daysTaken;
            }
        }
    }
    
    stats.averageCompletionTime = completedCount > 0 ? totalDays / completedCount : 0;
    
    // Calculate averages by type
    for (const [type, data] of Object.entries(stats.byTaskType)) {
        stats.byTaskType[type].averageDays = data.totalDays / data.count;
    }
    
    for (const [owner, data] of Object.entries(stats.byOwner)) {
        stats.byOwner[owner].averageDays = data.totalDays / data.count;
    }
    
    return stats;
}

// Initialize model on load
initPredictionModel();

module.exports = {
    predictDeadline,
    updatePredictionModel,
    getProjectDeadlines,
    analyzeDeadlineRealism,
    getCompletionStats,
    identifyTaskType,
    addTaskToHistory: (task) => { taskHistory.push(task); }
};
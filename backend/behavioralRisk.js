// Add at the end of the file

// Real-time behavior tracking
let realTimeBehavior = {
    activeSpeakers: [],
    urgencyDetected: false,
    conflictDetected: false,
    sentiment: 'neutral',
    liveAlerts: []
};

// Analyze real-time transcript during meeting
function analyzeRealTimeBehavior(textChunk) {
    const lowerText = textChunk.toLowerCase();
    const alerts = [];
    
    // Detect urgency words
    const urgencyWords = ['urgent', 'asap', 'immediately', 'critical', 'emergency', 'high priority'];
    for (const word of urgencyWords) {
        if (lowerText.includes(word)) {
            alerts.push(`⚠️ URGENCY DETECTED: "${word}" - Task needs immediate attention`);
            realTimeBehavior.urgencyDetected = true;
            break;
        }
    }
    
    // Detect conflicts/delays
    const delayWords = ['delayed', 'behind', 'late', 'missed', 'not done', 'not completed'];
    for (const word of delayWords) {
        if (lowerText.includes(word)) {
            alerts.push(`🔴 CONFLICT DETECTED: Task delay mentioned - "${word}"`);
            realTimeBehavior.conflictDetected = true;
            break;
        }
    }
    
    // Detect sentiment
    const positiveWords = ['completed', 'done', 'finished', 'great', 'excellent', 'good progress'];
    const negativeWords = ['problem', 'issue', 'stuck', 'blocked', 'failed'];
    
    for (const word of positiveWords) {
        if (lowerText.includes(word)) {
            realTimeBehavior.sentiment = 'positive';
            break;
        }
    }
    for (const word of negativeWords) {
        if (lowerText.includes(word)) {
            realTimeBehavior.sentiment = 'negative';
            alerts.push(`📉 NEGATIVE SENTIMENT: "${word}" - Team morale indicator`);
            break;
        }
    }
    
    // Extract action commitments in real-time
    const commitmentPatterns = [
        /(\w+)\s+will\s+(.+?)(?:\.|$)/i,
        /(\w+)\s+needs to\s+(.+?)(?:\.|$)/i,
        /(\w+)\s+has to\s+(.+?)(?:\.|$)/i
    ];
    
    for (const pattern of commitmentPatterns) {
        const match = textChunk.match(pattern);
        if (match) {
            alerts.push(`🎯 REAL-TIME COMMITMENT: ${match[1]} committed to "${match[2].substring(0, 50)}"`);
        }
    }
    
    realTimeBehavior.liveAlerts = alerts;
    return { alerts, sentiment: realTimeBehavior.sentiment, urgency: realTimeBehavior.urgencyDetected };
}

// Get real-time behavior summary
function getRealTimeBehaviorSummary() {
    return {
        urgencyDetected: realTimeBehavior.urgencyDetected,
        conflictDetected: realTimeBehavior.conflictDetected,
        sentiment: realTimeBehavior.sentiment,
        activeAlerts: realTimeBehavior.liveAlerts,
        lastUpdated: new Date().toISOString()
    };
}
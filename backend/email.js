// backend/email.js - Shows preview URL properly
const nodemailer = require('nodemailer');

let transporter = null;
let testAccount = null;

async function initEmail() {
    try {
        testAccount = await nodemailer.createTestAccount();
        
        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
        });
        
        console.log('✅ Email service initialized');
        console.log(`📧 Test email account: ${testAccount.user}`);
        console.log(`🌐 Preview emails at: https://ethereal.email/login`);
        
        return true;
    } catch (error) {
        console.error('❌ Email init failed:', error.message);
        return false;
    }
}

async function sendTaskReminderEmail(task, baseUrl) {
    if (!transporter) {
        await initEmail();
    }
    
    const doneUrl = `${baseUrl}/api/task/done?id=${task.id}`;
    const delayUrl = `${baseUrl}/api/task/delay?id=${task.id}&days=2`;
    
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Task Reminder</title>
            <style>
                body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
                .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
                .header h1 { margin: 0; font-size: 24px; }
                .content { padding: 24px; }
                .task-box { background: #f8f9fa; padding: 16px; border-radius: 12px; margin: 16px 0; border-left: 4px solid #667eea; }
                .risk-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; color: white; background-color: ${task.riskScore > 70 ? '#dc2626' : (task.riskScore > 40 ? '#f59e0b' : '#22c55e')}; }
                .buttons { display: flex; gap: 12px; margin: 24px 0; }
                .btn-done { flex: 1; background: #22c55e; color: white; text-align: center; padding: 12px; text-decoration: none; border-radius: 8px; font-weight: bold; }
                .btn-delay { flex: 1; background: #f59e0b; color: white; text-align: center; padding: 12px; text-decoration: none; border-radius: 8px; font-weight: bold; }
                .footer { background: #f8f9fa; padding: 16px; text-align: center; font-size: 12px; color: #6c757d; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📋 RiskIntel</h1>
                    <p>Task Reminder</p>
                </div>
                <div class="content">
                    <p>Hello <strong>${task.owner || 'Team Member'}</strong>,</p>
                    <p>You have a task that needs your attention:</p>
                    
                    <div class="task-box">
                        <div><strong>📌 Task:</strong> ${task.title}</div>
                        <div style="margin-top: 8px;"><strong>📅 Deadline:</strong> ${new Date(task.deadline).toDateString()}</div>
                        <div style="margin-top: 8px;"><strong>⚠️ Risk:</strong> <span class="risk-badge">${task.riskScore || 0}%</span></div>
                    </div>
                    
                    <div class="buttons">
                        <a href="${doneUrl}" class="btn-done">✅ Mark as Done</a>
                        <a href="${delayUrl}" class="btn-delay">⏳ Delay 2 Days</a>
                    </div>
                    
                    <p style="font-size: 13px; color: #6c757d; text-align: center;">Click a button above to update your task status instantly.</p>
                </div>
                <div class="footer">
                    <p>This is an automated reminder from RiskIntel</p>
                    <p>Task created from meeting: ${task.sourceMeetingTitle || 'Manual Entry'}</p>
                </div>
            </div>
        </body>
        </html>
    `;
    
    const info = await transporter.sendMail({
        from: `"RiskIntel" <${testAccount.user}>`,
        to: task.ownerEmail || 'test@example.com',
        subject: `📋 Task Reminder: ${task.title.substring(0, 50)}`,
        html: html
    });
    
    const previewUrl = nodemailer.getTestMessageUrl(info);
    
    // Print to terminal
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📧 EMAIL SENT!`);
    console.log(`${'='.repeat(60)}`);
    console.log(`📤 To: ${task.ownerEmail || 'test@example.com'}`);
    console.log(`📋 Subject: Task Reminder: ${task.title.substring(0, 40)}`);
    console.log(`🔗 PREVIEW URL: ${previewUrl}`);
    console.log(`💡 Click the URL above to see the email in your browser`);
    console.log(`${'='.repeat(60)}\n`);
    
    return previewUrl;
}

module.exports = { initEmail, sendTaskReminderEmail };
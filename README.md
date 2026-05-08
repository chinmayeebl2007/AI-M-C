 The Problem

Meetings produce dozens of action items. But most tools stop at transcription and task lists. No follow‑up. No tracking of who actually completes work. Same people delay tasks repeatedly. Decisions get made but never executed. Teams waste *30% of meeting time* re‑discussing things that were already decided but never done.

Existing tools like Otter.ai, Fireflies.ai, or Asana either:

- Only transcribe (never follow up)
- Only manage tasks manually (no prediction)
- Send generic email reminders that require logging into their app
- Treat every user the same (no reliability tracking)

*Result:* Tasks fall through cracks. No accountability. No learning from past failures.

---

## ✅ The Solution – AI Meeting Companion

An *Execution Intelligence System* that processes meetings, extracts tasks and decisions, predicts which tasks will fail before they start, tracks every team member’s reliability over time, learns from every outcome, and closes the loop with one‑click email actions.

### Why It’s Different

| What others do | What this system does |
|----------------|------------------------|
| Transcribe and stop | Sends email with *“Done”/“Delay” buttons* – one click updates task, no app needed |
| Show “high risk” with no explanation | Shows *exact breakdown*: owner history + weak language + task type + deadline day |
| Treat everyone the same | Tracks *per‑user reliability* (Sarah 92%, Marcus 38% – updates after every task) |
| Static rules | *Learns from every outcome* – 87% accuracy, gets smarter over time |
| Force you into their app | *Email becomes the interface* – you stay in your inbox |

---

## ✨ Key Features (12)

1. *5 ways to input meetings* – paste transcript, record live audio, record live video+audio, upload file, manual entry, plus direct *Zoom / Google Meet import*.
2. *AI task extraction* – automatically pulls title, owner, deadline, priority.
3. *Provable risk prediction* – shows exact mathematical breakdown (owner history + weak language + task type + deadline day).
4. *Team reliability tracking* – every member has a dynamic reliability score that updates after each task.
5. *Decision tracker* – links decisions to tasks, flags topics discussed 3+ times without resolution.
6. *Learning engine* – improves with every task; shows model accuracy and confidence.
7. *Email reminders with one‑click actions* – “Done” and “Delay” buttons work directly from the email.
8. *Smart actions panel* – one‑click reassign high‑risk tasks, add co‑owners to API tasks.
9. *Cross‑meeting memory* – remembers past meetings, detects recurring topics.
10. *Live meeting capture* – real‑time speech transcription (audio + video) with alerts for urgency/weak commitment.
11. *Zoom / Google Meet integration* – import meetings directly from your calendar or cloud recordings.
12. *Visual dashboards* – main dashboard, team intelligence, task details, decisions, settings, help center.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|--------------|
| *Frontend* | HTML5, Tailwind CSS, Chart.js, WebRTC (live video), Web Speech API (live transcription) |
| *Backend* | Node.js, Express.js, REST APIs, WebSocket (live transcript streaming) |
| *Database* | In‑memory (Firebase‑ready), localStorage (team management) |
| *AI / NLP* | Pattern‑based extraction + optional OpenAI GPT / Gemini API, risk prediction logic, sentiment analysis |
| *Audio / Transcription* | Whisper API / Deepgram API (optional), Web Speech API (browser‑based) |
| *Integrations* | Zoom API, Google Meet / Google Calendar API, OAuth 2.0 |
| *Email* | Nodemailer with Ethereal (fake SMTP) – can switch to Gmail |
| *Deployment* | Vercel / Netlify (Frontend), Render / Railway (Backend) |

---

## 🚀 Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/ai-meeting-companion.git
cd ai-meeting-companion
2. Backend Setup
cd backend
npm install
3. Start the backend server
node server.js
You should see:
Server running on http://localhost:3000
4. Frontend Setup
No build step required – it’s plain HTML/CSS/JS.
Open the frontend folder in VS Code and use Live Server (recommended) or simply double‑click index.html.

If using Live Server, the frontend will be available at http://127.0.0.1:5500.
Usage Instructions
Adding a Meeting
Open the app and click “New Meeting” in the sidebar.

Choose one of the input methods:

Paste Transcript – copy‑paste meeting notes.

Record Live – speak into your microphone (audio only).

Upload File – upload an MP3/WAV/M4A recording.

Manual Entry – create a task manually.

Live Capture – record audio+video with real‑time transcript.

Zoom / Google Meet – connect your account and import meetings.

Click “Process Meeting” (for transcripts, record, upload, or live capture). Tasks will appear within seconds.

Understanding Risk Scores
High (red) – >70% failure likelihood.

Medium (yellow) – 40–70%.

Low (green) – <40%.

Click any task to see the exact risk breakdown:

Owner reliability (points)

Weak language detected (“probably”, “maybe”, “try”)

Task type multiplier (API tasks delayed 2.3x)

Deadline day risk (Friday 40% failure)

Taking Action
Reassign high‑risk tasks – one click moves all high‑risk tasks to the most reliable team member (e.g., Sarah Kim, 92%).

Send email reminder – the task owner receives an HTML email with ✅ Done and ⏳ Delay buttons. One click updates the task without opening the app.

Add co‑owners to API tasks – automatically suggests a reliable co‑owner in the task description.

Monitoring Team Performance
Open “Team Intelligence” to see reliability scores for every member, common delay patterns, and risk distribution charts.

Use “Team Management” to add, edit, or remove team members.

Live Capture (Real‑time Transcription)
Click “Live Capture” in the sidebar, then “Start Live Capture”.

Speak naturally – your words appear in a terminal‑style window.

The system detects urgency (“urgent”, “asap”) or weak commitment (“probably”, “maybe”) and shows alerts.

Click “Stop”, then “Process Captured Meeting” – the transcript is automatically sent for task extraction.

Email Reminders
Emails are sent using Ethereal (fake SMTP) by default. When you click “Send Email”, a preview URL appears in the backend terminal. Click it to see the email and test the Done/Delay buttons.

To use real Gmail, configure your .env with a valid Gmail address and an App Password (2‑step verification required).
Demo Transcript
Copy and paste the following into the Paste Transcript tab to test:

Product Sprint Review – May 8, 2026

Rahul said he will probably try to finish the API integration by Friday.
Priya needs to complete the user documentation. She said hopefully by tomorrow.
Sarah guaranteed the dashboard redesign will be done by Monday.
Marcus might look at the login bug fix this week.
We decided to move the database migration to the next sprint.
We agreed to use React for the frontend framework.
The API error logging task has been discussed in 3 meetings but never started.
Alex needs to complete the code review. He has delayed 4 similar tasks.
Samantha will deliver the wireframe designs for the medical website by Wednesday.
Jordan needs to deploy the staging environment by Saturday afternoon.
Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.


Acknowledgements
OpenAI Whisper & GPT (optional integration)

Ethereal.email for email testing

Tailwind CSS for rapid UI development
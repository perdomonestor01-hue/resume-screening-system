# Resume Screening System for Manufacturing & Labor

An AI-powered resume screening and comparison system designed for **manufacturing, production, and skilled trades** positions. Automatically processes resumes via **web upload** or **email submission**, compares them against job descriptions using **Claude AI**, and sends email notifications for high-match candidates.

**Perfect for screening:**
- CNC Machine Operators
- General Labor & Assemblers
- Forklift Operators
- MIG/TIG Welders
- Industrial Maintenance Mechanics
- Machine Operators
- Production Workers

## 🌟 Features

- **Dual Input Methods**
  - 📤 Web-based drag-and-drop resume upload
  - 📧 Automatic email monitoring (recruiting@yourcompany.com)

- **AI-Powered Analysis**
  - 🤖 Claude AI comparison of resumes vs job descriptions
  - 📊 Match scoring (0-100%)
  - ✅ Detailed analysis of strengths, gaps, and recommendations

- **Automated Notifications**
  - 📬 Email alerts for high-match candidates (configurable threshold)
  - 🎯 Customizable notification templates

- **Resume Parsing**
  - 📄 Supports PDF, DOCX, DOC, and TXT files
  - 🔍 Automatic extraction of name, email, phone

- **Job Management**
  - 💼 Create and manage multiple job descriptions
  - ⏸️ Activate/deactivate jobs
  - 📝 Detailed job requirements and skill specifications

- **Dashboard & Analytics**
  - 📈 View all candidates with match scores
  - 🔎 Search and filter candidates
  - 📋 Detailed candidate profiles and comparisons

## 🛠️ Tech Stack

- **Backend**: Node.js + Express
- **Database**: SQLite (easily migrated to PostgreSQL)
- **AI**: Anthropic Claude API
- **File Processing**: pdf-parse, mammoth (DOCX)
- **Email**: nodemailer, node-imap, mailparser
- **Frontend**: HTML5, CSS3, Vanilla JavaScript

## 📋 Prerequisites

- Node.js (v14 or higher)
- Claude API key from [Anthropic](https://www.anthropic.com)
- Email account with IMAP access (Gmail, Outlook, etc.)
- SMTP credentials for sending notifications

## 🚀 Quick Start

### 1. Clone or Navigate to Project

```bash
cd resume-screening-system
```

### 2. Install Dependencies

Dependencies are already installed, but if needed:

```bash
npm install
```

### 3. Configure Environment Variables

Copy the template and configure your settings:

```bash
cp .env.template .env
```

Edit `.env` with your credentials:

```env
# Claude AI API
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Email Monitoring (receiving resumes)
EMAIL_HOST=imap.gmail.com
EMAIL_USER=recruiting@yourcompany.com
EMAIL_PASSWORD=your_app_password

# Email Notifications (sending alerts)
SMTP_HOST=smtp.gmail.com
SMTP_USER=notifications@yourcompany.com
SMTP_PASSWORD=your_smtp_password
NOTIFICATION_TO=hr@yourcompany.com

# Match threshold for notifications (70% = only notify for 70%+ matches)
NOTIFICATION_THRESHOLD=70
```

### 4. Initialize Database

```bash
npm run init-db
```

This creates the SQLite database and adds a sample job description.

### 5. Start the Server

```bash
npm start
```

The application will be available at **http://localhost:3000**

## 📧 Email Setup Guide

### For Gmail Users

1. **Enable 2-Factor Authentication** on your Google account
2. **Create an App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Copy the 16-character password
   - Use this in `.env` as `EMAIL_PASSWORD` and `SMTP_PASSWORD`

3. **Configure .env**:
```env
EMAIL_HOST=imap.gmail.com
EMAIL_PORT=993
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your_16_char_app_password

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your_16_char_app_password
```

### For Other Email Providers

**Outlook/Office 365:**
```env
EMAIL_HOST=outlook.office365.com
SMTP_HOST=smtp.office365.com
```

**Yahoo:**
```env
EMAIL_HOST=imap.mail.yahoo.com
SMTP_HOST=smtp.mail.yahoo.com
```

## 📖 Usage Guide

### Web Upload

1. Go to **http://localhost:3000**
2. Drag and drop a resume or click to browse
3. System automatically:
   - Parses the resume
   - Compares against all active jobs
   - Displays match scores and analysis
   - Sends email notification if score ≥ threshold

### Email Submission

Candidates can email their resume to your configured email address:
- Subject: Anything (e.g., "Application for Software Engineer")
- Attachment: Resume (PDF, DOCX, DOC, or TXT)

The system automatically:
- Detects new emails every 60 seconds (configurable)
- Extracts resume from attachment
- Processes and compares against all active jobs
- Sends notification for high matches
- Logs all activity

### Managing Jobs

1. Go to **http://localhost:3000/jobs.html**
2. Click "**+ Add New Job**"
3. Fill in:
   - Job Title (required)
   - Description (required)
   - Experience Level
   - Education Requirements
   - Required Skills
   - Preferred Skills
4. Click "**Save Job**"

Jobs can be:
- ✏️ **Edited**: Click edit icon
- ⏸️ **Deactivated**: Pause comparisons without deleting
- 🗑️ **Deleted**: Permanently remove

### Viewing Candidates

1. Go to **http://localhost:3000/dashboard.html**
2. See all candidates with:
   - Best match score
   - Source (email or web)
   - Application date
3. Click any candidate for detailed analysis:
   - Contact information
   - Resume preview
   - Comparison results for all jobs
   - Strengths, gaps, and recommendations

### Dashboard Features

- **Search**: Find candidates by name or email
- **Sort**: By match score or date
- **Stats**: Total candidates, high matches, active jobs, average score

## 🎯 Match Score Interpretation

| Score | Level | Recommendation |
|-------|-------|----------------|
| 90-100% | Exceptional ⭐⭐⭐⭐⭐ | Highly recommended - Priority interview |
| 75-89% | Strong ⭐⭐⭐⭐ | Recommended - Schedule interview |
| 60-74% | Good ⭐⭐⭐ | Consider for interview |
| 40-59% | Moderate ⭐⭐ | May lack key qualifications |
| 0-39% | Poor ⭐ | Not recommended |

## 🔧 Configuration Options

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `ANTHROPIC_API_KEY` | - | Claude AI API key (required) |
| `EMAIL_CHECK_INTERVAL` | 60000 | Email check interval (ms) |
| `NOTIFICATION_THRESHOLD` | 70 | Minimum score for notifications |
| `MAX_FILE_SIZE` | 10485760 | Max upload size (10MB) |
| `ALLOWED_EXTENSIONS` | .pdf,.docx,.doc,.txt | Allowed file types |

### Customizing Email Notifications

Edit `services/notifier.js` to customize:
- Email template HTML
- Notification content
- Sender name
- Subject line format

### Adjusting AI Analysis

Edit `services/aiComparison.js` to customize:
- Scoring criteria
- Analysis depth
- Prompt instructions
- Model parameters

## 🗄️ Database Schema

### Tables

**jobs** - Job descriptions
- id, title, description, required_skills, preferred_skills
- experience_level, education_requirements, status
- created_at, updated_at

**candidates** - Submitted resumes
- id, name, email, phone, resume_text, resume_filename
- source (email/web_upload), created_at

**comparisons** - AI analysis results
- id, candidate_id, job_id, match_score
- strengths, gaps, recommendations, detailed_analysis
- notified, created_at

**email_logs** - Email processing history
- id, email_subject, email_from, processed
- candidate_id, error, created_at

## 🐛 Troubleshooting

### Email Monitoring Not Working

1. Check `.env` credentials are correct
2. Verify IMAP is enabled on your email account
3. For Gmail: Ensure App Password is used (not regular password)
4. Check console logs for connection errors
5. Test with `EMAIL_CHECK_INTERVAL=10000` (10 seconds) for faster debugging

### Resume Parsing Errors

- Ensure file is valid PDF/DOCX/TXT
- Check file size < 10MB
- Some PDFs may be images - OCR not supported
- Try converting DOCX to PDF if parsing fails

### AI Comparison Errors

- Verify `ANTHROPIC_API_KEY` is valid
- Check API usage limits
- Ensure resume text was extracted successfully
- Review logs for specific error messages

### Email Notifications Not Sending

- Verify SMTP credentials in `.env`
- Check `NOTIFICATION_THRESHOLD` isn't set too high
- Ensure match score meets threshold
- Review email logs in database

## 📁 Project Structure

```
resume-screening-system/
├── server.js                 # Main Express server
├── package.json              # Dependencies
├── .env                      # Configuration (create from .env.template)
├── database.db               # SQLite database
├── uploads/                  # Temporary file storage
├── scripts/
│   └── initDatabase.js       # Database initialization
├── services/
│   ├── resumeParser.js       # PDF/DOCX/TXT parsing
│   ├── aiComparison.js       # Claude AI integration
│   ├── emailMonitor.js       # IMAP email monitoring
│   └── notifier.js           # Email notifications
└── public/
    ├── index.html            # Upload page
    ├── dashboard.html        # Candidate dashboard
    ├── jobs.html             # Job management
    └── styles.css            # Styling
```

## 🚀 Deployment

### Local Development

Already set up! Just run:
```bash
npm start
```

### Production Deployment

#### Railway.app (Recommended)

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login and deploy:
```bash
railway login
railway init
railway up
```

3. Add environment variables in Railway dashboard

#### VPS/Server

1. Install Node.js on server
2. Clone repository
3. Configure `.env`
4. Use PM2 for process management:
```bash
npm install -g pm2
pm2 start server.js --name resume-screening
pm2 save
```

## 🔒 Security Notes

- Never commit `.env` to version control
- Use strong, unique passwords for email accounts
- Regularly rotate API keys
- Consider adding authentication for production use
- Review email logs regularly for suspicious activity

## 📝 Sample Job Descriptions

Six sample manufacturing jobs are pre-loaded:

1. **CNC Machine Operator** - 1st shift, blueprint reading, precision measurement
2. **General Production Assembler** - Entry level, on-the-job training provided
3. **Machine Operator - 2nd Shift** - Production line, quality monitoring
4. **Forklift Operator** - Warehouse/production floor material handling
5. **MIG Welder** - Structural steel fabrication, AWS certification preferred
6. **Industrial Maintenance Mechanic** - Equipment troubleshooting, rotating shifts

To test:

1. Start the server
2. Upload any sample resume (CNC operator, welder, forklift operator, etc.)
3. View match results immediately across all jobs!

## 🎓 Best Practices

1. **Job Descriptions**: Be specific about required vs preferred skills
2. **Notifications**: Set threshold at 70-75% to avoid alert fatigue
3. **Email Monitoring**: Use a dedicated recruiting@ email address
4. **Regular Cleanup**: Archive old candidates periodically
5. **Database Backup**: Backup `database.db` regularly

## 🆘 Support

For issues or questions:
1. Check troubleshooting section above
2. Review console logs for error messages
3. Verify all environment variables are set correctly
4. Check that services are initialized properly

## 📄 License

MIT License - Free to use and modify

## 🎉 Credits

Built with:
- [Claude AI](https://www.anthropic.com) - AI-powered resume analysis
- [Express](https://expressjs.com) - Web framework
- [SQLite](https://www.sqlite.org) - Database
- [Multer](https://github.com/expressjs/multer) - File uploads
- [pdf-parse](https://www.npmjs.com/package/pdf-parse) - PDF parsing
- [mammoth](https://www.npmjs.com/package/mammoth) - DOCX parsing
- [nodemailer](https://nodemailer.com) - Email sending
- [node-imap](https://github.com/mscdex/node-imap) - Email monitoring

---

**Built for efficient, AI-powered candidate screening** 🚀

For more information about Claude AI capabilities, visit [docs.anthropic.com](https://docs.anthropic.com)

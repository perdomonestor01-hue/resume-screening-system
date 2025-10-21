# Quick Start Guide

Get your Resume Screening System running in 5 minutes!

## ⚡ Minimal Setup (Test Locally)

### Step 1: Get Claude API Key

1. Visit https://console.anthropic.com/
2. Sign up or log in
3. Go to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-ant-`)

### Step 2: Configure .env

Open `.env` and add your Claude API key:

```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

**That's it for minimal setup!** Email features are optional.

### Step 3: Start the Server

```bash
npm start
```

You should see:

```
╔════════════════════════════════════════════╗
║  Resume Screening System                  ║
╚════════════════════════════════════════════╝

🚀 Server running on http://localhost:3000

📱 Available pages:
   - Upload: http://localhost:3000
   - Dashboard: http://localhost:3000/dashboard.html
   - Jobs: http://localhost:3000/jobs.html

✓ Database connected
✓ All services initialized
⚠️  Email monitoring disabled - configuration not complete
⚠️  Email notifications disabled - configuration not complete
```

### Step 4: Test It!

1. **Open browser**: http://localhost:3000
2. **Upload a resume**: Drag & drop any PDF/DOCX resume
3. **See results**: Instant AI analysis and match score!
4. **View dashboard**: http://localhost:3000/dashboard.html
5. **Manage jobs**: http://localhost:3000/jobs.html

## 📧 Optional: Enable Email Features

### For Gmail (Easiest)

1. **Enable 2-Factor Authentication**:
   - https://myaccount.google.com/security

2. **Create App Password**:
   - https://myaccount.google.com/apppasswords
   - Select "Mail" → "Other (Custom)"
   - Copy the 16-character password

3. **Update .env**:

```env
# Email Monitoring (receive resumes)
EMAIL_HOST=imap.gmail.com
EMAIL_PORT=993
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx

# Email Notifications (send alerts)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx
NOTIFICATION_FROM=your-email@gmail.com
NOTIFICATION_TO=your-email@gmail.com
```

4. **Restart server**:
```bash
npm start
```

You should now see:
```
✓ Email notification service initialized
✓ Connected to email server
✓ Email monitoring service started
  Monitoring: your-email@gmail.com
  Check interval: 60s
```

5. **Test Email Submission**:
   - Send an email to your configured address
   - Attach a resume (PDF/DOCX)
   - Wait up to 60 seconds
   - Check dashboard for new candidate!

## 🎯 Testing Tips

### Sample Resumes

The system includes sample resumes for different manufacturing roles:

- **`sample-resume-cnc-operator.txt`** - CNC Machine Operator with 3 years experience
- **`sample-resume-assembler.txt`** - Production Assembler with 2 years experience
- **`sample-resume-forklift-operator.txt`** - Forklift Operator with 4 years experience
- **`sample-resume-welder.txt`** - MIG Welder with 5 years experience
- **`sample-resume-mechanic.txt`** - Industrial Maintenance Mechanic with 7 years experience

Upload any of these and see how they match the pre-loaded manufacturing jobs!

### Expected Match Scores

**CNC Operator Resume** vs CNC Machine Operator job:
- **Expected Score**: 85-95% (Strong to Exceptional Match)
- **Strengths**: CNC experience, blueprint reading, Haas/Fanuc controllers, quality control
- **Gaps**: May need specific facility training

**Assembler Resume** vs General Production Assembler job:
- **Expected Score**: 80-90% (Strong Match)
- **Strengths**: Assembly experience, hand tools, quality inspection, excellent attendance
- **Gaps**: Entry-level, limited power tool experience

## 🔍 What to Check

After uploading a resume, you should see:

1. ✅ **Upload Success**
2. 📋 **Candidate Info** (Name, Email, Phone extracted)
3. 🎯 **Match Results** for each active job:
   - Match score percentage
   - Strengths (what matches well)
   - Gaps (what's missing)
   - Recommendations (hiring advice)

## 🐛 Common Issues

### "Failed to parse resume"
- Ensure file is valid PDF/DOCX/TXT
- Try converting DOCX → PDF
- Check file size < 10MB

### "Error in AI comparison"
- Verify `ANTHROPIC_API_KEY` is correct
- Check you have API credits
- Try again (rate limit may have hit)

### Email monitoring not working
- Verify Gmail App Password (not regular password)
- Check IMAP is enabled
- Test email credentials with another app

### No match results
- Ensure at least one job is "active"
- Go to Jobs page and check job status
- Add a new job if none exist

## 🎓 Next Steps

1. **Add Real Jobs**:
   - Go to http://localhost:3000/jobs.html
   - Delete or edit the sample job
   - Add your actual job descriptions

2. **Customize Notifications**:
   - Adjust `NOTIFICATION_THRESHOLD` in `.env`
   - Edit email template in `services/notifier.js`

3. **Test Email Submissions**:
   - Configure email monitoring
   - Send test resume to configured email
   - Check dashboard for automatic processing

4. **Review Analytics**:
   - Dashboard shows total candidates, high matches, etc.
   - Click candidates to see detailed analysis
   - Use search/filter to find specific candidates

## 📚 Full Documentation

See `README.md` for:
- Complete configuration options
- Email setup for different providers
- Deployment instructions
- Troubleshooting guide
- API documentation

## 🚀 You're Ready!

Your Resume Screening System is now running!

**Quick Links:**
- 📤 Upload: http://localhost:3000
- 📊 Dashboard: http://localhost:3000/dashboard.html
- 💼 Jobs: http://localhost:3000/jobs.html

Happy screening! 🎉

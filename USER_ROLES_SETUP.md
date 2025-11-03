# User Roles & Access Control Setup
**Custom Workforce Solutions LLC - Resume Screening System**

## ✅ Setup Complete!

Your resume screening system now has role-based access control with two user accounts configured.

---

## 👥 User Accounts

### 1. Admin Account (Full Access + Audit Trail)
- **Email:** `admin@customworkforcesolutionsllc.com`
- **Password:** `admin123`
- **Role:** `admin`
- **Access Level:** Full system access including audit trail history

**Capabilities:**
- ✅ Upload and view resumes
- ✅ Manage candidates
- ✅ Create, edit, and delete job descriptions
- ✅ **View complete audit trail history** 🔍
- ✅ Access all system statistics
- ✅ Full administrative control

---

### 2. Safety Coordinator Account (Standard Access)
- **Email:** `safety@customworkforcesolutionsllc.com`
- **Password:** `Safety2025!`
- **Role:** `recruiter`
- **Access Level:** Standard recruiting operations

**Capabilities:**
- ✅ Upload and view resumes
- ✅ Manage candidates
- ✅ Create, edit, and delete job descriptions
- ✅ Access dashboard and statistics
- ❌ **Cannot access audit trail** (admin only)

---

## 🔐 Security Features Implemented

### Backend Protection
- **Authentication Middleware:** All routes require login
- **Authorization Middleware:** Audit trail routes restricted to admin role only
- **Session Management:** Role stored in secure server-side session
- **API Endpoints Protected:**
  - `/api/audit-logs` - Admin only
  - `/api/audit-logs/stats` - Admin only
  - `/api/audit-logs/user/:userId` - Admin only
  - `/api/audit-logs/resource/:type/:id` - Admin only

### Frontend Protection
- **Dynamic Navigation:** Audit trail link only visible to admin users
- **Role-Based UI:** Navigation automatically adapts based on user role
- **Pages Updated:**
  - `index.html` (Upload page)
  - `dashboard.html` (Candidate dashboard)
  - `manage-jobs.html` (Jobs management)

---

## 🎯 How to Use

### Accessing the System

1. **Open your browser:** http://localhost:3000/login.html

2. **Login as Admin** (to see audit trail):
   ```
   Email: admin@customworkforcesolutionsllc.com
   Password: admin123
   ```
   → You will see the **"🔍 Audit Trail"** link in the navigation

3. **Login as Safety Coordinator** (standard access):
   ```
   Email: safety@customworkforcesolutionsllc.com
   Password: Safety2025!
   ```
   → The audit trail link will NOT appear in the navigation

### Testing the Setup

**Test 1: Admin Access**
1. Login as admin@customworkforcesolutionsllc.com
2. Look at the navigation bar - you should see "🔍 Audit Trail"
3. Click it to view complete system audit history
4. You should see all login attempts, changes, and system events

**Test 2: Safety Coordinator Access**
1. Logout (if logged in)
2. Login as safety@customworkforcesolutionsllc.com
3. Look at the navigation bar - the audit trail link should be hidden
4. Try to manually access http://localhost:3000/api/audit-logs
5. You should get a 403 Forbidden error (as expected)

---

## 📋 Audit Trail Features (Admin Only)

The audit trail system tracks:

- **User Authentication**
  - Login successes and failures
  - Logout events
  - IP addresses and user agents

- **Candidate Management**
  - Resume uploads (web and email)
  - Candidate profile views
  - AI comparison results

- **Job Management**
  - Job creation
  - Job updates (with before/after values)
  - Job deletions

- **System Events**
  - Timestamp of all actions
  - User who performed each action
  - Detailed change history

---

## 🔧 Technical Implementation

### Database Schema
```sql
-- Users table with role support
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  password_hash TEXT,
  role TEXT DEFAULT 'recruiter',  -- 'admin' or 'recruiter'
  created_at DATETIME,
  last_login DATETIME
);

-- Audit logs table
CREATE TABLE audit_logs (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  user_email TEXT,
  action_type TEXT,
  resource_type TEXT,
  resource_id INTEGER,
  details TEXT,
  before_value TEXT,
  after_value TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME
);
```

### Session Storage
When users login, their role is stored in the server-side session:
```javascript
req.session.userId = user.id;
req.session.userEmail = user.email;
req.session.userName = user.name;
req.session.userRole = user.role; // 'admin' or 'recruiter'
```

### Authorization Check
```javascript
function requireAdmin(req, res, next) {
  if (req.session &&
      req.session.userId &&
      req.session.userRole === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Admin access required' });
  }
}
```

---

## 📧 Email Configuration

Both accounts are configured in `.env`:

```env
# Email monitoring (receiving resumes)
EMAIL_USER=safety@customworkforcesolutionsllc.com

# Email notifications (sending alerts)
SMTP_USER=safety@customworkforcesolutionsllc.com
NOTIFICATION_FROM=safety@customworkforcesolutionsllc.com
NOTIFICATION_TO=safety@customworkforcesolutionsllc.com
```

**Note:** The safety coordinator email is used for automated resume processing and notifications. The admin account is for system administration and oversight.

---

## 🔒 Security Recommendations

1. **Change Default Passwords**
   - Update admin password from `admin123` to a strong password
   - Consider using a password manager

2. **Email Authentication**
   - Switch from regular passwords to App Passwords for Gmail
   - Enable 2-factor authentication on email accounts

3. **Regular Audits**
   - Admin should regularly review the audit trail
   - Monitor for suspicious login attempts
   - Check for unauthorized changes

4. **Password Policy**
   - Require strong passwords (8+ characters, mixed case, numbers, symbols)
   - Implement password expiration (every 90 days)
   - Prevent password reuse

5. **Production Deployment**
   - Use HTTPS in production
   - Set secure session cookies
   - Implement rate limiting on login attempts
   - Consider adding CAPTCHA to login form

---

## 🚀 Quick Commands

### Start the Server
```bash
cd resume-screening-system
npm start
```

### View Current Users
```bash
sqlite3 database.db "SELECT name, email, role FROM users;"
```

### Reset a User's Password
```bash
node scripts/setupUsers.js
```

### Check Audit Logs (via database)
```bash
sqlite3 database.db "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;"
```

---

## 📞 Support

If you encounter any issues:

1. **Check server logs** for error messages
2. **Verify database** users are created correctly
3. **Test authentication** using both accounts
4. **Review browser console** for client-side errors
5. **Check network tab** to see API responses

---

## 📊 System Architecture

```
┌─────────────────────────────────────────┐
│         Client Browser                  │
│  (Login → Get Role → Show/Hide Links)  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         Express Server                  │
│  ┌────────────────────────────────┐    │
│  │  Authentication Middleware     │    │
│  │  (Check Session)               │    │
│  └────────────────────────────────┘    │
│  ┌────────────────────────────────┐    │
│  │  Authorization Middleware      │    │
│  │  (Check Role for Admin Routes) │    │
│  └────────────────────────────────┘    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         SQLite Database                 │
│  ┌────────────────────────────────┐    │
│  │  users (with roles)            │    │
│  │  audit_logs (admin only)       │    │
│  │  candidates                    │    │
│  │  jobs                          │    │
│  └────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

---

## ✅ Verification Checklist

- [x] Admin user created with correct email
- [x] Safety coordinator user created with correct email
- [x] Backend routes protected with requireAdmin middleware
- [x] Frontend navigation shows audit link only for admin
- [x] Session stores user role
- [x] Audit trail accessible only to admin
- [x] API returns 403 when non-admin tries to access audit endpoints
- [x] All pages updated (index, dashboard, manage-jobs)
- [x] .env file documented with user credentials
- [x] Server starts successfully

---

**Setup completed:** October 28, 2025
**System:** Resume Screening System for Custom Workforce Solutions LLC
**Version:** 1.0

For questions or modifications, refer to the main README.md or contact the system administrator.

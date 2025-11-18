# 🚀 Quick Start - User Accounts

## Login to the System

**URL:** http://localhost:3000/login.html

---

## 👑 Admin Account
**Full Access + Audit Trail**

```
Email:    admin@customworkforcesolutionsllc.com
Password: admin123
```

✅ **Can access:**
- Upload resumes
- View all candidates
- Manage job descriptions
- **🔍 View complete audit trail** (unique to admin)
- See all system changes and history

---

## 👤 Safety Coordinator
**Standard Recruiting Access**

```
Email:    safety@customworkforcesolutionsllc.com
Password: Safety2025!
```

✅ **Can access:**
- Upload resumes
- View all candidates
- Manage job descriptions
- Dashboard and statistics

❌ **Cannot access:**
- Audit trail (admin only)

---

## 🔍 Key Difference

When you login as **admin**, you'll see a **"🔍 Audit Trail"** link in the navigation.

When you login as **safety coordinator**, this link is hidden and the audit endpoints return 403 Forbidden.

---

## 📋 Test It Now

1. Open: http://localhost:3000/login.html
2. Login as admin → See audit trail link ✅
3. Logout
4. Login as safety → No audit trail link ❌

---

**Server Status:** ✅ Running on http://localhost:3000

For complete documentation, see: `USER_ROLES_SETUP.md`

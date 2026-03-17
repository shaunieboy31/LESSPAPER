# 🔐 Security Audit Report — Less Paper System (LPS)

**Date:** February 24, 2026
**Audited By:** Antigravity AI Security Audit
**Scope:** Full-Stack Audit — Backend (Node.js/Express/Prisma) & Frontend (React)
**Application:** Less Paper System — DepEd Imus City Division Document Management System

---

> **Severity Scale:**
> - 🔴 **Critical** — Exploitable immediately, data breach risk
> - 🟠 **High** — Significant risk, exploitable with minor effort
> - 🟡 **Medium** — Moderate risk, requires some conditions
> - 🔵 **Low** — Minor risk, informational / best practice

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Vulnerabilities Catalogue](#vulnerabilities-catalogue)
3. [Attack Penetration Vectors Summary](#attack-penetration-vectors-summary)
4. [Mitigation Plan](#mitigation-plan)
5. [Strong Points of the System](#strong-points-of-the-system)
6. [System Weaknesses](#system-weaknesses)
7. [Comprehensive Plan of Action](#comprehensive-plan-of-action)
8. [Scorecard Summary](#scorecard-summary)
9. [Files Audited](#files-audited)

---

## Executive Summary

The **Less Paper System** is a government document management system used by the DepEd Imus City Division that handles sensitive personnel data, digital signatures, PKI certificates, facial recognition data, and official documents. The audit identified **23 distinct vulnerabilities** across authentication, file handling, authorization, data exposure, and infrastructure — ranging from **Critical to Low** severity.

### Key Risk Areas

| Risk | Severity |
|---|---|
| Real credentials committed to the repository (API keys, DB creds, JWT secrets) | 🔴 Critical |
| Path traversal vulnerability allowing file system access outside upload directory | 🔴 Critical |
| Unauthenticated endpoints exposing all users, documents, and signatures | 🔴 Critical |
| JWT implementation is partially broken (auth system bypass possible) | 🔴 Critical |
| Google OAuth client secret exposed in tracked file | 🟠 High |
| No rate limiting on login (brute-force attack surface wide open) | 🟠 High |
| Source maps enabled in production (full source code disclosure) | 🔴 Critical |

---

## Vulnerabilities Catalogue

---

### 🔴 CRITICAL-01 — Hardcoded Secrets Committed to Repository

**Location:** `backend/.env`, `frontend/credentials.json`

**Evidence:**
```env
# backend/.env
ACCESS_TOKEN_SECRET=eabe112eb69ee8b8006aeba180b7eb25281f3a877af9175a1ba51be1ad44bf57b80efa4a...
REFRESH_TOKEN_SECRET=c4f18d57808235d45f4681e81166817faec8a017f8dfb2f319a7b017906...
SECRET_KEY=1e3c77761ac69550031ea94af2382b781b6f14d5f55eb5c88e6375a849860227
DB_USER=root
DB_PASS=1234
```

```json
// frontend/credentials.json
"client_secret": "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"
```

**Risk:** Anyone with repository access (or if it is ever public) can:
- Forge valid JWTs for any user, including admin
- Access the production database directly
- Impersonate the Google OAuth application

**Attacks Applicable:** Credential Stuffing, JWT Forgery, OAuth Abuse, Database Takeover

---

### 🔴 CRITICAL-02 — Path Traversal via `displayDocumentAsBlob` and `eSignatures/delete`

**Location:** `backend/src/app/documents/documents-controller.js` (line 829), `backend/app.js` (line 124)

**Evidence:**
```js
// documents-controller.js:829
const filePath = path.join(__dirname, '..', '..', 'uploads', fileName);
// No sanitization of `fileName`

// app.js:124
const filePath = path.join(__dirname, 'src', imgFilePath);
fs.unlink(filePath, ...); // imgFilePath from req.query — NOT sanitized
```

**Attack Example:**
```
GET /documents/displayDocumentAsBlob?fileName=../../.env
DELETE /eSignatures/delete?imgFilePath=../../.env
```

This allows reading **any file on the server** or **deleting critical files**, including `.env`, SSL private keys, and database dumps.

**Attacks Applicable:** Path Traversal (CWE-22), Arbitrary File Read/Delete

---

### 🔴 CRITICAL-03 — JWT Verification Logic Bug in `verifyJWT.js`

**Location:** `backend/src/middlewares/verifyJWT.js` (line 10)

**Evidence:**
```js
// BUG: Uses && (AND) — should be || (OR)
if (!authHeader && !authHeader.startsWith('Bearer ')) {
```

Using `&&` (AND) instead of `||` (OR) means: if `authHeader` **is present but doesn't start with "Bearer"**, the guard **passes silently**. An attacker can send any non-empty `Authorization` header to bypass the null check.

**Attacks Applicable:** Authentication Bypass

---

### 🔴 CRITICAL-04 — Unauthenticated Critical Endpoints

**Location:** `backend/src/UserAuth/user-controller.js`

**Evidence:** The following endpoints have **zero** authentication middleware (`verifyToken` is never applied):

```
GET    /user/getAllUsers          → Returns ALL users including hashed passwords + face data
GET    /user/getUser/:uid         → Returns any user by ID
PUT    /user/update/:uid          → Update any user's data (including roles!)
PUT    /user/changePassword/:uid  → Change any user's password
PUT    /user/registerFaceData/:uid → Register facial recognition for any user
DELETE /user/delete/:uid          → Delete any user
POST   /user/register             → Register new users (admin action, unprotected)
```

**Risk:** Any unauthenticated person on the network can enumerate all accounts, change passwords, and promote themselves to admin without logging in.

**Attacks Applicable:** Broken Access Control (OWASP A01), Privilege Escalation, Account Takeover

---

### 🔴 CRITICAL-05 — `GENERATE_SOURCEMAP=true` in Production

**Location:** `frontend/.env` (line 14)

**Evidence:**
```env
GENERATE_SOURCEMAP=true
NODE_ENV = "production"
```

**Risk:** Attackers can download the full original React source code (all `.js.map` files) from the production server via browser DevTools. This exposes all business logic, API endpoint paths, role names, and token-handling code.

**Attacks Applicable:** Source Code Disclosure, Reconnaissance, API Endpoint Enumeration

---

### 🟠 HIGH-01 — No Brute-Force / Rate-Limit Protection on Login

**Location:** `backend/src/UserAuth/user-controller.js` (line 7)

**Evidence:** `express-rate-limit` is installed but **never applied** to the `/user/login` route. There is no account lockout mechanism.

```js
// No rate limiter on this route
usersRouter.post('/login', async (req, res) => { ... });
```

**Attacks Applicable:** Brute-Force Attack, Credential Stuffing, Password Spraying

---

### 🟠 HIGH-02 — Access Token and User Data Stored in `localStorage`

**Location:** `frontend/src/contexts/ContextProvider.js` (line 13)

**Evidence:**
```js
const storedAuth = localStorage.getItem('authInfo'); // Full user object in localStorage
const [auth, setAuth] = useState(JSON.parse(storedAuth) || null);
```

Storing the full user info and access tokens in `localStorage` makes them accessible to malicious scripts on the page.

**Attacks Applicable:** XSS (Cross-Site Scripting) → Token Theft, Session Hijacking

---

### 🟠 HIGH-03 — Helmet Security Headers Disabled

**Location:** `backend/app.js` (line 36)

**Evidence:**
```js
// app.use(helmet()); // Temporarily disabled for testing
```

`helmet` is installed but **commented out**. Without it, responses lack:
- `X-Frame-Options` (Clickjacking protection)
- `X-Content-Type-Options` (MIME sniffing protection)
- `Strict-Transport-Security` (HTTPS enforcement)
- `Referrer-Policy`
- `Permissions-Policy`

> **Note:** As of the audit date (Feb 24, 2026), the user has already **re-enabled Helmet** — this item is resolved. ✅

**Attacks Applicable:** Clickjacking, MIME Sniffing, Protocol Downgrade

---

### 🟠 HIGH-04 — Socket.IO CORS Wildcard `origin: "*"`

**Location:** `backend/app.js` (line 189)

**Evidence:**
```js
const io = new Server(server, {
  cors: { origin: '*' } // Any website can connect!
});
```

While HTTP CORS is restricted, WebSocket upgrades bypass the HTTP CORS config. Any malicious website can establish a WebSocket connection to the server and receive real-time document notifications.

**Attacks Applicable:** Cross-Site WebSocket Hijacking (CSWSH), Data Exfiltration

---

### 🟠 HIGH-05 — Insecure Password Generation (`Math.random`)

**Location:** `backend/src/UserAuth/user-service.js` (lines 82–91)

**Evidence:**
```js
const randomIndex = Math.floor(Math.random() * chars.length);
```

`Math.random()` is **not cryptographically secure**. An attacker who knows the approximate time a user account was created may be able to predict the initial generated password.

**Attacks Applicable:** Predictable Password Attack, Weak PRNG Exploitation

---

### 🟠 HIGH-06 — Admin Role Check via Client-Controlled Body Field

**Location:** `backend/src/UserAuth/user-service.js` (line 396)

**Evidence:**
```js
// The `editor` field comes directly from the request body
if (data.editor !== 'admin') {
  // verify old password
}
```

A user can send `{ "editor": "admin" }` in the request body to **skip the current-password verification** and change any user's password without knowing the old one.

**Attacks Applicable:** Privilege Escalation, Insecure Direct Object Reference (IDOR)

---

### 🟠 HIGH-07 — Database Backup Command Injection Risk

**Location:** `backend/cron/cronjobs.js` (lines 68–70)

**Evidence:**
```js
dumpCmd = `mysqldump -u ${DB_USER} -p${DB_PASS} ${DB_NAME} ${table} > "${outFile}"`;
exec(dumpCmd, ...);
```

If `DB_USER`, `DB_PASS`, or `DB_NAME` contain shell metacharacters (e.g., `; rm -rf /`), OS command injection is possible.

**Attacks Applicable:** OS Command Injection (CWE-78)

---

### 🟠 HIGH-08 — Unrestricted File Upload via Extension-Only Check

**Location:** `backend/src/middlewares/multer-png.js` (lines 35–48)

**Evidence:**
```js
const ext = path.extname(file.originalname).toLowerCase();
// Only checks file extension — NOT actual file content (magic bytes)
```

Attackers can rename a malicious file to `.png` and upload it bypassing the filter.

**Attacks Applicable:** Malicious File Upload, Remote Code Execution

---

### 🟡 MEDIUM-01 — Error Messages Enable Username Enumeration

**Location:** `backend/src/UserAuth/user-service.js` (lines 99, 113)

**Evidence:**
```js
throw new Error('Username not found');  // → 404
throw new Error('Invalid password');    // → 401
```

Different error codes for "user not found" vs. "wrong password" allow attackers to enumerate valid usernames.

**Attacks Applicable:** Username/Account Enumeration, Targeted Brute-Force

---

### 🟡 MEDIUM-02 — Refresh Token Stored in Database in Plaintext

**Location:** `backend/prisma/schema.prisma` (line 116)

**Evidence:**
```prisma
refreshToken  String?  // stored in DB as plaintext
```

If the database is compromised, all refresh tokens are exposed, enabling permanent session hijacking.

**Attacks Applicable:** Database Dump → Session Hijack

---

### 🟡 MEDIUM-03 — Open CORS for `!origin` (Curl / Server-to-Server Requests)

**Location:** `backend/src/middlewares/corsConfig/corsOptions.js` (line 5)

**Evidence:**
```js
if (allowedOrigins.includes(origin) || !origin) {
  callback(null, true); // Tools like curl, Postman, server-to-server: ALL allowed
}
```

All requests with **no `Origin` header** (API tools, scripts, server-side requests) are allowed, defeating the purpose of CORS for API protection.

---

### 🟡 MEDIUM-04 — Google OAuth Client Secret in Frontend Repository

**Location:** `frontend/credentials.json`

**Evidence:**
```json
"client_secret": "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"
```

This file is **not in `.gitignore`** and contains a live Google OAuth client secret that should **only ever exist server-side**.

**Attacks Applicable:** OAuth Token Forgery, Google API Abuse

---

### 🟡 MEDIUM-05 — Sensitive Data Returned Without Field Exclusion

**Location:** `backend/src/UserAuth/user-service.js` `getAllUsers()` (line 548)

The `getAllUsers()` function returns all fields including `password`, `refreshToken`, `fingerprintData`, `faceData`, and `signPath` for every user — across a completely unauthenticated endpoint.

---

### 🟡 MEDIUM-06 — `alert()` Used for Real-Time Document Notifications (XSS Vector)

**Location:** `frontend/src/App.js` (line 247)

**Evidence:**
```js
socket.on('documentNotif', data => {
  alert(data?.message); // Unsanitized WebSocket data displayed to user
});
```

If an attacker injects data into Socket.IO events (via the wildcard CORS), they could trigger misleading or phishing `alert()` dialogs.

---

### 🟡 MEDIUM-07 — Weak Database Credentials

**Location:** `backend/.env`

```env
DB_USER=root
DB_PASS=1234
```

Using the root MySQL user with a trivially weak password maximizes database blast radius on breach.

---

### 🔵 LOW-01 — Internal IP Addresses Hard-Coded in Source

**Location:** `backend/src/middlewares/corsConfig/allowedOrigins.js`, `frontend/deploy.sh`

```js
'http://172.16.0.25:7000',
'http://172.16.0.25'
```

Internal network IPs are visible in source code, aiding internal network reconnaissance.

---

### 🔵 LOW-02 — `console.log` with Error / Auth Details in Production

Multiple controller files use `console.log(error)` and `console.log(body)` in login and update routes, which can expose passwords, tokens, or stack traces in logs.

---

### 🔵 LOW-03 — No `HttpOnly` Cookie for Access Token

The refresh token uses cookies but the access token is stored in React state and `localStorage`. No secure `HttpOnly` cookie path exists for access tokens.

---

### 🔵 LOW-04 — Production `.env` Has Invalid Comment Syntax

**Location:** `frontend/.env` (line 13)

```env
---- PRODUCTION ------    ← Not a valid comment; parsed as broken key-value pair
```

---

## Attack Penetration Vectors Summary

| Attack Vector | Method | Target | Severity |
|---|---|---|---|
| JWT Forgery | Stolen `ACCESS_TOKEN_SECRET` from repo | All protected routes | 🔴 Critical |
| Path Traversal | `?fileName=../../.env` | `/displayDocumentAsBlob`, `/eSignatures/delete` | 🔴 Critical |
| Auth Bypass | `&&` bug in verifyJWT | JWT middleware | 🔴 Critical |
| Unauthenticated API | Direct HTTP call (no token) | `/user/getAllUsers`, `/user/delete/:uid` | 🔴 Critical |
| Source Code Disclosure | Download `.js.map` files | Production frontend server | 🔴 Critical |
| Brute-Force Login | Automated tool (Hydra, Burp Intruder) | `POST /user/login` | 🟠 High |
| Privilege Escalation | `{ "editor": "admin" }` in body | `PUT /user/changePassword/:uid` | 🟠 High |
| CSWSH | WebSocket from any malicious site | Socket.IO server | 🟠 High |
| XSS → Token Theft | Malicious script + `localStorage` | Frontend | 🟠 High |
| Clickjacking | iframe embed (no `X-Frame-Options`) | All pages | 🟠 High |
| Malicious File Upload | Renamed `.exe` → `.png` | `/user/register`, `/user/update` | 🟠 High |
| Username Enumeration | Differential error responses | `POST /user/login` | 🟡 Medium |
| OAuth Abuse | Stolen Google `client_secret` | Google API | 🟡 Medium |
| Session Hijack | DB dump → plaintext refresh tokens | Database | 🟡 Medium |

---

## Mitigation Plan

### 🔴 IMMEDIATE ACTIONS (Within 24–48 Hours)

#### Fix 1 — Rotate All Secrets NOW

1. Regenerate JWT secrets:
   ```bash
   node -e "require('crypto').randomBytes(64).toString('hex')"
   ```
2. Revoke and regenerate the Google OAuth client secret at [console.cloud.google.com](https://console.cloud.google.com)
3. Change database passwords from `1234` to a strong credential
4. Remove `credentials.json` from the frontend repo and add to `.gitignore`
5. Purge git history using **BFG Repo Cleaner** or `git filter-branch`

#### Fix 2 — Path Traversal

```js
// documents-controller.js & app.js
const safeName = path.basename(fileName); // strips any ../ components
const filePath = path.join(uploadsDirectory, safeName);

// Verify path is still inside the uploads directory
if (!filePath.startsWith(path.resolve(uploadsDirectory))) {
  return res.status(400).json({ error: 'Invalid file path' });
}
```

#### Fix 3 — JWT Logic Bug

```js
// verifyJWT.js line 10 — change && to ||
if (!authHeader || !authHeader.startsWith('Bearer ')) {
```

#### Fix 4 — Disable Source Maps in Production

```env
# frontend/.env
GENERATE_SOURCEMAP=false
```

---

### 🟠 HIGH PRIORITY (Within 1 Week)

#### Fix 5 — Add Authentication to All User Routes

```js
// user-controller.js — add verifyToken middleware to all sensitive routes
usersRouter.get('/getAllUsers', verifyToken, async (req, res) => { ... });
usersRouter.get('/getUser/:uid', verifyToken, async (req, res) => { ... });
usersRouter.put('/update/:uid', verifyToken, async (req, res) => { ... });
usersRouter.put('/changePassword/:uid', verifyToken, async (req, res) => { ... });
usersRouter.put('/registerFaceData/:uid', verifyToken, async (req, res) => { ... });
usersRouter.delete('/delete/:uid', verifyToken, async (req, res) => { ... });
```

#### Fix 6 — Re-Enable Helmet ✅ (Already Fixed by User)

```js
app.use(helmet()); // Now re-enabled
```

#### Fix 7 — Apply Rate Limiting to Login

```js
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // 10 attempts max
  message: { error: 'Too many login attempts, please try again later.' }
});

usersRouter.post('/login', loginLimiter, async (req, res) => { ... });
```

#### Fix 8 — Fix Socket.IO CORS

```js
const allowedOrigins = require('./src/middlewares/corsConfig/allowedOrigins');

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});
```

#### Fix 9 — Remove `editor` Field Privilege Escalation

```js
// user-service.js — derive admin status from verified JWT, not request body
async function changePassword(uid, data, requesterRole) {
  const isAdmin = Array.isArray(requesterRole) && requesterRole.includes('admin');
  if (!isAdmin) {
    const validPassword = await bcrypt.compare(data.password, fetchedUser.password);
    if (!validPassword) throw new Error('Invalid current password');
  }
  // ...
}
```

#### Fix 10 — Cryptographically Secure Password Generation

```js
const crypto = require('crypto');

function generateRandomPassword(length = 12) {
  return crypto.randomBytes(length).toString('base64').slice(0, length);
}
```

---

### 🟡 MEDIUM PRIORITY (Within 1 Month)

#### Fix 11 — Normalize Login Error Responses

```js
// Same message and status regardless of whether username or password is wrong
res.status(401).json({ error: 'Invalid username or password' });
```

#### Fix 12 — Hash Refresh Tokens Before DB Storage

```js
const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
// Store hashedToken in DB; compare hash during lookup
```

#### Fix 13 — Validate File Content (Magic Bytes) on Upload

```js
const FileType = require('file-type');

const buffer = fs.readFileSync(file.path);
const type = await FileType.fromBuffer(buffer);
if (!['image/png'].includes(type?.mime)) {
  fs.unlinkSync(file.path);
  return cb(new Error('Invalid file content'));
}
```

#### Fix 14 — Exclude Sensitive Fields from User API Responses

```js
// Use Prisma `select` to exclude sensitive fields
const users = await prisma.users.findMany({
  select: {
    uid: true, firstName: true, lastName: true,
    username: true, role: true, officeName: true,
    unitName: true, status: true
    // Excludes: password, refreshToken, faceData, fingerprintData, signPath
  }
});
```

#### Fix 15 — Remove Internal IPs from Source Code

Use environment variables instead:
```js
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
```

---

### 🔵 LOW PRIORITY (Ongoing)

| # | Action |
|---|---|
| 16 | Replace `console.log/error` with a proper logging library (`winston`) with log levels |
| 17 | Implement Content-Security-Policy headers to mitigate XSS |
| 18 | Replace `alert()` notifications with in-app toast/snackbar components |
| 19 | Fix the `.env` comment syntax error in frontend |
| 20 | Add RBAC authorization checks to all document endpoints |
| 21 | Use a separate, least-privilege DB user instead of `root` |
| 22 | Sanitize WebSocket message data before rendering |
| 23 | Add `Secure` and `SameSite=Strict` flags to all cookies |

---

## Strong Points of the System

---

### ✅ STRENGTH-01 — Passwords Are Properly Bcrypt-Hashed

```js
const encryptedPassword = await bcrypt.hash(generatedPassword, 10);
const validPassword = await bcrypt.compare(password, user.password);
```

bcrypt with a cost factor of 10 is the industry standard. Passwords are **never stored in plaintext** and comparisons use `bcrypt.compare` (timing-attack safe). This prevents mass credential compromise in the event of a database dump.

---

### ✅ STRENGTH-02 — Signature Data Is AES-256-CBC Encrypted at Rest

```js
const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
```

The `signPath` field (containing paths to digital signatures and PKI certificates) is encrypted in the database using **AES-256-CBC with a random IV** per encryption — a thoughtful design decision.

---

### ✅ STRENGTH-03 — HTTPS/SSL Is Properly Configured in Production

The server reads Let's Encrypt TLS certificates and creates an HTTPS server in production mode, ensuring all client-server communication is encrypted in transit.

---

### ✅ STRENGTH-04 — HTTP CORS Whitelist Is Properly Configured

The HTTP CORS policy uses an explicit whitelist (`allowedOrigins`) and correctly rejects requests from unlisted origins — a correct baseline for browser-based API protection.

---

### ✅ STRENGTH-05 — Role-Based Access Control (RBAC) Is Architecturally Present

The frontend wraps routes in `<RequireAuth allowedRoles={[...]} />` components and enforces role checks (admin, sds, secretary, etc.) before rendering pages.

---

### ✅ STRENGTH-06 — Dual-Token Architecture Is Conceptually Sound

The system uses a **dual-token approach**: short-lived Access Tokens (30s) + long-lived Refresh Tokens via cookies. This is the correct modern pattern used by OAuth 2.0, minimizing the window of token theft. The design intent is excellent.

---

### ✅ STRENGTH-07 — Automated Database Backups via Cron Job

The system automatically:
- Creates daily per-table MySQL dumps
- Compresses them into `.zip` archives
- Rotates to keep only the last 5 backups
- Logs all operations

This demonstrates mature operational thinking for a government system.

---

### ✅ STRENGTH-08 — Password Is Never Returned in API Responses

```js
const { password, ...otherUserDetails } = user;
// Only otherUserDetails is sent in the response
```

The password hash is explicitly stripped from all API responses — a correct defensive practice.

---

### ✅ STRENGTH-09 — File Upload Has Size Limits and Type Filters

Multer upload middleware enforces a 100 MB file size limit and filters by file type (PDF, PNG, `.p12`), showing security awareness in the design.

---

### ✅ STRENGTH-10 — Content Security Policy (CSP) Headers Are Set

```js
res.setHeader('Content-Security-Policy',
  `default-src 'self'; img-src 'self' ...; script-src 'self'; style-src 'self';`
);
```

CSP headers are applied globally to restrict resource loading origins — a meaningful XSS mitigation layer.

---

### ✅ STRENGTH-11 — XSS Library Is Installed

The `xss` npm package is listed as a dependency, showing awareness of XSS risk.

---

### ✅ STRENGTH-12 — JWT Verification Middleware Structure Is Correct

A dedicated JWT verification middleware (`verifyJWT.js`) follows the Bearer token standard. Despite the logic bug found in this audit, the structure is correct and easily fixable.

---

### ✅ STRENGTH-13 — Socket.IO Uses Room-Based Scoped Notifications

Document notifications are scoped to specific office/unit **rooms**, preventing cross-department data leaks via WebSocket. Users only receive notifications for their own unit.

---

### ✅ STRENGTH-14 — Prisma ORM Prevents SQL Injection

All database queries go through **Prisma Client**, which uses parameterized queries exclusively. SQL injection via user input is largely prevented (with one exception in `cronjobs.js`'s `$queryRawUnsafe`).

---

### ✅ STRENGTH-15 — Cutoff Time Is Enforced Server-Side

The system cutoff (business hours lock) is enforced by the **server clock** via Socket.IO — not the client clock. Users cannot bypass time-based restrictions by changing their device time.

---

## System Weaknesses

---

### ⚠️ WEAKNESS-01 — Authentication Is Broken at the Architecture Level

The JWT token flow has multiple disconnected pieces that fail together:
- The **login** endpoint no longer issues JWT tokens (code is commented out)
- The `useRefreshToken.js` accesses `response.accessToken` instead of `response.data.accessToken`
- The `verifyToken` middleware has a logic bug (`&&` vs `||`)
- **Net result:** The authentication chain is partially non-functional in the current state

---

### ⚠️ WEAKNESS-02 — No Input Validation or Sanitization Layer

`express-validator` is installed but **never used** in any route. All incoming request body data is used as-is, passed directly to Prisma or service functions without validation of types, lengths, or formats.

---

### ⚠️ WEAKNESS-03 — Inconsistent Error Handling Across the Codebase

- Some routes use `next(error)` (correct pattern)
- Most routes catch errors and manually send responses (inconsistent)
- The `errorHandler.js` middleware exists but is **never registered** in `app.js`
- Custom error classes (`NotFoundError`, `BadRequestError`) are used in controllers but never imported from `errorHandler.js` — they reference undefined classes

---

### ⚠️ WEAKNESS-04 — No Automated Testing

There are no unit tests, integration tests, or end-to-end tests in either the backend or frontend. Refactoring or fixing vulnerabilities carries high risk of introducing undetected regressions.

---

### ⚠️ WEAKNESS-05 — Multiple `PrismaClient` Instances Created

`new PrismaClient()` is created in `app.js`, `user-dao.js`, and `cron/cronjobs.js` — three separate connection pools where one shared singleton should suffice. This can lead to database connection exhaustion under load.

---

### ⚠️ WEAKNESS-06 — Native `alert()` Used for Notifications

Native `alert()` dialogs:
- Block all JavaScript execution
- Cannot be styled or dismissed programmatically
- Can be abused for social engineering via injected messages
- Are poor UX in modern applications

---

### ⚠️ WEAKNESS-07 — No API Versioning

All routes are at the root path (e.g., `/user/login`, `/documents/getAllDocuments`). There is no versioning (`/api/v1/...`). Any breaking change requires updating all API consumers simultaneously.

---

### ⚠️ WEAKNESS-08 — Large Blocks of Commented-Out Legacy Code

Large blocks of commented-out code exist throughout the codebase (especially in `user-service.js` with old token generation, and `user-controller.js` with old cookie code). This creates confusion about which code paths are active and indicates technical debt accumulation.

---

### ⚠️ WEAKNESS-09 — No Audit Log / Activity Log System

Despite being a government document management system, there is **no audit trail** for who viewed, modified, deleted, or accessed which document. The `doclogs` table tracks document state changes but not user-action events (logins, failed logins, admin actions, data exports).

---

### ⚠️ WEAKNESS-10 — Biometric Data Stored Without Additional Encryption

```prisma
faceData         Json?
fingerprintData  Json?
```

Biometric data — which is **irrevocable unlike a password** — is stored as plain JSON in the database with no additional encryption layer. Under **Philippine Data Privacy Act (RA 10173)**, biometric data requires the highest level of protection.

---

### ⚠️ WEAKNESS-11 — No Centralized Logging or Monitoring

The system only uses `console.log/error`. There is no structured logging (JSON format), no log rotation, no centralized log aggregation (e.g., ELK stack), and no alerting. If something goes wrong in production, root-cause analysis is extremely difficult.

---

### ⚠️ WEAKNESS-12 — Full User Object Persisted in `localStorage`

```js
localStorage.getItem('authInfo')
// Contains: name, role, officeId, unitId, signPath, etc.
```

The full user profile (including roles and organizational info) persists across browser sessions in plaintext — readable by any JavaScript on the page.

---

### ⚠️ WEAKNESS-13 — No CSRF Protection

The backend uses `cookie-parser` but has no CSRF token validation. State-changing POST/PUT/DELETE endpoints that rely on cookies are vulnerable to Cross-Site Request Forgery.

---

## Comprehensive Plan of Action

---

### 🔴 PHASE 1 — Emergency Response (Day 1–2)

> **Goal:** Stop the bleeding. Address threats that are exploitable right now.

| # | Action | Effort |
|---|---|---|
| 1.1 | **Rotate ALL secrets** — JWT secrets, DB passwords, Google OAuth secret | 1 hour |
| 1.2 | **Purge secrets from git history** using BFG Repo Cleaner | 2 hours |
| 1.3 | **Add `credentials.json` to `.gitignore`** | 5 min |
| 1.4 | **Set `GENERATE_SOURCEMAP=false`** and rebuild/redeploy frontend | 30 min |
| 1.5 | **Fix path traversal** by sanitizing `fileName` and `imgFilePath` query params | 1 hour |
| 1.6 | **Fix the JWT logic bug** (`&&` → `||` in `verifyJWT.js` line 10) | 5 min |

---

### 🟠 PHASE 2 — Critical Security Hardening (Week 1)

> **Goal:** Close all critical and high attack surfaces.

| # | Action | Effort |
|---|---|---|
| 2.1 | **Add `verifyToken` middleware to ALL sensitive user routes** | 2 hours |
| 2.2 | **Re-enable `app.use(helmet())`** ✅ Already done | Complete |
| 2.3 | **Apply `express-rate-limit`** to `/user/login` (10 req / 15 min) | 1 hour |
| 2.4 | **Fix Socket.IO CORS** — replace `origin: '*'` with `allowedOrigins` whitelist | 30 min |
| 2.5 | **Remove the `editor` field bypass** from `changePassword` — use JWT role instead | 2 hours |
| 2.6 | **Replace `Math.random()`** with `crypto.randomBytes()` for password generation | 30 min |
| 2.7 | **Register `errorHandler` middleware** in `app.js` and fix undefined class references | 2 hours |
| 2.8 | **Sanitize shell inputs** in `cronjobs.js` using `shellEscape` or equivalent | 1 hour |

---

### 🟡 PHASE 3 — Authentication Architecture Repair (Week 2)

> **Goal:** Make the authentication system fully functional and secure end-to-end.

| # | Action | Detail |
|---|---|---|
| 3.1 | **Restore JWT issuance on login** | Uncomment and wire up token generation in `user-service.js` |
| 3.2 | **Fix `useRefreshToken.js`** | Change `response.accessToken` → `response.data.accessToken` |
| 3.3 | **Hash refresh tokens before storing** | Use `SHA-256(token)` for DB storage; compare hash on lookup |
| 3.4 | **Implement proper token revocation** | On logout, delete refresh token from DB |
| 3.5 | **Move `authInfo` from `localStorage` to memory** | Store access token in-memory only; use `HttpOnly` cookies for refresh token |
| 3.6 | **Implement account lockout** | Lock account for 15 min after 5 failed login attempts |
| 3.7 | **Normalize error messages** | Return generic `401: Invalid username or password` for all auth failures |

---

### 🔵 PHASE 4 — Data Protection & Privacy (Week 3)

> **Goal:** Comply with RA 10173 (Philippine Data Privacy Act) and protect biometric data.

| # | Action | Detail |
|---|---|---|
| 4.1 | **Encrypt biometric data at rest** | Apply AES-256 to `faceData` and `fingerprintData` (same pattern as `signPath`) |
| 4.2 | **Exclude sensitive fields from list endpoints** | Use Prisma `select` to exclude `password`, `refreshToken`, `faceData`, `fingerprintData` |
| 4.3 | **Implement RBAC on backend document endpoints** | Verify JWT role claim in document controller routes |
| 4.4 | **Add CSRF Protection** | Use `csurf` middleware for all cookie-authenticated state-changing endpoints |
| 4.5 | **Validate file contents (magic bytes)** | Use `file-type` npm package to check actual binary of uploaded files |
| 4.6 | **Create a dedicated DB user** | MySQL user with only `SELECT/INSERT/UPDATE/DELETE` on `paperless` DB; no root access |

---

### 🟢 PHASE 5 — Code Quality & Architecture (Month 2)

> **Goal:** Make the system maintainable, testable, and resilient.

| # | Action | Detail |
|---|---|---|
| 5.1 | **Implement input validation with `express-validator`** | Add validation schemas for all POST/PUT endpoints |
| 5.2 | **Create a Prisma singleton** | Export one shared `PrismaClient` instance from `lib/prisma.js` |
| 5.3 | **Implement structured logging with `winston`** | Replace all `console.log/error` with `logger.info/error/warn` in JSON format |
| 5.4 | **Replace `alert()` with proper notifications** | Use existing `notistack` or `react-toastify` for all alert calls |
| 5.5 | **Add API versioning** | Prefix all routes with `/api/v1/` |
| 5.6 | **Clean up commented-out dead code** | Remove all obsolete `//` blocks; use git history for rollback |
| 5.7 | **Write integration tests** | Use Jest + Supertest to test all auth, document, and user endpoints |
| 5.8 | **Add OpenAPI/Swagger documentation** | Document all endpoints using `swagger-jsdoc` |

---

### 🟢 PHASE 6 — Monitoring, Audit & Compliance (Month 3)

> **Goal:** Build operational visibility and long-term resilience.

| # | Action | Detail |
|---|---|---|
| 6.1 | **Build an Audit Log system** | Create `auditlogs` Prisma model to record: user, action, target, timestamp, IP address |
| 6.2 | **Implement real-time security alerting** | Alert admin on 5+ failed logins from same IP, off-hours bulk deletions |
| 6.3 | **Set up automated vulnerability scanning** | Add `npm audit` to CI/CD pipeline; run weekly with email report |
| 6.4 | **Conduct quarterly penetration testing** | Schedule manual pen tests; document and track remediation |
| 6.5 | **Implement CSP nonce** | Upgrade CSP from static rules to per-request nonce for `script-src` |
| 6.6 | **Add DPO notification workflow** | Alert Data Privacy Officer on any potential data breach event (RA 10173) |
| 6.7 | **Implement backup integrity verification** | After each automated backup, run a test restore to verify dump validity |

---

## Scorecard Summary

| Category | Current Score | Target Score | Gap |
|---|---|---|---|
| Authentication & Session Management | 3/10 | 9/10 | 🔴 Critical |
| Authorization & Access Control | 2/10 | 9/10 | 🔴 Critical |
| Data Protection at Rest | 5/10 | 9/10 | 🟠 High |
| Data Protection in Transit | 7/10 | 10/10 | 🟡 Good |
| Input Validation & Sanitization | 2/10 | 9/10 | 🔴 Critical |
| File Upload Security | 4/10 | 9/10 | 🟠 High |
| Security Headers & CSP | 5/10 | 9/10 | 🟡 Medium |
| Error Handling & Logging | 3/10 | 8/10 | 🟠 High |
| Code Quality & Maintainability | 5/10 | 8/10 | 🟡 Medium |
| Operational Resilience (Backup/Monitoring) | 5/10 | 9/10 | 🟡 Medium |
| Compliance (RA 10173 / Data Privacy) | 3/10 | 8/10 | 🟠 High |
| | | | |
| **OVERALL** | **3.8 / 10** | **8.9 / 10** | Needs Work |

> **Note:** Security Headers score updated to 5/10 (from 3/10) following the re-enabling of Helmet on Feb 24, 2026.

---

## Files Audited

| File | Type | Key Findings |
|---|---|---|
| `backend/app.js` | Server Entry | Path traversal, Helmet (now fixed), Socket CORS wildcard |
| `backend/.env` | Config | JWT secrets, DB credentials exposed |
| `backend/package.json` | Dependencies | Rate limiter installed but unused |
| `backend/prisma/schema.prisma` | Database Schema | Plaintext refresh token, unencrypted biometrics |
| `backend/cron/cronjobs.js` | Background Jobs | Shell command injection risk |
| `backend/src/UserAuth/user-controller.js` | Routes | All user routes unauthenticated |
| `backend/src/UserAuth/user-service.js` | Business Logic | PRNG weakness, editor bypass, enumeration |
| `backend/src/UserAuth/user-dao.js` | Data Access | Multiple PrismaClient instances |
| `backend/src/middlewares/verifyJWT.js` | Auth Middleware | Logic bug (`&&` vs `||`) |
| `backend/src/middlewares/corsConfig/corsOptions.js` | CORS | `!origin` bypass |
| `backend/src/middlewares/multer.js` | Upload | 100MB limit, PDF-only filter |
| `backend/src/middlewares/multer-png.js` | Upload | Extension-only check (no magic bytes) |
| `backend/src/middlewares/errorHandler.js` | Error Handling | Never registered in app.js |
| `backend/src/app/documents/documents-controller.js` | Routes | Path traversal on file reads |
| `backend/src/app/libraries/libraries-controller.js` | Routes | All endpoints unauthenticated |
| `frontend/.env` | Config | Source maps in production, env syntax error |
| `frontend/credentials.json` | OAuth | Google client secret in tracked file |
| `frontend/src/contexts/ContextProvider.js` | Auth State | Token in localStorage |
| `frontend/src/contexts/RequireAuth.js` | Frontend Auth | Client-only RBAC (no server enforcement) |
| `frontend/src/contexts/interceptors/axios.js` | HTTP Client | Interceptor setup, token attachment |
| `frontend/src/contexts/interceptors/useRefreshToken.js` | Token Refresh | `response.accessToken` bug |
| `frontend/src/App.js` | App Core | `alert()` XSS vector, no sanitization |
| `frontend/deploy.sh` | Deployment | Internal IP addresses exposed |

---

## Final Remarks

The **Less Paper System** shows genuine engineering effort and good design intent. bcrypt passwords, AES-256 encryption of signature paths, HTTPS, RBAC concepts, automated database backups, and a clean MVC-style architecture all demonstrate that the developers understand security fundamentals. The system's **foundations are sound**.

However, the system is currently in a **"half-built security state"** — many of the right tools are installed (Helmet, rate-limit, express-validator, xss library) but most are **commented out, misconfigured, or simply not applied**. This is the classic pattern of security features being added during development, then disabled "temporarily for testing" and never re-enabled.

> ⚠️ **Top Priority:** The JWT secrets, database credentials, and Google OAuth client secret committed to the repository must be **rotated immediately** — even before any code fix — as the exposure window is already open. Treat all of these as fully compromised.

After completing the 6-phase plan above, the system would be well-positioned to serve a government agency securely and in full compliance with the **Philippine Data Privacy Act (RA 10173)**.

---

*Report generated: February 24, 2026 | Audited by: Antigravity AI Security Audit*

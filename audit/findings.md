# Jawan Fitness — Comprehensive Security, Integrity & Systems Audit Findings

**Date**: 2026-10-13  
**Auditor**: Principal Engineer & Security Auditor  
**Scope**: Full Stack (React 19, TypeScript, Capacitor 7 Android APK, PWA, Cloudflare Pages Functions, Cloudflare D1 SQL)

---

## Executive Summary & Scorecard (Initial Baseline)

| Domain | Baseline Rating | Key Problem Identified | Target Rating |
| :--- | :---: | :--- | :---: |
| **Security** | 4.5 / 10 | Open CORS reflection, 0 rate-limiting, timing attacks on login, plain localStorage tokens on APK | 9.5 / 10 |
| **Reliability** | 5.0 / 10 | Master sync row concurrency race conditions (lost updates), missing CAS | 9.5 / 10 |
| **Data Integrity** | 5.5 / 10 | Temporary passwords in state payloads, unversioned JSON blobs, no tombstones | 9.5 / 10 |
| **Performance** | 7.5 / 10 | 1324-exercise virtualization improved, but monolithic sync blob payload grows unbounded | 9.0 / 10 |
| **Accessibility** | 8.0 / 10 | 48dp touch targets added, WCAG 2.2 AA audit ongoing | 9.5 / 10 |
| **Maintainability** | 6.0 / 10 | Duplicate backend folders (`api/` vs `functions/api/`), lack of automated test suites | 9.0 / 10 |
| **Compliance** | 4.0 / 10 | DPDP Act 2023 consent gaps, missing in-app account deletion & data export endpoints | 9.0 / 10 |

---

## Detailed Findings

### [SEC-01] Open CORS Reflection with Credentials Allowed
- **Severity**: 🔴 Critical
- **Reference**: OWASP Top 10 A01:2021 (Broken Access Control) / OWASP ASVS 14.5.3
- **File & Line**: [`functions/api/auth.ts#L6-L14`](file:///c:/Users/yoges/.gemini/antigravity-ide/scratch/jawan-fitness-app/functions/api/auth.ts#L6-L14), [`functions/api/sync.ts#L16-L24`](file:///c:/Users/yoges/.gemini/antigravity-ide/scratch/jawan-fitness-app/functions/api/sync.ts#L16-L24)
- **Reproduction**:
  Send an HTTP request with header `Origin: https://evil-attacker.com`.
  The server responds with:
  ```http
  Access-Control-Allow-Origin: https://evil-attacker.com
  Access-Control-Allow-Credentials: true
  ```
- **Impact**: Any malicious third-party site visited by an authenticated gym administrator or member can send cross-origin requests to read or modify private health, weight, and meal data.
- **Recommended Fix**: Implement an explicit CORS origin allowlist (`https://jawan-fitness-app.pages.dev`, `https://jawan-fitness-admin.pages.dev`, `https://jawan-fitness-trainer.pages.dev`, `https://jawanfitness.com`, `http://localhost:5173`, `capacitor://localhost`). Deny or omit credentialed CORS for unknown origins.
- **Effort**: S

---

### [SEC-02] No Rate Limiting on Authentication Endpoints (Brute Force Vulnerability)
- **Severity**: 🔴 Critical
- **Reference**: OWASP Top 10 A07:2021 (Identification and Authentication Failures) / OWASP ASVS 2.2.1
- **File & Line**: [`functions/api/auth.ts#L70-L176`](file:///c:/Users/yoges/.gemini/antigravity-ide/scratch/jawan-fitness-app/functions/api/auth.ts#L70-L176)
- **Reproduction**:
  Issue 10,000 rapid POST requests to `/api/auth?action=login` guessing passwords for `admin@jawan.fit`. The endpoint processes every single request without throttling, backoff, or temporary account lockouts.
- **Impact**: Attackers can brute-force 4-digit PINs, short temporary passwords, or user credentials without resistance.
- **Recommended Fix**: Implement dual-key rate limiting (IP-level threshold + compound `IP + identifier` lockout with exponential backoff). Store attempt counters in D1 or Cloudflare KV.
- **Effort**: M

---

### [SEC-03] Timing Attack and Account Enumeration on Login
- **Severity**: 🟠 High
- **Reference**: OWASP ASVS 2.1.8 / 2.2.2
- **File & Line**: [`functions/api/auth.ts#L88-L126`](file:///c:/Users/yoges/.gemini/antigravity-ide/scratch/jawan-fitness-app/functions/api/auth.ts#L88-L126)
- **Reproduction**:
  Measure the response time of `/api/auth?action=login` for:
  1. A non-existent email (e.g. `nonexistent@jawan.fit`): returns in ~5ms because D1 returns null and `hashPassword` is bypassed.
  2. A valid email (e.g. `admin@jawan.fit`) with wrong password: returns in ~80-120ms due to PBKDF2 100,000 iterations.
- **Impact**: An attacker can enumerate all registered member phone numbers and email addresses by observing request timing deltas.
- **Recommended Fix**: Perform a dummy PBKDF2 computation on non-existent user lookups so execution timing remains identical whether the account exists or not. Use timing-safe comparison for password hashes.
- **Effort**: S

---

### [SEC-04] Missing Optimistic Concurrency & Lost Updates on Master Sync Row
- **Severity**: 🔴 Critical
- **Reference**: OWASP Top 10 A04:2021 (Insecure Design) / OWASP ASVS 10.3.2
- **File & Line**: [`functions/api/sync.ts#L501-L575`](file:///c:/Users/yoges/.gemini/antigravity-ide/scratch/jawan-fitness-app/functions/api/sync.ts#L501-L575)
- **Reproduction**:
  1. Client A reads master sync row at `t0`.
  2. Client B reads master sync row at `t0 + 1ms`.
  3. Client A completes set and saves at `t0 + 20ms`.
  4. Client B logs meal and saves at `t0 + 25ms`.
  Client B's write overwrites Client A's state entirely because `UPDATE gym_sync_state` is a blind overwrite without a version check.
- **Impact**: Concurrent updates result in silent data loss (lost workouts, overwritten nutrition entries, lost client assignments).
- **Recommended Fix**: Add a `version INTEGER NOT NULL DEFAULT 1` column to `gym_sync_state`. Enforce atomic compare-and-set:
  `UPDATE gym_sync_state SET data = ?, version = version + 1 WHERE id = 'master' AND version = ?`. If rows affected is 0, return `409 Conflict` and retry with backoff.
- **Effort**: M

---

### [SEC-05] Temporary Password Stored in Local Storage and State Payloads
- **Severity**: 🟠 High
- **Reference**: OWASP Top 10 A02:2021 (Cryptographic Failures) / OWASP ASVS 2.1.2
- **File & Line**: [`src/services/syncedStore.ts#L29`](file:///c:/Users/yoges/.gemini/antigravity-ide/scratch/jawan-fitness-app/src/services/syncedStore.ts#L29), [`src/components/admin/AdminScreen.tsx#L288`](file:///c:/Users/yoges/.gemini/antigravity-ide/scratch/jawan-fitness-app/src/components/admin/AdminScreen.tsx#L288)
- **Reproduction**:
  When an admin adds a new member, `temporaryPassword` is written directly into `client.temporaryPassword` and serialized to local storage. Although `stripSecrets` in `sync.ts` removes it on GET, it remains in memory and local backups.
- **Impact**: Plaintext passwords exposed in client browser memory and storage.
- **Recommended Fix**: Remove `temporaryPassword` from `ClientData` and `TrainerData` interfaces entirely. Issue passwords through secure out-of-band credential modals and store only PBKDF2 hashes in `gym_users`.
- **Effort**: S

---

### [SEC-06] PBKDF2 Iteration Count Below Current OWASP Recommendations
- **Severity**: 🟡 Medium
- **Reference**: OWASP ASVS 2.4.1 / OWASP Password Storage Cheat Sheet
- **File & Line**: [`functions/api/auth.ts#L29`](file:///c:/Users/yoges/.gemini/antigravity-ide/scratch/jawan-fitness-app/functions/api/auth.ts#L29)
- **Reproduction**:
  `iterations: 100000` is hardcoded. OWASP recommends at least 210,000 iterations for PBKDF2-HMAC-SHA512.
- **Impact**: Lower resilience against GPU-accelerated hash cracking.
- **Recommended Fix**: Upgrade iteration count to 210,000. Add `iterations` column to `gym_users` defaulting to 100,000 for legacy records and automatically re-hash to 210,000 upon successful login.
- **Effort**: M

---

### [SEC-07] Plain LocalStorage Token on Android APK
- **Severity**: 🟠 High
- **Reference**: OWASP MASVS-STORAGE-1 / MASVS-STORAGE-2
- **File & Line**: [`src/services/authService.ts#L30`](file:///c:/Users/yoges/.gemini/antigravity-ide/scratch/jawan-fitness-app/src/services/authService.ts#L30)
- **Reproduction**:
  On an Android device, inspection of the WebView storage exposes `jawan_auth_session_token_v1` in unencrypted SQLite web storage.
- **Impact**: Compromised devices, root access, or physical device access can extract the session token.
- **Recommended Fix**: Use native secure storage backed by Android Keystore on native platforms, falling back to localStorage on standard web browsers.
- **Effort**: M

---

### [SEC-08] Missing HTTP Security Headers
- **Severity**: 🟠 High
- **Reference**: OWASP Top 10 A05:2021 (Security Misconfiguration) / OWASP ASVS 14.4.1
- **File & Line**: [`functions/api/auth.ts#L6-L14`](file:///c:/Users/yoges/.gemini/antigravity-ide/scratch/jawan-fitness-app/functions/api/auth.ts#L6-L14), [`index.html#L1-L50`](file:///c:/Users/yoges/.gemini/antigravity-ide/scratch/jawan-fitness-app/index.html#L1-L50)
- **Reproduction**:
  Inspect response headers on `/` and `/api/*`. Missing: `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`, `Referrer-Policy: strict-origin-when-cross-origin`.
- **Impact**: Vulnerable to clickjacking, MIME-sniffing, and inline script injection.
- **Recommended Fix**: Add a `_headers` configuration file for Cloudflare Pages and attach standard security headers to all Pages Functions responses.
- **Effort**: M

---

### [SEC-09] Broken Authorization (IDOR) Potential in Chat & Sync History
- **Severity**: 🟠 High
- **Reference**: OWASP Top 10 A01:2021 (Broken Access Control) / OWASP ASVS 4.1.1
- **File & Line**: [`functions/api/sync.ts#L200-L280`](file:///c:/Users/yoges/.gemini/antigravity-ide/scratch/jawan-fitness-app/functions/api/sync.ts#L200-L280)
- **Reproduction**:
  A client syncing an incoming message array can theoretically append messages with arbitrary `clientId`s if not strictly stamped and validated on the server.
- **Impact**: Cross-client message spoofing.
- **Recommended Fix**: Enforce strict server-side stamping of `clientId = session.user_id` for all client mutations; discard any mutation touching foreign records.
- **Effort**: M

---

### [SEC-10] Monolithic Sync Blob Scalability Bottleneck
- **Severity**: 🟡 Medium
- **Reference**: OWASP Top 10 A04:2021 (Insecure Design)
- **File & Line**: [`functions/api/sync.ts#L330-L460`](file:///c:/Users/yoges/.gemini/antigravity-ide/scratch/jawan-fitness-app/functions/api/sync.ts#L330-L460)
- **Reproduction**:
  Query `SELECT length(data) FROM gym_sync_state WHERE id = 'master'`. As 100 members record daily workouts, sets, and meals, the JSON blob grows beyond 5-10 MB, causing high latency, D1 row-size limits, and mobile browser memory bloat.
- **Impact**: Severe performance degradation over 6-12 months of gym operation.
- **Recommended Fix**: Design and migrate to normalized D1 tables (`gym_workouts`, `gym_sets`, `gym_meals`, `gym_weights`, `gym_messages`) with date-range pagination and delta synchronization.
- **Effort**: L

---

### [SEC-11] Dual Backend Codebase Drift (D1 vs Legacy Supabase/pg)
- **Severity**: 🟢 Low
- **Reference**: OWASP ASVS 14.2.1
- **File & Line**: [`api/db.ts#L1-L60`](file:///c:/Users/yoges/.gemini/antigravity-ide/scratch/jawan-fitness-app/api/db.ts#L1-L60), [`functions/api/auth.ts#L1-L50`](file:///c:/Users/yoges/.gemini/antigravity-ide/scratch/jawan-fitness-app/functions/api/auth.ts#L1-L50)
- **Reproduction**:
  The repository contains both `api/` (Node + Supabase PostgreSQL) and `functions/api/` (Cloudflare Pages Functions + D1).
- **Impact**: Developer confusion, risk of fixing vulnerabilities in the wrong backend file, maintenance overhead.
- **Recommended Fix**: Deprecate and archive the legacy `api/` folder or align both implementations to standard contracts.
- **Effort**: S

---

### [SEC-12] Missing Input Schema Validation on Sync Mutations
- **Severity**: 🟡 Medium
- **Reference**: OWASP Top 10 A03:2021 (Injection) / OWASP ASVS 5.1.1
- **File & Line**: [`functions/api/sync.ts#L495-L560`](file:///c:/Users/yoges/.gemini/antigravity-ide/scratch/jawan-fitness-app/functions/api/sync.ts#L495-L560)
- **Reproduction**:
  Send an oversized or malformed JSON payload to `/api/sync`. The handler accepts raw objects without size capping or schema validation.
- **Impact**: Denial of Service (DoS) through payload bloat or malformed state corruption.
- **Recommended Fix**: Enforce payload size limits (e.g., max 2 MB per sync request) and validate essential entity structures before merging.
- **Effort**: M

# Domain and reachability (Healthinclined)

`ERR_CONNECTION_TIMED_OUT` and “some browsers / networks can’t open the site” are almost always **DNS or routing**, not the Next.js app. This project does **not** block User-Agents, countries, or networks.

## What was wrong (verified via public DNS)

- **`healthinclined.com`** had a valid **A** record.
- **`www.healthinclined.com`** returned **NXDOMAIN** (no record). Anyone using `www` hits a dead name and may see timeouts or “can’t be reached.”

## Fix (do this at your DNS registrar — e.g. Namecheap)

1. In **Vercel** → Project → **Settings → Domains**: add **`www.healthinclined.com`** to the same project as the apex (if not already).
2. Copy the **CNAME** target Vercel shows (often `cname.vercel-dns.com` or a project-specific hostname — use **exactly** what the dashboard lists).
3. At the registrar DNS panel, add:
   - **Type:** CNAME  
   - **Host / Name:** `www`  
   - **Value:** (paste from Vercel, include trailing `.` if your provider expects it)
4. Keep the **apex** (`@`) record matching Vercel’s current **A** record(s). Remove **old or duplicate** A records that point elsewhere.
5. Wait for propagation (often minutes; up to 24–48 hours with long TTL). Check globally: [DNSChecker](https://dnschecker.org) or [Google Public DNS](https://dns.google/).

After `www` resolves to Vercel, this repo’s **Next.js redirect** sends `https://www.healthinclined.com/*` → `https://healthinclined.com/*` (308).

## IPv6 (Vercel + third-party DNS)

Vercel’s docs: **custom domains on third-party DNS cannot use a working AAAA pointing at Vercel** (IPv6 is not supported for that setup). If you add an **AAAA** record that is wrong or points nowhere, **IPv6-first networks** may hang or time out. **Do not** publish a broken **AAAA**; if unsure, **omit AAAA** so clients use IPv4.

## Ongoing checks

- GitHub Action **Site reachability** (if enabled): pings the apex homepage on each push to `main`.
- After DNS changes, verify:
  - `https://healthinclined.com`
  - `https://www.healthinclined.com` (should redirect to apex)

## Corporate / school networks

Rarely, a firewall blocks a CDN IP range. That is local policy, not something the app can override. Using **HTTPS** to the canonical domain and correct DNS is the standard fix.

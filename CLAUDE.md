# CLAUDE.md — Cook & Bake Academy website

Read this whole file before making changes. It is the project's source of truth for
constraints, conventions, and where things live — most of what's below exists because
an earlier session got it wrong once.

## What this is

The website for **Cook & Bake Academy**, a real hands-on cooking and baking school
launching in Singapore: 20 courses (S$160–1,580), two campuses, classes of 12. Plain
HTML/CSS/JS, no framework, no backend. `market-validation.html` and `market-brief.md`
in this folder are the market research behind the catalogue and pricing — read those
for *why* the site is built the way it is, not just *how*.

The Singapore cooking-class market is dominated by single 2–4 hour sessions. This
site's core bet is structured 1–8 week courses, which has little precedent — that's
the thing the copy and UX need to sell, not just a class listing.

## Hard constraints — do not violate

- **No framework, no build step.** Plain HTML, CSS, JS only.
- **No backend.** Sign-ups persist to `localStorage` only (optionally also POST to
  `SIGNUP_ENDPOINT` in `script.js` if a session ever sets it — it's `null` by default).
- **Never hard-code course data.** Fee, weeks, schedule, campus, title, etc. are always
  rendered from `data/courses.json`. If you're tempted to type a fee into HTML/JS,
  you're doing it wrong.
- **Must work at 375px width, no horizontal scroll.** Check this after every layout change.
- **Accessible by default:** every input has a `<label>`, focus states use the brand's
  basil green (`--basil`) and must stay visible, failed fields get `aria-invalid="true"`.
- **`fetch('data/courses.json')` needs a local server.** Opening `index.html` via
  `file://` breaks the fetch in Chrome (CORS). Always test with e.g.
  `python3 -m http.server 8000`, never by double-clicking the file.

## File structure

| File | Purpose |
|---|---|
| `index.html` | The site: hero, course grid, filter chips + search, campuses, FAQ, course-assistant dialog, sign-up dialog |
| `styles.css` | All styling. Brand tokens live in `:root` — reuse them, don't hard-code colors |
| `script.js` | Course render/filter/search, the client-side "course assistant" search modal, the sign-up form logic |
| `data/courses.json` | The 20-course catalogue. Source of truth for all course data |
| `admin.html` / `admin.js` | Staff-only: lists sign-ups saved in this browser's `localStorage`, exports CSV |
| `market-brief.md` | Condensed research: positioning, personas, launch-five, pricing notes |
| `market-validation.html` | Full research report — competitors, pricing, demand/seasonality, every figure cited |

## Brand

Source: `brand.md` (if not in this folder, treat the table below as canonical —
it was transcribed from it).

- **Voice:** warm, practical, confident. Talk like a chef who likes teaching. Short
  sentences. No hype words ("amazing", "world-class").
- **Colours:** Crust (primary) `#B5652D` · Crust dark/hover `#8F4B1F` · Ink (text)
  `#2B211B` · Cream (background) `#FBF7F1` · Basil (focus state — all
  `:focus-visible` outlines use this) `#3F6B4A`.
- **Type:** headings in Georgia (serif), bold; body is the system sans-serif stack.
- **Photos:** real food, natural light, hands at work. Never stock photos of people
  smiling at the camera. Sourced from Unsplash by photo id:
  `https://images.unsplash.com/photo-<ID>?auto=format&fit=crop&w=<width>&q=<quality>`.
  Every course in `courses.json` carries its own `img` id for its card photo.

## Data model — `data/courses.json`

```jsonc
{
  "code": "BAK-101",       // unique. BAK-xxx = Bakery (Orchard Road), CUL-xxx = Cooking (Bukit Timah)
  "title": "Artisan Sourdough Bread Baking",
  "cat": "Bakery",          // "Bakery" | "Cooking" — drives the filter chips
  "level": "Beginner",      // "Beginner" | "Intermediate" | "Advanced"
  "weeks": 4,                // number of weekly sessions
  "fee": 680,                 // SGD, integer. Format with formatFee() -> "S$680"
  "campus": "Orchard Road",  // "Orchard Road" | "Bukit Timah"
  "img": "1589367920969-ab8e050bbb04",
  "when": "Saturday 9:30am–12:30pm",
  "summary": "...",
  "learn": ["...", "..."],
  "allergens": "wheat (gluten), rye, sesame",
  "bring": "...",
  "intakes": ["2026-10-10", "2026-12-05"],  // exactly 2 ISO dates — the sign-up form reads these directly
  "class_size": 12
}
```

20 courses total: 10 Bakery + 10 Cooking. If you add/remove a course, check anywhere
that assumes this count (tests, DONE WHEN criteria in any spec file).

## Sign-up form

Full behavioural spec: `signup-spec.md` (if present in this folder). Key rules,
already implemented in `script.js` — don't relax these without checking that file first:

- One shared `<dialog id="signup-dialog">`, opened per-card via `.course-signup-btn`,
  prefilled **read-only** with course code/title/campus/schedule/weeks/fee. The intake
  `<select>` is built from that course's `intakes` array.
- Required: full name (≥2 chars), email (valid format), Singapore mobile, consent checkbox.
- Optional: experience (None/Some/Confident, defaults to None), allergies (free text),
  newsletter checkbox — **separate from consent, unticked by default**. This is
  intentional: PDPA consent to be contacted about a booking is not consent to marketing.
  Never merge these two checkboxes.
- Singapore mobile regex: `/^(\+65\s?)?[689]\d{3}\s?\d{4}$/` — accepts `+65 9123 4567`
  or `91234567`, must start with 6, 8, or 9.
- Validation on submit is **sequential**: show exactly one error at a time, in order
  (name → email → mobile → consent), and set `aria-invalid="true"` on the failing field.
- **Nuts warning is non-blocking.** If the course's `allergens` matches `/nut/i` AND the
  allergies textarea also matches `/nut/i`, show a warning — never prevent submission.
- On success: push a record to `localStorage['cb_signups']`; reference number format
  `CB-YYYYMMDD-NNNN`, sequential per day via `localStorage['cb_signup_seq_YYYYMMDD']`
  starting at 1001; show a `mailto:enrol@cookbakeacademy.sg` link prefilled with the details.
- `SIGNUP_ENDPOINT` near the top of the sign-up block in `script.js`: `null` by default.
  If a future session sets it, the record is also POSTed there, best-effort, after the
  local save (never blocks or depends on the POST succeeding).

## CSV export — `admin.html` / `admin.js`

Column order is fixed and must exactly match `signups-format.csv` (if present):

```
ref,submitted,course_code,course_title,intake,full_name,email,mobile,experience,allergies,marketing_opt_in,paid
```

`paid` is always `"no"` — there is no payment processing. Values are CSV-escaped
(quoted, internal quotes doubled) when they contain a comma, quote, or newline.

## Before calling any change "done"

- 20 cards render from `data/courses.json`; Bakery filter shows exactly 10, Cooking exactly 10.
- No horizontal scroll at 375px — check with the sign-up dialog both closed and open.
- Keyboard focus is visible (basil green) on every interactive element, including inside the dialogs.
- Serve locally (`python3 -m http.server 8000` or similar) before testing anything that
  calls `fetch()` — testing via `file://` will hide real bugs.
- If you touched the sign-up form: submit empty → name error appears; fix fields one at
  a time and confirm each error clears in sequence; confirm the nuts warning shows but
  doesn't block; confirm the reference number matches `CB-YYYYMMDD-NNNN` and increments;
  confirm `admin.html` lists the new row and the exported CSV header matches
  `signups-format.csv` exactly.

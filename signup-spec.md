# Sign-up form — specification

One shared `<dialog>`, opened by a **Sign up** button on every course card.

## Fields
| Field | Rule |
|---|---|
| Course | Prefilled and read-only: code, title, fee, weeks, schedule, campus |
| Intake | Select from the course's two `intakes` dates |
| Full name | Required, at least 2 characters |
| Email | Required, valid format |
| Mobile | Required, Singapore format: `+65 9123 4567`, `91234567` (starts 6, 8 or 9) |
| Experience | None / Some / Confident |
| Allergies | Optional free text |
| Consent | **Required** checkbox: agree to be contacted about this sign-up |
| Newsletter | **Separate, unticked** checkbox: opt in to marketing |

## Behaviour
- Validate on submit; show the first problem inline; mark bad fields
  with `aria-invalid="true"`.
- If allergies mention nuts and the course's allergens mention nuts,
  show a warning (do not block).
- On success: save to `localStorage` key `cb_signups`, show a reference
  `CB-YYYYMMDD-NNNN`, and a mailto link to enrol@cookbakeacademy.sg with the details.
- `admin.html` lists sign-ups on this device and exports CSV with exactly
  the columns in signups-format.csv.
- Optional: if `SIGNUP_ENDPOINT` is set, also POST the form there.

## Why two checkboxes
Agreeing to be contacted about your booking is not agreeing to marketing.
PDPA consent must be specific.

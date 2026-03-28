# Mobile Receipt Capture — Mini PRD

**Date:** March 27, 2026
**Status:** Proposed

---

## 1. Overview

A simplified, single-purpose mobile experience focused entirely on capturing receipts in the field. The mobile app is a "camera first" tool — open the app, take a photo, done. All processing, categorization, and vendor/estimate linking happens later on the web app.

---

## 2. User Stories

### Mobile App (Capture Only)

- **MC-1:** As a user, when I open the app, I immediately see the camera (no navigation, no tabs).
- **MC-2:** As a user, I can tap to capture a receipt photo, with the option to retake if blurry.
- **MC-3:** As a user, after capturing, I see the photo and can optionally add a quick note (e.g., "Kitchen cabinets deposit").
- **MC-4:** As a user, I tap "Save to Inbox" and the receipt is uploaded with a status of `inbox`. I see a success confirmation.
- **MC-5:** As a user, I can access a simple gallery view of my recent captures (last 7 days) in case I need to re-check something.
- **MC-6:** As a user, I stay logged in unless I explicitly sign out (no daily re-auth friction).

### Web App Inbox (Processing)

- **WI-1:** As a user, I see an "Inbox" tab in the main navigation showing uncaptured receipts (status=`inbox`).
- **WI-2:** As a user, each inbox item shows: thumbnail, captured date/time, any mobile note, and AI-extracted data (vendor name, date, total, HST).
- **WI-3:** As a user, I can assign a vendor to an inbox receipt via search/autocomplete.
- **WI-4:** As a user, for Contract vendors, I can optionally link the receipt to an estimate.
- **WI-5:** As a user, I can add/edit fields (vendor ref, payment type, tags, notes) before confirming.
- **WI-6:** As a user, I can "Quick Confirm" if the AI data looks correct — vendor + totals are saved as-is.
- **WI-7:** As a user, confirmed receipts move from Inbox to the vendor's receipt list and appear in dashboard totals.

---

## 3. Mobile App Design

### Screen Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Launch App     │────▶│  Camera View    │────▶│  Photo Preview  │
│  (auto-login)   │     │  (fullscreen)   │     │  + Note Input   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                          │
                              ┌───────────────────────────┘
                              ▼
                       ┌─────────────────┐
                       │  Success Screen │────▶ Back to Camera
                       │  (2 sec auto)   │
                       └─────────────────┘
```

### UI Specification

**Camera Screen:**
- Fullscreen camera view (back camera, auto-focus)
- Shutter button: bottom center, large circular
- Gallery shortcut: bottom left (last captured thumbnail)
- Settings/account: top right (gear icon, minimal)

**Preview/Confirm Screen:**
- Photo preview (zoomable)
- Quick note input (optional): "Add a note..."
- Retake button (left)
- "Save to Inbox" button (right, primary)

**Gallery Screen (swipe up or tap thumbnail):**
- Grid of recent captures (last 7 days)
- Tap to view full image
- Swipe down to close

**Navigation:**
- No bottom tabs
- No hamburger menu
- Simple: Camera → (preview) → Camera

---

## 4. Technical Requirements

### Mobile Changes

1. **Remove:** Bottom tab navigator, Search screen, Vendor detail screens, Receipt detail screens, Estimate linking
2. **Simplify:** Auth screen (keep magic link but auto-redirect if session exists)
3. **Add:** Fullscreen camera on launch, Quick note input on preview, Success confirmation toast/screen

### Web Changes

1. **Add Inbox Tab:**
   - New top-level navigation tab "Inbox (N)" with badge count
   - Grid/list view of `status='inbox'` receipts
   - AI-extracted data display (read-only initially)
   - Edit form for: vendor (required), estimate (optional), all receipt fields
   - "Quick Confirm" vs "Edit & Confirm" actions

2. **Inbox Processing Flow:**
   - Select vendor → (if contract) suggest estimates → Confirm → Status changes to `confirmed`
   - Confirmed receipts appear in normal vendor/receipt flows

3. **Dashboard Filter:**
   - Exclude `status='inbox'` receipts from all financial totals

### Data Model

**Receipts table (additions):**
- `status`: 'inbox' | 'confirmed' (default: 'confirmed' for web, 'inbox' for mobile)
- `mobile_note`: text (optional quick note from mobile capture)
- `captured_by`: FK to auth.users (who took the photo)

**Edge Function (OCR):**
- Existing OCR endpoint works as-is
- Returns extracted data + confidence score
- Mobile saves raw OCR data; web displays it for confirmation

---

## 5. Success Criteria

- Mobile: Open app → capture receipt → save in < 10 seconds
- Mobile: No navigation decisions required (single flow)
- Web: Process inbox item → assign vendor → confirm in < 30 seconds
- Web: Inbox badge shows accurate count of unprocessed captures
- Both: Receipt appears in correct vendor/estimate after confirmation

---

## 6. Out of Scope

- Mobile vendor search/creation (do it on web)
- Mobile estimate linking (do it on web)
- Mobile receipt editing (delete/re-capture if wrong)
- Mobile dashboard or financial summaries
- Mobile document management

---

## 7. Future Considerations

- Auto-suggest vendor based on GPS location (if multiple Home Depots)
- Auto-suggest vendor based on previous captures (ML pattern matching)
- Batch process multiple receipts at once on web
- Mobile push notification when receipt is processed on web

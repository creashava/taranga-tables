# Taranga Tables Quality Assurance & Compliance Audit

This document validates compliance with the **Central Consumer Protection Authority (CCPA) Dark Patterns Prevention Guidelines (2023)** and DPDP / privacy requirements per **SPEC.md Section 9.5**.

---

## 1. CCPA Dark Pattern Prevention Checklist

| Dark Pattern Category | CCPA Definition | Taranga Implementation & Safeguard | Test Reference | Verified |
|---|---|---|---|:---:|
| **False Urgency** | Creating artificial scarcity or false deadlines (e.g., 'only 2 left', 'last chance') | Prohibited by CI banned-phrase lint. Neutral scheduling copy used everywhere. | `tests/p0-at18.test.ts`, `tests/p5-tables-at11-at21.test.ts` | ✅ PASS |
| **Basket Sneaking** | Adding items, add-ons or costs without explicit consent | No automatic add-ons; zero hidden service charges. | `tests/p5-tables-at11-at21.test.ts` | ✅ PASS |
| **Confirm Shaming** | Using guilt or emotionally charged phrases to prevent opting out | Prohibited by banned-phrase lint. Skip button uses neutral copy: *"No problem. Maybe another time."* | `tests/p0-at18.test.ts`, `tests/p5-tables-at11-at21.test.ts` | ✅ PASS |
| **Forced Action** | Requiring users to take unrelated actions or bundled consents | Unbundled consents per purpose (**R1/AT2**). Check-in and letters never require sharing social media. | `tests/p2-onboarding-at1-at4.test.ts` | ✅ PASS |
| **Subscription Trap** | Making cancellation convoluted or difficult | One-click kind withdrawal (`POST /api/me/withdraw`) and immediate deletion (`DELETE /api/me`). | `tests/p6-safety-at10-at12-at16.test.ts` | ✅ PASS |
| **Interface Interference** | Visually hiding choices or manipulating button prominence | Accept and Skip buttons are rendered with equal visual weight and tap size (**R7**). | `tests/p5-tables-at11-at21.test.ts` | ✅ PASS |
| **Bait and Switch** | Deceptive results differing from user expectation | Transparent 4-week wave schedule; no automated algorithm surprises without host approval. | `tests/p3-matching-at5.test.ts` | ✅ PASS |
| **Drip Pricing** | Hiding fees until late checkout | In the deposit arm, ₹X refundable amount is disclosed upfront before payment confirmation (**AT11**). | `tests/p5-tables-at11-at21.test.ts` | ✅ PASS |
| **Disguised Advertisements** | Native ads designed to mimic organic content | Zero ads, zero sponsorships, zero sponsored listings. Public cafe venues are purely community locations. | `tests/p0-at20.test.tsx` | ✅ PASS |
| **Nagging** | Repeated unwanted popups interrupting user task flow | No push notifications, no nagging modals, strict maximum of 1 notification per day (**AT9**). | `tests/p4-letters-at6-at9.test.ts` | ✅ PASS |
| **Trick Wording** | Confusing double-negatives or pre-ticked checkboxes | All checkboxes are strictly unticked by default (**R12/AT2**); plain language used in English and Kannada. | `tests/p2-onboarding-at1-at4.test.ts` | ✅ PASS |
| **SaaS Billing Traps** | Recurring charges without prior reminders | Zero recurring subscriptions; each Wave is a standalone four-week pilot. | Architecture check | ✅ PASS |
| **Rogue Malware / Trackers** | Silent tracking or bundling third-party scripts | Zero third-party trackers, zero advertising SDKs, strict data minimisation (**AT3/AT10**). | `tests/p2-onboarding-at1-at4.test.ts` | ✅ PASS |

---

## 2. Digital Personal Data Protection (DPDP) Compliance
* **Data Minimisation (Section 9.4)**: No DOB stored (only `is_18_plus`), no phone number stored, no precise GPS coordinates, no raw check-in answers stored (**AT3**).
* **Right to Erasure (AT16)**: `DELETE /api/me` immediately removes profile, consents, letters, and memberships, and anonymises event log entries.
* **Data Portability (AT16)**: `GET /api/me/export` delivers complete JSON personal data bundle.
* **Mutual Content Isolation (AT13)**: Member blocking prevents reciprocal display of letters and notes and alerts the host for pod rematching.

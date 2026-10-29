# Taranga Tables — UI Screenshots

This directory holds captured responsive screenshots of every screen at the three standard breakpoints:
- **360×740** — Primary mobile baseline (target for all members)
- **390×844** — iPhone Pro size
- **768×1024** — Tablet / host console

All screenshots were captured using automated headless Chromium / Playwright (`node scripts/capture-all-screens.mjs`) against the production deployment. Total screenshots: **69**.

---

## Screens by Phase

### Phase P2: Onboarding (M1–M6)
| Screen | Route | 360×740 (Mobile) | 390×844 (iPhone) | 768×1024 (Tablet) |
|---|---|---|---|---|
| Landing / Sign-in | `/signin` | [360×740](p2_m1_landing_360x740.png) | [390×844](p2_m1_landing_390x844.png) | [768×1024](p2_m1_landing_768x1024.png) |
| Onboarding Stepper | `/onboarding` | [360×740](p2_m3_onboarding_360x740.png) | [390×844](p2_m3_onboarding_390x844.png) | [768×1024](p2_m3_onboarding_768x1024.png) |
| Consents | `/consents` | [360×740](p2_m4_consents_360x740.png) | [390×844](p2_m4_consents_390x844.png) | [768×1024](p2_m4_consents_768x1024.png) |
| Waitlist | `/waitlist` | [360×740](p2_m6_waitlist_360x740.png) | [390×844](p2_m6_waitlist_390x844.png) | [768×1024](p2_m6_waitlist_768x1024.png) |

### Phase P4: Letters & Closing (M7–M9)
| Screen | Route | 360×740 (Mobile) | 390×844 (iPhone) | 768×1024 (Tablet) |
|---|---|---|---|---|
| Pod Home | `/pod` | [360×740](p4_m7_pod_home_360x740.png) | [390×844](p4_m7_pod_home_390x844.png) | [768×1024](p4_m7_pod_home_768x1024.png) |
| Write Letter | `/pod/write` | [360×740](p4_m7_write_letter_360x740.png) | [390×844](p4_m7_write_letter_390x844.png) | [768×1024](p4_m7_write_letter_768x1024.png) |
| Letters (Unlock) | `/pod/letters` | [360×740](p4_m8_letters_unlock_360x740.png) | [390×844](p4_m8_letters_unlock_390x844.png) | [768×1024](p4_m8_letters_unlock_768x1024.png) |
| Closing Screen | `/pod/closing` | [360×740](p4_m9_closing_screen_360x740.png) | [390×844](p4_m9_closing_screen_390x844.png) | [768×1024](p4_m9_closing_screen_768x1024.png) |

### Phase P5: Tables & Meetups (M10–M12, H4–H5)
| Screen | Route | 360×740 (Mobile) | 390×844 (iPhone) | 768×1024 (Tablet) |
|---|---|---|---|---|
| RSVP | `/pod/rsvp` | [360×740](p5_m10_rsvp_360x740.png) | [390×844](p5_m10_rsvp_390x844.png) | [768×1024](p5_m10_rsvp_768x1024.png) |
| Table Day | `/pod/table/day` | [360×740](p5_m11_table_day_360x740.png) | [390×844](p5_m11_table_day_390x844.png) | [768×1024](p5_m11_table_day_768x1024.png) |
| Stretch Cards | `/pod/stretch` | [360×740](p5_m12_stretch_cards_360x740.png) | [390×844](p5_m12_stretch_cards_390x844.png) | [768×1024](p5_m12_stretch_cards_768x1024.png) |
| Pod Notes | `/pod/notes` | [360×740](p5_m12_pod_notes_360x740.png) | [390×844](p5_m12_pod_notes_390x844.png) | [768×1024](p5_m12_pod_notes_768x1024.png) |
| Host Check-in | `/host/meetups/m-kaveri-1/checkin` | [360×740](p5_h5_host_checkin_360x740.png) | [390×844](p5_h5_host_checkin_390x844.png) | [768×1024](p5_h5_host_checkin_768x1024.png) |

### Phase P7: Polish (H8)
| Screen | Route | 360×740 (Mobile) | 390×844 (iPhone) | 768×1024 (Tablet) |
|---|---|---|---|---|
| Host Metrics | `/host/metrics` | [360×740](p7_h8_host_metrics_360x740.png) | [390×844](p7_h8_host_metrics_390x844.png) | [768×1024](p7_h8_host_metrics_768x1024.png) |
| Host Safety Queue | `/host/safety` | [360×740](p7_h6_host_safety_360x740.png) | [390×844](p7_h6_host_safety_390x844.png) | [768×1024](p7_h6_host_safety_768x1024.png) |
| Settings | `/settings` | [360×740](p7_m15_settings_360x740.png) | [390×844](p7_m15_settings_390x844.png) | [768×1024](p7_m15_settings_768x1024.png) |

### Phase P8: v2.0 Features (M13, M14, M16, M18, H3b, H9, H10)
| Screen | Route | 360×740 (Mobile) | 390×844 (iPhone) | 768×1024 (Tablet) |
|---|---|---|---|---|
| Opener Card | `/pod/opener` | [360×740](p8_m13_opener_card_360x740.png) | [390×844](p8_m13_opener_card_390x844.png) | [768×1024](p8_m13_opener_card_768x1024.png) |
| Seen Cards | `/pod/seen` | [360×740](p8_m14_seen_cards_360x740.png) | [390×844](p8_m14_seen_cards_390x844.png) | [768×1024](p8_m14_seen_cards_768x1024.png) |
| Quests & Passport | `/pod/quests` | [360×740](p8_m16_quests_passport_360x740.png) | [390×844](p8_m16_quests_passport_390x844.png) | [768×1024](p8_m16_quests_passport_768x1024.png) |
| From Taranga Events | `/pod/events` | [360×740](p8_m18_taranga_events_360x740.png) | [390×844](p8_m18_taranga_events_390x844.png) | [768×1024](p8_m18_taranga_events_768x1024.png) |
| Letter Box Print | `/host/pods/pod-a/print` | [360×740](p8_h3b_letter_box_print_360x740.png) | [390×844](p8_h3b_letter_box_print_390x844.png) | [768×1024](p8_h3b_letter_box_print_768x1024.png) |
| Content Console | `/host/content` | [360×740](p8_h9_content_console_360x740.png) | [390×844](p8_h9_content_console_390x844.png) | [768×1024](p8_h9_content_console_768x1024.png) |
| Events Console | `/host/events` | [360×740](p8_h10_events_console_360x740.png) | [390×844](p8_h10_events_console_390x844.png) | [768×1024](p8_h10_events_console_768x1024.png) |

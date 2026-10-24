-- Taranga Tables - Initial Seed Data (Pilot-First)
-- 1 Cycle, 2 Venues, Prompts from Section 8.4, 1 Host, 12 Fake Users, 2 Pods (Pod A: Free, Pod B: Deposit)

-- 1. Venues in Mysuru (Public spaces only)
insert into venues (id, name, area, public_place, capacity, contact) values
  ('11111111-1111-1111-1111-111111111101', 'Old House Cafe', 'Gokulam', true, 30, 'Old House Staff'),
  ('11111111-1111-1111-1111-111111111102', 'Minimalist Coffee Studio', 'Jayalakshmipuram', true, 20, 'Minimalist Staff')
on conflict (id) do nothing;

-- 2. Cycles (Wave 1: Mysuru 4-Week Pilot)
insert into cycles (id, name, starts_on, ends_on) values
  ('22222222-2222-2222-2222-222222222201', 'Wave 1 - Mysuru Pilot', '2026-11-01', '2026-11-28')
on conflict (id) do nothing;

-- 3. Prompts from SPEC.md Section 8.4
-- Letter prompts
insert into prompts (id, kind, level, body_en, body_kn, active) values
  ('33333333-3333-3333-3333-333333333101', 'letter', 1, 'Something small that made your week better.', 'ನಿಮ್ಮ ವಾರವನ್ನು ಉತ್ತಮಗೊಳಿಸಿದ ಒಂದು ಸಣ್ಣ ವಿಷಯ.', true),
  ('33333333-3333-3333-3333-333333333102', 'letter', 2, 'A place in Mysuru that feels like yours, and why.', 'ನಿಮ್ಮದು ಎಂದು ಭಾವಿಸುವ ಮೈಸೂರಿನ ಒಂದು ಸ್ಥಳ ಮತ್ತು ಏಕೆ.', true),
  ('33333333-3333-3333-3333-333333333103', 'letter', 3, 'Something you''re quietly working on, or hoping for.', 'ನೀವು ಶ್ರಮಿಸುತ್ತಿರುವ ಅಥವಾ ಆಶಿಸುತ್ತಿರುವ ಒಂದು ವಿಷಯ.', true),

-- Table cards
  ('33333333-3333-3333-3333-333333333201', 'table', 1, 'What''s the best thing you ate this month?', 'ಈ ತಿಂಗಳು ನೀವು ತಿಂದ ಅತ್ಯುತ್ತಮ ಆಹಾರ ಯಾವುದು?', true),
  ('33333333-3333-3333-3333-333333333202', 'table', 2, 'What''s something you changed your mind about recently?', 'ಇತ್ತೀಚೆಗೆ ನೀವು ನಿಮ್ಮ ಮನಸ್ಸನ್ನು ಬದಲಾಯಿಸಿಕೊಂಡ ಒಂದು ವಿಷಯವೇನು?', true),
  ('33333333-3333-3333-3333-333333333203', 'table', 3, 'When do you feel most like yourself?', 'ನೀವು ಯಾವಾಗ ನಿಮ್ಮಂತೆಯೇ ಹೆಚ್ಚು ಇರುತ್ತೀರಿ?', true),

-- Stretch cards
  ('33333333-3333-3333-3333-333333333301', 'stretch', 1, 'Tell one person at the next table something you liked about their letter.', 'ಮುಂದಿನ ಮೇಜಿನಲ್ಲಿರುವ ಒಬ್ಬ ವ್ಯಕ್ತಿಗೆ ಅವರ ಪತ್ರದಲ್ಲಿ ನಿಮಗೆ ಇಷ್ಟವಾದ ವಿಷಯ ತಿಳಿಸಿ.', true),
  ('33333333-3333-3333-3333-333333333302', 'stretch', 2, 'Ask someone a question you''d normally skip.', 'ನೀವು ಸಾಮಾನ್ಯವಾಗಿ ಕೇಳಲು ಹಿಂದೇಟು ಹಾಕುವ ಪ್ರಶ್ನೆಯನ್ನು ಕೇಳಿ.', true),
  ('33333333-3333-3333-3333-333333333303', 'stretch', 3, 'Share one thing you''re nervous about right now.', 'ಈ ಸಮಯದಲ್ಲಿ ನಿಮ್ಮನ್ನು ಆತಂಕಕ್ಕೊಳಪಡಿಸುವ ಒಂದು ವಿಷಯವನ್ನು ಹಂಚಿಕೊಳ್ಳಿ.', true)
on conflict (id) do nothing;

-- 4. Host & Admin Profile
insert into profiles (id, display_name, role, status, is_18_plus, age_method, area, letter_hour) values
  ('00000000-0000-0000-0000-000000000001', 'Varun (Host)', 'host', 'completed', true, 'self_declared_stub', 'Jayalakshmipuram', 20)
on conflict (id) do nothing;

-- 5. 12 Fake Members (Explicitly marked as fake pilot test members)
insert into profiles (id, display_name, role, status, is_18_plus, age_method, wants_women_only, languages, interests, talk_vs_listen, planned_vs_spontaneous, area, letter_hour) values
  -- Pod A candidates (Free arm)
  ('aaaa0001-0000-0000-0000-000000000001', 'Aarav-Fake', 'member', 'in_pod', true, 'self_declared_stub', false, '{"English","Kannada"}', '{"Filter Coffee","Cycling","Books"}', 3, 2, 'Gokulam', 20),
  ('aaaa0002-0000-0000-0000-000000000002', 'Bhavana-Fake', 'member', 'in_pod', true, 'self_declared_stub', false, '{"English","Kannada"}', '{"Architecture","Photography"}', 2, 4, 'Jayalakshmipuram', 20),
  ('aaaa0003-0000-0000-0000-000000000003', 'Chetan-Fake', 'member', 'in_pod', true, 'self_declared_stub', false, '{"English","Hindi"}', '{"Books","Heritage Walks"}', 4, 3, 'VV Mohalla', 20),
  ('aaaa0004-0000-0000-0000-000000000004', 'Deepa-Fake', 'member', 'in_pod', true, 'self_declared_stub', false, '{"English","Kannada"}', '{"Filter Coffee","Gardening"}', 3, 3, 'Gokulam', 20),
  ('aaaa0005-0000-0000-0000-000000000005', 'Eshwar-Fake', 'member', 'in_pod', true, 'self_declared_stub', false, '{"English"}', '{"Podcasts","Running"}', 2, 2, 'KRS Road', 20),
  ('aaaa0006-0000-0000-0000-000000000006', 'Farah-Fake', 'member', 'in_pod', true, 'self_declared_stub', false, '{"English","Kannada"}', '{"Art","Books"}', 4, 4, 'Jayalakshmipuram', 20),

  -- Pod B candidates (Deposit arm)
  ('bbbb0001-0000-0000-0000-000000000001', 'Girish-Fake', 'member', 'in_pod', true, 'self_declared_stub', false, '{"English","Kannada"}', '{"Filter Coffee","Writing"}', 3, 3, 'Gokulam', 20),
  ('bbbb0002-0000-0000-0000-000000000002', 'Harini-Fake', 'member', 'in_pod', true, 'self_declared_stub', false, '{"English","Kannada"}', '{"Bird Watching","History"}', 2, 4, 'Kuvempunagar', 20),
  ('bbbb0003-0000-0000-0000-000000000003', 'Imran-Fake', 'member', 'in_pod', true, 'self_declared_stub', false, '{"English","Hindi"}', '{"Writing","Poetry"}', 4, 2, 'Saraswathipuram', 20),
  ('bbbb0004-0000-0000-0000-000000000004', 'Jyothi-Fake', 'member', 'in_pod', true, 'self_declared_stub', false, '{"English","Kannada"}', '{"Filter Coffee","Cinema"}', 3, 3, 'Gokulam', 20),
  ('bbbb0005-0000-0000-0000-000000000005', 'Karthik-Fake', 'member', 'in_pod', true, 'self_declared_stub', false, '{"English"}', '{"Yoga","Reading"}', 2, 3, 'Jayalakshmipuram', 20),
  ('bbbb0006-0000-0000-0000-000000000006', 'Leela-Fake', 'member', 'in_pod', true, 'self_declared_stub', false, '{"English","Kannada"}', '{"Cinema","History"}', 4, 3, 'VV Mohalla', 20)
on conflict (id) do nothing;

-- 6. Consents for members
insert into consents (user_id, purpose, notice_version, granted)
select id, 'core_service', '1.0', true from profiles where role = 'member';
insert into consents (user_id, purpose, notice_version, granted)
select id, 'safety_checkin', '1.0', true from profiles where role = 'member';
insert into consents (user_id, purpose, notice_version, granted)
select id, 'whatsapp_contact', '1.0', true from profiles where role = 'member';

-- 7. Screenings (all non-elevated for initial seed)
insert into screenings (user_id, instrument_version, band, helpline_shown)
select id, '1.0-draft', 'none', false from profiles where role = 'member';

-- 8. Pods: Pod A (Free) and Pod B (Deposit ₹200)
insert into pods (id, cycle_id, name, status, women_only, capacity, arm, deposit_inr, host_id, default_venue_id) values
  ('aaaa0000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222201', 'Kaveri Wave (Free)', 'letters', false, 6, 'free', 0, '00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111101'),
  ('bbbb0000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222201', 'Chamundi Wave (Deposit)', 'letters', false, 6, 'deposit', 200, '00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111102')
on conflict (id) do nothing;

-- 9. Pod Memberships
insert into pod_members (pod_id, user_id) values
  ('aaaa0000-0000-0000-0000-000000000000', 'aaaa0001-0000-0000-0000-000000000001'),
  ('aaaa0000-0000-0000-0000-000000000000', 'aaaa0002-0000-0000-0000-000000000002'),
  ('aaaa0000-0000-0000-0000-000000000000', 'aaaa0003-0000-0000-0000-000000000003'),
  ('aaaa0000-0000-0000-0000-000000000000', 'aaaa0004-0000-0000-0000-000000000004'),
  ('aaaa0000-0000-0000-0000-000000000000', 'aaaa0005-0000-0000-0000-000000000005'),
  ('aaaa0000-0000-0000-0000-000000000000', 'aaaa0006-0000-0000-0000-000000000006'),

  ('bbbb0000-0000-0000-0000-000000000000', 'bbbb0001-0000-0000-0000-000000000001'),
  ('bbbb0000-0000-0000-0000-000000000000', 'bbbb0002-0000-0000-0000-000000000002'),
  ('bbbb0000-0000-0000-0000-000000000000', 'bbbb0003-0000-0000-0000-000000000003'),
  ('bbbb0000-0000-0000-0000-000000000000', 'bbbb0004-0000-0000-0000-000000000004'),
  ('bbbb0000-0000-0000-0000-000000000000', 'bbbb0005-0000-0000-0000-000000000005'),
  ('bbbb0000-0000-0000-0000-000000000000', 'bbbb0006-0000-0000-0000-000000000006')
on conflict (pod_id, user_id) do nothing;

-- 10. Meetups (3 meetups for each pod)
insert into meetups (id, pod_id, seq, starts_at, ends_at, venue_id, status) values
  ('aaaa0000-0000-0000-0000-000000000101', 'aaaa0000-0000-0000-0000-000000000000', 1, '2026-11-07 17:30:00+05:30', '2026-11-07 19:00:00+05:30', '11111111-1111-1111-1111-111111111101', 'scheduled'),
  ('aaaa0000-0000-0000-0000-000000000102', 'aaaa0000-0000-0000-0000-000000000000', 2, '2026-11-14 17:30:00+05:30', '2026-11-14 19:00:00+05:30', '11111111-1111-1111-1111-111111111101', 'scheduled'),
  ('aaaa0000-0000-0000-0000-000000000103', 'aaaa0000-0000-0000-0000-000000000000', 3, '2026-11-21 17:30:00+05:30', '2026-11-21 19:00:00+05:30', '11111111-1111-1111-1111-111111111101', 'scheduled'),

  ('bbbb0000-0000-0000-0000-000000000101', 'bbbb0000-0000-0000-0000-000000000000', 1, '2026-11-08 17:30:00+05:30', '2026-11-08 19:00:00+05:30', '11111111-1111-1111-1111-111111111102', 'scheduled'),
  ('bbbb0000-0000-0000-0000-000000000102', 'bbbb0000-0000-0000-0000-000000000000', 2, '2026-11-15 17:30:00+05:30', '2026-11-15 19:00:00+05:30', '11111111-1111-1111-1111-111111111102', 'scheduled'),
  ('bbbb0000-0000-0000-0000-000000000103', 'bbbb0000-0000-0000-0000-000000000000', 3, '2026-11-22 17:30:00+05:30', '2026-11-22 19:00:00+05:30', '11111111-1111-1111-1111-111111111102', 'scheduled')
on conflict (id) do nothing;

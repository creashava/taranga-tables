import { z } from 'zod';

export const ageDeclarationSchema = z.object({
  email: z.string().email(),
  is18Plus: z.boolean(),
});

export const onboardingProfileSchema = z.object({
  userId: z.string().min(1),
  displayName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(30, 'Name must be under 30 characters'),
  is18Plus: z.literal(true, {
    errorMap: () => ({ message: 'You must be 18 or older to join Taranga Tables.' }),
  }),
  gender: z.string().optional(),
  wantsWomenOnly: z.boolean().default(false),
  languages: z.array(z.string()).min(1, 'Please select at least one language'),
  interests: z
    .array(z.string())
    .min(1, 'Please select at least one interest')
    .max(5, 'Maximum of 5 interests allowed'),
  talkVsListen: z.number().int().min(1).max(5).default(3),
  plannedVsSpontaneous: z.number().int().min(1).max(5).default(3),
  availability: z
    .array(
      z.object({
        dow: z.number().int().min(0).max(6),
        part: z.literal('evening'),
      })
    )
    .min(1, 'Please select at least one evening'),
  area: z.string().min(2, 'Please select your neighbourhood in Mysuru'),
  letterHour: z.number().int().min(7).max(22).default(20),
});

export const consentSubmissionSchema = z.object({
  userId: z.string().min(1),
  purpose: z.enum(['core_service', 'safety_checkin', 'whatsapp_contact', 'content_photos']),
  noticeVersion: z.string().default('1.0'),
  granted: z.boolean(),
});

export const checkinSubmissionSchema = z.object({
  userId: z.string().min(1),
  answers: z.record(z.string(), z.number().int().min(0).max(3)),
});

/**
 * Calculates reveal time in Asia/Kolkata timezone (UTC+5:30)
 * Reveal time is the next occurrence of reader's letter_hour after the later of:
 * - author's letter submission time
 * - reader's own letter submission time for the same sequence
 */
export function calculateRevealTime(
  authorSubmittedAt: string | Date,
  readerSubmittedAt: string | Date,
  readerLetterHour: number = 20
): Date {
  const authorDate = new Date(authorSubmittedAt);
  const readerDate = new Date(readerSubmittedAt);
  const baseTime = new Date(Math.max(authorDate.getTime(), readerDate.getTime()));

  // Asia/Kolkata is UTC + 5.5 hours (+330 minutes)
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const istBaseTime = new Date(baseTime.getTime() + IST_OFFSET_MS);

  const istYear = istBaseTime.getUTCFullYear();
  const istMonth = istBaseTime.getUTCMonth();
  const istDate = istBaseTime.getUTCDate();
  const istHours = istBaseTime.getUTCHours();
  const istMinutes = istBaseTime.getUTCMinutes();
  const istSeconds = istBaseTime.getUTCSeconds();
  const istMillis = istBaseTime.getUTCMilliseconds();

  // Candidate: readerLetterHour on the same IST day
  const candidateTodayUTC = Date.UTC(istYear, istMonth, istDate, readerLetterHour, 0, 0, 0) - IST_OFFSET_MS;
  const candidateToday = new Date(candidateTodayUTC);

  if (baseTime.getTime() <= candidateToday.getTime()) {
    return candidateToday;
  }

  // Otherwise, next day at readerLetterHour
  const candidateNextDayUTC = Date.UTC(istYear, istMonth, istDate + 1, readerLetterHour, 0, 0, 0) - IST_OFFSET_MS;
  return new Date(candidateNextDayUTC);
}

export function isLetterUnlocked(
  now: Date,
  authorSubmittedAt: string | Date,
  readerSubmittedAt: string | Date,
  readerLetterHour: number = 20
): boolean {
  const revealTime = calculateRevealTime(authorSubmittedAt, readerSubmittedAt, readerLetterHour);
  return now.getTime() >= revealTime.getTime();
}

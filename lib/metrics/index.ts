import { MemoryDatabase } from '@/lib/db/memory-db';

export interface SecondMeetingRateResult {
  arm: 'free' | 'deposit';
  attended_first: number;
  attended_second: number;
  second_meeting_pct: number;
}

export interface ShowRateFirstTableResult {
  arm: 'free' | 'deposit';
  said_yes: number;
  showed_up: number;
  show_pct: number;
}

export interface PilotMetricsSummary {
  secondMeetingRate: SecondMeetingRateResult[];
  showRateFirstTable: ShowRateFirstTableResult[];
  hoursTogetherByPod: Array<{ podId: string; podName: string; arm: string; hours: number }>;
  safetyMetrics: {
    openReports: number;
    resolvedReports: number;
    highSeverityCount: number;
  };
  feedbackAverages: {
    avgFeltSafe: number;
    avgFeltIncluded: number;
    returnIntentPct: number;
    totalResponses: number;
  };
}

/**
 * Calculates v_second_meeting_rate (SPEC Section 10.2, AT17)
 * Ratio of members who attended Table 1 and also returned for Table 2.
 */
export function calculateSecondMeetingRate(db: MemoryDatabase): SecondMeetingRateResult[] {
  const arms: Array<'free' | 'deposit'> = ['free', 'deposit'];
  const results: SecondMeetingRateResult[] = [];

  for (const arm of arms) {
    // Find all pods with this arm
    const pods = Array.from(db.pods.values()).filter((p) => p.arm === arm);
    const podIds = new Set(pods.map((p) => p.id));

    // Find Table 1 attendees in these pods
    const table1Attendees = new Set<string>();
    // Find Table 2 attendees in these pods
    const table2Attendees = new Set<string>();

    for (const meetup of db.meetups.values()) {
      if (!podIds.has(meetup.pod_id)) continue;

      const attendees = db.attendance.filter((a) => a.meetup_id === meetup.id);
      for (const a of attendees) {
        if (meetup.seq === 1) {
          table1Attendees.add(`${meetup.pod_id}:${a.user_id}`);
        } else if (meetup.seq === 2) {
          table2Attendees.add(`${meetup.pod_id}:${a.user_id}`);
        }
      }
    }

    const attendedFirst = table1Attendees.size;
    let attendedSecond = 0;
    for (const key of table1Attendees) {
      if (table2Attendees.has(key)) {
        attendedSecond++;
      }
    }

    const pct = attendedFirst > 0 ? Math.round((1000.0 * attendedSecond) / attendedFirst) / 10 : 0;

    results.push({
      arm,
      attended_first: attendedFirst,
      attended_second: attendedSecond,
      second_meeting_pct: pct,
    });
  }

  return results;
}

/**
 * Calculates v_show_rate_first_table (SPEC Section 10.2, AT17)
 * Percentage of members who RSVPed 'yes' for Table 1 and actually showed up.
 */
export function calculateShowRateFirstTable(db: MemoryDatabase): ShowRateFirstTableResult[] {
  const arms: Array<'free' | 'deposit'> = ['free', 'deposit'];
  const results: ShowRateFirstTableResult[] = [];

  for (const arm of arms) {
    const pods = Array.from(db.pods.values()).filter((p) => p.arm === arm);
    const podIds = new Set(pods.map((p) => p.id));

    // Find all Table 1 meetups in these pods
    const table1Meetups = Array.from(db.meetups.values()).filter(
      (m) => podIds.has(m.pod_id) && m.seq === 1
    );

    let saidYesCount = 0;
    let showedUpCount = 0;

    for (const meetup of table1Meetups) {
      const rsvps = Array.from(db.rsvps.values()).filter(
        (r) => r.meetup_id === meetup.id && r.response === 'yes'
      );
      saidYesCount += rsvps.length;

      for (const r of rsvps) {
        const attended = db.attendance.some(
          (a) => a.meetup_id === meetup.id && a.user_id === r.user_id
        );
        if (attended) {
          showedUpCount++;
        }
      }
    }

    const pct = saidYesCount > 0 ? Math.round((1000.0 * showedUpCount) / saidYesCount) / 10 : 0;

    results.push({
      arm,
      said_yes: saidYesCount,
      showed_up: showedUpCount,
      show_pct: pct,
    });
  }

  return results;
}

/**
 * Calculates full pilot metrics summary (SPEC Section 10.2)
 */
export function calculatePilotMetrics(db: MemoryDatabase): PilotMetricsSummary {
  const secondMeetingRate = calculateSecondMeetingRate(db);
  const showRateFirstTable = calculateShowRateFirstTable(db);

  // Hours together by pod
  const hoursTogetherByPod = Array.from(db.pods.values()).map((pod) => {
    let hours = 0;
    const podMeetups = Array.from(db.meetups.values()).filter(
      (m) => m.pod_id === pod.id && m.status === 'done'
    );
    for (const m of podMeetups) {
      const attendedCount = db.attendance.filter((a) => a.meetup_id === m.id).length;
      if (attendedCount > 0) {
        const durationHours =
          (new Date(m.ends_at).getTime() - new Date(m.starts_at).getTime()) / 3600000;
        hours += durationHours;
      }
    }
    return {
      podId: pod.id,
      podName: pod.name,
      arm: pod.arm,
      hours: Math.round(hours * 10) / 10,
    };
  });

  // Safety metrics
  const allReports = Array.from(db.safetyReports.values());
  const openReports = allReports.filter((r) => r.status !== 'resolved').length;
  const resolvedReports = allReports.filter((r) => r.status === 'resolved').length;
  const highSeverityCount = allReports.filter((r) => r.severity === 'high').length;

  // Feedback averages
  const allFeedback = Array.from(db.feedback.values());
  const total = allFeedback.length;
  let avgFeltSafe = 0;
  let avgFeltIncluded = 0;
  let returnIntentPct = 0;

  if (total > 0) {
    const sumSafe = allFeedback.reduce((acc, f) => acc + f.felt_safe, 0);
    const sumInc = allFeedback.reduce((acc, f) => acc + f.felt_included, 0);
    const returnCount = allFeedback.filter((f) => f.would_return).length;

    avgFeltSafe = Math.round((10.0 * sumSafe) / total) / 10;
    avgFeltIncluded = Math.round((10.0 * sumInc) / total) / 10;
    returnIntentPct = Math.round((100.0 * returnCount) / total);
  }

  return {
    secondMeetingRate,
    showRateFirstTable,
    hoursTogetherByPod,
    safetyMetrics: {
      openReports,
      resolvedReports,
      highSeverityCount,
    },
    feedbackAverages: {
      avgFeltSafe,
      avgFeltIncluded,
      returnIntentPct,
      totalResponses: total,
    },
  };
}

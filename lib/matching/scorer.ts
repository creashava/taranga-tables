import { MatchCandidate } from './types';

export function getSharedLanguages(members: MatchCandidate[]): string[] {
  if (members.length === 0) return [];
  let common = new Set(members[0].languages);
  for (let i = 1; i < members.length; i++) {
    common = new Set(members[i].languages.filter((l) => common.has(l)));
  }
  return Array.from(common);
}

export function getSharedAvailability(members: MatchCandidate[]): Array<{ dow: number; part: string }> {
  if (members.length === 0) return [];
  const slotKey = (s: { dow: number; part: string }) => `${s.dow}_${s.part}`;

  let commonSlots = new Set(members[0].availability.map(slotKey));

  for (let i = 1; i < members.length; i++) {
    const memberSlots = new Set(members[i].availability.map(slotKey));
    commonSlots = new Set(Array.from(commonSlots).filter((k) => memberSlots.has(k)));
  }

  return Array.from(commonSlots).map((k) => {
    const [dow, part] = k.split('_');
    return { dow: Number(dow), part };
  });
}

/**
 * Hard constraints check for adding a candidate to a pod (Section 6.1 & AT5)
 */
export function canAddCandidateToPod(podMembers: MatchCandidate[], candidate: MatchCandidate, isWomenOnlyPod: boolean): boolean {
  // 1. is_18_plus is true and status is waitlisted
  if (!candidate.is18Plus || candidate.status !== 'waitlisted') {
    return false;
  }

  // 2. Not an elevated screening band, unless host_followup_done is true
  if (candidate.screeningBand === 'elevated' && !candidate.hostFollowupDone) {
    return false;
  }

  // 5. women_only constraint:
  // - A member who wants women-only is never placed in a mixed pod.
  // - women_only pods contain only members who selected women-only option.
  if (isWomenOnlyPod) {
    if (!candidate.wantsWomenOnly) return false;
  } else {
    if (candidate.wantsWomenOnly) return false;
  }

  // 6. No blocked pair in the same pod
  for (const m of podMembers) {
    if (m.blockedUserIds.includes(candidate.id) || candidate.blockedUserIds.includes(m.id)) {
      return false;
    }
  }

  // Check pairwise compatibility with current pod members
  const proposed = [...podMembers, candidate];

  // 4. At least one shared language with every other pod member
  const sharedLangs = getSharedLanguages(proposed);
  if (sharedLangs.length === 0) {
    return false;
  }

  // 3. At least 2 shared availability slots with every other pod member
  const sharedSlots = getSharedAvailability(proposed);
  if (sharedSlots.length < 2) {
    return false;
  }

  return true;
}

/**
 * Validates whole pod constraints (Section 6.1 & AT5)
 */
export function validateFinalPod(members: MatchCandidate[], isWomenOnlyPod: boolean): boolean {
  // 7. Pod size 5 to 7
  if (members.length < 5 || members.length > 7) {
    return false;
  }

  // 5. Mixed pods must NOT have exactly one woman [JUDGMENT / AT5]
  if (!isWomenOnlyPod) {
    const femaleCount = members.filter((m) => m.gender?.toLowerCase() === 'female' || m.gender?.toLowerCase() === 'woman').length;
    if (femaleCount === 1) {
      return false;
    }
  }

  return true;
}

/**
 * Computes soft score according to Section 6.2
 */
export function calculatePodScore(members: MatchCandidate[]): {
  score: number;
  breakdown: { avgSharedInterests: number; comfortStdDev: number; areaProximity: number };
} {
  if (members.length < 2) {
    return { score: 0, breakdown: { avgSharedInterests: 0, comfortStdDev: 0, areaProximity: 0 } };
  }

  // 1. avg_pairwise_shared_interests_capped_at_2
  let totalPairs = 0;
  let totalShared = 0;
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const interestsA = new Set(members[i].interests);
      const sharedCount = members[j].interests.filter((item) => interestsA.has(item)).length;
      totalShared += Math.min(sharedCount, 2); // Capped at 2
      totalPairs++;
    }
  }
  const avgSharedInterests = totalPairs > 0 ? totalShared / totalPairs : 0;

  // 2. Diversity of comfort sliders (talk_vs_listen) stddev between 0.6 and 1.4
  const values = members.map((m) => m.talkVsListen);
  const mean = values.reduce((acc, v) => acc + v, 0) / values.length;
  const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length;
  const comfortStdDev = Math.sqrt(variance);

  let comfortBonus = 0;
  if (comfortStdDev >= 0.6 && comfortStdDev <= 1.4) {
    comfortBonus = 2; // Optimal diversity
  } else if (comfortStdDev > 0) {
    comfortBonus = 1;
  }

  // 3. Area proximity (count of members in top modal area)
  const areaCounts: Record<string, number> = {};
  members.forEach((m) => {
    areaCounts[m.area] = (areaCounts[m.area] || 0) + 1;
  });
  const maxInSameArea = Math.max(...Object.values(areaCounts));
  const areaProximity = maxInSameArea >= 3 ? 1 : 0.5;

  const score = Number((3 * avgSharedInterests + 2 * comfortBonus + 1 * areaProximity).toFixed(2));

  return {
    score,
    breakdown: {
      avgSharedInterests: Number(avgSharedInterests.toFixed(2)),
      comfortStdDev: Number(comfortStdDev.toFixed(2)),
      areaProximity,
    },
  };
}

/**
 * Builds the plain-language explanation line: "why these people" (Section 6.3 #3)
 */
export function buildWhyThesePeopleExplanation(
  members: MatchCandidate[],
  sharedLanguages: string[],
  sharedAvailability: Array<{ dow: number; part: string }>
): string {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayStrings = sharedAvailability.map((s) => dayNames[s.dow]).join(' & ');
  const langString = sharedLanguages.join(', ');

  // Find most common shared interests
  const interestCounts: Record<string, number> = {};
  members.forEach((m) => {
    m.interests.forEach((intr) => {
      interestCounts[intr] = (interestCounts[intr] || 0) + 1;
    });
  });

  const popularInterests = Object.entries(interestCounts)
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([intr]) => intr)
    .slice(0, 2);

  const interestPhrase = popularInterests.length > 0 ? popularInterests.join(' and ') : 'shared curiosity';

  return `Matched on shared ${interestPhrase}, shared ${dayStrings} evenings, in ${langString}.`;
}

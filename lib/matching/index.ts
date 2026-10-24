import { MatchCandidate, SuggestedPod, MatchingResult } from './types';
import {
  canAddCandidateToPod,
  validateFinalPod,
  calculatePodScore,
  getSharedLanguages,
  getSharedAvailability,
  buildWhyThesePeopleExplanation,
} from './scorer';

export * from './types';
export * from './scorer';

export function runMatchingAlgorithm(
  candidates: MatchCandidate[],
  defaultPodSize: number = 6
): MatchingResult {
  // Sort candidates by waiting time (longest waiting first)
  const pool = [...candidates].sort(
    (a, b) => new Date(a.waitingSince).getTime() - new Date(b.waitingSince).getTime()
  );

  // Split into candidates wanting women-only vs mixed
  const womenOnlyPool = pool.filter((c) => c.wantsWomenOnly);
  const mixedPool = pool.filter((c) => !c.wantsWomenOnly);

  const suggestedPods: SuggestedPod[] = [];
  const assignedCandidateIds = new Set<string>();

  // Helper to build pods from a specific pool
  function buildPodsFromPool(candidatePool: MatchCandidate[], isWomenOnly: boolean) {
    const unassigned = candidatePool.filter((c) => !assignedCandidateIds.has(c.id));

    while (unassigned.length >= 5) {
      // Seed with longest-waiting member
      const seed = unassigned[0];
      const currentPodMembers: MatchCandidate[] = [seed];
      assignedCandidateIds.add(seed.id);
      unassigned.splice(0, 1);

      // Greedy fill with best compatible members
      let candidateIndex = 0;
      while (candidateIndex < unassigned.length && currentPodMembers.length < defaultPodSize) {
        const candidate = unassigned[candidateIndex];
        if (canAddCandidateToPod(currentPodMembers, candidate, isWomenOnly)) {
          currentPodMembers.push(candidate);
          assignedCandidateIds.add(candidate.id);
          unassigned.splice(candidateIndex, 1);
        } else {
          candidateIndex++;
        }
      }

      // Check if pod meets whole-pod constraints (size 5-7, no single woman in mixed pod)
      if (validateFinalPod(currentPodMembers, isWomenOnly)) {
        const sharedLangs = getSharedLanguages(currentPodMembers);
        const sharedSlots = getSharedAvailability(currentPodMembers);
        const { score, breakdown } = calculatePodScore(currentPodMembers);
        const explanation = buildWhyThesePeopleExplanation(currentPodMembers, sharedLangs, sharedSlots);

        const podId = `sug-pod-${suggestedPods.length + 1}`;
        const podName = isWomenOnly
          ? `Suggested Women's Pod #${suggestedPods.length + 1}`
          : `Suggested Mixed Pod #${suggestedPods.length + 1}`;

        suggestedPods.push({
          id: podId,
          name: podName,
          members: currentPodMembers,
          score,
          isWomenOnly,
          arm: suggestedPods.length % 2 === 0 ? 'free' : 'deposit',
          sharedLanguages: sharedLangs,
          sharedAvailability: sharedSlots,
          explanation,
          breakdown,
        });
      } else {
        // Rollback assignments if pod failed validation (e.g. single woman in mixed pod or < 5 members)
        currentPodMembers.forEach((m) => {
          assignedCandidateIds.delete(m.id);
          unassigned.push(m);
        });
        break; // Stop greedy loop for this pool if cannot form valid pod
      }
    }
  }

  // 1. Build women-only pods first
  buildPodsFromPool(womenOnlyPool, true);

  // 2. Build mixed pods
  buildPodsFromPool(mixedPool, false);

  // Rank suggested pods by score descending
  suggestedPods.sort((a, b) => b.score - a.score);

  const unplacedCandidates = candidates.filter((c) => !assignedCandidateIds.has(c.id));

  return {
    suggestedPods,
    unplacedCandidates,
    totalCandidates: candidates.length,
  };
}

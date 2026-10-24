import { Profile } from '@/lib/db/types';

export interface MatchCandidate {
  id: string;
  displayName: string;
  is18Plus: boolean;
  status: string;
  screeningBand: 'none' | 'mild' | 'elevated';
  hostFollowupDone: boolean;
  wantsWomenOnly: boolean;
  gender?: string;
  languages: string[];
  interests: string[];
  talkVsListen: number;
  plannedVsSpontaneous: number;
  availability: Array<{ dow: number; part: 'morning' | 'afternoon' | 'evening' }>;
  area: string;
  blockedUserIds: string[];
  waitingSince: string;
}

export interface SuggestedPod {
  id: string;
  name: string;
  members: MatchCandidate[];
  score: number;
  isWomenOnly: boolean;
  arm: 'free' | 'deposit';
  sharedLanguages: string[];
  sharedAvailability: Array<{ dow: number; part: string }>;
  explanation: string;
  breakdown: {
    avgSharedInterests: number;
    comfortStdDev: number;
    areaProximity: number;
  };
}

export interface MatchingResult {
  suggestedPods: SuggestedPod[];
  unplacedCandidates: MatchCandidate[];
  totalCandidates: number;
}

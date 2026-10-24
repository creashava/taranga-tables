'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, ShieldCheck, Check } from 'lucide-react';

const MYSURU_AREAS = [
  'Gokulam',
  'Jayalakshmipuram',
  'VV Mohalla',
  'Kuvempunagar',
  'Saraswathipuram',
  'Vijayanagar',
  'Hebbal',
  'Chamundipuram',
  'Other Mysuru Area',
];

const AVAILABLE_LANGUAGES = ['Kannada', 'English', 'Hindi', 'Tamil', 'Telugu'];

const INTEREST_OPTIONS = [
  'Filter Coffee',
  'Books & Literature',
  'Architecture & Heritage',
  'Art & Sketching',
  'Cycling',
  'Gardening & Plants',
  'Writing & Poetry',
  'Podcasts',
  'Cinema & Theatre',
  'Board Games',
  'Cooking & Baking',
  'Yoga & Movement',
];

const DAYS_OF_WEEK = [
  { dow: 1, label: 'Mon' },
  { dow: 2, label: 'Tue' },
  { dow: 3, label: 'Wed' },
  { dow: 4, label: 'Thu' },
  { dow: 5, label: 'Fri' },
  { dow: 6, label: 'Sat' },
  { dow: 0, label: 'Sun' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [userId, setUserId] = useState('usr-test');
  const [error, setError] = useState<string | null>(null);
  const [isUnderageBlocked, setIsUnderageBlocked] = useState(false);

  // Form State
  const [is18Plus, setIs18Plus] = useState<boolean | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [area, setArea] = useState('Gokulam');
  const [languages, setLanguages] = useState<string[]>(['English']);
  const [interests, setInterests] = useState<string[]>([]);
  const [talkVsListen, setTalkVsListen] = useState(3);
  const [plannedVsSpontaneous, setPlannedVsSpontaneous] = useState(3);
  const [letterHour, setLetterHour] = useState(20);
  const [wantsWomenOnly, setWantsWomenOnly] = useState(false);
  const [gender, setGender] = useState<string>('prefer_not_to_say');
  const [selectedEvenings, setSelectedEvenings] = useState<number[]>([6, 0]); // Default Sat, Sun
  const [conductAgreed, setConductAgreed] = useState(false);

  useEffect(() => {
    const storedId = localStorage.getItem('taranga_user_id');
    if (storedId) {
      setUserId(storedId);
    } else {
      const generated = `usr-${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('taranga_user_id', generated);
      setUserId(generated);
    }
  }, []);

  const handleInterestToggle = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter((i) => i !== interest));
    } else {
      if (interests.length >= 5) {
        setError('You can pick up to 5 interests.');
        return;
      }
      setError(null);
      setInterests([...interests, interest]);
    }
  };

  const handleLanguageToggle = (lang: string) => {
    if (languages.includes(lang)) {
      if (languages.length === 1) return; // Keep at least one
      setLanguages(languages.filter((l) => l !== lang));
    } else {
      setLanguages([...languages, lang]);
    }
  };

  const handleEveningToggle = (dow: number) => {
    if (selectedEvenings.includes(dow)) {
      if (selectedEvenings.length === 1) return;
      setSelectedEvenings(selectedEvenings.filter((d) => d !== dow));
    } else {
      setSelectedEvenings([...selectedEvenings, dow]);
    }
  };

  const handleNext = async () => {
    setError(null);

    // Step 1 validation: Age 18+ (AT1)
    if (currentStep === 1) {
      if (is18Plus === false) {
        setIsUnderageBlocked(true);
        return;
      }
      if (is18Plus !== true) {
        setError('Please declare whether you are 18 years or older.');
        return;
      }
    }

    // Step 2 validation: Name & Area
    if (currentStep === 2) {
      if (displayName.trim().length < 2 || displayName.trim().length > 30) {
        setError('Please enter a display name between 2 and 30 characters.');
        return;
      }
    }

    // Step 3 validation: Interests & Language
    if (currentStep === 3) {
      if (interests.length === 0) {
        setError('Please pick at least one interest (up to 5).');
        return;
      }
    }

    // Step 5 validation: Evenings
    if (currentStep === 5) {
      if (selectedEvenings.length === 0) {
        setError('Please select at least one available evening.');
        return;
      }
    }

    // Step 6 validation & Submit
    if (currentStep === 6) {
      if (!conductAgreed) {
        setError('Please read and acknowledge the Code of Conduct.');
        return;
      }

      // Submit onboarding payload
      const payload = {
        userId,
        displayName: displayName.trim(),
        is18Plus: true,
        gender: wantsWomenOnly ? gender : undefined,
        wantsWomenOnly,
        languages,
        interests,
        talkVsListen,
        plannedVsSpontaneous,
        availability: selectedEvenings.map((dow) => ({ dow, part: 'evening' })),
        area,
        letterHour,
      };

      try {
        const res = await fetch('/api/onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json();
          setError(errData.message || 'Error saving profile.');
          return;
        }

        router.push('/consents');
      } catch (err) {
        setError('Failed to reach server. Please try again.');
      }
      return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, 6));
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  if (isUnderageBlocked) {
    return (
      <div className="flex-1 flex flex-col justify-center py-6 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-stone-200 flex items-center justify-center text-stone-700">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-paper-900">18+ Requirement</h1>
        <p className="text-sm text-paper-800 leading-relaxed max-w-xs mx-auto">
          Under India’s DPDP Act and Taranga Tables safety regulations, only adults 18 and older may join stranger pods.
        </p>
        <p className="text-xs text-muted-foreground">
          No profile information has been saved.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-between py-4">
      {/* Header & Step Indicator */}
      <header className="space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
          <span>Step {currentStep} of 6</span>
          <span className="text-wave-700 font-semibold">A Taranga project</span>
        </div>
        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-paper-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-wave-600 transition-all duration-300"
            style={{ width: `${(currentStep / 6) * 100}%` }}
          />
        </div>
      </header>

      {error && (
        <div className="my-3 p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-md text-xs">
          {error}
        </div>
      )}

      {/* Step Contents */}
      <div className="my-auto py-4">
        {/* Step 1: Age Declaration (AT1) */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="font-serif text-2xl font-bold text-paper-900">Are you 18 or older?</h2>
            <p className="text-sm text-paper-800 leading-relaxed">
              Taranga Tables is an adult offline community in Mysuru. All members declare their age before entering the waitlist.
            </p>
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => setIs18Plus(true)}
                className={`w-full p-4 rounded-lg border text-left flex items-center justify-between transition-colors ${
                  is18Plus === true
                    ? 'border-wave-600 bg-wave-50 text-wave-900 font-medium'
                    : 'border-paper-300 bg-paper-100 text-paper-900 hover:bg-paper-200'
                }`}
              >
                <span>Yes, I am 18 years of age or older</span>
                {is18Plus === true && <Check className="w-5 h-5 text-wave-600" />}
              </button>

              <button
                type="button"
                onClick={() => setIs18Plus(false)}
                className={`w-full p-4 rounded-lg border text-left flex items-center justify-between transition-colors ${
                  is18Plus === false
                    ? 'border-stone-500 bg-stone-100 text-stone-900 font-medium'
                    : 'border-paper-300 bg-paper-100 text-paper-900 hover:bg-paper-200'
                }`}
              >
                <span>No, I am under 18</span>
                {is18Plus === false && <Check className="w-5 h-5 text-stone-700" />}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground pt-2">
              Age assurance adapter: self_declared_stub (NOT COMPLIANT FOR PRODUCTION).
            </p>
          </div>
        )}

        {/* Step 2: Name & Coarse Neighbourhood */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="font-serif text-2xl font-bold text-paper-900">Your First Name & Area</h2>
            <p className="text-sm text-paper-800">
              Only your first name is shown to your pod. We do not ask for exact addresses or phone numbers.
            </p>
            <div className="space-y-3 pt-2">
              <div>
                <label htmlFor="displayName" className="block text-xs font-medium text-paper-900 mb-1">
                  First Name or Handle
                </label>
                <input
                  id="displayName"
                  type="text"
                  maxLength={30}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Varun"
                  className="w-full px-3 py-2.5 text-sm bg-paper-100 border border-paper-300 rounded-md text-paper-900 focus:outline-none focus:ring-1 focus:ring-wave-600"
                />
              </div>

              <div>
                <label htmlFor="area" className="block text-xs font-medium text-paper-900 mb-1">
                  Coarse Neighbourhood in Mysuru
                </label>
                <select
                  id="area"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-paper-100 border border-paper-300 rounded-md text-paper-900 focus:outline-none focus:ring-1 focus:ring-wave-600"
                >
                  {MYSURU_AREAS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Languages & Interests */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="font-serif text-2xl font-bold text-paper-900">Languages & Interests</h2>
            <p className="text-xs text-paper-800">
              We match pods with at least one shared language and 1-2 common interests for effortless table conversation.
            </p>

            <div className="space-y-2">
              <span className="block text-xs font-medium text-paper-900">Languages you speak</span>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_LANGUAGES.map((lang) => {
                  const selected = languages.includes(lang);
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => handleLanguageToggle(lang)}
                      className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                        selected
                          ? 'bg-wave-600 text-white font-medium'
                          : 'bg-paper-200 text-paper-900 hover:bg-paper-300'
                      }`}
                    >
                      {lang}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-paper-900">Select 1 to 5 interests</span>
                <span className="text-xs text-muted-foreground">{interests.length}/5 picked</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((interest) => {
                  const selected = interests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => handleInterestToggle(interest)}
                      className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                        selected
                          ? 'bg-wave-700 text-white font-medium'
                          : 'bg-paper-100 border border-paper-300 text-paper-900 hover:bg-paper-200'
                      }`}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Comfort Sliders & Pod Preferences */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h2 className="font-serif text-2xl font-bold text-paper-900">Comfort & Rhythm</h2>
            <p className="text-xs text-paper-800">
              Pods work best with balanced conversational energies.
            </p>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-paper-900 mb-1">
                  <span>More listener</span>
                  <span>More talker</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={talkVsListen}
                  onChange={(e) => setTalkVsListen(Number(e.target.value))}
                  className="w-full accent-wave-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-paper-900 mb-1">
                  <span>Planned</span>
                  <span>Spontaneous</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={plannedVsSpontaneous}
                  onChange={(e) => setPlannedVsSpontaneous(Number(e.target.value))}
                  className="w-full accent-wave-600"
                />
              </div>

              <div className="pt-2">
                <label htmlFor="letterHour" className="block text-xs font-medium text-paper-900 mb-1">
                  Preferred Daily Letter Delivery Hour (IST)
                </label>
                <select
                  id="letterHour"
                  value={letterHour}
                  onChange={(e) => setLetterHour(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-paper-100 border border-paper-300 rounded-md text-paper-900"
                >
                  <option value={8}>8:00 AM</option>
                  <option value={12}>12:00 PM (Noon)</option>
                  <option value={17}>5:00 PM</option>
                  <option value={20}>8:00 PM (Default)</option>
                  <option value={21}>9:00 PM</option>
                </select>
              </div>

              <div className="pt-2 border-t border-paper-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wantsWomenOnly}
                    onChange={(e) => setWantsWomenOnly(e.target.checked)}
                    className="accent-wave-600 rounded"
                  />
                  <span className="text-xs text-paper-900 font-medium">
                    I prefer a women-only pod
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Evenings Available */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <h2 className="font-serif text-2xl font-bold text-paper-900">Your Evenings</h2>
            <p className="text-sm text-paper-800">
              Tables take place between 5:30 PM and 7:00 PM. Choose which evenings usually suit your schedule.
            </p>
            <div className="grid grid-cols-4 gap-2 pt-2">
              {DAYS_OF_WEEK.map((day) => {
                const selected = selectedEvenings.includes(day.dow);
                return (
                  <button
                    key={day.dow}
                    type="button"
                    onClick={() => handleEveningToggle(day.dow)}
                    className={`p-3 rounded-lg border text-center transition-colors text-xs font-medium ${
                      selected
                        ? 'bg-wave-600 text-white border-wave-600'
                        : 'bg-paper-100 border-paper-300 text-paper-900 hover:bg-paper-200'
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 6: Code of Conduct */}
        {currentStep === 6 && (
          <div className="space-y-4">
            <h2 className="font-serif text-2xl font-bold text-paper-900">Code of Conduct</h2>
            <div className="p-4 bg-paper-100 border border-paper-200 rounded-lg text-xs text-paper-800 space-y-2">
              <p className="font-semibold text-paper-900">To keep our tables welcoming and safe:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>No romantic or sexual solicitation (this is not a dating app).</li>
                <li>No selling, pitch decks, or commercial recruiting.</li>
                <li>No recording or taking photos without explicit consent.</li>
                <li>Do not share others' personal details outside the pod.</li>
                <li>Respect every member's boundaries and right to say no.</li>
              </ul>
            </div>
            <label className="flex items-start gap-2 pt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={conductAgreed}
                onChange={(e) => setConductAgreed(e.target.checked)}
                className="mt-0.5 accent-wave-600 rounded"
              />
              <span className="text-xs text-paper-900 leading-snug">
                I agree to the Taranga Tables Code of Conduct.
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Stepper Navigation Buttons */}
      <footer className="flex items-center justify-between pt-4 border-t border-paper-200">
        {currentStep > 1 ? (
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-paper-200 hover:bg-paper-300 text-paper-900 rounded-md text-xs font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        ) : (
          <div />
        )}

        <button
          type="button"
          onClick={handleNext}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-wave-600 hover:bg-wave-700 text-white rounded-md text-xs font-medium transition-colors ml-auto shadow-sm"
        >
          <span>{currentStep === 6 ? 'Save Profile' : 'Continue'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </footer>
    </div>
  );
}

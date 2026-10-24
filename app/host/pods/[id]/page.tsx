'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, UserMinus, Calendar, MapPin, Shield } from 'lucide-react';

interface PodDetail {
  id: string;
  name: string;
  status: string;
  arm: 'free' | 'deposit';
  deposit_inr: number;
  women_only: boolean;
  default_venue_id?: string;
  members: Array<{ userId: string; displayName: string; joinedAt: string }>;
  meetups: Array<{ id: string; seq: number; starts_at: string; status: string }>;
}

export default function PodDetailPage() {
  const params = useParams();
  const router = useRouter();
  const podId = params?.id as string;

  const [pod, setPod] = useState<PodDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMemberToRemove, setSelectedMemberToRemove] = useState<string | null>(null);
  const [removeReason, setRemoveReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPod() {
      try {
        const res = await fetch('/api/host/pods');
        if (res.ok) {
          const data = await res.json();
          const found = data.pods.find((p: PodDetail) => p.id === podId);
          setPod(found || null);
        }
      } catch (err) {
        setError('Error fetching pod details.');
      } finally {
        setLoading(false);
      }
    }
    if (podId) fetchPod();
  }, [podId]);

  const handleRemoveMember = async () => {
    if (!selectedMemberToRemove || !removeReason.trim()) {
      setError('Please provide a specific reason for removal.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/host/move-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedMemberToRemove,
          podId,
          action: 'remove',
          reason: removeReason.trim(),
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        setError(errJson.error || 'Failed to remove member.');
        setIsSubmitting(false);
        return;
      }

      // Refresh pod detail
      setPod((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          members: prev.members.filter((m) => m.userId !== selectedMemberToRemove),
        };
      });

      setSelectedMemberToRemove(null);
      setRemoveReason('');
    } catch (err) {
      setError('Network error while processing removal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-xs text-muted-foreground">Loading pod details...</div>;
  }

  if (!pod) {
    return (
      <div className="py-12 text-center space-y-3">
        <p className="text-sm font-semibold text-paper-900">Pod not found</p>
        <Link href="/host" className="text-xs text-wave-700 underline">
          Return to host console
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col py-4 space-y-5">
      <header className="space-y-2">
        <Link
          href="/host"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-paper-900"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Host Console</span>
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-2xl font-bold text-paper-900">{pod.name}</h1>
          <span
            className={`text-xs font-mono uppercase px-2 py-0.5 rounded ${
              pod.arm === 'deposit' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {pod.arm === 'deposit' ? `Deposit ₹${pod.deposit_inr}` : 'Free Arm'}
          </span>
        </div>
        <p className="text-xs text-paper-800">
          Status: <strong className="capitalize">{pod.status}</strong> • Mysuru Wave 1
        </p>
      </header>

      {error && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-md text-xs">
          {error}
        </div>
      )}

      {/* Pod Members (H3) */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-paper-900">
          Pod Members ({pod.members.length}/6)
        </h2>
        <div className="space-y-2">
          {pod.members.map((member) => (
            <div
              key={member.userId}
              className="p-3 bg-paper-100 border border-paper-200 rounded-lg flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-semibold text-paper-900">{member.displayName}</span>
                <span className="text-muted-foreground text-[11px] block">
                  Joined: {new Date(member.joinedAt).toLocaleDateString()}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMemberToRemove(member.userId)}
                className="text-stone-600 hover:text-red-700 p-1.5 rounded transition-colors"
                title="Remove member (with logged reason)"
              >
                <UserMinus className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Removal Reason Modal (Section 9.3) */}
      {selectedMemberToRemove && (
        <div className="p-4 bg-paper-100 border border-paper-300 rounded-lg space-y-3">
          <h3 className="text-xs font-semibold text-paper-900">
            Remove Member from Pod
          </h3>
          <p className="text-[11px] text-paper-800">
            Every removal is logged to the audit log. The host will personally check in with the member.
          </p>
          <textarea
            rows={2}
            value={removeReason}
            onChange={(e) => setRemoveReason(e.target.value)}
            placeholder="Reason for removal (e.g. scheduling conflict, requested transfer, safety)..."
            className="w-full p-2 text-xs bg-paper-50 border border-paper-300 rounded focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedMemberToRemove(null);
                setRemoveReason('');
              }}
              className="px-3 py-1.5 bg-paper-200 hover:bg-paper-300 rounded text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleRemoveMember}
              className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded text-xs font-medium"
            >
              {isSubmitting ? 'Removing...' : 'Confirm Removal'}
            </button>
          </div>
        </div>
      )}

      {/* Meetups Timeline */}
      <section className="space-y-3 pt-2 border-t border-paper-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-paper-900">
            Scheduled Meetups
          </h2>
          <Link
            href={`/host/pods/${podId}/meetups`}
            className="text-xs text-wave-700 hover:text-wave-800 font-medium underline"
          >
            Manage / Schedule Meetups
          </Link>
        </div>
        <div className="space-y-2">
          {pod.meetups.length === 0 ? (
            <p className="text-xs text-muted-foreground">No meetups scheduled yet.</p>
          ) : (
            pod.meetups.map((m) => (
              <div
                key={m.id}
                className="p-3 bg-paper-100 border border-paper-200 rounded-lg flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-wave-600" />
                  <span className="font-medium text-paper-900">Table #{m.seq}</span>
                  <span className="text-muted-foreground">
                    ({new Date(m.starts_at).toLocaleDateString()})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono capitalize px-2 py-0.5 rounded bg-paper-200">
                    {m.status}
                  </span>
                  <Link
                    href={`/host/meetups/${m.id}/checkin`}
                    className="px-2.5 py-1 bg-wave-600 hover:bg-wave-700 text-white rounded text-[11px] font-medium"
                  >
                    Check In
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

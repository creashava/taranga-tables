'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, Shield, Download, LogOut, Trash2, UserX, Phone, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [letterHour, setLetterHour] = useState(20);
  const [podMembers, setPodMembers] = useState<Array<{ user_id: string; display_name: string }>>([]);
  const [selectedBlockUser, setSelectedBlockUser] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [blockSuccess, setBlockSuccess] = useState<string | null>(null);

  const [withdrawMessage, setWithdrawMessage] = useState<string | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const userId = typeof window !== 'undefined' ? (localStorage.getItem('taranga_user_id') ?? 'usr-a1') : 'usr-a1';

  useEffect(() => {
    async function loadSettings() {
      try {
        const podRes = await fetch('/api/me/pod', { headers: { 'x-user-id': userId } });
        if (podRes.ok) {
          const data = await podRes.json();
          setPodMembers((data.members || []).filter((m: { is_self: boolean }) => !m.is_self));
        }
      } catch {
        // fallback
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [userId]);

  const handleBlockMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBlockUser) return;

    setSubmitting(true);
    setBlockSuccess(null);

    try {
      const res = await fetch('/api/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blockerId: userId,
          blockedId: selectedBlockUser,
          reason: blockReason.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setBlockSuccess(data.message || 'Member has been blocked.');
        setPodMembers((prev) => prev.filter((m) => m.user_id !== selectedBlockUser));
        setSelectedBlockUser('');
        setBlockReason('');
      }
    } catch {
      //
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportData = async () => {
    try {
      const res = await fetch(`/api/me/export?userId=${userId}`, {
        headers: { 'x-user-id': userId },
      });
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `taranga-tables-export-${userId}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch {
      alert('Error exporting data.');
    }
  };

  const handleWithdraw = async () => {
    if (!confirm('Are you sure you wish to withdraw from your pod?')) return;

    setSubmitting(true);
    setWithdrawError(null);
    try {
      const res = await fetch('/api/me/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();
      if (res.ok) {
        // SPEC Section 8.3 exact microcopy
        setWithdrawMessage(data.message);
      } else {
        setWithdrawError(data.error || 'Failed to process withdrawal.');
      }
    } catch {
      setWithdrawError('Network error processing withdrawal.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }

    try {
      const res = await fetch(`/api/me?userId=${userId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': userId },
      });

      if (res.ok) {
        alert('Your account and personal data have been completely erased.');
        localStorage.clear();
        router.push('/');
      }
    } catch {
      alert('Error deleting account.');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-wave-600" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href="/pod" className="p-1 text-paper-700 hover:text-paper-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-serif text-xl font-bold text-paper-900">Settings & Safety</h1>
          <p className="text-xs text-paper-700">Preferences, safety controls, and data rights</p>
        </div>
      </div>

      {/* Letter Timing */}
      <section className="p-4 bg-paper-100 border border-paper-200 rounded-xl space-y-2">
        <div className="flex items-center gap-2 font-semibold text-xs text-paper-900">
          <Clock className="w-4 h-4 text-wave-600" />
          <span>Daily Letter Delivery Hour</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Letters reveal at your configured hour (Asia/Kolkata). Default is 8:00 PM.
        </p>
        <select
          value={letterHour}
          onChange={(e) => setLetterHour(Number(e.target.value))}
          className="w-full p-2 bg-paper-50 border border-paper-300 rounded text-xs text-paper-900"
        >
          <option value={18}>6:00 PM IST</option>
          <option value={19}>7:00 PM IST</option>
          <option value={20}>8:00 PM IST (Standard)</option>
          <option value={21}>9:00 PM IST</option>
        </select>
      </section>

      {/* Block a Pod Member (AT13) */}
      <section className="p-4 bg-paper-100 border border-paper-200 rounded-xl space-y-3">
        <div className="flex items-center gap-2 font-semibold text-xs text-paper-900">
          <UserX className="w-4 h-4 text-red-600" />
          <span>Block a Member (AT13)</span>
        </div>
        <p className="text-xs text-paper-800 leading-relaxed">
          Blocks are reciprocal and discreet. Both users&apos; letters and notes become hidden from each other, and the host is notified without alerting the other person.
        </p>

        {podMembers.length > 0 ? (
          <form onSubmit={handleBlockMember} className="space-y-2.5">
            <select
              value={selectedBlockUser}
              onChange={(e) => setSelectedBlockUser(e.target.value)}
              className="w-full p-2 bg-paper-50 border border-paper-300 rounded text-xs text-paper-900"
              required
            >
              <option value="">Select a member to block...</option>
              {podMembers.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.display_name}
                </option>
              ))}
            </select>

            <textarea
              rows={2}
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="Reason for host context (optional, confidential)..."
              className="w-full p-2 bg-paper-50 border border-paper-300 rounded text-xs text-paper-900"
            />

            {blockSuccess && (
              <div className="p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                {blockSuccess}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !selectedBlockUser}
              className="w-full py-2 bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white rounded text-xs font-semibold"
            >
              Block Member
            </button>
          </form>
        ) : (
          <p className="text-xs text-muted-foreground italic">No other members in pod.</p>
        )}
      </section>

      {/* Free 24/7 Helplines */}
      <section className="p-4 bg-wave-50/70 border border-wave-200 rounded-xl space-y-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-wave-900">
          Free Support Helplines
        </span>
        <div className="flex items-center justify-between text-xs">
          <span className="text-paper-900">Tele-MANAS (Mental health, 24/7):</span>
          <a href="tel:14416" className="font-bold text-wave-700 hover:underline flex items-center gap-1">
            <Phone className="w-3.5 h-3.5" /> 14416
          </a>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-paper-900">National Emergency Services:</span>
          <a href="tel:112" className="font-bold text-wave-700 hover:underline flex items-center gap-1">
            <Phone className="w-3.5 h-3.5" /> 112
          </a>
        </div>
      </section>

      {/* Data Rights & Pod Exit (AT15, AT16) */}
      <section className="p-4 bg-paper-100 border border-paper-200 rounded-xl space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-paper-900">
          Data Rights & Membership
        </h2>

        {/* Export */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="text-xs font-medium text-paper-900">Download My Data (AT16)</p>
            <p className="text-[11px] text-muted-foreground">Export complete personal bundle as JSON</p>
          </div>
          <button
            type="button"
            onClick={handleExportData}
            className="px-3 py-1.5 bg-paper-200 hover:bg-paper-300 text-paper-900 rounded text-xs font-medium flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>

        {/* Withdraw kindly */}
        <div className="pt-3 border-t border-paper-200 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-paper-900">Withdraw from Pod (AT15)</p>
              <p className="text-[11px] text-muted-foreground">Hides letters, triggers gentle host check-in</p>
            </div>
            <button
              type="button"
              disabled={submitting}
              onClick={handleWithdraw}
              className="px-3 py-1.5 bg-paper-200 hover:bg-paper-300 text-paper-900 rounded text-xs font-medium flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Withdraw</span>
            </button>
          </div>

          {withdrawMessage && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-800 leading-relaxed">
              {withdrawMessage}
            </div>
          )}
          {withdrawError && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
              {withdrawError}
            </div>
          )}
        </div>

        {/* Delete account */}
        <div className="pt-3 border-t border-paper-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-red-800">Delete My Account (AT16)</p>
            <p className="text-[11px] text-muted-foreground">Permanently erases profile and personal rows</p>
          </div>
          <button
            type="button"
            onClick={handleDeleteAccount}
            className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded text-xs font-medium flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{deleteConfirm ? 'Confirm Delete' : 'Delete'}</span>
          </button>
        </div>
      </section>

      <div className="text-center pt-2">
        <Link href="/pod" className="text-xs text-wave-700 hover:underline">
          Return to Pod Home
        </Link>
      </div>
    </div>
  );
}

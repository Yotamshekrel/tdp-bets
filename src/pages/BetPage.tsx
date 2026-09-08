import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { TEAMS, TDP_MEMBERS, TEAM_STYLES } from '../constants/config';
import { Team, ToastMessage } from '../types';
import { getBet, saveBet } from '../services/db-service';
import { Check, AlertCircle } from 'lucide-react';

interface BetPageProps {
  onShowToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

export const BetPage: React.FC<BetPageProps> = ({ onShowToast }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [bettorName, setBettorName] = useState(searchParams.get('name') || '');
  const [predictions, setPredictions] = useState<Record<string, Team>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // If a name is passed via query params, attempt to fetch existing selections
  useEffect(() => {
    const nameParam = searchParams.get('name');
    if (!nameParam) return;

    const loadExistingBet = async () => {
      setLoading(true);
      try {
        const bet = await getBet(nameParam);
        if (bet) {
          setBettorName(bet.bettorName);
          setPredictions(bet.predictions || {});
          onShowToast({
            type: 'info',
            message: `Loaded existing picks for "${bet.bettorName}".`,
          });
        } else {
          onShowToast({
            type: 'info',
            message: `No existing bet found for "${nameParam}". Starting a new submission.`,
          });
        }
      } catch (err) {
        console.error(err);
        onShowToast({
          type: 'error',
          message: 'Failed to fetch existing bet. Please check your network.',
        });
      } finally {
        setLoading(false);
      }
    };

    loadExistingBet();
  }, [searchParams]);

  const handleSelectTeam = (member: string, team: Team) => {
    setPredictions((prev) => ({
      ...prev,
      [member]: team,
    }));
  };

  const completedCount = Object.keys(predictions).filter((key) =>
    TDP_MEMBERS.includes(key as any)
  ).length;
  const isComplete = completedCount === TDP_MEMBERS.length && bettorName.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);

    if (!bettorName.trim()) {
      onShowToast({
        type: 'error',
        message: 'Please enter your name before submitting.',
      });
      return;
    }

    if (completedCount < TDP_MEMBERS.length) {
      const missingCount = TDP_MEMBERS.length - completedCount;
      onShowToast({
        type: 'error',
        message: `Missing selections for ${missingCount} TDP ${missingCount === 1 ? 'member' : 'members'}.`,
      });
      return;
    }

    setSubmitting(true);
    try {
      await saveBet(bettorName, predictions);
      onShowToast({
        type: 'success',
        message: 'Bet successfully submitted!',
      });
      navigate('/results');
    } catch (err) {
      console.error(err);
      onShowToast({
        type: 'error',
        message: 'Error saving your bet. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col pb-28">
      <Header
        title={searchParams.get('name') ? 'Edit Your Bet' : 'Enter a Bet'}
        subtitle={`${completedCount}/${TDP_MEMBERS.length} assigned`}
      />

      <main className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 flex-1">
        {loading ? (
          <LoadingSpinner message="Checking existing bet..." />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Bettor's Name Card */}
            <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 shadow-sm space-y-2">
              <label htmlFor="bettorName" className="block text-sm font-semibold text-slate-200">
                Bettor&apos;s Full Name <span className="text-rose-400">*</span>
              </label>
              <input
                id="bettorName"
                type="text"
                value={bettorName}
                onChange={(e) => setBettorName(e.target.value)}
                placeholder="e.g., Alex Johnson"
                className={`w-full px-4 py-3 rounded-xl bg-slate-900 border text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all ${
                  hasAttemptedSubmit && !bettorName.trim()
                    ? 'border-rose-500 focus:ring-rose-500'
                    : 'border-slate-700'
                }`}
              />
              {hasAttemptedSubmit && !bettorName.trim() && (
                <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Bettor name is required.
                </p>
              )}
            </div>

            {/* List of TDP Members */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                  TDP Members ({TDP_MEMBERS.length})
                </h2>
                <span className="text-xs text-slate-400">Select 1 team per member</span>
              </div>

              {TDP_MEMBERS.map((member, index) => {
                const selectedTeam = predictions[member];
                const isMissing = hasAttemptedSubmit && !selectedTeam;

                return (
                  <div
                    key={member}
                    className={`p-4 rounded-2xl bg-slate-800/70 border transition-all ${
                      isMissing
                        ? 'border-rose-500/70 bg-rose-950/20'
                        : selectedTeam
                        ? 'border-slate-700/80'
                        : 'border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Member Info */}
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-slate-500 w-5">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span
                          dir="rtl"
                          className="text-base sm:text-lg font-bold text-slate-100 tracking-wide"
                        >
                          {member}
                        </span>
                        {selectedTeam && (
                          <Check className="w-4 h-4 text-emerald-400 sm:hidden ml-auto" />
                        )}
                      </div>

                      {/* Team Selector Chips */}
                      <div className="grid grid-cols-5 gap-1.5 sm:flex sm:items-center sm:gap-2">
                        {TEAMS.map((team) => {
                          const isSelected = selectedTeam === team;
                          const styles = TEAM_STYLES[team];

                          return (
                            <button
                              key={team}
                              type="button"
                              onClick={() => handleSelectTeam(member, team)}
                              className={`py-2 px-2 sm:px-3 rounded-xl text-xs font-semibold border transition-all text-center select-none active:scale-95 ${
                                isSelected
                                  ? styles.active
                                  : `${styles.bg} ${styles.text} ${styles.border} hover:opacity-90`
                              }`}
                            >
                              {team}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </form>
        )}
      </main>

      {/* Bottom Sticky Submit Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 p-4 pb-safe">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-slate-400">Total Progress</div>
            <div className="text-sm font-bold text-slate-200">
              {completedCount} / {TDP_MEMBERS.length} Assigned
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className={`px-6 py-3 rounded-xl font-semibold text-sm shadow-md transition-all flex items-center gap-2 ${
              isComplete
                ? 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-indigo-500/25'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700'
            }`}
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Submit Bet</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

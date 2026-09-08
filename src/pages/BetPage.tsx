import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ConfirmModal } from '../components/Modal';
import { TEAMS, TDP_MEMBERS, TEAM_STYLES } from '../constants/config';
import { Team, ToastMessage } from '../types';
import { getBet, saveBet, deleteBet } from '../services/db-service';
import { Check, AlertCircle, Trash2, ShieldAlert } from 'lucide-react';

interface BetPageProps {
  onShowToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

export const BetPage: React.FC<BetPageProps> = ({ onShowToast }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const nameParam = searchParams.get('name');
  const isAdmin = searchParams.get('admin') === 'true';

  const [bettorName, setBettorName] = useState(nameParam || '');
  const [predictions, setPredictions] = useState<Record<string, Team>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [isExistingBet, setIsExistingBet] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (!nameParam) return;

    const loadExistingBet = async () => {
      setLoading(true);
      try {
        const bet = await getBet(nameParam);
        if (bet) {
          setBettorName(bet.bettorName);
          setPredictions(bet.predictions || {});
          setIsExistingBet(true);
          onShowToast({
            type: 'info',
            message: `נטענו ההימורים של "${bet.bettorName}".`,
          });
        } else {
          setIsExistingBet(false);
          onShowToast({
            type: 'info',
            message: `לא נמצא הימור קיים עבור "${nameParam}". יצירת הימור חדש.`,
          });
        }
      } catch (err) {
        console.error(err);
        onShowToast({
          type: 'error',
          message: 'שגיאה בטעינת הימור קיים. בדוק את החיבור לרשת.',
        });
      } finally {
        setLoading(false);
      }
    };

    loadExistingBet();
  }, [nameParam]);

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
        message: 'אנא הזן שם מהמר לפני השמירה.',
      });
      return;
    }

    if (completedCount < TDP_MEMBERS.length) {
      const missingCount = TDP_MEMBERS.length - completedCount;
      onShowToast({
        type: 'error',
        message: `חסרות בחירות עבור ${missingCount} חברי TDP.`,
      });
      return;
    }

    setSubmitting(true);
    try {
      await saveBet(bettorName, predictions);
      onShowToast({
        type: 'success',
        message: 'ההימור נשמר בהצלחה!',
      });
      navigate('/results');
    } catch (err) {
      console.error(err);
      onShowToast({
        type: 'error',
        message: 'שגיאה בשמירת ההימור. אנא נסה שנית.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBet = async () => {
    if (!bettorName.trim()) return;

    setDeleting(true);
    try {
      await deleteBet(bettorName);
      setIsDeleteModalOpen(false);
      onShowToast({
        type: 'success',
        message: `ההימור של "${bettorName}" נמחק בהצלחה.`,
      });
      navigate('/results');
    } catch (err) {
      console.error(err);
      onShowToast({
        type: 'error',
        message: 'שגיאה במחיקת ההימור. אנא נסה שוב.',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col pb-28">
      <Header
        title={
          isAdmin
            ? `עריכת מנהל: ${bettorName || 'הימור'}`
            : isExistingBet
            ? 'עריכת ההימור שלך'
            : 'הזנת הימור חדש'
        }
        subtitle={`${completedCount}/${TDP_MEMBERS.length} משובצים`}
      />

      <main className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 flex-1">
        {isAdmin && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>מצב מנהל (Admin Mode) - באפשרותך לערוך או למחוק הימור זה.</span>
          </div>
        )}

        {loading ? (
          <LoadingSpinner message="טוען נתוני הימור..." />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="bettorName" className="block text-sm font-semibold text-slate-200">
                  שם המהמר <span className="text-rose-400">*</span>
                </label>
                {(isExistingBet || isAdmin) && (
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    מחק הימור
                  </button>
                )}
              </div>
              <input
                id="bettorName"
                type="text"
                value={bettorName}
                onChange={(e) => setBettorName(e.target.value)}
                placeholder="למשל: דניאל כהן"
                className={`w-full px-4 py-3 rounded-xl bg-slate-900 border text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all ${
                  hasAttemptedSubmit && !bettorName.trim()
                    ? 'border-rose-500 focus:ring-rose-500'
                    : 'border-slate-700'
                }`}
              />
              {hasAttemptedSubmit && !bettorName.trim() && (
                <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" /> שדה חובה.
                </p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                  חברי TDP ({TDP_MEMBERS.length})
                </h2>
                <span className="text-xs text-slate-400">יש לבחור חטיבה אחת לכל חבר</span>
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

      <div className="fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 p-4 pb-safe">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-slate-400">התקדמות</div>
            <div className="text-sm font-bold text-slate-200">
              {completedCount} / {TDP_MEMBERS.length} משובצים
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(isExistingBet || isAdmin) && (
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                disabled={deleting || submitting}
                className="px-4 py-3 rounded-xl font-semibold text-xs sm:text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/30 transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">מחק הימור</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || deleting}
              className={`px-6 py-3 rounded-xl font-semibold text-sm shadow-md transition-all flex items-center gap-2 ${
                isComplete
                  ? 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-indigo-500/25'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700'
              }`}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>שומר...</span>
                </>
              ) : (
                <span>שמור הימור</span>
              )}
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="מחיקת הימור לצמיתות"
        message={`האם אתה בטוח שברצונך למחוק את כל ההימור עבור "${bettorName}"? פעולה זו היא בלתי הפיכה וההימור יוסר מכל טבלאות הסיכום.`}
        confirmLabel={deleting ? 'מוחק...' : 'כן, מחק הימור'}
        cancelLabel="ביטול"
        isDestructive={true}
        onConfirm={handleDeleteBet}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};
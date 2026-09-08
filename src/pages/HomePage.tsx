import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  Edit3,
  Table,
  Sparkles,
  ShieldCheck,
  Trash2,
  Edit,
  X,
  Search,
  Users,
  Trophy,
  Save,
  RotateCcw,
} from 'lucide-react';
import { PromptModal, ConfirmModal } from '../components/Modal';
import {
  subscribeToBets,
  deleteBet,
  getOfficialResults,
  saveOfficialResults,
  deleteOfficialResults,
} from '../services/db-service';
import { BetDocument, Team, ToastMessage } from '../types';
import { TDP_MEMBERS, TEAMS, TEAM_STYLES } from '../constants/config';

interface HomePageProps {
  onShowToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onShowToast }) => {
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminTab, setAdminTab] = useState<'bets' | 'official'>('bets');

  const [bets, setBets] = useState<BetDocument[]>([]);
  const [adminSearch, setAdminSearch] = useState('');
  const [betToDelete, setBetToDelete] = useState<string | null>(null);

  const [officialPlacements, setOfficialPlacements] = useState<Record<string, Team>>({});
  const [isPublished, setIsPublished] = useState(false);
  const [savingOfficial, setSavingOfficial] = useState(false);
  const [isResetOfficialModalOpen, setIsResetOfficialModalOpen] = useState(false);

  useEffect(() => {
    if (!isAdminOpen) return;

    const unsubscribe = subscribeToBets(
      (data) => setBets(data),
      (err) => {
        console.error(err);
        onShowToast({ type: 'error', message: 'שגיאה בטעינת הימורים לפאנל הניהול.' });
      }
    );

    getOfficialResults()
      .then((res) => {
        if (res) {
          setOfficialPlacements(res.predictions || {});
          setIsPublished(res.isPublished || false);
        } else {
          setOfficialPlacements({});
          setIsPublished(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching official results:', err);
      });

    return () => unsubscribe();
  }, [isAdminOpen]);

  const handleEditConfirm = (name: string) => {
    setIsEditModalOpen(false);

    if (name.trim().toLowerCase() === 'yotamtheking') {
      setIsAdminOpen(true);
      onShowToast({
        type: 'info',
        message: 'ברוך הבא לפאנל הניהול (Admin Mode)!',
      });
      return;
    }

    navigate(`/bet?name=${encodeURIComponent(name)}`);
  };

  const handleDeleteBet = async () => {
    if (!betToDelete) return;

    try {
      await deleteBet(betToDelete);
      onShowToast({
        type: 'success',
        message: `ההימור של "${betToDelete}" נמחק בהצלחה.`,
      });
    } catch (err) {
      console.error(err);
      onShowToast({
        type: 'error',
        message: 'שגיאה בעת מחיקת ההימור.',
      });
    } finally {
      setBetToDelete(null);
    }
  };

  const handleSaveOfficialResults = async () => {
    setSavingOfficial(true);
    try {
      await saveOfficialResults(officialPlacements, isPublished);
      onShowToast({
        type: 'success',
        message: isPublished
          ? 'תוצאות האמת פורסמו בהצלחה לכל המשתמשים!'
          : 'תוצאות האמת נשמרו כטיוטה (לא פורסמו עדיין).',
      });
    } catch (err) {
      console.error('Save official results failed:', err);
      onShowToast({
        type: 'error',
        message: 'שגיאה בשמירת תוצאות האמת. אנא נסה שוב.',
      });
    } finally {
      setSavingOfficial(false);
    }
  };

  const handleResetOfficialResults = async () => {
    try {
      await deleteOfficialResults();
      setOfficialPlacements({});
      setIsPublished(false);
      setIsResetOfficialModalOpen(false);
      onShowToast({
        type: 'success',
        message: 'תוצאות האמת נמחקו ואופסו בהצלחה. לוח המובילים חזר להיות מוסתר.',
      });
    } catch (err) {
      console.error('Reset official results failed:', err);
      onShowToast({
        type: 'error',
        message: 'שגיאה באיפוס תוצאות האמת.',
      });
    }
  };

  const filteredAdminBets = bets.filter((b) =>
    b.bettorName.toLowerCase().includes(adminSearch.toLowerCase().trim())
  );

  const officialCompletedCount = Object.keys(officialPlacements).filter((k) =>
    TDP_MEMBERS.includes(k as any)
  ).length;

  return (
    <div className="min-h-screen flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto space-y-8 text-center">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Placement Season 2026
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
            TDP Placement Bets <span className="inline-block">🎯</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            נחשו את השיבוץ של כל 18 חברי ה-TDP ועקבו אחר תוצאות ההימורים בזמן אמת!
          </p>
        </div>

        <div className="space-y-4 pt-4">
          <button
            onClick={() => navigate('/bet')}
            className="w-full group flex items-center justify-between px-6 py-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-2xl shadow-lg shadow-indigo-600/20 transition-all transform active:scale-[0.99]"
          >
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-indigo-700/50 group-hover:bg-indigo-700 transition-colors">
                <PlusCircle className="w-6 h-6 text-indigo-200" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-base">Enter a New Bet</div>
                <div className="text-xs text-indigo-200">הזנת הימור חדש מאפס</div>
              </div>
            </div>
            <span className="text-indigo-200 group-hover:translate-x-1 transition-transform">→</span>
          </button>

          <button
            onClick={() => setIsEditModalOpen(true)}
            className="w-full group flex items-center justify-between px-6 py-4 bg-slate-800 hover:bg-slate-750 active:bg-slate-800 text-white border border-slate-700 rounded-2xl shadow-sm transition-all transform active:scale-[0.99]"
          >
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-slate-700/50 group-hover:bg-slate-700 transition-colors">
                <Edit3 className="w-6 h-6 text-slate-300" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-base">Edit Your Bet</div>
                <div className="text-xs text-slate-400">טעינה, עריכה או מחיקה של הימור קיים</div>
              </div>
            </div>
            <span className="text-slate-400 group-hover:translate-x-1 transition-transform">→</span>
          </button>

          <button
            onClick={() => navigate('/results')}
            className="w-full group flex items-center justify-between px-6 py-4 bg-slate-800 hover:bg-slate-750 active:bg-slate-800 text-white border border-slate-700 rounded-2xl shadow-sm transition-all transform active:scale-[0.99]"
          >
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-slate-700/50 group-hover:bg-slate-700 transition-colors">
                <Table className="w-6 h-6 text-slate-300" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-base">View Results Table</div>
                <div className="text-xs text-slate-400">צפייה בסיכומים, לוח מובילים וציונים</div>
              </div>
            </div>
            <span className="text-slate-400 group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>
      </div>

      <PromptModal
        isOpen={isEditModalOpen}
        title="עריכת ההימור שלך"
        placeholder="הזן את שמך המדויק..."
        submitLabel="המשך"
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditConfirm}
      />

      {isAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-850 border border-slate-700 rounded-2xl p-6 w-full max-w-2xl shadow-2xl relative flex flex-col max-h-[90vh]">
            <button
              onClick={() => setIsAdminOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 p-1"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-800">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">פאנל ניהול (Admin Settings)</h3>
                <p className="text-xs text-slate-400">ניהול הימורים, עריכה והזנת תוצאות אמת</p>
              </div>
            </div>

            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 mb-4">
              <button
                onClick={() => setAdminTab('bets')}
                className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                  adminTab === 'bets'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                רשימת הימורים ({bets.length})
              </button>
              <button
                onClick={() => setAdminTab('official')}
                className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  adminTab === 'official'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Trophy className="w-4 h-4 text-amber-300" />
                הזנת ועריכת תוצאות אמת {isPublished && '(מפורסם)'}
              </button>
            </div>

            {adminTab === 'bets' && (
              <>
                <div className="relative mb-3">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={adminSearch}
                    onChange={(e) => setAdminSearch(e.target.value)}
                    placeholder="חפש לפי שם מהמר..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="overflow-y-auto flex-1 space-y-2 pr-1 min-h-[300px]">
                  {filteredAdminBets.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-sm">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      לא נמצאו הימורים
                    </div>
                  ) : (
                    filteredAdminBets.map((bet) => (
                      <div
                        key={bet.bettorName}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
                      >
                        <div>
                          <div className="font-bold text-slate-200 text-sm">{bet.bettorName}</div>
                          <div className="text-xs text-slate-500">
                            {Object.keys(bet.predictions || {}).length} חברים משובצים
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setIsAdminOpen(false);
                              navigate(
                                `/bet?name=${encodeURIComponent(bet.bettorName)}&admin=true`
                              );
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 border border-indigo-500/30 flex items-center gap-1.5 transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            ערוך
                          </button>

                          <button
                            onClick={() => setBetToDelete(bet.bettorName)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30 flex items-center gap-1.5 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            מחק
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {adminTab === 'official' && (
              <div className="flex flex-col flex-1 overflow-hidden space-y-3">
                <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs text-slate-400">התקדמות שיבוץ תוצאות האמת:</div>
                    <div className="text-sm font-bold text-amber-400">
                      {officialCompletedCount} מתוך {TDP_MEMBERS.length} משובצים
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer bg-slate-850 px-3 py-1.5 rounded-lg border border-slate-700">
                    <input
                      type="checkbox"
                      checked={isPublished}
                      onChange={(e) => setIsPublished(e.target.checked)}
                      className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500 focus:ring-offset-slate-900"
                    />
                    <span className="text-xs font-bold text-slate-200">
                      פרסם תוצאות לכולם (Reveal)
                    </span>
                  </label>
                </div>

                <div className="overflow-y-auto flex-1 space-y-2 pr-1 max-h-[340px]">
                  {TDP_MEMBERS.map((member) => {
                    const currentTeam = officialPlacements[member];
                    return (
                      <div
                        key={member}
                        className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <span dir="rtl" className="font-bold text-sm text-slate-100">
                          {member}
                        </span>

                        <div className="grid grid-cols-5 gap-1 sm:flex sm:gap-1.5">
                          {TEAMS.map((team) => {
                            const isSelected = currentTeam === team;
                            const style = TEAM_STYLES[team];
                            return (
                              <button
                                key={team}
                                type="button"
                                onClick={() =>
                                  setOfficialPlacements((prev) => ({
                                    ...prev,
                                    [member]: team,
                                  }))
                                }
                                className={`py-1 px-2 rounded-lg text-[11px] font-semibold border transition-all ${
                                  isSelected
                                    ? style.active
                                    : `${style.bg} ${style.text} ${style.border}`
                                }`}
                              >
                                {team}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-800">
                  {officialCompletedCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsResetOfficialModalOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 border border-rose-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      איפוס / מחיקה
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleSaveOfficialResults}
                    disabled={savingOfficial}
                    className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-600/25 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    {savingOfficial ? 'שומר תוצאות אמת...' : 'שמור תוצאות אמת'}
                  </button>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-800 mt-2 flex justify-between items-center text-xs text-slate-400">
              <span>Admin Mode</span>
              <button
                onClick={() => setIsAdminOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!betToDelete}
        title="מחיקת הימור (Admin)"
        message={`האם אתה בטוח שברצונך למחוק לצמיתות את ההימור של "${betToDelete}"?`}
        confirmLabel="כן, מחק הימור"
        cancelLabel="ביטול"
        isDestructive={true}
        onConfirm={handleDeleteBet}
        onCancel={() => setBetToDelete(null)}
      />

      <ConfirmModal
        isOpen={isResetOfficialModalOpen}
        title="איפוס ומחיקת תוצאות האמת"
        message="האם אתה בטוח שברצונך למחוק ולאפס את כל תוצאות האמת? פעולה זו תבטל את פרסום תוצאות האמת, ולוח המובילים והציונים יחזרו להיות מוסתרים עבור כל המשתמשים."
        confirmLabel="כן, אפס תוצאות"
        cancelLabel="ביטול"
        isDestructive={true}
        onConfirm={handleResetOfficialResults}
        onCancel={() => setIsResetOfficialModalOpen(false)}
      />
    </div>
  );
};

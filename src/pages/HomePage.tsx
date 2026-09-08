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
} from 'lucide-react';
import { PromptModal, ConfirmModal } from '../components/Modal';
import { subscribeToBets, deleteBet } from '../services/db-service';
import { BetDocument, ToastMessage } from '../types';

interface HomePageProps {
  onShowToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onShowToast }) => {
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [bets, setBets] = useState<BetDocument[]>([]);
  const [adminSearch, setAdminSearch] = useState('');
  const [betToDelete, setBetToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdminOpen) return;

    const unsubscribe = subscribeToBets(
      (data) => setBets(data),
      (err) => {
        console.error(err);
        onShowToast({ type: 'error', message: 'שגיאה בטעינת הימורים לפאנל הניהול.' });
      }
    );

    return () => unsubscribe();
  }, [isAdminOpen]);

  const handleEditConfirm = (name: string) => {
    setIsEditModalOpen(false);

    // זיהוי מילת המפתח של המנהל
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

  const filteredAdminBets = bets.filter((b) =>
    b.bettorName.toLowerCase().includes(adminSearch.toLowerCase().trim())
  );

  return (
    <div className="min-h-screen flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto space-y-8 text-center">
        {/* Hero Section */}
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

        {/* Action Buttons */}
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
                <div className="text-xs text-slate-400">צפייה בסיכומים ובטבלה המלאה</div>
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

      {/* Admin Panel Modal */}
      {isAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-850 border border-slate-700 rounded-2xl p-6 w-full max-w-2xl shadow-2xl relative flex flex-col max-h-[85vh]">
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
                <p className="text-xs text-slate-400">ניהול, עריכה ומחיקה של כל ההימורים הרשומים</p>
              </div>
            </div>

            <div className="relative mb-4">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                placeholder="חפש לפי שם מהמר..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="overflow-y-auto flex-1 space-y-2 pr-1">
              {filteredAdminBets.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm">
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
                          navigate(`/bet?name=${encodeURIComponent(bet.bettorName)}&admin=true`);
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

            <div className="pt-4 border-t border-slate-800 mt-3 flex justify-between items-center text-xs text-slate-400">
              <span>סה״כ {bets.length} הימורים רשומים</span>
              <button
                onClick={() => setIsAdminOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
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
    </div>
  );
};
import React, { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { subscribeToBets } from '../services/db-service';
import { BetDocument, Team, ToastMessage } from '../types';
import { TDP_MEMBERS, TEAM_STYLES } from '../constants/config';
import { Users, Search } from 'lucide-react';

interface ResultsPageProps {
  onShowToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({ onShowToast }) => {
  const [bets, setBets] = useState<BetDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeToBets(
      (newBets) => {
        setBets(newBets);
        setLoading(false);
      },
      (error) => {
        console.error(error);
        onShowToast({
          type: 'error',
          message: 'Unable to stream live results from Firestore.',
        });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredBets = bets.filter((bet) =>
    bet.bettorName.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        title="Live Prediction Results"
        subtitle={`${bets.length} total ${bets.length === 1 ? 'bettor' : 'bettors'}`}
      />

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex-1 flex flex-col gap-4">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bettor name..."
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-1.5 self-end sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Real-time synced
          </div>
        </div>

        {loading ? (
          <LoadingSpinner message="Syncing predictions from Firestore..." />
        ) : bets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-800/40 rounded-2xl border border-slate-800">
            <Users className="w-12 h-12 text-slate-600 mb-3" />
            <p className="text-base font-semibold text-slate-300">No bets placed yet</p>
            <p className="text-xs text-slate-500 mt-1">Be the first to submit your predictions!</p>
          </div>
        ) : (
          /* Responsive Table Container with Sticky First Column */
          <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-850 shadow-xl">
            <div className="overflow-x-auto max-h-[75vh]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800/90 border-b border-slate-700">
                    <th
                      scope="col"
                      className="sticky left-0 z-20 bg-slate-800/95 backdrop-blur px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-300 min-w-[140px] sm:min-w-[180px] shadow-[2px_0_5px_rgba(0,0,0,0.3)]"
                    >
                      Bettor
                    </th>
                    {TDP_MEMBERS.map((member) => (
                      <th
                        key={member}
                        scope="col"
                        dir="rtl"
                        className="px-3 py-3.5 text-xs font-bold text-slate-200 text-center min-w-[95px] whitespace-nowrap border-l border-slate-800/60"
                      >
                        {member}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-xs">
                  {filteredBets.map((bet) => (
                    <tr
                      key={bet.bettorName}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Sticky Bettor Column */}
                      <td className="sticky left-0 z-10 bg-slate-900 group-hover:bg-slate-850 px-4 py-3 font-semibold text-slate-100 whitespace-nowrap shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                        {bet.bettorName}
                      </td>

                      {/* Prediction Cells */}
                      {TDP_MEMBERS.map((member) => {
                        const team = bet.predictions?.[member] as Team | undefined;
                        const style = team ? TEAM_STYLES[team] : null;

                        return (
                          <td
                            key={member}
                            className="px-2 py-3 text-center border-l border-slate-800/40 whitespace-nowrap"
                          >
                            {team && style ? (
                              <span
                                className={`inline-block px-2.5 py-1 rounded-lg font-medium border text-[11px] ${style.bg} ${style.text} ${style.border}`}
                              >
                                {team}
                              </span>
                            ) : (
                              <span className="text-slate-600 text-[11px]">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

import React, { useEffect, useState, useMemo } from 'react';
import { Header } from '../components/Header';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { subscribeToBets, subscribeToOfficialResults } from '../services/db-service';
import { BetDocument, OfficialResultsDocument, Team, TDPMember, ToastMessage } from '../types';
import { TDP_MEMBERS, TEAMS, TEAM_STYLES } from '../constants/config';
import {
  Users,
  Search,
  BarChart3,
  Table as TableIcon,
  Crown,
  Layers,
  UserCheck,
  TrendingUp,
  Trophy,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';

interface ResultsPageProps {
  onShowToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

type MainTab = 'leaderboard' | 'summary' | 'table';
type SummarySubTab = 'roster' | 'consensus' | 'breakdown';

export const ResultsPage: React.FC<ResultsPageProps> = ({ onShowToast }) => {
  const [bets, setBets] = useState<BetDocument[]>([]);
  const [officialResults, setOfficialResults] = useState<OfficialResultsDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // לשוניות ראשיות
  const [mainTab, setMainTab] = useState<MainTab>('summary');
  const [summarySubTab, setSummarySubTab] = useState<SummarySubTab>('roster');

  // סינון חטיבה עבור תצוגת שיבוץ
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<Team | 'ALL'>('ALL');

  // חבר נבחר עבור גרף העמודות
  const [selectedMember, setSelectedMember] = useState<TDPMember>(TDP_MEMBERS[0]);

  // מהמר שנפתח בלוח המובילים לצפייה בפירוט
  const [expandedBettor, setExpandedBettor] = useState<string | null>(null);

  // מתג לצמצום או הרחבת כרטיסיית תוצאות האמת
  const [showOfficialRoster, setShowOfficialRoster] = useState(true);

  useEffect(() => {
    let betsLoaded = false;
    let officialLoaded = false;

    const checkLoading = () => {
      if (betsLoaded && officialLoaded) {
        setLoading(false);
      }
    };

    const unsubBets = subscribeToBets(
      (newBets) => {
        setBets(newBets);
        betsLoaded = true;
        checkLoading();
      },
      (error) => {
        console.error(error);
        onShowToast({
          type: 'error',
          message: 'שגיאה בסנכרון ההימורים מ-Firestore.',
        });
        betsLoaded = true;
        checkLoading();
      }
    );

    const unsubOfficial = subscribeToOfficialResults(
      (results) => {
        setOfficialResults(results);
        if (results && results.isPublished) {
          setMainTab('leaderboard'); // ברגע שהתוצאות מפורסמות, נפתח ישר לוח המובילים
        }
        officialLoaded = true;
        checkLoading();
      },
      (error) => {
        console.error(error);
        officialLoaded = true;
        checkLoading();
      }
    );

    return () => {
      unsubBets();
      unsubOfficial();
    };
  }, []);

  const isOfficialPublished = Boolean(
    officialResults &&
      officialResults.isPublished &&
      Object.keys(officialResults.predictions || {}).length > 0
  );

  // חלוקת חברי המחזור לחטיבות לפי תוצאות האמת (לתצוגה מהירה)
  const officialTeamRosters = useMemo(() => {
    if (!isOfficialPublished || !officialResults) return null;

    const rosters: Record<Team, TDPMember[]> = {
      Consumer: [],
      Levelup: [],
      Netcom: [],
      Artemis: [],
      Dispatch: [],
    };

    TDP_MEMBERS.forEach((member) => {
      const realTeam = officialResults.predictions[member];
      if (realTeam && rosters[realTeam]) {
        rosters[realTeam].push(member);
      }
    });

    return rosters;
  }, [officialResults, isOfficialPublished]);

  // חישוב קולות לפי חבר
  const memberStats = useMemo(() => {
    const stats: Record<
      string,
      {
        totalVotes: number;
        counts: Record<Team, number>;
        percentages: Record<Team, number>;
        leadingTeams: Team[];
        maxVotes: number;
      }
    > = {};

    TDP_MEMBERS.forEach((member) => {
      const counts: Record<Team, number> = {
        Consumer: 0,
        Levelup: 0,
        Netcom: 0,
        Artemis: 0,
        Dispatch: 0,
      };

      let total = 0;
      bets.forEach((bet) => {
        const team = bet.predictions?.[member];
        if (team && counts[team] !== undefined) {
          counts[team]++;
          total++;
        }
      });

      const percentages: Record<Team, number> = {
        Consumer: 0,
        Levelup: 0,
        Netcom: 0,
        Artemis: 0,
        Dispatch: 0,
      };

      let maxVotes = 0;
      TEAMS.forEach((team) => {
        if (counts[team] > maxVotes) {
          maxVotes = counts[team];
        }
        percentages[team] = total > 0 ? Math.round((counts[team] / total) * 100) : 0;
      });

      const leadingTeams: Team[] = [];
      if (maxVotes > 0) {
        TEAMS.forEach((team) => {
          if (counts[team] === maxVotes) {
            leadingTeams.push(team);
          }
        });
      }

      stats[member] = {
        totalVotes: total,
        counts,
        percentages,
        leadingTeams,
        maxVotes,
      };
    });

    return stats;
  }, [bets]);

  // חישוב שיבוץ צפוי לחטיבה לפי רוב הקולות
  const projectedRosters = useMemo(() => {
    const rosters: Record<
      Team,
      Array<{ member: TDPMember; votes: number; total: number; percentage: number; isTie: boolean }>
    > = {
      Consumer: [],
      Levelup: [],
      Netcom: [],
      Artemis: [],
      Dispatch: [],
    };

    TDP_MEMBERS.forEach((member) => {
      const data = memberStats[member];
      if (data.leadingTeams.length > 0) {
        data.leadingTeams.forEach((team) => {
          rosters[team].push({
            member,
            votes: data.maxVotes,
            total: data.totalVotes,
            percentage: data.percentages[team],
            isTie: data.leadingTeams.length > 1,
          });
        });
      }
    });

    return rosters;
  }, [memberStats]);

  // חישוב ציונים ודירוג מהמרים
  const rankedBettors = useMemo(() => {
    if (!isOfficialPublished || !officialResults) return [];

    const scores = bets.map((bet) => {
      let correctCount = 0;
      const details: Record<string, { guessed: Team; actual: Team; isCorrect: boolean }> = {};

      TDP_MEMBERS.forEach((member) => {
        const guessed = bet.predictions?.[member];
        const actual = officialResults.predictions[member];
        if (guessed && actual) {
          const isCorrect = guessed === actual;
          if (isCorrect) correctCount++;
          details[member] = { guessed, actual, isCorrect };
        }
      });

      const accuracy = Math.round((correctCount / TDP_MEMBERS.length) * 100);

      return {
        bettorName: bet.bettorName,
        correctCount,
        total: TDP_MEMBERS.length,
        accuracy,
        details,
        updatedAt: bet.updatedAt,
      };
    });

    scores.sort((a, b) => b.correctCount - a.correctCount);
    return scores;
  }, [bets, officialResults, isOfficialPublished]);

  const filteredBets = bets.filter((bet) =>
    bet.bettorName.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <div className="min-h-screen flex flex-col pb-16">
      <Header
        title="Live Prediction Results"
        subtitle={`${bets.length} total ${bets.length === 1 ? 'bettor' : 'bettors'}`}
      />

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex-1 flex flex-col gap-6">
        {/* כרטיסיית תוצאות האמת הרשמיות - מוצגת בראש העמוד לצפייה מהירה */}
        {isOfficialPublished && officialTeamRosters && (
          <div className="bg-slate-850 border border-amber-500/40 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <span>השיבוצים הרשמיים של המחזור (תוצאות אמת)</span>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </h2>
                  <p className="text-xs text-slate-400">
                    חלוקת 18 חברי ה-TDP לחטיבות כפי שפורסמה רשמית
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowOfficialRoster(!showOfficialRoster)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-1"
              >
                <span>{showOfficialRoster ? 'צמצם' : 'הרחב'}</span>
                {showOfficialRoster ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>

            {showOfficialRoster && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
                {TEAMS.map((team) => {
                  const members = officialTeamRosters[team] || [];
                  const style = TEAM_STYLES[team];

                  return (
                    <div
                      key={team}
                      className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <span
                          className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${style.bg} ${style.text} ${style.border}`}
                        >
                          {team}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {members.length}
                        </span>
                      </div>

                      <div className="space-y-1">
                        {members.length === 0 ? (
                          <span className="text-[11px] text-slate-500 italic">אין שיבוצים</span>
                        ) : (
                          members.map((m) => (
                            <div
                              key={m}
                              dir="rtl"
                              className="text-xs font-bold text-slate-200 bg-slate-800/60 px-2 py-1 rounded-lg flex items-center justify-between"
                            >
                              <span>{m}</span>
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* מתג לשוניות ראשי */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex flex-wrap bg-slate-800 p-1 rounded-xl border border-slate-700 w-full sm:w-auto">
            {isOfficialPublished && (
              <button
                onClick={() => setMainTab('leaderboard')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  mainTab === 'leaderboard'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Trophy className="w-4 h-4 text-amber-300" />
                לוח מובילים (Leaderboard)
              </button>
            )}

            <button
              onClick={() => setMainTab('summary')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                mainTab === 'summary'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              סיכום ותובנות (Analytics)
            </button>

            <button
              onClick={() => setMainTab('table')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                mainTab === 'table'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TableIcon className="w-4 h-4" />
              טבלה מלאה (Full Grid)
            </button>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-2 self-end sm:self-auto">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            סנכרון בזמן אמת ({bets.length} הצבעות)
          </div>
        </div>

        {loading ? (
          <LoadingSpinner message="טוען נתונים מ-Firestore..." />
        ) : bets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-800/40 rounded-2xl border border-slate-800">
            <Users className="w-12 h-12 text-slate-600 mb-3" />
            <p className="text-base font-semibold text-slate-300">עדיין לא נרשמו הימורים</p>
            <p className="text-xs text-slate-500 mt-1">היה הראשון להזין הימור!</p>
          </div>
        ) : mainTab === 'leaderboard' && isOfficialPublished ? (
          /* ============================================================ */
          /*                       לוח מובילים וציונים                    */
          /* ============================================================ */
          <div className="space-y-6">
            <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  דירוג המנחשים לפי תוצאות האמת
                </h3>
                <p className="text-xs text-slate-400">
                  הציון מחושב לפי כמות השיבוצים המדויקת מתוך 18 חברי המחזור
                </p>
              </div>
              <span className="text-xs text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20 font-bold">
                {rankedBettors.length} משתתפים מדורגים
              </span>
            </div>

            <div className="space-y-3">
              {rankedBettors.map((item, index) => {
                const rank = index + 1;
                const isExpanded = expandedBettor === item.bettorName;

                const medalColor =
                  rank === 1
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-amber-500/10'
                    : rank === 2
                    ? 'bg-slate-300/20 text-slate-200 border-slate-400/40'
                    : rank === 3
                    ? 'bg-amber-700/20 text-amber-400 border-amber-700/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700';

                return (
                  <div
                    key={item.bettorName}
                    className="bg-slate-800/80 border border-slate-700 rounded-2xl overflow-hidden transition-all shadow-sm"
                  >
                    <div
                      onClick={() =>
                        setExpandedBettor(isExpanded ? null : item.bettorName)
                      }
                      className="p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-750 transition-colors"
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-black text-sm sm:text-base border shadow-sm ${medalColor}`}
                        >
                          {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                        </div>

                        <div>
                          <div className="font-bold text-slate-100 text-base sm:text-lg flex items-center gap-2">
                            <span>{item.bettorName}</span>
                            {rank === 1 && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                                מקום ראשון!
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400">
                            {item.correctCount} ניחושים נכונים מתוך {item.total}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-lg sm:text-xl font-black font-mono text-indigo-400">
                            {item.accuracy}%
                          </div>
                          <div className="text-[11px] text-slate-400 hidden sm:block">דיוק</div>
                        </div>

                        <button
                          type="button"
                          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
                          aria-label="Toggle details"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* פירוט הניחושים בלחיצה */}
                    {isExpanded && (
                      <div className="p-4 sm:p-5 bg-slate-900 border-t border-slate-700/80 space-y-3">
                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          פירוט ניחושי האמת של {item.bettorName}:
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {TDP_MEMBERS.map((member) => {
                            const det = item.details[member];
                            if (!det) return null;

                            return (
                              <div
                                key={member}
                                className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                                  det.isCorrect
                                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                                    : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {det.isCorrect ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                                  )}
                                  <span dir="rtl" className="font-bold text-slate-200">
                                    {member}
                                  </span>
                                </div>

                                <div className="text-right">
                                  {det.isCorrect ? (
                                    <span className="font-semibold text-emerald-400">
                                      {det.guessed}
                                    </span>
                                  ) : (
                                    <span className="text-[11px]">
                                      <span className="line-through text-slate-400 mr-1">
                                        {det.guessed}
                                      </span>
                                      <span className="font-bold text-rose-300">{det.actual}</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : mainTab === 'summary' ? (
          /* ============================================================ */
          /*                       סיכומים ותובנות                        */
          /* ============================================================ */
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSummarySubTab('roster')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                  summarySubTab === 'roster'
                    ? 'bg-slate-800 border-indigo-500 text-indigo-400 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Layers className="w-4 h-4" />
                שיבוץ צפוי לפי חטיבה (Rosters)
              </button>
              <button
                onClick={() => setSummarySubTab('consensus')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                  summarySubTab === 'consensus'
                    ? 'bg-slate-800 border-indigo-500 text-indigo-400 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Crown className="w-4 h-4" />
                הימור מוביל לכל חבר (Consensus)
              </button>
              <button
                onClick={() => setSummarySubTab('breakdown')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                  summarySubTab === 'breakdown'
                    ? 'bg-slate-800 border-indigo-500 text-indigo-400 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                גרף עמודות לחבר ספציפי (Bar Chart)
              </button>
            </div>

            {/* חלק 1: שיבוץ צפוי לפי חטיבה */}
            {summarySubTab === 'roster' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800/60 p-4 rounded-2xl border border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">
                      חלוקה לחטיבות לפי ההימור המוביל
                    </h3>
                    <p className="text-xs text-slate-400">
                      כל חבר TDP משובץ לחטיבה שקיבלה עבורו את מירב הקולות
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setSelectedTeamFilter('ALL')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        selectedTeamFilter === 'ALL'
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      הכל (5 חטיבות)
                    </button>
                    {TEAMS.map((team) => {
                      const isSelected = selectedTeamFilter === team;
                      const style = TEAM_STYLES[team];
                      return (
                        <button
                          key={team}
                          onClick={() => setSelectedTeamFilter(team)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            isSelected
                              ? style.active
                              : `${style.bg} ${style.text} ${style.border}`
                          }`}
                        >
                          {team} ({projectedRosters[team].length})
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div
                  className={`grid gap-4 ${
                    selectedTeamFilter === 'ALL'
                      ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                      : 'grid-cols-1'
                  }`}
                >
                  {(selectedTeamFilter === 'ALL' ? TEAMS : [selectedTeamFilter]).map((team) => {
                    const roster = projectedRosters[team];
                    const style = TEAM_STYLES[team];

                    return (
                      <div
                        key={team}
                        className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 flex flex-col shadow-sm"
                      >
                        <div className="flex items-center justify-between pb-3 border-b border-slate-700 mb-4">
                          <span
                            className={`px-3 py-1 rounded-lg text-xs font-bold border ${style.bg} ${style.text} ${style.border}`}
                          >
                            {team}
                          </span>
                          <span className="text-xs font-semibold text-slate-400">
                            {roster.length} {roster.length === 1 ? 'חבר צפוי' : 'חברים צפויים'}
                          </span>
                        </div>

                        {roster.length === 0 ? (
                          <p className="text-xs text-slate-500 italic py-6 text-center">
                            אין חברים שזהו ההימור המוביל עבורם
                          </p>
                        ) : (
                          <div className="space-y-2.5 flex-1">
                            {roster.map(({ member, votes, total, percentage, isTie }) => (
                              <div
                                key={member}
                                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <span
                                    dir="rtl"
                                    className="text-sm font-bold text-slate-200"
                                  >
                                    {member}
                                  </span>
                                  {isTie && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                      תיקו
                                    </span>
                                  )}
                                </div>
                                <div className="text-right">
                                  <span className="text-xs font-mono font-bold text-indigo-400">
                                    {percentage}%
                                  </span>
                                  <span className="text-[11px] text-slate-500 ml-1">
                                    ({votes}/{total})
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* חלק 2: ההימור המוביל לכל חבר */}
            {summarySubTab === 'consensus' && (
              <div className="space-y-4">
                <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-800">
                  <h3 className="text-sm font-bold text-slate-100">
                    ההימור המוביל עבור כל אחד מ-18 חברי ה-TDP
                  </h3>
                  <p className="text-xs text-slate-400">
                    תמונת מצב מרוכזת של החטיבה בעלת הסיכוי הגבוה ביותר על פי קולות המשתתפים
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {TDP_MEMBERS.map((member) => {
                    const stat = memberStats[member];
                    const hasVotes = stat.totalVotes > 0;
                    const isTie = stat.leadingTeams.length > 1;

                    return (
                      <div
                        key={member}
                        className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-col justify-between gap-3 shadow-sm hover:border-slate-600 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <UserCheck className="w-4 h-4 text-indigo-400" />
                            <span dir="rtl" className="text-base font-bold text-slate-100">
                              {member}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 font-mono">
                            {stat.totalVotes} הצבעות
                          </span>
                        </div>

                        {hasVotes ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-400">
                                {isTie ? 'תיקו מוביל בין:' : 'הימור מוביל:'}
                              </span>
                              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                {stat.leadingTeams.map((team) => {
                                  const style = TEAM_STYLES[team];
                                  return (
                                    <span
                                      key={team}
                                      className={`px-2 py-0.5 rounded-lg text-xs font-bold border ${style.bg} ${style.text} ${style.border}`}
                                    >
                                      {team}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden flex">
                              {TEAMS.map((team) => {
                                const percent = stat.percentages[team];
                                if (percent === 0) return null;
                                const colorMap: Record<Team, string> = {
                                  Consumer: 'bg-blue-500',
                                  Levelup: 'bg-purple-500',
                                  Netcom: 'bg-emerald-500',
                                  Artemis: 'bg-amber-500',
                                  Dispatch: 'bg-rose-500',
                                };
                                return (
                                  <div
                                    key={team}
                                    style={{ width: `${percent}%` }}
                                    title={`${team}: ${stat.counts[team]} votes (${percent}%)`}
                                    className={`${colorMap[team]}`}
                                  />
                                );
                              })}
                            </div>

                            <div className="flex justify-between text-[11px] text-slate-400 pt-0.5">
                              <span>קונצנזוס:</span>
                              <span className="font-semibold text-slate-200">
                                {stat.leadingTeams.map((t) => stat.percentages[t]).join(' / ')}%
                                ({stat.maxVotes} מתוך {stat.totalVotes})
                              </span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 italic">טרם הוזנו הצבעות</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* חלק 3: גרף עמודות לחבר ספציפי */}
            {summarySubTab === 'breakdown' && (
              <div className="space-y-6">
                <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-100">
                        גרף עמודות ופירוט הצבעות לפי שם
                      </h3>
                      <p className="text-xs text-slate-400">
                        בחר חבר TDP כדי לראות את התפלגות כל 5 האופציות
                      </p>
                    </div>

                    <div className="text-xs text-slate-400">
                      נבחר: <strong className="text-indigo-400">{selectedMember}</strong>
                    </div>
                  </div>

                  <div className="flex gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar">
                    {TDP_MEMBERS.map((member) => {
                      const isSelected = selectedMember === member;
                      const stat = memberStats[member];
                      return (
                        <button
                          key={member}
                          onClick={() => setSelectedMember(member)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                            isSelected
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <span dir="rtl">{member}</span>
                          <span className="ml-1 text-[10px] opacity-70">
                            ({stat.totalVotes})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {(() => {
                  const stat = memberStats[selectedMember];
                  const hasVotes = stat.totalVotes > 0;

                  return (
                    <div className="p-6 rounded-2xl bg-slate-800/90 border border-slate-700 shadow-xl space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700">
                        <div>
                          <div className="flex items-center gap-3">
                            <span dir="rtl" className="text-2xl font-black text-white">
                              {selectedMember}
                            </span>
                            {stat.leadingTeams.length > 0 && (
                              <div className="flex items-center gap-1.5">
                                <Crown className="w-4 h-4 text-amber-400" />
                                <span className="text-xs font-semibold text-amber-400">
                                  ההימור המוביל: {stat.leadingTeams.join(' / ')}
                                </span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            סה״כ {stat.totalVotes} הצבעות נרשמו עבור {selectedMember}
                          </p>
                        </div>
                      </div>

                      {!hasVotes ? (
                        <p className="text-sm text-slate-500 italic text-center py-8">
                          אין עדיין הצבעות עבור {selectedMember}
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {TEAMS.map((team) => {
                            const count = stat.counts[team];
                            const percentage = stat.percentages[team];
                            const isLeading = stat.leadingTeams.includes(team);
                            const style = TEAM_STYLES[team];

                            const colorBar: Record<Team, string> = {
                              Consumer: 'bg-blue-500',
                              Levelup: 'bg-purple-500',
                              Netcom: 'bg-emerald-500',
                              Artemis: 'bg-amber-500',
                              Dispatch: 'bg-rose-500',
                            };

                            return (
                              <div key={team} className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs sm:text-sm">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${style.bg} ${style.text} ${style.border}`}
                                    >
                                      {team}
                                    </span>
                                    {isLeading && (
                                      <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                                        ★ מוביל
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-400 text-xs">
                                      {count} {count === 1 ? 'הצבעה' : 'הצבעות'}
                                    </span>
                                    <span className="font-mono font-bold text-slate-200 w-12 text-right">
                                      {percentage}%
                                    </span>
                                  </div>
                                </div>

                                <div className="h-4 w-full bg-slate-900/90 rounded-xl overflow-hidden p-0.5 border border-slate-800">
                                  <div
                                    style={{ width: `${percentage}%` }}
                                    className={`h-full rounded-lg transition-all duration-500 ${colorBar[team]} ${
                                      isLeading ? 'brightness-110 shadow-sm' : 'opacity-80'
                                    }`}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        ) : (
          /* ============================================================ */
          /*                       טבלה מלאה                              */
          /* ============================================================ */
          <div className="space-y-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="חפש לפי שם מהמר..."
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

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
                      {isOfficialPublished && (
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-xs font-bold text-center text-amber-300 bg-slate-800/95 min-w-[90px] border-l border-slate-700"
                        >
                          ציון
                        </th>
                      )}
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
                    {/* שורת תוצאות אמת מודגשת בראש הטבלה */}
                    {isOfficialPublished && officialResults && (
                      <tr className="bg-amber-950/20 border-b-2 border-amber-500/40">
                        <td className="sticky left-0 z-10 bg-slate-900 px-4 py-3 font-bold text-amber-400 whitespace-nowrap shadow-[2px_0_5px_rgba(0,0,0,0.3)] flex items-center gap-1.5">
                          <Trophy className="w-4 h-4 text-amber-400" />
                          <span>תוצאות אמת</span>
                        </td>
                        <td className="px-2 py-3 text-center border-l border-slate-800 text-amber-400 font-bold">
                          -
                        </td>
                        {TDP_MEMBERS.map((member) => {
                          const realTeam = officialResults.predictions[member];
                          const style = realTeam ? TEAM_STYLES[realTeam] : null;
                          return (
                            <td
                              key={member}
                              className="px-2 py-3 text-center border-l border-slate-800/40 whitespace-nowrap"
                            >
                              {realTeam && style ? (
                                <span
                                  className={`inline-block px-2.5 py-1 rounded-lg font-bold border text-[11px] ring-1 ring-amber-500/50 ${style.bg} ${style.text} ${style.border}`}
                                >
                                  {realTeam}
                                </span>
                              ) : (
                                <span className="text-slate-600 text-[11px]">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    )}

                    {filteredBets.map((bet) => {
                      let scoreText = '';
                      if (isOfficialPublished && officialResults) {
                        let matches = 0;
                        TDP_MEMBERS.forEach((m) => {
                          if (bet.predictions?.[m] === officialResults.predictions[m]) {
                            matches++;
                          }
                        });
                        scoreText = `${matches}/${TDP_MEMBERS.length}`;
                      }

                      return (
                        <tr
                          key={bet.bettorName}
                          className="hover:bg-slate-800/40 transition-colors group"
                        >
                          <td className="sticky left-0 z-10 bg-slate-900 group-hover:bg-slate-850 px-4 py-3 font-semibold text-slate-100 whitespace-nowrap shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                            {bet.bettorName}
                          </td>

                          {isOfficialPublished && (
                            <td className="px-2 py-3 text-center border-l border-slate-800 font-mono font-bold text-amber-300">
                              {scoreText}
                            </td>
                          )}

                          {TDP_MEMBERS.map((member) => {
                            const team = bet.predictions?.[member] as Team | undefined;
                            const style = team ? TEAM_STYLES[team] : null;

                            const isCorrect =
                              isOfficialPublished &&
                              officialResults &&
                              team &&
                              team === officialResults.predictions[member];

                            const isWrong =
                              isOfficialPublished &&
                              officialResults &&
                              team &&
                              team !== officialResults.predictions[member];

                            return (
                              <td
                                key={member}
                                className="px-2 py-3 text-center border-l border-slate-800/40 whitespace-nowrap"
                              >
                                {team && style ? (
                                  <span
                                    className={`inline-block px-2.5 py-1 rounded-lg font-medium border text-[11px] ${
                                      isCorrect
                                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 ring-1 ring-emerald-500/50'
                                        : isWrong
                                        ? 'opacity-60 grayscale-[30%]'
                                        : `${style.bg} ${style.text} ${style.border}`
                                    }`}
                                  >
                                    {team}
                                    {isCorrect && ' ✔'}
                                  </span>
                                ) : (
                                  <span className="text-slate-600 text-[11px]">-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
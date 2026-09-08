import { TDPMember, Team } from '../types';

export const TEAMS: Team[] = ['Consumer', 'Levelup', 'Netcom', 'Artemis', 'Dispatch'];

export const TDP_MEMBERS: TDPMember[] = [
  'נועה',
  'שי',
  'גל',
  'איוב',
  'בן',
  'יערה',
  'מאיה',
  'עידו',
  'יובל',
  'יאיר',
  'מור',
  'אופיר',
  'נדב',
  'אופק',
  'יותם',
  'הדר',
  'אשל',
  'דביר',
];

export const TEAM_STYLES: Record<Team, { bg: string; text: string; border: string; active: string }> = {
  Consumer: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    active: 'bg-blue-600 text-white border-blue-500 shadow-blue-500/20 shadow-md',
  },
  Levelup: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    active: 'bg-purple-600 text-white border-purple-500 shadow-purple-500/20 shadow-md',
  },
  Netcom: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    active: 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20 shadow-md',
  },
  Artemis: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    active: 'bg-amber-600 text-white border-amber-500 shadow-amber-500/20 shadow-md',
  },
  Dispatch: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    active: 'bg-rose-600 text-white border-rose-500 shadow-rose-500/20 shadow-md',
  },
};

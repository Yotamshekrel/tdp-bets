import { Timestamp } from 'firebase/firestore';

export type Team = 'Consumer' | 'Levelup' | 'Netcom' | 'Artemis' | 'Dispatch';

export type TDPMember =
  | 'נועה'
  | 'שי'
  | 'גל'
  | 'איוב'
  | 'בן'
  | 'יערה'
  | 'מאיה'
  | 'עידו'
  | 'יובל'
  | 'יאיר'
  | 'מור'
  | 'אופיר'
  | 'נדב'
  | 'אופק'
  | 'יותם'
  | 'הדר'
  | 'אשל'
  | 'דביר';

export interface BetDocument {
  bettorName: string;
  predictions: Record<string, Team>;
  updatedAt: Timestamp | Date;
}

export interface OfficialResultsDocument {
  bettorName?: string;
  predictions: Record<string, Team>;
  isPublished: boolean;
  updatedAt?: Timestamp | Date;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
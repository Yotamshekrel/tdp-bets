import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { BetDocument, Team } from '../types';

const BETS_COLLECTION = 'bets';

export const normalizeBettorKey = (name: string): string => {
  return name.trim().toLowerCase();
};

export const getBet = async (bettorName: string): Promise<BetDocument | null> => {
  const docId = normalizeBettorKey(bettorName);
  const docRef = doc(db, BETS_COLLECTION, docId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data() as BetDocument;
  }
  return null;
};

export const saveBet = async (
  bettorName: string,
  predictions: Record<string, Team>
): Promise<void> => {
  const trimmedName = bettorName.trim();
  const docId = normalizeBettorKey(trimmedName);
  const docRef = doc(db, BETS_COLLECTION, docId);

  await setDoc(
    docRef,
    {
      bettorName: trimmedName,
      predictions,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

export const deleteBet = async (bettorName: string): Promise<void> => {
  const docId = normalizeBettorKey(bettorName);
  const docRef = doc(db, BETS_COLLECTION, docId);
  await deleteDoc(docRef);
};

export const subscribeToBets = (
  callback: (bets: BetDocument[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const betsRef = collection(db, BETS_COLLECTION);
  const betsQuery = query(betsRef, orderBy('updatedAt', 'desc'));

  return onSnapshot(
    betsQuery,
    (snapshot) => {
      const bets: BetDocument[] = [];
      snapshot.forEach((docSnap) => {
        bets.push(docSnap.data() as BetDocument);
      });
      callback(bets);
    },
    (error) => {
      console.error('Firestore listener error:', error);
      if (onError) onError(error);
    }
  );
};
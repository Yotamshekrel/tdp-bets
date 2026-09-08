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
import { BetDocument, OfficialResultsDocument, Team } from '../types';

const BETS_COLLECTION = 'bets';
export const OFFICIAL_RESULTS_DOC_ID = 'official_results';

export const normalizeBettorKey = (name: string): string => {
  return name.trim().toLowerCase();
};

export const getBet = async (bettorName: string): Promise<BetDocument | null> => {
  const docId = normalizeBettorKey(bettorName);
  if (docId === OFFICIAL_RESULTS_DOC_ID) return null;

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
        if (docSnap.id !== OFFICIAL_RESULTS_DOC_ID) {
          const data = docSnap.data() as BetDocument;
          if (data.bettorName && normalizeBettorKey(data.bettorName) !== OFFICIAL_RESULTS_DOC_ID) {
            bets.push(data);
          }
        }
      });
      callback(bets);
    },
    (error) => {
      console.error('Firestore listener error:', error);
      if (onError) onError(error);
    }
  );
};

export const getOfficialResults = async (): Promise<OfficialResultsDocument | null> => {
  const docRef = doc(db, BETS_COLLECTION, OFFICIAL_RESULTS_DOC_ID);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data() as OfficialResultsDocument;
  }
  return null;
};

export const saveOfficialResults = async (
  predictions: Record<string, Team>,
  isPublished: boolean
): Promise<void> => {
  const docRef = doc(db, BETS_COLLECTION, OFFICIAL_RESULTS_DOC_ID);

  const cleanPredictions: Record<string, Team> = {};
  for (const [key, val] of Object.entries(predictions)) {
    if (val) {
      cleanPredictions[key] = val;
    }
  }

  await setDoc(
    docRef,
    {
      bettorName: OFFICIAL_RESULTS_DOC_ID,
      predictions: cleanPredictions,
      isPublished,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

export const deleteOfficialResults = async (): Promise<void> => {
  const docRef = doc(db, BETS_COLLECTION, OFFICIAL_RESULTS_DOC_ID);
  await deleteDoc(docRef);
};

export const subscribeToOfficialResults = (
  callback: (results: OfficialResultsDocument | null) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const docRef = doc(db, BETS_COLLECTION, OFFICIAL_RESULTS_DOC_ID);

  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as OfficialResultsDocument);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('Official results listener error:', error);
      if (onError) onError(error);
    }
  );
};
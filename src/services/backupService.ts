import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export interface BackupStatus {
  collectionName: string;
  count: number;
  success: boolean;
  error?: string;
}

export interface BackupResult {
  fileName: string;
  succeededCollections: string[];
  failedCollections: string[];
  hasFailures: boolean;
  totalRecords: number;
  details: BackupStatus[];
}

export interface BackupData {
  exportedAt: string;
  triggerAction: string;
  appVersion: string;
  status: {
    hasFailures: boolean;
    failedCollections: string[];
    collectionSummary: Record<string, { count: number; success: boolean }>;
  };
  collections: Record<string, any[]>;
}

const COLLECTIONS_TO_BACKUP = [
  'characters',
  'tags',
  'talent_definitions',
  'trait_factors',
  'trait_remarks',
  'custom_metrics',
  'character_extensions',
  'talent_tree_layout',
  'system_configs'
];

export const createBackup = async (action: string): Promise<BackupResult> => {
  const collections: Record<string, any[]> = {};
  const details: BackupStatus[] = [];
  let totalRecords = 0;

  for (const collName of COLLECTIONS_TO_BACKUP) {
    try {
      const snapshot = await getDocs(collection(db, collName));
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      collections[collName] = docs;
      totalRecords += docs.length;
      details.push({ collectionName: collName, count: docs.length, success: true });
    } catch (error: any) {
      console.error(`Error backing up collection ${collName}:`, error);
      details.push({ 
        collectionName: collName, 
        count: 0, 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      });
      // Important: if it fails, we do NOT fill it with an empty array in the output collections
      // so it's clear it's missing.
    }
  }

  const hasFailures = details.some(d => !d.success);
  const succeededCollections = details.filter(d => d.success).map(d => d.collectionName);
  const failedCollections = details.filter(d => !d.success).map(d => d.collectionName);

  const backup: BackupData = {
    exportedAt: new Date().toISOString(),
    triggerAction: action,
    appVersion: '5.1.0',
    status: {
      hasFailures,
      failedCollections,
      collectionSummary: details.reduce((acc, curr) => ({
        ...acc,
        [curr.collectionName]: { count: curr.count, success: curr.success }
      }), {})
    },
    collections
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fileName = `manor-backup_${dateStr}_${action}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return {
    fileName,
    succeededCollections,
    failedCollections,
    hasFailures,
    totalRecords,
    details
  };
};

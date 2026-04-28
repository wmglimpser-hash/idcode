import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export interface BackupData {
  exportedAt: string;
  triggerAction: string;
  appVersion: string;
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

export const createBackup = async (action: string): Promise<string> => {
  const collections: Record<string, any[]> = {};
  
  for (const collName of COLLECTIONS_TO_BACKUP) {
    try {
      const snapshot = await getDocs(collection(db, collName));
      collections[collName] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error(`Error backing up collection ${collName}:`, error);
      collections[collName] = [];
    }
  }

  const backup: BackupData = {
    exportedAt: new Date().toISOString(),
    triggerAction: action,
    appVersion: '5.0.0',
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

  return fileName;
};

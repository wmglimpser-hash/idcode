import { collection, doc, getDocs, query, setDoc, serverTimestamp, where, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Tag } from '../constants';

export const syncTags = async (tagNames: string[], role: 'Survivor' | 'Hunter' | 'Both', userId: string) => {
  if (!tagNames || tagNames.length === 0) return;

  try {
    const tagsRef = collection(db, 'tags');
    const snapshot = await getDocs(tagsRef);
    const existingTagNames = new Set(snapshot.docs.map(doc => (doc.data() as Tag).name));

    for (const name of tagNames) {
      if (!name) continue;
      if (!existingTagNames.has(name)) {
        const docId = `tag_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        await setDoc(doc(db, 'tags', docId), {
          name,
          color: '#00f3ff', // Default color
          affectedRole: role,
          affectedStats: [],
          authorId: userId,
          updatedAt: serverTimestamp()
        });
        existingTagNames.add(name); // Prevent adding same tag multiple times in one loop
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'tags');
  }
};

export const renameTagGlobal = async (oldName: string, newName: string) => {
  if (!oldName || !newName || oldName === newName) return;

  try {
    // 1. Update talents
    const talentsSnapshot = await getDocs(collection(db, 'talent_definitions'));
    for (const d of talentsSnapshot.docs) {
      const data = d.data();
      if (data.tags?.includes(oldName)) {
        const newTags = data.tags.map((t: string) => t === oldName ? newName : t);
        const newTagColors = { ...(data.tagColors || {}) };
        if (newTagColors[oldName]) {
          newTagColors[newName] = newTagColors[oldName];
          delete newTagColors[oldName];
        }
        await updateDoc(doc(db, 'talent_definitions', d.id), {
          tags: newTags,
          tagColors: newTagColors,
          updatedAt: serverTimestamp()
        });
      }
    }

    // 2. Update characters
    const charsSnapshot = await getDocs(collection(db, 'characters'));
    for (const d of charsSnapshot.docs) {
      const data = d.data();
      let changed = false;
      const skills = data.skills?.map((s: any) => {
        if (s.tags?.includes(oldName)) {
          changed = true;
          return { ...s, tags: s.tags.map((t: string) => t === oldName ? newName : t) };
        }
        return s;
      });
      const presence = data.presence?.map((p: any) => {
        if (p.tags?.includes(oldName)) {
          changed = true;
          return { ...p, tags: p.tags.map((t: string) => t === oldName ? newName : t) };
        }
        return p;
      });

      if (changed) {
        await updateDoc(doc(db, 'characters', d.id), {
          skills,
          presence,
          lastUpdated: serverTimestamp()
        });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'global_rename');
  }
};

export const deleteTagGlobal = async (tagName: string) => {
  if (!tagName) return;

  try {
    // 1. Update talents
    const talentsSnapshot = await getDocs(collection(db, 'talent_definitions'));
    for (const d of talentsSnapshot.docs) {
      const data = d.data();
      if (data.tags?.includes(tagName)) {
        const newTags = data.tags.filter((t: string) => t !== tagName);
        const newTagColors = { ...(data.tagColors || {}) };
        delete newTagColors[tagName];
        await updateDoc(doc(db, 'talent_definitions', d.id), {
          tags: newTags,
          tagColors: newTagColors,
          updatedAt: serverTimestamp()
        });
      }
    }

    // 2. Update characters
    const charsSnapshot = await getDocs(collection(db, 'characters'));
    for (const d of charsSnapshot.docs) {
      const data = d.data();
      let changed = false;
      const skills = data.skills?.map((s: any) => {
        if (s.tags?.includes(tagName)) {
          changed = true;
          return { ...s, tags: s.tags.filter((t: string) => t !== tagName) };
        }
        return s;
      });
      const presence = data.presence?.map((p: any) => {
        if (p.tags?.includes(tagName)) {
          changed = true;
          return { ...p, tags: p.tags.filter((t: string) => t !== tagName) };
        }
        return p;
      });

      if (changed) {
        await updateDoc(doc(db, 'characters', d.id), {
          skills,
          presence,
          lastUpdated: serverTimestamp()
        });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'global_delete');
  }
};

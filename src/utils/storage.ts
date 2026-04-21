import { MoodEntry, TestEntry } from "@/types";

// Генерируем уникальные ключи для каждого пользователя
const getUserStorageKey = (baseKey: string) => {
  const user = localStorage.getItem('token');
  if (!user) return baseKey;
  
  // Используем ID пользователя как часть ключа
  const token = user;
  return `${baseKey}-${token}`;
};

// Local Storage Keys
const MOOD_ENTRIES_BASE_KEY = "esports-mood-entries";
const TEST_ENTRIES_BASE_KEY = "esports-test-entries";

// Mood Entries
export const getMoodEntries = (): MoodEntry[] => {
  const storageKey = getUserStorageKey(MOOD_ENTRIES_BASE_KEY);
  const entries = localStorage.getItem(storageKey);
  
  if (!entries) {
    return [];
  }
  
  try {
    return JSON.parse(entries).map((entry: any) => ({
      ...entry,
      date: new Date(entry.date)
    }));
  } catch (error) {
    console.error("Error parsing mood entries:", error);
    return [];
  }
};

export const saveMoodEntry = (entry: Omit<MoodEntry, "id">): MoodEntry => {
  const entries = getMoodEntries();
  const newEntry = {
    ...entry,
    id: Date.now().toString(),
  };
  
  const storageKey = getUserStorageKey(MOOD_ENTRIES_BASE_KEY);
  localStorage.setItem(storageKey, JSON.stringify([...entries, newEntry]));
  
  return newEntry;
};

export const deleteMoodEntry = (id: string): void => {
  const entries = getMoodEntries();
  const filteredEntries = entries.filter(entry => entry.id !== id);
  
  const storageKey = getUserStorageKey(MOOD_ENTRIES_BASE_KEY);
  localStorage.setItem(storageKey, JSON.stringify(filteredEntries));
};

// Test Entries
export const getTestEntries = (): TestEntry[] => {
  const storageKey = getUserStorageKey(TEST_ENTRIES_BASE_KEY);
  const entries = localStorage.getItem(storageKey);
  
  if (!entries) {
    return [];
  }
  
  try {
    return JSON.parse(entries).map((entry: any) => ({
      ...entry,
      date: new Date(entry.date)
    }));
  } catch (error) {
    console.error("Error parsing test entries:", error);
    return [];
  }
};

export const saveTestEntry = (entry: Omit<TestEntry, "id">): TestEntry => {
  const entries = getTestEntries();
  const newEntry = {
    ...entry,
    id: Date.now().toString(),
  };
  
  const storageKey = getUserStorageKey(TEST_ENTRIES_BASE_KEY);
  localStorage.setItem(storageKey, JSON.stringify([...entries, newEntry]));
  
  return newEntry;
};

export const updateTestEntry = (id: string, updates: Partial<TestEntry>): TestEntry | null => {
  const entries = getTestEntries();
  const entryIndex = entries.findIndex(entry => entry.id === id);
  
  if (entryIndex === -1) {
    return null;
  }
  
  const updatedEntry = { ...entries[entryIndex], ...updates };
  entries[entryIndex] = updatedEntry;
  
  const storageKey = getUserStorageKey(TEST_ENTRIES_BASE_KEY);
  localStorage.setItem(storageKey, JSON.stringify(entries));
  
  return updatedEntry;
};

export const deleteTestEntry = (id: string): void => {
  const entries = getTestEntries();
  const filteredEntries = entries.filter(entry => entry.id !== id);
  
  const storageKey = getUserStorageKey(TEST_ENTRIES_BASE_KEY);
  localStorage.setItem(storageKey, JSON.stringify(filteredEntries));
};

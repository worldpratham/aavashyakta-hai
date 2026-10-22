/**
 * Utility for persisting and restoring form drafts across page navigation.
 * Uses both sessionStorage (for session-based tab history) and localStorage (as backup),
 * ensuring that when users navigate away, click browser Back/Forward buttons, or return,
 * their entered form details remain completely intact.
 */

export function getDraft<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const saved = window.sessionStorage.getItem(key) || window.localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (typeof defaultValue === 'object' && defaultValue !== null && !Array.isArray(defaultValue)) {
        return { ...defaultValue, ...parsed };
      }
      return parsed as T;
    }
  } catch (err) {
    console.warn(`[draftStorage] Failed to read draft for "${key}":`, err);
  }
  return defaultValue;
}

export function getDraftField<T>(key: string, field: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const saved = window.sessionStorage.getItem(key) || window.localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && field in parsed && parsed[field] !== undefined && parsed[field] !== null) {
        return parsed[field] as T;
      }
    }
  } catch (err) {
    console.warn(`[draftStorage] Failed to read draft field "${field}" for "${key}":`, err);
  }
  return defaultValue;
}

export function saveDraft<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    const json = JSON.stringify(data);
    window.sessionStorage.setItem(key, json);
    window.localStorage.setItem(key, json);
  } catch (err) {
    console.warn(`[draftStorage] Failed to save draft for "${key}":`, err);
  }
}

export function clearDraft(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(key);
    window.localStorage.removeItem(key);
  } catch (err) {
    console.warn(`[draftStorage] Failed to clear draft for "${key}":`, err);
  }
}

export function hasDraft(key: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const saved = window.sessionStorage.getItem(key) || window.localStorage.getItem(key);
    if (!saved) return false;
    const parsed = JSON.parse(saved);
    if (typeof parsed === 'object' && parsed !== null) {
      return Object.values(parsed).some(
        (val) => val !== '' && val !== null && val !== undefined && val !== false
      );
    }
    return Boolean(parsed);
  } catch (e) {
    return false;
  }
}

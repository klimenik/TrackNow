// Central place for storage keys and the fixed working-time rules.

export const STORAGE_PREFIX = "tracknow";

export const ENTRIES_KEY = `${STORAGE_PREFIX}.entries`;
export const MARKS_KEY = `${STORAGE_PREFIX}.marks`;
export const RUNNING_KEY = `${STORAGE_PREFIX}.running`;
export const THEME_KEY = `${STORAGE_PREFIX}.theme`;
export const LAST_BACKUP_KEY = `${STORAGE_PREFIX}.lastBackup`;

/** Daily target on a working day, in minutes (8 h). */
export const DAILY_TARGET_MINUTES = 8 * 60;

/** Weekday numbers that count as working days (Date.getDay(): 0 = Sunday). */
export const WORKDAYS = new Set([1, 2, 3, 4, 5]); // Mon–Fri

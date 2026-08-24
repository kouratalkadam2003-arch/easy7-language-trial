// FIX: The file was incomplete, causing "is not a module" errors.
// Completed the file with getFromStorage and saveToStorage functions.
/**
 * Retrieves an item from localStorage and parses it as JSON.
 * @param key The key of the item to retrieve from localStorage.
 * @param defaultValue A default value to return if the item is not found or if parsing fails.
 * @returns The parsed item from localStorage, or the defaultValue.
 */
export const getFromStorage = <T>(key: string, defaultValue: T): T => {
    try {
        const storedValue = window.localStorage.getItem(key);
        if (storedValue) {
            return JSON.parse(storedValue) as T;
        }
    } catch (error) {
        console.error(`Error reading from localStorage for key "${key}":`, error);
        // If parsing fails, it's safer to return the default value.
    }
    return defaultValue;
};

/**
 * Saves an item to localStorage, converting it to a JSON string first.
 * @param key The key under which to store the item in localStorage.
 * @param value The value to store. It will be JSON.stringified.
 */
export const saveToStorage = <T>(key: string, value: T): void => {
    try {
        const stringifiedValue = JSON.stringify(value);
        window.localStorage.setItem(key, stringifiedValue);
    } catch (error) {
        console.error(`Error writing to localStorage for key "${key}":`, error);
    }
};

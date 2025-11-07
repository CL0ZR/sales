/**
 * Date Formatting Utilities
 * All dates are formatted in Gregorian calendar
 */

/**
 * Format date to English MM/DD/YYYY
 * @param date - Date object or ISO string
 * @returns Formatted date string in MM/DD/YYYY format
 */
export function formatGregorianDate(date: Date | string): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${month}/${day}/${year}`;
}

/**
 * Format date and time to English MM/DD/YYYY hh:MM AM/PM
 * @param date - Date object or ISO string
 * @returns Formatted date-time string in MM/DD/YYYY hh:MM AM/PM format
 */
export function formatGregorianDateTime(date: Date | string): string {
  const d = new Date(date);
  const dateStr = formatGregorianDate(d);
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12; // Convert to 12-hour format
  const hoursStr = String(hours).padStart(2, '0');
  return `${dateStr} ${hoursStr}:${minutes} ${ampm}`;
}

/**
 * Format time only in 12-hour format with AM/PM
 * @param date - Date object or ISO string
 * @returns Formatted time string in hh:MM AM/PM format
 */
export function formatTime(date: Date | string): string {
  const d = new Date(date);
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12; // Convert to 12-hour format
  const hoursStr = String(hours).padStart(2, '0');
  return `${hoursStr}:${minutes} ${ampm}`;
}

/**
 * Format date and time with seconds to English MM/DD/YYYY hh:MM:SS AM/PM
 * @param date - Date object or ISO string
 * @returns Formatted date-time string with seconds
 */
export function formatGregorianDateTimeSeconds(date: Date | string): string {
  const d = new Date(date);
  const dateStr = formatGregorianDate(d);
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12; // Convert to 12-hour format
  const hoursStr = String(hours).padStart(2, '0');
  return `${dateStr} ${hoursStr}:${minutes}:${seconds} ${ampm}`;
}

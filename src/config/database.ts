import path from 'path';
import os from 'os';

/**
 * Database configuration
 * Stores the database in a dedicated directory on the D: drive
 */

// Base directory for all warehouse data
const DATA_DIR = 'D:\\MyWarehouseData';

/**
 * Get the path to the database file
 */
export function getDatabasePath(): string {
  return path.join(DATA_DIR, 'warehouse.db');
}

/**
 * Get the path to the backup directory
 */
export function getBackupPath(): string {
  return path.join(DATA_DIR, 'backups');
}

/**
 * Get the path to the export directory
 */
export function getExportPath(): string {
  return path.join(DATA_DIR, 'exports');
}

/**
 * Generate a backup file name with timestamp
 */
export function getBackupFileName(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return `warehouse-backup-${timestamp}.db`;
}

/**
 * Get the full path to a backup file
 */
export function getBackupFilePath(fileName?: string): string {
  const backupDir = getBackupPath();
  const backupName = fileName || getBackupFileName();
  return path.join(backupDir, backupName);
}

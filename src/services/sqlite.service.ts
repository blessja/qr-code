import { CapacitorSQLite, SQLiteDBConnection } from '@capacitor-community/sqlite';

const dbName = 'offline-clock-db';

export const initializeDatabase = async (): Promise<SQLiteDBConnection> => {
    const db = (await CapacitorSQLite.createConnection({
        database: dbName,
        version: 1,
        encrypted: false,
        mode: 'no-encryption',
      })) as unknown as SQLiteDBConnection; // Casting through unknown to ensure TypeScript acceptance
      
    if (!db) {
      throw new Error('Failed to create a database connection');
    }
  
    await db.open(); // Open the database connection
  
    await db.execute(`CREATE TABLE IF NOT EXISTS clock_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workerID TEXT,
      workerName TEXT,
      actionType TEXT,
      timestamp TEXT
    )`);
  
    return db;
  };

export const saveClockData = async (clockData: {
  workerID: string;
  workerName: string;
  actionType: string;
  timestamp: string;
}) => {
  const db = await initializeDatabase();
  await db.run(
    `INSERT INTO clock_data (workerID, workerName, actionType, timestamp)
    VALUES (?, ?, ?, ?)`,
    [clockData.workerID, clockData.workerName, clockData.actionType, clockData.timestamp]
  );
  await db.close();
};

export const getAllClockData = async () => {
  const db = await initializeDatabase();
  const res = await db.query('SELECT * FROM clock_data');
  await db.close();
  return res.values;
};

export const clearAllClockData = async () => {
  const db = await initializeDatabase();
  await db.execute('DELETE FROM clock_data');
  await db.close();
};

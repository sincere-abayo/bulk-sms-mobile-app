import * as SQLite from 'expo-sqlite';

export interface CachedContact {
  id: string;
  userId: string;
  name: string;
  phone: string;
  source: string;
  serverId?: string;
  lastSynced?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DraftMessage {
  id: string;
  userId: string;
  title: string;
  content: string;
  recipientCount: number;
  contactIds: string; // JSON string of contact IDs
  createdAt: string;
  updatedAt: string;
}

export interface QueuedBatch {
  id: string;
  userId: string;
  messageId: string;
  contactIds: string; // JSON string of contact IDs
  message: string;
  status: 'pending' | 'sending' | 'completed' | 'failed';
  priority: number;
  scheduledAt?: string;
  createdAt: string;
  updatedAt: string;
  errorMessage?: string;
}

class DatabaseService {
  private db: SQLite.SQLiteDatabase;

  constructor() {
    this.db = SQLite.openDatabaseSync('bulksms.db');
    this.initDatabase();
  }

  private async initDatabase(): Promise<void> {
    try {
      // Create cached_contacts table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS cached_contacts (
          id TEXT PRIMARY KEY,
          userId TEXT NOT NULL,
          name TEXT NOT NULL,
          phone TEXT NOT NULL,
          source TEXT NOT NULL,
          serverId TEXT,
          lastSynced TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        )
      `);

      // Create draft_messages table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS draft_messages (
          id TEXT PRIMARY KEY,
          userId TEXT NOT NULL,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          recipientCount INTEGER NOT NULL,
          contactIds TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        )
      `);

      // Create queued_batches table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS queued_batches (
          id TEXT PRIMARY KEY,
          userId TEXT NOT NULL,
          messageId TEXT NOT NULL,
          contactIds TEXT NOT NULL,
          message TEXT NOT NULL,
          status TEXT NOT NULL,
          priority INTEGER DEFAULT 0,
          scheduledAt TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          errorMessage TEXT
        )
      `);

      // Create indexes for better performance
      await this.db.execAsync(`CREATE INDEX IF NOT EXISTS idx_cached_contacts_user ON cached_contacts(userId)`);
      await this.db.execAsync(`CREATE INDEX IF NOT EXISTS idx_draft_messages_user ON draft_messages(userId)`);
      await this.db.execAsync(`CREATE INDEX IF NOT EXISTS idx_queued_batches_user ON queued_batches(userId)`);
      await this.db.execAsync(`CREATE INDEX IF NOT EXISTS idx_queued_batches_status ON queued_batches(status)`);

      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  // Cached Contacts Methods
  async saveContacts(userId: string, contacts: CachedContact[]): Promise<void> {
    try {
      // Clear existing contacts for this user
      await this.db.runAsync('DELETE FROM cached_contacts WHERE userId = ?', [userId]);

      // Insert new contacts
      for (const contact of contacts) {
        await this.db.runAsync(`
          INSERT OR REPLACE INTO cached_contacts
          (id, userId, name, phone, source, serverId, lastSynced, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          contact.id,
          contact.userId,
          contact.name,
          contact.phone,
          contact.source,
          contact.serverId || null,
          contact.lastSynced || null,
          contact.createdAt,
          contact.updatedAt
        ]);
      }
    } catch (error) {
      console.error('Error saving contacts:', error);
      throw error;
    }
  }

  async getCachedContacts(userId: string): Promise<CachedContact[]> {
    try {
      const result = await this.db.getAllAsync<CachedContact>(
        'SELECT * FROM cached_contacts WHERE userId = ? ORDER BY name ASC',
        [userId]
      );
      return result;
    } catch (error) {
      console.error('Error getting cached contacts:', error);
      throw error;
    }
  }

  async addCachedContact(contact: CachedContact): Promise<void> {
    try {
      await this.db.runAsync(`
        INSERT OR REPLACE INTO cached_contacts
        (id, userId, name, phone, source, serverId, lastSynced, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        contact.id,
        contact.userId,
        contact.name,
        contact.phone,
        contact.source,
        contact.serverId || null,
        contact.lastSynced || null,
        contact.createdAt,
        contact.updatedAt
      ]);
    } catch (error) {
      console.error('Error adding cached contact:', error);
      throw error;
    }
  }

  async removeCachedContact(userId: string, contactId: string): Promise<void> {
    try {
      await this.db.runAsync(
        'DELETE FROM cached_contacts WHERE userId = ? AND id = ?',
        [userId, contactId]
      );
    } catch (error) {
      console.error('Error removing cached contact:', error);
      throw error;
    }
  }

  async updateContactServerId(userId: string, localId: string, serverId: string): Promise<void> {
    try {
      await this.db.runAsync(
        'UPDATE cached_contacts SET serverId = ?, lastSynced = ? WHERE userId = ? AND id = ?',
        [serverId, new Date().toISOString(), userId, localId]
      );
    } catch (error) {
      console.error('Error updating contact server ID:', error);
      throw error;
    }
  }

  // Draft Messages Methods
  async saveDraftMessage(draft: DraftMessage): Promise<void> {
    try {
      await this.db.runAsync(`
        INSERT OR REPLACE INTO draft_messages
        (id, userId, title, content, recipientCount, contactIds, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        draft.id,
        draft.userId,
        draft.title,
        draft.content,
        draft.recipientCount,
        draft.contactIds,
        draft.createdAt,
        draft.updatedAt
      ]);
    } catch (error) {
      console.error('Error saving draft message:', error);
      throw error;
    }
  }

  async getDraftMessages(userId: string): Promise<DraftMessage[]> {
    try {
      const result = await this.db.getAllAsync<DraftMessage>(
        'SELECT * FROM draft_messages WHERE userId = ? ORDER BY updatedAt DESC',
        [userId]
      );
      return result;
    } catch (error) {
      console.error('Error getting draft messages:', error);
      throw error;
    }
  }

  async deleteDraftMessage(userId: string, draftId: string): Promise<void> {
    try {
      await this.db.runAsync(
        'DELETE FROM draft_messages WHERE userId = ? AND id = ?',
        [userId, draftId]
      );
    } catch (error) {
      console.error('Error deleting draft message:', error);
      throw error;
    }
  }

  // Queued Batches Methods
  async queueBatch(batch: QueuedBatch): Promise<void> {
    try {
      await this.db.runAsync(`
        INSERT INTO queued_batches
        (id, userId, messageId, contactIds, message, status, priority, scheduledAt, createdAt, updatedAt, errorMessage)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        batch.id,
        batch.userId,
        batch.messageId,
        batch.contactIds,
        batch.message,
        batch.status,
        batch.priority,
        batch.scheduledAt || null,
        batch.createdAt,
        batch.updatedAt,
        batch.errorMessage || null
      ]);
    } catch (error) {
      console.error('Error queuing batch:', error);
      throw error;
    }
  }

  async getQueuedBatches(userId: string, status?: string): Promise<QueuedBatch[]> {
    try {
      let query = 'SELECT * FROM queued_batches WHERE userId = ?';
      let params: any[] = [userId];

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }

      query += ' ORDER BY priority DESC, createdAt ASC';

      const result = await this.db.getAllAsync<QueuedBatch>(query, params);
      return result;
    } catch (error) {
      console.error('Error getting queued batches:', error);
      throw error;
    }
  }

  async updateBatchStatus(batchId: string, status: string, errorMessage?: string): Promise<void> {
    try {
      await this.db.runAsync(
        'UPDATE queued_batches SET status = ?, errorMessage = ?, updatedAt = ? WHERE id = ?',
        [status, errorMessage || null, new Date().toISOString(), batchId]
      );
    } catch (error) {
      console.error('Error updating batch status:', error);
      throw error;
    }
  }

  async removeBatch(batchId: string): Promise<void> {
    try {
      await this.db.runAsync(
        'DELETE FROM queued_batches WHERE id = ?',
        [batchId]
      );
    } catch (error) {
      console.error('Error removing batch:', error);
      throw error;
    }
  }

  // Utility Methods
  async clearUserData(userId: string): Promise<void> {
    try {
      await this.db.runAsync('DELETE FROM cached_contacts WHERE userId = ?', [userId]);
      await this.db.runAsync('DELETE FROM draft_messages WHERE userId = ?', [userId]);
      await this.db.runAsync('DELETE FROM queued_batches WHERE userId = ?', [userId]);
    } catch (error) {
      console.error('Error clearing user data:', error);
      throw error;
    }
  }

  async getStorageStats(userId: string): Promise<{
    contacts: number;
    drafts: number;
    queuedBatches: number;
  }> {
    try {
      const contactsResult = await this.db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM cached_contacts WHERE userId = ?',
        [userId]
      );

      const draftsResult = await this.db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM draft_messages WHERE userId = ?',
        [userId]
      );

      const batchesResult = await this.db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM queued_batches WHERE userId = ?',
        [userId]
      );

      return {
        contacts: contactsResult?.count || 0,
        drafts: draftsResult?.count || 0,
        queuedBatches: batchesResult?.count || 0,
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      throw error;
    }
  }
}

export const databaseService = new DatabaseService();
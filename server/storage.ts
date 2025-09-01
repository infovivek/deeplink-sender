import { 
  users, instances, credits, transactions, contacts, campaigns, messages,
  type User, type Instance, type Credits, type Transaction, type Contact, 
  type Campaign, type Message, type InsertUser, type InsertInstance,
  type InsertContact, type InsertCampaign, type InsertMessage, type InsertTransaction
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql, gte, lte, ilike, or } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  
  // Instances
  getInstances(ownerId: string): Promise<Instance[]>;
  getInstance(id: string): Promise<Instance | undefined>;
  createInstance(instance: InsertInstance): Promise<Instance>;
  updateInstance(id: string, updates: Partial<Instance>): Promise<Instance | undefined>;
  
  // Credits
  getUserCredits(userId: string): Promise<Credits | undefined>;
  createOrUpdateCredits(userId: string, delta: number, reason: string, refId?: string): Promise<Credits>;
  
  // Transactions
  getTransactions(userId: string): Promise<Transaction[]>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | undefined>;
  
  // Contacts
  getContacts(instanceId: string, limit?: number, offset?: number): Promise<Contact[]>;
  getContact(id: string): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  createContacts(contacts: InsertContact[]): Promise<Contact[]>;
  deleteContact(id: string): Promise<boolean>;
  
  // Campaigns
  getCampaigns(instanceId: string): Promise<Campaign[]>;
  getCampaign(id: string): Promise<Campaign | undefined>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign | undefined>;
  
  // Messages
  getMessages(filters: {
    instanceId?: string;
    campaignId?: string;
    status?: string;
    q?: string;
    limit?: number;
    offset?: number;
  }): Promise<Message[]>;
  getMessage(id: string): Promise<Message | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  createMessages(messages: InsertMessage[]): Promise<Message[]>;
  updateMessage(id: string, updates: Partial<Message>): Promise<Message | undefined>;
  
  // Analytics
  getMessageStats(instanceId: string, days: number): Promise<{
    messagesSent: number;
    deliveryRate: number;
    creditsUsed: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getInstances(ownerId: string): Promise<Instance[]> {
    return await db
      .select()
      .from(instances)
      .where(eq(instances.ownerId, ownerId))
      .orderBy(desc(instances.createdAt));
  }

  async getInstance(id: string): Promise<Instance | undefined> {
    const [instance] = await db.select().from(instances).where(eq(instances.id, id));
    return instance || undefined;
  }

  async createInstance(insertInstance: InsertInstance): Promise<Instance> {
    const [instance] = await db.insert(instances).values(insertInstance).returning();
    return instance;
  }

  async updateInstance(id: string, updates: Partial<Instance>): Promise<Instance | undefined> {
    const [instance] = await db
      .update(instances)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(instances.id, id))
      .returning();
    return instance || undefined;
  }

  async getUserCredits(userId: string): Promise<Credits | undefined> {
    const [userCredits] = await db.select().from(credits).where(eq(credits.userId, userId));
    return userCredits || undefined;
  }

  async createOrUpdateCredits(userId: string, delta: number, reason: string, refId?: string): Promise<Credits> {
    const existing = await this.getUserCredits(userId);
    
    const historyEntry = {
      delta,
      reason,
      refId,
      at: new Date().toISOString(),
    };

    if (existing) {
      const newBalance = existing.balance + delta;
      const newHistory = [...existing.history, historyEntry];
      
      const [updated] = await db
        .update(credits)
        .set({
          balance: newBalance,
          history: newHistory,
          updatedAt: new Date(),
        })
        .where(eq(credits.userId, userId))
        .returning();
      
      return updated;
    } else {
      const [created] = await db
        .insert(credits)
        .values({
          userId,
          balance: delta,
          history: [historyEntry],
        })
        .returning();
      
      return created;
    }
  }

  async getTransactions(userId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction || undefined;
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db.insert(transactions).values(insertTransaction).returning();
    return transaction;
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | undefined> {
    const [transaction] = await db
      .update(transactions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(transactions.id, id))
      .returning();
    return transaction || undefined;
  }

  async getContacts(instanceId: string, limit = 50, offset = 0): Promise<Contact[]> {
    return await db
      .select()
      .from(contacts)
      .where(eq(contacts.instanceId, instanceId))
      .orderBy(desc(contacts.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getContact(id: string): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact || undefined;
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const [contact] = await db.insert(contacts).values(insertContact).returning();
    return contact;
  }

  async createContacts(insertContacts: InsertContact[]): Promise<Contact[]> {
    return await db.insert(contacts).values(insertContacts).returning();
  }

  async deleteContact(id: string): Promise<boolean> {
    const result = await db.delete(contacts).where(eq(contacts.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getCampaigns(instanceId: string): Promise<Campaign[]> {
    return await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.instanceId, instanceId))
      .orderBy(desc(campaigns.createdAt));
  }

  async getCampaign(id: string): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return campaign || undefined;
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    const [campaign] = await db.insert(campaigns).values(insertCampaign).returning();
    return campaign;
  }

  async updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign | undefined> {
    const [campaign] = await db
      .update(campaigns)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(campaigns.id, id))
      .returning();
    return campaign || undefined;
  }

  async getMessages(filters: {
    instanceId?: string;
    campaignId?: string;
    status?: string;
    q?: string;
    limit?: number;
    offset?: number;
  }): Promise<Message[]> {
    let query = db.select().from(messages);
    
    const conditions = [];
    
    if (filters.instanceId) {
      conditions.push(eq(messages.instanceId, filters.instanceId));
    }
    
    if (filters.campaignId) {
      conditions.push(eq(messages.campaignId, filters.campaignId));
    }
    
    if (filters.status) {
      conditions.push(eq(messages.status, filters.status as any));
    }
    
    if (filters.q) {
      conditions.push(
        or(
          ilike(messages.to, `%${filters.q}%`),
          ilike(messages.text, `%${filters.q}%`)
        )
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    query = query.orderBy(desc(messages.createdAt));
    
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters.offset) {
      query = query.offset(filters.offset);
    }
    
    return await query;
  }

  async getMessage(id: string): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message || undefined;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(insertMessage).returning();
    return message;
  }

  async createMessages(insertMessages: InsertMessage[]): Promise<Message[]> {
    return await db.insert(messages).values(insertMessages).returning();
  }

  async updateMessage(id: string, updates: Partial<Message>): Promise<Message | undefined> {
    const [message] = await db
      .update(messages)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(messages.id, id))
      .returning();
    return message || undefined;
  }

  async getMessageStats(instanceId: string, days: number): Promise<{
    messagesSent: number;
    deliveryRate: number;
    creditsUsed: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const [stats] = await db
      .select({
        total: sql<number>`count(*)`,
        delivered: sql<number>`count(*) filter (where status in ('opened_link', 'sent_by_user'))`,
      })
      .from(messages)
      .where(
        and(
          eq(messages.instanceId, instanceId),
          gte(messages.createdAt, startDate)
        )
      );
    
    const messagesSent = stats?.total || 0;
    const deliveredCount = stats?.delivered || 0;
    const deliveryRate = messagesSent > 0 ? (deliveredCount / messagesSent) * 100 : 0;
    
    return {
      messagesSent,
      deliveryRate,
      creditsUsed: messagesSent, // 1 credit per message
    };
  }
}

export const storage = new DatabaseStorage();

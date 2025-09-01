import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, decimal, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const messageStatusEnum = pgEnum("message_status", ["queued", "opened_link", "sent_by_user", "failed", "expired"]);
export const transactionStatusEnum = pgEnum("transaction_status", ["pending", "captured", "failed", "refunded"]);
export const campaignStatusEnum = pgEnum("campaign_status", ["draft", "queued", "sending", "completed", "paused"]);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  role: userRoleEnum("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Instances table
export const instances = pgTable("instances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  webhookUrl: text("webhook_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Credits table
export const credits = pgTable("credits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  balance: integer("balance").default(0).notNull(),
  history: jsonb("history").$type<Array<{
    delta: number;
    reason: string;
    refId?: string;
    at: string;
  }>>().default([]).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").default("razorpay").notNull(),
  orderId: text("order_id").notNull(),
  paymentId: text("payment_id"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  creditsAdded: integer("credits_added").notNull(),
  status: transactionStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Contacts table
export const contacts = pgTable("contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  instanceId: varchar("instance_id").notNull().references(() => instances.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  phoneE164: text("phone_e164").notNull(),
  fields: jsonb("fields").$type<Record<string, string>>().default({}).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Campaigns table
export const campaigns = pgTable("campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  instanceId: varchar("instance_id").notNull().references(() => instances.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  template: text("template").notNull(),
  variables: jsonb("variables").$type<string[]>().default([]).notNull(),
  status: campaignStatusEnum("status").default("draft").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Messages table
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  instanceId: varchar("instance_id").notNull().references(() => instances.id, { onDelete: "cascade" }),
  campaignId: varchar("campaign_id").references(() => campaigns.id, { onDelete: "set null" }),
  to: text("to").notNull(),
  text: text("text").notNull(),
  mediaUrl: text("media_url"),
  status: messageStatusEnum("status").default("queued").notNull(),
  meta: jsonb("meta").$type<Record<string, any>>().default({}).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  instances: many(instances),
  credits: one(credits),
  transactions: many(transactions),
}));

export const instancesRelations = relations(instances, ({ one, many }) => ({
  owner: one(users, {
    fields: [instances.ownerId],
    references: [users.id],
  }),
  contacts: many(contacts),
  campaigns: many(campaigns),
  messages: many(messages),
}));

export const creditsRelations = relations(credits, ({ one }) => ({
  user: one(users, {
    fields: [credits.userId],
    references: [users.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

export const contactsRelations = relations(contacts, ({ one }) => ({
  instance: one(instances, {
    fields: [contacts.instanceId],
    references: [instances.id],
  }),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  instance: one(instances, {
    fields: [campaigns.instanceId],
    references: [instances.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  instance: one(instances, {
    fields: [messages.instanceId],
    references: [instances.id],
  }),
  campaign: one(campaigns, {
    fields: [messages.campaignId],
    references: [campaigns.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInstanceSchema = createInsertSchema(instances).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Select types
export type User = typeof users.$inferSelect;
export type Instance = typeof instances.$inferSelect;
export type Credits = typeof credits.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Contact = typeof contacts.$inferSelect;
export type Campaign = typeof campaigns.$inferSelect;
export type Message = typeof messages.$inferSelect;

// Insert types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertInstance = z.infer<typeof insertInstanceSchema>;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = loginSchema.extend({
  name: z.string().min(2),
  phone: z.string().optional(),
});

export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;

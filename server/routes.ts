import type { Express } from "express";
import { createServer, type Server } from "http";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import { AuthService } from "./services/auth";
import { QueueService } from "./services/queue";
import { RazorpayService } from "./services/razorpay";
import { DeeplinkService } from "./services/deeplink";
import { 
  loginSchema, 
  registerSchema, 
  insertInstanceSchema, 
  insertCampaignSchema,
  insertContactSchema 
} from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import csvParser from "csv-parser";
import { Readable } from "stream";

const upload = multer({ storage: multer.memoryStorage() });

// Auth middleware
const requireAuth = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const user = await AuthService.getUserFromToken(token);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Authentication failed' });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize queue service
  await QueueService.init();

  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      
      // Check if user exists
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password and create user
      const passwordHash = await AuthService.hashPassword(data.password);
      const user = await storage.createUser({
        ...data,
        passwordHash,
      });

      // Initialize credits for new user
      await storage.createOrUpdateCredits(user.id, 100, 'Welcome bonus');

      // Generate tokens
      const tokens = AuthService.generateTokens(user);

      res.json({
        user: { ...user, passwordHash: undefined },
        ...tokens,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Registration failed' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const validPassword = await AuthService.verifyPassword(data.password, user.passwordHash);
      if (!validPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const tokens = AuthService.generateTokens(user);

      res.json({
        user: { ...user, passwordHash: undefined },
        ...tokens,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Login failed' });
    }
  });

  app.post('/api/auth/refresh', async (req, res) => {
    try {
      const { refreshToken } = req.body;
      
      const payload = AuthService.verifyRefreshToken(refreshToken);
      if (!payload) {
        return res.status(401).json({ message: 'Invalid refresh token' });
      }

      const user = await storage.getUser(payload.userId);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      const tokens = AuthService.generateTokens(user);
      res.json(tokens);
    } catch (error) {
      res.status(401).json({ message: 'Token refresh failed' });
    }
  });

  // User routes
  app.get('/api/me', requireAuth, async (req: any, res) => {
    const credits = await storage.getUserCredits(req.user.id);
    res.json({
      user: { ...req.user, passwordHash: undefined },
      credits: credits?.balance || 0,
    });
  });

  app.patch('/api/me', requireAuth, async (req: any, res) => {
    try {
      const updateData = req.body;
      delete updateData.passwordHash; // Prevent password hash updates
      delete updateData.id; // Prevent ID updates
      delete updateData.role; // Prevent role updates

      const updatedUser = await storage.updateUser(req.user.id, updateData);
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ ...updatedUser, passwordHash: undefined });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update user' });
    }
  });

  // Instance routes
  app.get('/api/instances', requireAuth, async (req: any, res) => {
    try {
      const instances = await storage.getInstances(req.user.id);
      res.json(instances);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch instances' });
    }
  });

  app.post('/api/instances', requireAuth, async (req: any, res) => {
    try {
      const data = insertInstanceSchema.parse({
        ...req.body,
        ownerId: req.user.id,
      });

      const instance = await storage.createInstance(data);
      res.json(instance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create instance' });
    }
  });

  app.patch('/api/instances/:id', requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const instance = await storage.getInstance(id);
      
      if (!instance || instance.ownerId !== req.user.id) {
        return res.status(404).json({ message: 'Instance not found' });
      }

      const updatedInstance = await storage.updateInstance(id, req.body);
      res.json(updatedInstance);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update instance' });
    }
  });

  // Credits routes
  app.get('/api/credits', requireAuth, async (req: any, res) => {
    try {
      const credits = await storage.getUserCredits(req.user.id);
      res.json(credits || { balance: 0, history: [] });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch credits' });
    }
  });

  // Razorpay routes
  app.get('/api/billing/packs', (req, res) => {
    res.json(RazorpayService.getCreditPacks());
  });

  app.post('/api/billing/razorpay/order', requireAuth, async (req: any, res) => {
    try {
      const { packId } = req.body;
      const order = await RazorpayService.createOrder(packId, req.user.id);
      
      // Create transaction record
      const pack = RazorpayService.getCreditPack(packId);
      if (!pack) {
        return res.status(400).json({ message: 'Invalid pack' });
      }

      await storage.createTransaction({
        userId: req.user.id,
        provider: 'razorpay',
        orderId: order.orderId,
        amount: order.amount.toString(),
        creditsAdded: pack.credits,
        status: 'pending',
      });

      res.json(order);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create order' });
    }
  });

  app.post('/api/billing/razorpay/webhook', async (req, res) => {
    try {
      const signature = req.headers['x-razorpay-signature'] as string;
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
      
      const isValid = RazorpayService.verifyWebhookSignature(
        JSON.stringify(req.body),
        signature,
        secret
      );

      if (!isValid) {
        return res.status(400).json({ message: 'Invalid signature' });
      }

      const { event, payload } = req.body;

      if (event === 'payment.captured') {
        const payment = payload.payment.entity;
        const orderId = payment.order_id;
        
        // Find transaction
        const transactions = await storage.getTransactions(''); // TODO: Fix this to get by order ID
        const transaction = transactions.find(t => t.orderId === orderId);
        
        if (transaction) {
          // Update transaction
          await storage.updateTransaction(transaction.id, {
            paymentId: payment.id,
            status: 'captured',
          });

          // Add credits
          await storage.createOrUpdateCredits(
            transaction.userId,
            transaction.creditsAdded,
            'Credit purchase',
            transaction.id
          );
        }
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Webhook processing failed' });
    }
  });

  // Contact routes
  app.get('/api/contacts', requireAuth, async (req: any, res) => {
    try {
      const { instanceId, limit = 50, offset = 0 } = req.query;
      
      if (!instanceId) {
        return res.status(400).json({ message: 'Instance ID required' });
      }

      // Verify instance ownership
      const instance = await storage.getInstance(instanceId);
      if (!instance || instance.ownerId !== req.user.id) {
        return res.status(404).json({ message: 'Instance not found' });
      }

      const contacts = await storage.getContacts(instanceId, parseInt(limit), parseInt(offset));
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch contacts' });
    }
  });

  app.post('/api/contacts/import', requireAuth, upload.single('csv'), async (req: any, res) => {
    try {
      const { instanceId } = req.body;
      
      if (!req.file) {
        return res.status(400).json({ message: 'CSV file required' });
      }

      // Verify instance ownership
      const instance = await storage.getInstance(instanceId);
      if (!instance || instance.ownerId !== req.user.id) {
        return res.status(404).json({ message: 'Instance not found' });
      }

      const contacts: any[] = [];
      const errors: string[] = [];

      // Parse CSV
      const stream = Readable.from(req.file.buffer);
      
      await new Promise((resolve, reject) => {
        stream
          .pipe(csvParser())
          .on('data', (row) => {
            try {
              // Default headers: name, phone, city, custom1, custom2
              const name = row.name || row.Name || '';
              const phone = row.phone || row.Phone || row.mobile || row.Mobile || '';
              const city = row.city || row.City || '';
              const custom1 = row.custom1 || row.Custom1 || '';
              const custom2 = row.custom2 || row.Custom2 || '';

              if (!name || !phone) {
                errors.push(`Row missing name or phone: ${JSON.stringify(row)}`);
                return;
              }

              // Format and validate phone number
              const formattedPhone = DeeplinkService.formatPhoneNumber(phone);
              if (!DeeplinkService.validatePhoneNumber(formattedPhone)) {
                errors.push(`Invalid phone number: ${phone}`);
                return;
              }

              contacts.push({
                instanceId,
                name,
                phoneE164: formattedPhone,
                fields: { city, custom1, custom2 },
              });
            } catch (error) {
              errors.push(`Error processing row: ${JSON.stringify(row)}`);
            }
          })
          .on('end', resolve)
          .on('error', reject);
      });

      // Import contacts
      const importedContacts = await storage.createContacts(contacts);

      res.json({
        imported: importedContacts.length,
        errors: errors.length,
        errorDetails: errors.slice(0, 10), // First 10 errors
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to import contacts' });
    }
  });

  // Campaign routes
  app.get('/api/campaigns', requireAuth, async (req: any, res) => {
    try {
      const { instanceId } = req.query;
      
      if (!instanceId) {
        return res.status(400).json({ message: 'Instance ID required' });
      }

      // Verify instance ownership
      const instance = await storage.getInstance(instanceId);
      if (!instance || instance.ownerId !== req.user.id) {
        return res.status(404).json({ message: 'Instance not found' });
      }

      const campaigns = await storage.getCampaigns(instanceId);
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch campaigns' });
    }
  });

  app.post('/api/campaigns', requireAuth, async (req: any, res) => {
    try {
      const data = insertCampaignSchema.parse(req.body);
      
      // Verify instance ownership
      const instance = await storage.getInstance(data.instanceId);
      if (!instance || instance.ownerId !== req.user.id) {
        return res.status(404).json({ message: 'Instance not found' });
      }

      const campaign = await storage.createCampaign(data);
      res.json(campaign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create campaign' });
    }
  });

  // Message routes
  app.post('/api/messages/queue', requireAuth, async (req: any, res) => {
    try {
      const { instanceId, campaignId, items } = req.body;
      
      // Verify instance ownership
      const instance = await storage.getInstance(instanceId);
      if (!instance || instance.ownerId !== req.user.id) {
        return res.status(404).json({ message: 'Instance not found' });
      }

      // Check credits
      const credits = await storage.getUserCredits(req.user.id);
      const requiredCredits = items.length;
      
      if (!credits || credits.balance < requiredCredits) {
        return res.status(400).json({ message: 'Insufficient credits' });
      }

      // Debit credits
      await storage.createOrUpdateCredits(
        req.user.id,
        -requiredCredits,
        'Message queue',
        `campaign_${campaignId}`
      );

      // Create messages
      const messages = items.map((item: any) => ({
        instanceId,
        campaignId,
        to: item.to,
        text: item.text,
        mediaUrl: item.mediaUrl,
        status: 'queued' as const,
        meta: item.vars || {},
      }));

      const createdMessages = await storage.createMessages(messages);

      // Queue messages
      const queueJobs = createdMessages.map(msg => ({
        messageId: msg.id,
        instanceId: msg.instanceId,
        to: msg.to,
        text: msg.text,
        mediaUrl: msg.mediaUrl || undefined,
      }));

      await QueueService.queueMessages(queueJobs);

      res.json({
        queued: createdMessages.length,
        creditsUsed: requiredCredits,
        remainingCredits: credits.balance - requiredCredits,
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to queue messages' });
    }
  });

  app.get('/api/messages', requireAuth, async (req: any, res) => {
    try {
      const { instanceId, status, q, limit = 50, offset = 0 } = req.query;
      
      if (instanceId) {
        // Verify instance ownership
        const instance = await storage.getInstance(instanceId);
        if (!instance || instance.ownerId !== req.user.id) {
          return res.status(404).json({ message: 'Instance not found' });
        }
      }

      const messages = await storage.getMessages({
        instanceId,
        status,
        q,
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch messages' });
    }
  });

  // Deeplink route
  app.get('/api/deeplink', async (req, res) => {
    try {
      const { messageId, t, s } = req.query as { messageId: string; t: string; s: string };
      
      if (!messageId || !t || !s) {
        return res.status(400).json({ message: 'Invalid deeplink parameters' });
      }

      // Verify signature
      const isValid = DeeplinkService.verifySignedDeeplink(messageId, t, s);
      if (!isValid) {
        return res.status(400).json({ message: 'Invalid or expired deeplink' });
      }

      // Get message
      const message = await storage.getMessage(messageId);
      if (!message) {
        return res.status(404).json({ message: 'Message not found' });
      }

      // Mark as opened
      await storage.updateMessage(messageId, {
        status: 'opened_link',
        meta: {
          ...message.meta,
          openedAt: new Date().toISOString(),
        },
      });

      // Generate WhatsApp deeplink
      const deeplink = DeeplinkService.generateDeeplink(message.to, message.text, message.mediaUrl || undefined);
      
      // Redirect to WhatsApp
      res.redirect(deeplink);
    } catch (error) {
      res.status(500).json({ message: 'Failed to process deeplink' });
    }
  });

  // Analytics routes
  app.get('/api/analytics/stats', requireAuth, async (req: any, res) => {
    try {
      const { instanceId, days = 7 } = req.query;
      
      if (!instanceId) {
        return res.status(400).json({ message: 'Instance ID required' });
      }

      // Verify instance ownership
      const instance = await storage.getInstance(instanceId);
      if (!instance || instance.ownerId !== req.user.id) {
        return res.status(404).json({ message: 'Instance not found' });
      }

      const stats = await storage.getMessageStats(instanceId, parseInt(days));
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch analytics' });
    }
  });

  // Transactions routes
  app.get('/api/transactions', requireAuth, async (req: any, res) => {
    try {
      const transactions = await storage.getTransactions(req.user.id);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch transactions' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

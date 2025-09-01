# SaaS WhatsApp Deeplink Sender

## Overview

This is a multi-tenant SaaS application that enables users to send WhatsApp messages through deeplinks (api.whatsapp.com). Users can manage contacts, create campaigns with merge fields, purchase credits, and send messages through WhatsApp's "Click to Chat" feature without requiring the WhatsApp Business API. The system includes a credit-based wallet system with Razorpay integration, message queuing with BullMQ, and comprehensive analytics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for development
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Authentication**: JWT-based auth with access/refresh token pattern

### Backend Architecture
- **Runtime**: Node.js with Express and TypeScript
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: JWT tokens with bcrypt password hashing
- **Message Queue**: BullMQ with Redis for background job processing and message throttling
- **File Processing**: Multer for CSV contact uploads with csv-parser
- **API Design**: RESTful endpoints with Zod schema validation

### Data Storage Solutions
- **Primary Database**: PostgreSQL via Neon serverless with connection pooling
- **Schema Management**: Drizzle Kit for migrations and schema evolution
- **Redis**: Message queue storage and session management
- **File Storage**: In-memory processing for CSV uploads

### Authentication & Authorization
- **JWT Strategy**: Dual token system (15-minute access, 7-day refresh tokens)
- **Password Security**: bcryptjs with salt rounds for password hashing
- **Role-Based Access**: User and admin roles with middleware protection
- **Session Management**: Stateless JWT with automatic token refresh

### Core Business Logic
- **Multi-Tenancy**: Instance-based isolation where users own multiple instances
- **Credit System**: Prepaid credit wallet with Razorpay payment integration
- **Message Processing**: Template-based campaigns with variable substitution ({{name}}, {{city}}, {{custom1}}, {{custom2}})
- **Deeplink Generation**: Signed URLs for WhatsApp api.whatsapp.com integration
- **Contact Management**: CSV import with E.164 phone validation and bulk operations

### Queue Management
- **BullMQ Integration**: Rate-limited message processing (10 messages/minute)
- **Job Processing**: Asynchronous message queue with retry logic and exponential backoff
- **Throttling**: Built-in rate limiting to prevent WhatsApp API abuse
- **Status Tracking**: Real-time message status updates (queued, opened_link, sent_by_user, failed, expired)

### Payment Integration
- **Razorpay Integration**: Credit pack purchases with webhook verification
- **Credit Packs**: Predefined packages (Starter: 500/₹199, Pro: 2000/₹699, Business: 5000/₹1499, Enterprise: 10000/₹2499)
- **Transaction Management**: Complete audit trail with status tracking
- **Webhook Security**: HMAC signature verification for payment confirmations

## External Dependencies

### Database Services
- **Neon**: Serverless PostgreSQL hosting with connection pooling
- **Redis**: Message queue backend and caching layer

### Payment Processing
- **Razorpay**: Payment gateway for credit purchases with webhook support
- **HMAC Security**: Cryptographic signature verification for payment webhooks

### Development Tools
- **Vite**: Frontend build tool with HMR and TypeScript support
- **Drizzle Kit**: Database migration and schema management
- **ESBuild**: Backend bundling for production deployment

### UI Components
- **Radix UI**: Unstyled, accessible component primitives
- **Lucide React**: Icon library for consistent iconography
- **React Hook Form**: Form management with Zod resolver integration
- **Date-fns**: Date manipulation and formatting utilities

### Runtime Dependencies
- **TanStack Query**: Server state management with caching and background updates
- **Wouter**: Lightweight routing solution for React
- **CSV Parser**: Contact import functionality from CSV files
- **Class Variance Authority**: Type-safe variant handling for UI components
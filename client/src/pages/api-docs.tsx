import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileCode, Key, Send, Users, CreditCard } from 'lucide-react';

export default function ApiDocs() {
  const endpoints = [
    {
      method: 'POST',
      path: '/api/auth/register',
      description: 'Register a new user account',
      body: {
        name: 'string',
        email: 'string',
        password: 'string',
        phone: 'string (optional)'
      },
      response: {
        user: 'User object',
        accessToken: 'string',
        refreshToken: 'string'
      }
    },
    {
      method: 'POST',
      path: '/api/auth/login',
      description: 'Login with email and password',
      body: {
        email: 'string',
        password: 'string'
      },
      response: {
        user: 'User object',
        accessToken: 'string',
        refreshToken: 'string'
      }
    },
    {
      method: 'POST',
      path: '/api/auth/refresh',
      description: 'Refresh access token',
      body: {
        refreshToken: 'string'
      },
      response: {
        accessToken: 'string',
        refreshToken: 'string'
      }
    },
    {
      method: 'GET',
      path: '/api/me',
      description: 'Get current user information',
      auth: true,
      response: {
        user: 'User object',
        credits: 'number'
      }
    },
    {
      method: 'GET',
      path: '/api/instances',
      description: 'Get user instances',
      auth: true,
      response: 'Array of Instance objects'
    },
    {
      method: 'POST',
      path: '/api/instances',
      description: 'Create a new instance',
      auth: true,
      body: {
        name: 'string',
        webhookUrl: 'string (optional)'
      },
      response: 'Instance object'
    },
    {
      method: 'POST',
      path: '/api/contacts/import',
      description: 'Import contacts from CSV',
      auth: true,
      body: 'FormData with csv file and instanceId',
      response: {
        imported: 'number',
        errors: 'number',
        errorDetails: 'Array of strings'
      }
    },
    {
      method: 'GET',
      path: '/api/contacts',
      description: 'Get contacts for an instance',
      auth: true,
      query: {
        instanceId: 'string (required)',
        limit: 'number (optional)',
        offset: 'number (optional)'
      },
      response: 'Array of Contact objects'
    },
    {
      method: 'POST',
      path: '/api/campaigns',
      description: 'Create a new campaign',
      auth: true,
      body: {
        instanceId: 'string',
        name: 'string',
        template: 'string',
        variables: 'Array of strings'
      },
      response: 'Campaign object'
    },
    {
      method: 'POST',
      path: '/api/messages/queue',
      description: 'Queue messages for sending',
      auth: true,
      body: {
        instanceId: 'string',
        campaignId: 'string (optional)',
        items: 'Array of message objects'
      },
      response: {
        queued: 'number',
        creditsUsed: 'number',
        remainingCredits: 'number'
      }
    },
    {
      method: 'GET',
      path: '/api/messages',
      description: 'Get messages with filters',
      auth: true,
      query: {
        instanceId: 'string (optional)',
        status: 'string (optional)',
        q: 'string (optional)',
        limit: 'number (optional)',
        offset: 'number (optional)'
      },
      response: 'Array of Message objects'
    },
    {
      method: 'GET',
      path: '/api/deeplink',
      description: 'Get signed deeplink for a message',
      query: {
        messageId: 'string',
        t: 'timestamp',
        s: 'signature'
      },
      response: 'Redirects to WhatsApp'
    },
    {
      method: 'GET',
      path: '/api/billing/packs',
      description: 'Get available credit packages',
      response: 'Array of CreditPack objects'
    },
    {
      method: 'POST',
      path: '/api/billing/razorpay/order',
      description: 'Create Razorpay order for credit purchase',
      auth: true,
      body: {
        packId: 'string'
      },
      response: {
        orderId: 'string',
        amount: 'number',
        currency: 'string',
        pack: 'CreditPack object'
      }
    }
  ];

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-green-100 text-green-800';
      case 'POST':
        return 'bg-blue-100 text-blue-800';
      case 'PATCH':
        return 'bg-yellow-100 text-yellow-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6" data-testid="api-docs-page">
      <div>
        <h1 className="text-2xl font-bold text-foreground">API Documentation</h1>
        <p className="text-muted-foreground">Complete API reference for LinkSender WhatsApp platform</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="authentication">Authentication</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCode className="w-5 h-5" />
                API Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                The LinkSender API allows you to manage WhatsApp marketing campaigns, contacts, and messages programmatically.
                All API endpoints are RESTful and return JSON responses.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-foreground mb-2">Base URL</h4>
                  <code className="block p-2 bg-muted rounded text-sm">
                    https://your-domain.com/api
                  </code>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">Content Type</h4>
                  <code className="block p-2 bg-muted rounded text-sm">
                    application/json
                  </code>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium text-foreground mb-3">Features</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Key className="w-5 h-5 text-primary" />
                    <span className="text-sm">JWT-based authentication</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-primary" />
                    <span className="text-sm">Contact management</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Send className="w-5 h-5 text-primary" />
                    <span className="text-sm">Message queuing</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-primary" />
                    <span className="text-sm">Credit-based billing</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="authentication" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Authentication
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                The API uses JWT (JSON Web Tokens) for authentication. Include the access token in the Authorization header.
              </p>

              <div>
                <h4 className="font-medium text-foreground mb-2">Authorization Header</h4>
                <code className="block p-3 bg-muted rounded text-sm">
                  Authorization: Bearer YOUR_ACCESS_TOKEN
                </code>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium text-foreground mb-3">Token Lifecycle</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div>• Access tokens expire in 15 minutes</div>
                  <div>• Refresh tokens expire in 7 days</div>
                  <div>• Use the refresh endpoint to get new access tokens</div>
                  <div>• Tokens are returned upon successful login/registration</div>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium text-foreground mb-2">Example Login Request</h4>
                <pre className="text-xs text-muted-foreground overflow-x-auto">
{`POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "yourpassword"
}

Response:
{
  "user": { "id": "...", "email": "...", "name": "..." },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="endpoints" className="space-y-6">
          <div className="space-y-4">
            {endpoints.map((endpoint, index) => (
              <Card key={index} data-testid={`endpoint-${index}`}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Badge className={getMethodColor(endpoint.method)}>
                      {endpoint.method}
                    </Badge>
                    <code className="font-mono text-sm">{endpoint.path}</code>
                    {endpoint.auth && (
                      <Badge variant="outline" className="text-xs">
                        <Key className="w-3 h-3 mr-1" />
                        Auth Required
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {endpoint.query && (
                    <div>
                      <h5 className="font-medium text-foreground mb-2">Query Parameters</h5>
                      <div className="p-3 bg-muted rounded text-sm">
                        <pre>{JSON.stringify(endpoint.query, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                  
                  {endpoint.body && (
                    <div>
                      <h5 className="font-medium text-foreground mb-2">Request Body</h5>
                      <div className="p-3 bg-muted rounded text-sm">
                        <pre>{JSON.stringify(endpoint.body, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h5 className="font-medium text-foreground mb-2">Response</h5>
                    <div className="p-3 bg-muted rounded text-sm">
                      <pre>{typeof endpoint.response === 'string' ? endpoint.response : JSON.stringify(endpoint.response, null, 2)}</pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="examples" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Common Use Cases</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium text-foreground mb-3">1. Import Contacts and Send Campaign</h4>
                <div className="p-4 bg-muted rounded-lg">
                  <pre className="text-xs text-muted-foreground overflow-x-auto">
{`// 1. Create an instance
POST /api/instances
{
  "name": "Marketing Campaign"
}

// 2. Import contacts
POST /api/contacts/import
FormData: {
  csv: file,
  instanceId: "instance_id"
}

// 3. Create campaign
POST /api/campaigns
{
  "instanceId": "instance_id",
  "name": "Welcome Campaign",
  "template": "Hi {{name}}, welcome from {{city}}!",
  "variables": ["name", "city"]
}

// 4. Queue messages
POST /api/messages/queue
{
  "instanceId": "instance_id",
  "items": [
    {
      "to": "+1234567890",
      "text": "Hi John, welcome from New York!",
      "vars": { "name": "John", "city": "New York" }
    }
  ]
}`}
                  </pre>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium text-foreground mb-3">2. Check Message Status</h4>
                <div className="p-4 bg-muted rounded-lg">
                  <pre className="text-xs text-muted-foreground overflow-x-auto">
{`// Get messages for an instance
GET /api/messages?instanceId=instance_id&status=queued

Response:
[
  {
    "id": "msg_id",
    "to": "+1234567890",
    "text": "Hi John, welcome!",
    "status": "queued",
    "createdAt": "2024-01-01T00:00:00Z"
  }
]`}
                  </pre>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium text-foreground mb-3">3. Purchase Credits</h4>
                <div className="p-4 bg-muted rounded-lg">
                  <pre className="text-xs text-muted-foreground overflow-x-auto">
{`// Get available packages
GET /api/billing/packs

// Create order
POST /api/billing/razorpay/order
{
  "packId": "pro"
}

Response:
{
  "orderId": "order_xxxxx",
  "amount": 699,
  "currency": "INR",
  "pack": {
    "name": "Pro",
    "credits": 2000
  }
}`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <h4 className="font-medium text-foreground">Error Handling</h4>
                <p className="text-sm text-muted-foreground">
                  All API errors return appropriate HTTP status codes with JSON error messages:
                </p>
                <div className="p-4 bg-muted rounded-lg">
                  <pre className="text-xs text-muted-foreground">
{`{
  "message": "Error description",
  "errors": [...] // Validation errors if applicable
}`}
                  </pre>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>400</strong> - Bad Request (validation errors)
                  </div>
                  <div>
                    <strong>401</strong> - Unauthorized (invalid token)
                  </div>
                  <div>
                    <strong>403</strong> - Forbidden (insufficient permissions)
                  </div>
                  <div>
                    <strong>404</strong> - Not Found (resource doesn't exist)
                  </div>
                  <div>
                    <strong>429</strong> - Too Many Requests (rate limited)
                  </div>
                  <div>
                    <strong>500</strong> - Internal Server Error
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const VARIABLES = ['name', 'city', 'custom1', 'custom2'];

export default function CampaignBuilder() {
  const [campaignName, setCampaignName] = useState('Welcome New Customers');
  const [messageTemplate, setMessageTemplate] = useState(
    'Hi {{name}}, welcome to our service! We\'re excited to have you from {{city}}. Use code {{custom1}} for 20% off your first order.'
  );
  const { toast } = useToast();

  const insertVariable = (variable: string) => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (textarea) {
      const cursorPos = textarea.selectionStart;
      const textBefore = messageTemplate.substring(0, cursorPos);
      const textAfter = messageTemplate.substring(textarea.selectionEnd);
      const newText = textBefore + `{{${variable}}}` + textAfter;
      setMessageTemplate(newText);
      
      // Focus and set cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(cursorPos + variable.length + 4, cursorPos + variable.length + 4);
      }, 0);
    }
  };

  const generatePreview = (template: string, contact: { name: string; city: string; custom1: string; custom2: string }) => {
    return template
      .replace(/\{\{name\}\}/g, contact.name)
      .replace(/\{\{city\}\}/g, contact.city)
      .replace(/\{\{custom1\}\}/g, contact.custom1)
      .replace(/\{\{custom2\}\}/g, contact.custom2);
  };

  const previewContacts = [
    { name: 'John Doe', phone: '+1234567890', city: 'New York', custom1: 'WELCOME20', custom2: '' },
    { name: 'Jane Smith', phone: '+1987654321', city: 'Los Angeles', custom1: 'WELCOME20', custom2: '' },
  ];

  const handleQueueCampaign = () => {
    toast({
      title: "Campaign queued!",
      description: "Your campaign has been added to the message queue.",
    });
  };

  return (
    <Card data-testid="campaign-builder">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Campaign Builder Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="campaign-name">Campaign Name</Label>
                <Input
                  id="campaign-name"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="Enter campaign name"
                  data-testid="input-campaign-name"
                />
              </div>
              
              <div>
                <Label htmlFor="message-template">Message Template</Label>
                <Textarea
                  id="message-template"
                  value={messageTemplate}
                  onChange={(e) => setMessageTemplate(e.target.value)}
                  placeholder="Type your message..."
                  className="h-32"
                  data-testid="textarea-message-template"
                />
              </div>
              
              <div>
                <Label>Available Variables</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {VARIABLES.map((variable) => (
                    <Button
                      key={variable}
                      variant="secondary"
                      size="sm"
                      onClick={() => insertVariable(variable)}
                      data-testid={`button-variable-${variable}`}
                    >
                      {`{{${variable}}}`}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <div className="space-y-4">
              <div>
                <Label>Preview</Label>
                <div className="bg-muted rounded-lg p-4 h-64 overflow-y-auto">
                  <div className="space-y-3">
                    {previewContacts.map((contact, index) => (
                      <div
                        key={index}
                        className="bg-background p-3 rounded-lg border border-border"
                        data-testid={`preview-contact-${index}`}
                      >
                        <div className="text-sm font-medium text-foreground mb-1">
                          {contact.name} ({contact.phone})
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {generatePreview(messageTemplate, contact)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-secondary rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-secondary-foreground">Campaign Summary</span>
                </div>
                <div className="space-y-2 text-sm text-secondary-foreground">
                  <div className="flex justify-between">
                    <span>Recipients:</span>
                    <span data-testid="text-recipient-count">234 contacts</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Credits Required:</span>
                    <span data-testid="text-credits-required">234 credits</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Available Credits:</span>
                    <span data-testid="text-available-credits">2,847 credits</span>
                  </div>
                </div>
                <Button
                  className="w-full mt-4"
                  onClick={handleQueueCampaign}
                  data-testid="button-queue-campaign"
                >
                  Queue Campaign
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

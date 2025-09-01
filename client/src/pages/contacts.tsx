import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Upload, Users, Download, Search, Trash2 } from 'lucide-react';
import type { Instance, Contact } from '@shared/schema';

export default function Contacts() {
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: instances = [] } = useQuery<Instance[]>({
    queryKey: ['/api/instances'],
  });

  const { data: contacts = [], isLoading } = useQuery<Contact[]>({
    queryKey: ['/api/contacts', { instanceId: selectedInstanceId, limit: 50, offset: currentPage * 50 }],
    enabled: !!selectedInstanceId,
  });

  const importContactsMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch('/api/contacts/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }

      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      toast({
        title: "Contacts imported",
        description: `Successfully imported ${data.imported} contacts${data.errors > 0 ? ` with ${data.errors} errors` : ''}.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import contacts",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedInstanceId) {
      toast({
        title: "Missing requirements",
        description: "Please select an instance and choose a CSV file.",
        variant: "destructive",
      });
      return;
    }

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('csv', file);
    formData.append('instanceId', selectedInstanceId);

    importContactsMutation.mutate(formData);
  };

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phoneE164.includes(searchQuery)
  );

  const downloadTemplate = () => {
    const csvContent = "name,phone,city,custom1,custom2\nJohn Doe,+1234567890,New York,WELCOME20,\nJane Smith,+1987654321,Los Angeles,WELCOME20,";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6" data-testid="contacts-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contacts</h1>
          <p className="text-muted-foreground">Manage your contact lists and import new contacts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadTemplate} data-testid="button-download-template">
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={!selectedInstanceId || importContactsMutation.isPending}
            data-testid="button-import-contacts"
          >
            <Upload className="w-4 h-4 mr-2" />
            {importContactsMutation.isPending ? "Importing..." : "Import Contacts"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="instance-select">Instance</Label>
              <Select value={selectedInstanceId} onValueChange={setSelectedInstanceId}>
                <SelectTrigger data-testid="select-instance">
                  <SelectValue placeholder="Select an instance" />
                </SelectTrigger>
                <SelectContent>
                  {instances.map((instance) => (
                    <SelectItem key={instance.id} value={instance.id}>
                      {instance.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="search">Search Contacts</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or phone..."
                  className="pl-9"
                  data-testid="input-search"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Import Instructions */}
      {!selectedInstanceId && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No instance selected</h3>
            <p className="text-muted-foreground mb-4 text-center">
              Please select an instance to view and manage contacts
            </p>
          </CardContent>
        </Card>
      )}

      {/* Contacts Table */}
      {selectedInstanceId && (
        <Card data-testid="contacts-table">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Contacts ({filteredContacts.length})
              </CardTitle>
              {filteredContacts.length > 0 && (
                <Badge variant="outline">
                  Total: {filteredContacts.length}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No contacts found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? "No contacts match your search criteria" : "Import your first CSV file to get started"}
                </p>
                {!searchQuery && (
                  <Button onClick={() => fileInputRef.current?.click()} data-testid="button-import-first-contacts">
                    <Upload className="w-4 h-4 mr-2" />
                    Import Contacts
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Custom 1</TableHead>
                      <TableHead>Custom 2</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContacts.map((contact, index: number) => (
                      <TableRow key={contact.id} data-testid={`contact-row-${index}`}>
                        <TableCell className="font-medium">{contact.name}</TableCell>
                        <TableCell className="font-mono text-sm">{contact.phoneE164}</TableCell>
                        <TableCell>{contact.fields?.city || '-'}</TableCell>
                        <TableCell>{contact.fields?.custom1 || '-'}</TableCell>
                        <TableCell>{contact.fields?.custom2 || '-'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(contact.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="text-destructive" data-testid={`button-delete-${index}`}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination would go here */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {filteredContacts.length} contacts
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* CSV Format Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">CSV Format Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your CSV file should include the following columns (headers are optional):
            </p>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
              <div className="font-mono bg-muted p-2 rounded">name</div>
              <div className="font-mono bg-muted p-2 rounded">phone</div>
              <div className="font-mono bg-muted p-2 rounded">city</div>
              <div className="font-mono bg-muted p-2 rounded">custom1</div>
              <div className="font-mono bg-muted p-2 rounded">custom2</div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Example CSV content:</h4>
              <pre className="text-xs text-muted-foreground">
{`name,phone,city,custom1,custom2
John Doe,+1234567890,New York,WELCOME20,VIP
Jane Smith,+1987654321,Los Angeles,WELCOME20,`}
              </pre>
            </div>
            <p className="text-xs text-muted-foreground">
              • Phone numbers must be in E.164 format (e.g., +1234567890)<br/>
              • Name and phone are required fields<br/>
              • Other fields are optional and can be used in message templates
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

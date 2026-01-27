/**
 * GoogleSheetsInfoDialog - Educational modal explaining how Google Sheets integration works
 *
 * Explains the conventions used for tab names, column headers, and how
 * the AI tools are generated from the spreadsheet structure.
 */

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table2, Lightbulb } from 'lucide-react';

interface GoogleSheetsInfoDialogProps {
  open: boolean;
  onClose: () => void;
}

export function GoogleSheetsInfoDialog({ open, onClose }: GoogleSheetsInfoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            How Google Sheets Integration Works
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 space-y-6 py-4 pr-2">
          {/* Overview */}
          <div>
            <p className="text-sm text-muted-foreground">
              Your Google Sheet becomes your personal database. The AI reads your sheet structure
              and automatically creates tools to add, search, and manage your data.
            </p>
          </div>

          {/* The Spreadsheet */}
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <Table2 className="h-4 w-4" />
              The Spreadsheet
            </h3>
            <p className="text-sm text-muted-foreground">
              When you connect, we look for a spreadsheet called <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">Skillomatic Data</code> in
              your Google Drive. If it doesn't exist, we create it for you.
            </p>
          </div>

          {/* Tab Names */}
          <div className="space-y-2">
            <h3 className="font-semibold">Tab Names = Tables</h3>
            <p className="text-sm text-muted-foreground">
              Each tab in your spreadsheet becomes a table. You can add a description after a <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">|</code> character
              to help the AI understand what the table is for.
            </p>
            <div className="bg-muted/50 rounded-lg p-3 space-y-1.5 text-sm font-mono">
              <div><span className="text-green-600">Contacts</span> <span className="text-muted-foreground">- simple table name</span></div>
              <div><span className="text-green-600">CRM | Track consulting clients</span> <span className="text-muted-foreground">- with description</span></div>
              <div><span className="text-green-600">Invoices | Monthly billing records</span></div>
            </div>
          </div>

          {/* Column Headers */}
          <div className="space-y-2">
            <h3 className="font-semibold">Column Headers</h3>
            <p className="text-sm text-muted-foreground">
              The first row of each tab defines your columns. Add a <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">*</code> after a column name
              to mark it as the primary key (unique identifier).
            </p>
            <div className="bg-muted/50 rounded-lg p-3 text-sm font-mono">
              <div className="flex gap-4 border-b border-border pb-2 mb-2">
                <span className="text-blue-600">Email*</span>
                <span>Name</span>
                <span>Company</span>
                <span>Stage</span>
              </div>
              <p className="text-xs text-muted-foreground font-sans">
                Email is marked as the primary key with *
              </p>
            </div>
          </div>

          {/* Generated Tools */}
          <div className="space-y-2">
            <h3 className="font-semibold">AI Tools Generated</h3>
            <p className="text-sm text-muted-foreground">
              Based on your sheet structure, the AI gets tools to work with your data:
            </p>
            <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <code className="bg-background px-1.5 py-0.5 rounded text-xs font-mono whitespace-nowrap">contacts_add</code>
                <span className="text-muted-foreground">Add a new row</span>
              </div>
              <div className="flex items-start gap-2">
                <code className="bg-background px-1.5 py-0.5 rounded text-xs font-mono whitespace-nowrap">contacts_list</code>
                <span className="text-muted-foreground">List all rows</span>
              </div>
              <div className="flex items-start gap-2">
                <code className="bg-background px-1.5 py-0.5 rounded text-xs font-mono whitespace-nowrap">contacts_search</code>
                <span className="text-muted-foreground">Search for rows</span>
              </div>
              <div className="flex items-start gap-2">
                <code className="bg-background px-1.5 py-0.5 rounded text-xs font-mono whitespace-nowrap">contacts_update</code>
                <span className="text-muted-foreground">Update a row</span>
              </div>
              <div className="flex items-start gap-2">
                <code className="bg-background px-1.5 py-0.5 rounded text-xs font-mono whitespace-nowrap">contacts_delete</code>
                <span className="text-muted-foreground">Delete a row</span>
              </div>
            </div>
          </div>

          {/* Example */}
          <div className="space-y-2">
            <h3 className="font-semibold">Example Conversation</h3>
            <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
              <p><span className="font-medium">You:</span> "Add John from Acme Corp to my CRM"</p>
              <p><span className="font-medium">AI:</span> <span className="text-muted-foreground italic">Uses crm_add to insert a new row with John's info</span></p>
              <p><span className="font-medium">You:</span> "Show me all leads from last week"</p>
              <p><span className="font-medium">AI:</span> <span className="text-muted-foreground italic">Uses crm_search to find matching entries</span></p>
            </div>
          </div>

          {/* Pro Tips */}
          <div className="space-y-2">
            <h3 className="font-semibold">Pro Tips</h3>
            <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
              <li>You can edit the spreadsheet directly in Google Sheets anytime</li>
              <li>Add new tabs to create new tables - no coding required</li>
              <li>The description after <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">|</code> helps the AI pick the right table</li>
              <li>Primary keys help prevent duplicate entries</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full sm:w-auto">
            I'm so smart!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

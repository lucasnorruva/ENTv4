// src/components/user-import-dialog.tsx
'use client';

import React, { useState, useTransition, useCallback } from 'react';
import Papa from 'papaparse';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from './ui/badge';
import { bulkUserImportSchema } from '@/lib/schemas';
import type { User } from '@/types';
import { bulkCreateUsers } from '@/lib/actions/user-actions';
import { Loader2, Upload } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

interface ValidatedRow {
  data: any;
  isValid: boolean;
  errors?: string[];
}

const getTemplate = () => {
  const headers = 'fullName,email,roles';
  const example = `"Jane Doe","jane.doe@example.com","Supplier,Auditor"`;
  const csvContent = `${headers}\n${example}`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'norruva_user_template.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

interface UserImportDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: () => void;
  user: User;
}

export default function UserImportDialog({
  isOpen,
  onOpenChange,
  onSave,
  user,
}: UserImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [validatedData, setValidatedData] = useState<ValidatedRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, startSavingTransition] = useTransition();
  const { toast } = useToast();

  const handleClose = useCallback(() => {
    setFile(null);
    setValidatedData([]);
    onOpenChange(false);
  }, [onOpenChange]);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event.target.files?.[0];
      if (selectedFile) {
        setFile(selectedFile);
        setIsParsing(true);
        setValidatedData([]);
        Papa.parse(selectedFile, {
          header: true,
          skipEmptyLines: true,
          complete: result => {
            const validated = result.data.map(row => {
              const parsed = bulkUserImportSchema.safeParse(row);
              if (parsed.success) {
                return { data: parsed.data, isValid: true };
              } else {
                return {
                  data: row,
                  isValid: false,
                  errors: parsed.error.errors.map(
                    e => `${e.path.join('.')}: ${e.message}`,
                  ),
                };
              }
            });
            setValidatedData(validated);
            setIsParsing(false);
          },
          error: () => {
            toast({
              title: 'Parsing Error',
              description: 'Could not parse the CSV file.',
              variant: 'destructive',
            });
            setIsParsing(false);
          },
        });
      }
    },
    [toast],
  );

  const handleImport = useCallback(() => {
    const usersToImport = validatedData
      .filter(row => row.isValid)
      .map(row => row.data);
    if (usersToImport.length === 0) {
      toast({
        title: 'No valid users',
        description: 'There are no valid users to import from the file.',
        variant: 'destructive',
      });
      return;
    }
    startSavingTransition(async () => {
      try {
        const result = await bulkCreateUsers(usersToImport, user.id);
        toast({
          title: 'Import Successful',
          description: `${result.createdCount} users have been imported.`,
        });
        onSave();
        handleClose();
      } catch (error: any) {
        toast({
          title: 'Import Failed',
          description: error.message,
          variant: 'destructive',
        });
      }
    });
  }, [validatedData, startSavingTransition, user.id, toast, onSave, handleClose]);


  const validRows = validatedData.filter(row => row.isValid).length;
  const invalidRows = validatedData.length - validRows;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Bulk Import Users</DialogTitle>
          <DialogDescription>
            Upload a CSV file to create multiple user accounts at once.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <Input type="file" accept=".csv" onChange={handleFileChange} />
          <Button variant="outline" size="sm" onClick={getTemplate}>
            Download CSV Template
          </Button>
        </div>
        {isParsing ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          validatedData.length > 0 && (
            <>
              <div className="flex gap-4 text-sm">
                <Badge variant="default">{validRows} valid rows</Badge>
                <Badge variant={invalidRows > 0 ? 'destructive' : 'secondary'}>
                  {invalidRows} invalid rows
                </Badge>
              </div>
              <ScrollArea className="flex-1 border rounded-md">
                <Table>
                  <TableHeader className="sticky top-0 bg-muted">
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Errors</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validatedData.map((row, index) => (
                      <TableRow
                        key={index}
                        className={!row.isValid ? 'bg-destructive/10' : ''}
                      >
                        <TableCell>
                          <Badge variant={row.isValid ? 'default' : 'destructive'}>
                            {row.isValid ? 'Valid' : 'Invalid'}
                          </Badge>
                        </TableCell>
                        <TableCell>{row.data.fullName}</TableCell>
                        <TableCell>{row.data.email}</TableCell>
                        <TableCell>{row.isValid ? row.data.roles.join(', ') : row.data.roles}</TableCell>
                        <TableCell className="text-xs text-destructive">
                          {row.errors?.join(', ')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </>
          )
        )}
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={isSaving || isParsing || validRows === 0}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import {validRows} Users
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

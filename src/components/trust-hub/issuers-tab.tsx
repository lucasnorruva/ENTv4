// src/components/trust-hub/issuers-tab.tsx
'use client';

import React, { useState, useCallback } from 'react';
import type { Company, User } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, ShieldCheck, ShieldAlert } from 'lucide-react';
import CompanyForm from '../company-form';

interface IssuersTabProps {
  companies: Company[];
  user: User;
  onDataChange: () => void;
}

export default function IssuersTab({ companies, user, onDataChange }: IssuersTabProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const handleEdit = useCallback((company: Company) => {
    setSelectedCompany(company);
    setIsFormOpen(true);
  }, []);

  const handleSave = useCallback(() => {
    onDataChange();
    setIsFormOpen(false);
  }, [onDataChange]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Trusted Issuer Management (EBSI)</CardTitle>
          <CardDescription>Designate which companies are trusted issuers of Verifiable Credentials within the EBSI ecosystem. This adds a layer of trust to their product passports.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Trusted Issuer Status</TableHead>
                <TableHead>Revocation List URL</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map(company => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell>{company.industry}</TableCell>
                  <TableCell>
                    {company.isTrustedIssuer ? (
                      <Badge variant="default"><ShieldCheck className="h-3 w-3 mr-1"/>Verified</Badge>
                    ) : (
                      <Badge variant="secondary"><ShieldAlert className="h-3 w-3 mr-1"/>Not Verified</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {company.revocationListUrl ? <a href={company.revocationListUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-mono hover:underline">{company.revocationListUrl}</a> : 'Not Set'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(company)}>
                      <Edit className="h-3 w-3 mr-2" />
                      Manage
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <CompanyForm 
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        company={selectedCompany}
        adminUser={user}
        onSave={handleSave}
      />
    </>
  );
}

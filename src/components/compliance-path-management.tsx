// src/components/compliance-path-management.tsx
'use client';

import React, { useState } from 'react';
import type { CompliancePath, User } from '@/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileQuestion, Plus, ScrollText, Settings2 } from 'lucide-react';
import CompliancePathForm from './compliance-path-form';

interface CompliancePathManagementProps {
  initialCompliancePaths: CompliancePath[];
  user: User;
}

export default function CompliancePathManagement({
  initialCompliancePaths,
  user,
}: CompliancePathManagementProps) {
  const [paths, setPaths] = useState<CompliancePath[]>(initialCompliancePaths);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPath, setSelectedPath] = useState<CompliancePath | null>(
    null,
  );

  const handleCreateNew = () => {
    setSelectedPath(null);
    setIsFormOpen(true);
  };

  const handleEdit = (path: CompliancePath) => {
    setSelectedPath(path);
    setIsFormOpen(true);
  };

  const handleSave = (savedPath: CompliancePath) => {
    if (selectedPath) {
      setPaths(currentPaths =>
        currentPaths.map(p => (p.id === savedPath.id ? savedPath : p)),
      );
    } else {
      setPaths(currentPaths => [...currentPaths, savedPath]);
    }
    setIsFormOpen(false);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Compliance Path Management
            </h1>
            <p className="text-muted-foreground">
              View and manage the compliance standards and rule sets that products
              are verified against.
            </p>
          </div>
          <Button onClick={handleCreateNew}>
            <Plus className="mr-2 h-4 w-4" /> Create Path
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {paths.map(path => (
            <Card key={path.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{path.name}</CardTitle>
                <Badge variant="outline" className="w-fit">
                  {path.category}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4 flex-1">
                <p className="text-sm text-muted-foreground">
                  {path.description}
                </p>
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <FileQuestion className="h-4 w-4 text-muted-foreground" />
                    Regulations
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {path.regulations.map(reg => (
                      <Badge key={reg} variant="secondary">
                        {reg}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <ScrollText className="h-4 w-4 text-muted-foreground" />
                    Rules
                  </h4>
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                    {JSON.stringify(path.rules, null, 2)}
                  </pre>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleEdit(path)}
                >
                  <Settings2 className="mr-2 h-4 w-4" />
                  Manage Path
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
      <CompliancePathForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        path={selectedPath}
        onSave={handleSave}
        user={user}
      />
    </>
  );
}

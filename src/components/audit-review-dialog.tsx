// src/components/audit-review-dialog.tsx
'use client';

import React, { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import PublicPassportView from './public-passport-view';
import type { Product, User } from '@/types';
import { Loader2, AlertTriangle } from 'lucide-react';
import { approvePassport, rejectPassport } from '@/lib/actions/product-actions';
import { useToast } from '@/hooks/use-toast';

interface AuditReviewDialogProps {
  product: Product | null;
  user: User;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function AuditReviewDialog({
  product,
  user,
  isOpen,
  onOpenChange,
}: AuditReviewDialogProps) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleClose = () => {
    setShowRejectionForm(false);
    setRejectionReason('');
    onOpenChange(false);
  };

  const handleApprove = () => {
    if (!product) return;
    startTransition(async () => {
      try {
        const updatedProduct = await approvePassport(product.id, user.id);
        toast({
          title: 'Passport Approved',
          description: `"${updatedProduct.productName}" has been verified and anchored.`,
        });
        handleClose();
      } catch (error: any) {
        toast({
          title: 'Approval Failed',
          description:
            error.message || 'An error occurred during the approval process.',
          variant: 'destructive',
        });
      }
    });
  };

  const handleReject = () => {
    if (!product || !rejectionReason) return;
    startTransition(async () => {
      try {
        const gaps =
          product.sustainability?.gaps ?? [
            { regulation: 'Manual Review', issue: rejectionReason },
          ];
        const updatedProduct = await rejectPassport(
          product.id,
          rejectionReason,
          gaps,
          user.id,
        );
        toast({
          title: 'Passport Rejected',
          description: `"${updatedProduct.productName}" has been marked as failed.`,
        });
        handleClose();
      } catch (error) {
        toast({
          title: 'Rejection Failed',
          description: 'An error occurred during the rejection process.',
          variant: 'destructive',
        });
      }
    });
  };

  if (!product) return null;

  const complianceGaps = product.sustainability?.gaps;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl flex flex-col h-full md:h-[90vh]">
        <DialogHeader className="pr-6">
          <DialogTitle>Review Passport: {product.productName}</DialogTitle>
          <DialogDescription>
            Audit the following product passport and approve or reject with
            feedback.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full pr-6">
            <PublicPassportView product={product} />
          </ScrollArea>
        </div>

        {showRejectionForm && (
          <div className="px-1 pt-4 space-y-2 border-t">
            <Label htmlFor="rejectionReason">Rejection Reason</Label>
            <Textarea
              id="rejectionReason"
              placeholder="Provide clear feedback for the supplier..."
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
            />
          </div>
        )}

        {!showRejectionForm &&
          complianceGaps &&
          complianceGaps.length > 0 && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Potential Compliance Gaps Detected</AlertTitle>
              <AlertDescription>
                The AI has flagged potential issues. Please review carefully
                before approving.
                <ul className="list-disc list-inside text-xs mt-2">
                  {complianceGaps.map((gap, index) => (
                    <li key={index}>
                      <strong>{gap.regulation}:</strong> {gap.issue}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

        <DialogFooter className="pt-4 border-t">
          {showRejectionForm ? (
            <>
              <Button
                variant="outline"
                onClick={() => setShowRejectionForm(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isPending || !rejectionReason}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Rejection
              </Button>
            </>
          ) : (
            <>
              <DialogClose asChild>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                variant="destructive"
                onClick={() => setShowRejectionForm(true)}
                disabled={isPending}
              >
                Reject
              </Button>
              <Button
                onClick={handleApprove}
                disabled={isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Approve & Anchor
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

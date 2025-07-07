// src/components/two-factor-setup-dialog.tsx
'use client';

import { useState, useEffect, useTransition } from 'react';
import QRCode from 'react-qr-code';
import {
  multiFactor,
  TotpMultiFactorGenerator,
  type TotpSecret,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { setMfaStatus } from '@/lib/actions';
import type { User } from '@/types';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ShieldCheck, Copy, Check } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface TwoFactorSetupDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess: () => void;
  user: User;
}

export default function TwoFactorSetupDialog({
  isOpen,
  onOpenChange,
  onSuccess,
  user,
}: TwoFactorSetupDialogProps) {
  const [qrCodeUri, setQrCodeUri] = useState<string | null>(null);
  const [secret, setSecret] = useState<TotpSecret | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [hasCopied, setHasCopied] = useState(false);

  useEffect(() => {
    async function startMfaEnrollment() {
      if (isOpen && auth.currentUser) {
        setIsLoading(true);
        try {
          const session = await multiFactor(auth.currentUser).getSession();
          const totpSecret =
            await TotpMultiFactorGenerator.generateSecret(session);
          setSecret(totpSecret);
          setQrCodeUri(totpSecret.toUri());
        } catch (error) {
          toast({
            title: 'Error starting 2FA setup',
            description: (error as Error).message,
            variant: 'destructive',
          });
          onOpenChange(false);
        } finally {
          setIsLoading(false);
        }
      }
    }
    startMfaEnrollment();
  }, [isOpen, onOpenChange, toast]);

  const handleVerifyAndEnroll = () => {
    if (!auth.currentUser || !secret || verificationCode.length !== 6) return;

    startTransition(async () => {
      try {
        const assertion = TotpMultiFactorGenerator.assertionForEnrollment(
          secret,
          verificationCode,
        );
        await multiFactor(auth.currentUser).enroll(
          assertion,
          'My Authenticator App',
        );

        await setMfaStatus(user.id, true, user.id);

        toast({
          title: 'Success!',
          description: 'Two-factor authentication has been enabled.',
        });
        onSuccess();
        onClose();
      } catch (error) {
        toast({
          title: 'Verification Failed',
          description: 'The code was incorrect. Please try again.',
          variant: 'destructive',
        });
      }
    });
  };

  const onClose = () => {
    setQrCodeUri(null);
    setSecret(null);
    setVerificationCode('');
    onOpenChange(false);
  };

  const copySecretToClipboard = () => {
    if (secret?.secretKey) {
      navigator.clipboard.writeText(secret.secretKey);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
          <DialogDescription>
            Scan the QR code with your authenticator app (like Google
            Authenticator or Authy), then enter the 6-digit code to verify.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-md flex justify-center">
              {qrCodeUri && <QRCode value={qrCodeUri} size={200} />}
            </div>
            <Alert>
              <ShieldCheck className="h-4 w-4" />
              <AlertTitle>Can't scan the code?</AlertTitle>
              <AlertDescription>
                You can also manually enter the setup key into your
                authenticator app.
                <div className="relative mt-2">
                  <Input
                    readOnly
                    value={secret?.secretKey || ''}
                    className="font-mono pr-12 bg-muted"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={copySecretToClipboard}
                  >
                    {hasCopied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Input
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={e => setVerificationCode(e.target.value)}
                maxLength={6}
                className="text-center text-lg font-mono tracking-widest"
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleVerifyAndEnroll}
            disabled={isPending || isLoading || verificationCode.length !== 6}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify &amp; Enable
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

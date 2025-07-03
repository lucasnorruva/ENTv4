// src/components/settings-client.tsx
'use client';

import { useState, useTransition } from 'react';
import {
  updateUserProfile,
  updateUserPassword,
  saveNotificationPreferences,
  setMfaStatus,
} from '@/lib/actions';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield } from 'lucide-react';
import type { User } from '@/types';
import { auth } from '@/lib/firebase';
import TwoFactorSetupDialog from './two-factor-setup-dialog';
import { multiFactor } from 'firebase/auth';

export default function SettingsClient({ user: initialUser }: { user: User }) {
  const [user, setUser] = useState(initialUser);
  const [fullName, setFullName] = useState(user.fullName);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [is2faDialogOpen, setIs2faDialogOpen] = useState(false);

  const handleProfileSave = () => {
    startTransition(async () => {
      try {
        await updateUserProfile(user.id, fullName, user.id);
        setUser(prev => ({...prev, fullName}));
        toast({
          title: 'Profile Updated',
          description: 'Your full name has been successfully updated.',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to update profile.',
          variant: 'destructive',
        });
      }
    });
  };

  const handlePasswordUpdate = () => {
    if (!currentPassword || !newPassword) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in both password fields.',
        variant: 'destructive',
      });
      return;
    }
    startTransition(async () => {
      try {
        await updateUserPassword(user.id, currentPassword, newPassword, user.id);
        toast({
          title: 'Password Updated',
          description: 'Your password has been successfully changed.',
        });
        setCurrentPassword('');
        setNewPassword('');
      } catch (error: any) {
        toast({
          title: 'Error',
          description:
            error.message ||
            'Failed to update password. Please check your current password.',
          variant: 'destructive',
        });
      }
    });
  };

  const handleNotificationsSave = () => {
    startTransition(async () => {
      try {
        await saveNotificationPreferences(user.id, {}, user.id);
        toast({
          title: 'Preferences Saved',
          description: 'Your notification settings have been updated.',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to save notification preferences.',
          variant: 'destructive',
        });
      }
    });
  };

  const handleDisable2FA = () => {
    if (!auth.currentUser) return;
    startTransition(async () => {
      try {
        const mfaUser = multiFactor(auth.currentUser);
        // Assuming only one factor (TOTP) is enrolled.
        // A real app might let the user choose which factor to unenroll.
        if (mfaUser.enrolledFactors && mfaUser.enrolledFactors.length > 0) {
            await mfaUser.unenroll(mfaUser.enrolledFactors[0]);
            await setMfaStatus(user.id, false, user.id);
            setUser(prev => ({...prev, isMfaEnabled: false}));
            toast({
              title: '2FA Disabled',
              description: 'Two-factor authentication has been disabled.',
            });
        } else {
            throw new Error("No 2FA methods are currently enrolled.");
        }
      } catch (error: any) {
        console.error('2FA Disable Error:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to disable 2FA.',
          variant: 'destructive',
        });
      }
    });
  };

  const on2faSuccess = () => {
    setIs2faDialogOpen(false);
    setUser(prev => ({...prev, isMfaEnabled: true}));
  };

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              This is your public display name and email address.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user.email} readOnly disabled />
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button onClick={handleProfileSave} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Profile
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>
              Update your password. It's a good practice to use a strong, unique
              password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Mock password is 'password123'"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button onClick={handlePasswordUpdate} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" /> Two-Factor Authentication
            </CardTitle>
            <CardDescription>
              Add an extra layer of security to your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user.isMfaEnabled ? (
              <p className="text-sm text-green-600">
                Two-factor authentication is currently enabled.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Two-factor authentication is currently disabled.
              </p>
            )}
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            {user.isMfaEnabled ? (
              <Button
                variant="destructive"
                onClick={handleDisable2FA}
                disabled={isPending}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Disable 2FA
              </Button>
            ) : (
              <Button onClick={() => setIs2faDialogOpen(true)}>
                Enable 2FA
              </Button>
            )}
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              Manage how you receive notifications from the platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base">Product Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Receive emails when a product you manage is updated or
                  verified.
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base">Compliance Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about compliance failures or upcoming regulation
                  changes.
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base">Platform News</Label>
                <p className="text-sm text-muted-foreground">
                  Receive occasional updates about new features and platform
                  news.
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button onClick={handleNotificationsSave} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Preferences
            </Button>
          </CardFooter>
        </Card>
      </div>
      <TwoFactorSetupDialog
        isOpen={is2faDialogOpen}
        onOpenChange={setIs2faDialogOpen}
        onSuccess={on2faSuccess}
        user={user}
      />
    </>
  );
}

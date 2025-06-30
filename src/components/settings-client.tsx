// src/components/settings-client.tsx
'use client';

import { useState, useTransition } from 'react';

import {
  updateUserProfile,
  updateUserPassword,
  saveNotificationPreferences,
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
import { Loader2 } from 'lucide-react';
import type { User } from '@/types';

interface SettingsClientProps {
  user: User;
}

export default function SettingsClient({ user }: SettingsClientProps) {
  const [fullName, setFullName] = useState(user.fullName);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleProfileSave = () => {
    startTransition(async () => {
      try {
        await updateUserProfile(user.id, fullName);
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
        await updateUserPassword(user.id, currentPassword, newPassword);
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
        await saveNotificationPreferences(user.id, {}); // Pass preferences object here
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

  return (
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
  );
}

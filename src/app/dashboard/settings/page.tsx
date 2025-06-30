// src/app/dashboard/settings/page.tsx
'use client';

import { useState, useTransition, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

import { getCurrentUser } from '@/lib/auth';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { Role, User } from '@/lib/constants';

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const role = (searchParams.get('role') as Role) || 'Supplier';

  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchUser() {
      const fetchedUser = await getCurrentUser(role);
      setUser(fetchedUser);
      setFullName(fetchedUser.fullName);
    }
    fetchUser();
  }, [role]);

  const handleProfileSave = () => {
    if (!user) return;
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
    if (!user || !currentPassword || !newPassword) {
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
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to update password. Please check your current password.',
          variant: 'destructive',
        });
      }
    });
  };
  
  const handleNotificationsSave = () => {
     if (!user) return;
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


  if (!user) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

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
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" defaultValue={user.email} readOnly disabled />
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
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
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

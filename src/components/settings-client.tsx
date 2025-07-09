// src/components/settings-client.tsx
'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  updateUserProfile,
  updateUserPassword,
  saveNotificationPreferences,
  deleteOwnAccount,
  setMfaStatus,
} from '@/lib/actions/user-actions';
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
import { Loader2, Shield, AlertTriangle, UserCircle } from 'lucide-react';
import type { User } from '@/types';
import { auth, storage } from '@/lib/firebase';
import { multiFactor } from 'firebase/auth';
import TwoFactorSetupDialog from './two-factor-setup-dialog';
import { useForm } from 'react-hook-form';
import {
  profileFormSchema,
  passwordFormSchema,
  notificationsFormSchema,
  deleteAccountSchema,
  type ProfileFormValues,
  type PasswordFormValues,
  type NotificationsFormValues,
  type DeleteAccountValues,
} from '@/lib/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Progress } from './ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';

export default function SettingsClient({ user: initialUser }: { user: User }) {
  const [user, setUser] = useState(initialUser);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  
  const [is2faDialogOpen, setIs2faDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(user.avatarUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { fullName: user.fullName || '' },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const notificationsForm = useForm<NotificationsFormValues>({
    resolver: zodResolver(notificationsFormSchema),
    defaultValues: user.notificationPreferences || {
      productUpdates: true,
      complianceAlerts: true,
      platformNews: false,
    },
  });

  const deleteForm = useForm<DeleteAccountValues>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: { confirmText: '' },
  });

  useEffect(() => {
    setAvatarPreview(user.avatarUrl);
    profileForm.reset({ fullName: user.fullName });
    notificationsForm.reset(user.notificationPreferences);
  }, [user, profileForm, notificationsForm]);


  const handleAvatarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  }, []);

  const onProfileSave = useCallback((values: ProfileFormValues) => {
    startTransition(async () => {
        let avatarUrl = user.avatarUrl;
        if (avatarFile) {
            setIsUploading(true);
            const storageRef = ref(storage, `avatars/${user.id}/${avatarFile.name}`);
            const uploadTask = uploadBytesResumable(storageRef, avatarFile);
            
            avatarUrl = await new Promise<string>((resolve, reject) => {
                uploadTask.on(
                    'state_changed',
                    (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
                    (error) => { reject(error); },
                    async () => { resolve(await getDownloadURL(uploadTask.snapshot.ref)); }
                );
            });
            setIsUploading(false);
        }

        try {
            await updateUserProfile(user.id, { fullName: values.fullName, avatarUrl }, user.id);
            setUser(prev => ({ ...prev, fullName: values.fullName, avatarUrl }));
            toast({ title: 'Profile Updated', description: 'Your profile has been successfully updated.' });
            setAvatarFile(null);
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to update profile.', variant: 'destructive' });
        }
    });
  }, [user, avatarFile, toast, startTransition]);

  const onPasswordUpdate = useCallback((values: PasswordFormValues) => {
    startTransition(async () => {
      try {
        await updateUserPassword(user.id, values.currentPassword, values.newPassword, user.id);
        toast({ title: 'Password Updated', description: 'Your password has been successfully changed.' });
        passwordForm.reset();
      } catch (error: any) {
        toast({ title: 'Error', description: error.message || 'Failed to update password.', variant: 'destructive' });
      }
    });
  }, [user.id, toast, passwordForm, startTransition]);

  const onNotificationsSave = useCallback((values: NotificationsFormValues) => {
    startTransition(async () => {
      try {
        await saveNotificationPreferences(user.id, values, user.id);
        setUser(prev => ({...prev, notificationPreferences: values}));
        toast({ title: 'Preferences Saved', description: 'Your notification settings have been updated.' });
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to save notification preferences.', variant: 'destructive' });
      }
    });
  }, [user.id, toast, startTransition]);

  const handleDisable2FA = useCallback(() => {
    if (!auth.currentUser) return;
    startTransition(async () => {
      try {
        const mfaUser = multiFactor(auth.currentUser);
        if (mfaUser.enrolledFactors && mfaUser.enrolledFactors.length > 0) {
          await mfaUser.unenroll(mfaUser.enrolledFactors[0]);
          await setMfaStatus(user.id, false, user.id);
          setUser(prev => ({ ...prev, isMfaEnabled: false }));
          toast({ title: '2FA Disabled', description: 'Two-factor authentication has been disabled.' });
        }
      } catch (error: any) {
        toast({ title: 'Error', description: error.message || 'Failed to disable 2FA.', variant: 'destructive' });
      }
    });
  }, [user.id, toast, startTransition]);

  const onDeleteAccount = useCallback(() => {
    startTransition(async () => {
        try {
            await deleteOwnAccount(user.id);
            toast({ title: 'Account Deleted', description: 'Your account has been permanently deleted.' });
            router.push('/login');
        } catch (error: any) {
            toast({ title: 'Error', description: error.message || 'Failed to delete account.', variant: 'destructive' });
        }
    })
  }, [user.id, toast, router, startTransition]);

  const on2faSuccess = useCallback(() => {
    setIs2faDialogOpen(false);
    setUser(prev => ({ ...prev, isMfaEnabled: true }));
  }, []);

  return (
    <>
      <div className="space-y-6">
        <Card>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSave)}>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>
                  This is your public display name and avatar.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={profileForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormItem>
                    <FormLabel>Avatar</FormLabel>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={avatarPreview || ''} />
                        <AvatarFallback><UserCircle className="h-8 w-8"/></AvatarFallback>
                      </Avatar>
                      <FormControl>
                        <Input type="file" accept="image/*" onChange={handleAvatarChange} className="max-w-xs" />
                      </FormControl>
                    </div>
                    {isUploading && <Progress value={uploadProgress} className="w-full mt-2 h-2" />}
                  </FormItem>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={user.email} readOnly disabled />
                </div>
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <Button type="submit" disabled={isPending || isUploading}>
                  {(isPending || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isUploading ? 'Uploading...' : 'Save Profile'}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>

        <Card>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordUpdate)}>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>
                  Update your password. It's a good practice to use a strong, unique password.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Mock password is 'password123'" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Password
                </Button>
              </CardFooter>
            </form>
          </Form>
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
              <p className="text-sm text-green-600 font-medium">
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
              <Button variant="destructive" onClick={handleDisable2FA} disabled={isPending}>
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
          <Form {...notificationsForm}>
            <form onSubmit={notificationsForm.handleSubmit(onNotificationsSave)}>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Manage how you receive notifications from the platform.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                    control={notificationsForm.control}
                    name="productUpdates"
                    render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                        <FormLabel>Product Updates</FormLabel>
                        <p className="text-sm text-muted-foreground">Receive emails when a product you manage is updated or verified.</p>
                        </div>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                    </FormItem>
                    )}
                />
                 <FormField
                    control={notificationsForm.control}
                    name="complianceAlerts"
                    render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                        <FormLabel>Compliance Alerts</FormLabel>
                        <p className="text-sm text-muted-foreground">Get notified about compliance failures or upcoming regulation changes.</p>
                        </div>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                    </FormItem>
                    )}
                />
                 <FormField
                    control={notificationsForm.control}
                    name="platformNews"
                    render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                        <FormLabel>Platform News</FormLabel>
                        <p className="text-sm text-muted-foreground">Receive occasional updates about new features and platform news.</p>
                        </div>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                    </FormItem>
                    )}
                />
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Preferences
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
        
        <Card className="border-destructive">
             <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle/> Danger Zone
                </CardTitle>
                <CardDescription>
                    These actions are permanent and cannot be undone.
                </CardDescription>
             </CardHeader>
             <CardFooter>
                 <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={isPending}>Delete My Account</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <Form {...deleteForm}>
                            <form onSubmit={deleteForm.handleSubmit(onDeleteAccount)}>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="py-4">
                                     <FormField
                                        control={deleteForm.control}
                                        name="confirmText"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>To confirm, type "DELETE MY ACCOUNT" below</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                </div>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction type="submit" variant="destructive" disabled={isPending || !deleteForm.formState.isValid}>
                                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                        I understand, delete my account
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                             </form>
                        </Form>
                    </AlertDialogContent>
                 </AlertDialog>
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

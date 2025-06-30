// src/app/dashboard/settings/page.tsx
import { getCurrentUser } from '@/lib/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Role } from '@/lib/constants';

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { role?: Role };
}) {
  const user = await getCurrentUser(searchParams.role || 'Supplier');

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
            <Input id="fullName" defaultValue={user.fullName} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" defaultValue={user.email} readOnly disabled />
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button>Save Profile</Button>
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
            <Input id="currentPassword" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input id="newPassword" type="password" />
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button>Update Password</Button>
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
          <Button>Save Preferences</Button>
        </CardFooter>
      </Card>
    </div>
  );
}

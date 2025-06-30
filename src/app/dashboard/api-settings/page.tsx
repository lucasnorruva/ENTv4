// src/app/dashboard/api-settings/page.tsx

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

// In a real app, these settings would be fetched from a 'settings' collection in Firestore.
const mockApiSettings = {
  isPublicApiEnabled: true,
  rateLimitPerMinute: 100,
  isWebhookSigningEnabled: true,
};

export default function ApiSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">API Settings</h1>
        <p className="text-muted-foreground">
          Configure global settings for the Norruva API and integrations.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General API Configuration</CardTitle>
          <CardDescription>
            Manage the availability and rate limits for the public API.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="enable-public-api">Enable Public API</Label>
              <p className="text-sm text-muted-foreground">
                Allow unauthenticated access to public product passport data.
              </p>
            </div>
            <Switch
              id="enable-public-api"
              defaultChecked={mockApiSettings.isPublicApiEnabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rate-limit">Rate Limit (Requests per Minute)</Label>
            <Input
              id="rate-limit"
              type="number"
              defaultValue={mockApiSettings.rateLimitPerMinute}
              className="max-w-xs"
            />
            <p className="text-sm text-muted-foreground">
              Set the maximum number of requests a single IP can make per
              minute.
            </p>
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button>Save API Settings</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Webhook Settings</CardTitle>
          <CardDescription>
            Configure security settings for outgoing webhooks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="enable-webhook-signing">
                Enable Webhook Signing
              </Label>
              <p className="text-sm text-muted-foreground">
                Sign outgoing webhook payloads with a secret key to ensure
                their authenticity.
              </p>
            </div>
            <Switch
              id="enable-webhook-signing"
              defaultChecked={mockApiSettings.isWebhookSigningEnabled}
            />
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button>Save Webhook Settings</Button>
        </CardFooter>
      </Card>
    </div>
  );
}

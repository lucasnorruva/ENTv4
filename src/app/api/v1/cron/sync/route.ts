// src/app/api/v1/cron/sync/route.ts

import { NextRequest, NextResponse } from "next/server";
import { runDailyReferenceDataSync } from "@/triggers/scheduled-syncs";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const result = await runDailyReferenceDataSync();
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Cron sync job failed:", error);
    return new NextResponse(error.message || "Internal Server Error", {
      status: 500,
    });
  }
}

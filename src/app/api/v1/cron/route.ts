// src/app/api/v1/cron/route.ts

import { NextRequest, NextResponse } from "next/server";
import { runDailyComplianceCheck } from "@/triggers/scheduled-verifications";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const result = await runDailyComplianceCheck();
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Cron job failed:", error);
    return new NextResponse(error.message || "Internal Server Error", {
      status: 500,
    });
  }
}

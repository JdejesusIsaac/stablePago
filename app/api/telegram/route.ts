import { NextResponse } from "next/server";

import telegramService from "@/services/TelegramService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ status: "telegram-bot-running", initialized: Boolean(telegramService) });
}

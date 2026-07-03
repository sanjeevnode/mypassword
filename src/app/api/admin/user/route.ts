import { NextResponse } from "next/server";
import { adminAuth, verifyAdminRequest } from "@/lib/admin";

export const dynamic = "force-dynamic";

/** Toggle a user's login (soft deactivation — data stays intact). */
export async function POST(req: Request) {
  const admin = await verifyAdminRequest(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { uid, disabled } = (await req.json()) as { uid?: string; disabled?: boolean };
  if (!uid || typeof disabled !== "boolean") {
    return NextResponse.json({ error: "uid and disabled are required" }, { status: 400 });
  }
  if (uid === admin.uid) {
    return NextResponse.json({ error: "You cannot deactivate your own admin account" }, { status: 400 });
  }

  await adminAuth().updateUser(uid, { disabled });
  if (disabled) {
    // kill existing sessions so the lockout is immediate
    await adminAuth().revokeRefreshTokens(uid);
  }
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { adminAuth, purgeUserData, verifyRequest } from "@/lib/admin";

export const dynamic = "force-dynamic";

/**
 * Permanently delete the caller's own account: every credential doc,
 * the vault doc (salts/verifier/wrapped key), and the auth user.
 * Irreversible by design — the client gates this behind master-password
 * re-confirmation and a typed confirmation.
 */
export async function DELETE(req: Request) {
  const decoded = await verifyRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const deleted = await purgeUserData(decoded.uid);
  await adminAuth().deleteUser(decoded.uid);
  return NextResponse.json({ ok: true, deletedCredentials: deleted });
}

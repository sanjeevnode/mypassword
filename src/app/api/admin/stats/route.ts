import { NextResponse } from "next/server";
import { adminAuth, adminDb, verifyAdminRequest } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const admin = await verifyAdminRequest(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = adminDb();
  const [listResult, userDocs] = await Promise.all([
    adminAuth().listUsers(1000),
    db.collection("users").get(),
  ]);

  // vault metadata per uid: rotation count + credential count
  const meta = new Map<string, { rotations: number; credentials: number }>();
  await Promise.all(
    userDocs.docs.map(async (doc) => {
      const count = await doc.ref.collection("passwords").count().get();
      meta.set(doc.id, {
        rotations: (doc.data().rotations as number) ?? 0,
        credentials: count.data().count,
      });
    })
  );

  const users = listResult.users.map((u) => ({
    uid: u.uid,
    email: u.email ?? "",
    displayName: u.displayName ?? "",
    createdAt: u.metadata.creationTime ?? null,
    lastSignIn: u.metadata.lastSignInTime ?? null,
    disabled: u.disabled,
    hasVault: meta.has(u.uid),
    credentials: meta.get(u.uid)?.credentials ?? 0,
    rotations: meta.get(u.uid)?.rotations ?? 0,
  }));

  const totals = {
    users: users.length,
    disabled: users.filter((u) => u.disabled).length,
    withVault: users.filter((u) => u.hasVault).length,
    credentials: users.reduce((s, u) => s + u.credentials, 0),
    rotations: users.reduce((s, u) => s + u.rotations, 0),
  };

  return NextResponse.json({ totals, users });
}

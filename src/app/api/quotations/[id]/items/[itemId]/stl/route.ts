import { NextRequest, NextResponse } from "next/server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@/lib/db";
import { r2, R2_BUCKET } from "@/lib/r2";
import { getSession } from "@/lib/auth";

async function requireAdmin() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    await requireAdmin();
    const { itemId } = await params;

    const item = await db.quotationItem.findUnique({ where: { id: itemId } });
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (item.stlKey) {
      try {
        await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: item.stlKey }));
      } catch {
        // Ignore NoSuchKey / 404 — file may already be gone
      }
    }

    const updated = await db.quotationItem.update({
      where: { id: itemId },
      data: { stlKey: null },
    });

    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

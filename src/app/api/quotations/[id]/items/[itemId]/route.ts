import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

async function requireAdmin() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    await requireAdmin();
    const { itemId } = await params;
    const body = await req.json();

    const item = await db.quotationItem.update({
      where: { id: itemId },
      data: {
        ...(body.itemName !== undefined && { itemName: body.itemName }),
        ...(body.filamentType !== undefined && { filamentType: body.filamentType }),
        ...(body.quality !== undefined && { quality: body.quality }),
        ...(body.infillPercent !== undefined && { infillPercent: body.infillPercent }),
        ...(body.printMinutes !== undefined && { printMinutes: body.printMinutes }),
        ...(body.weightGrams !== undefined && { weightGrams: body.weightGrams }),
        ...(body.sellingPrice !== undefined && { sellingPrice: body.sellingPrice }),
        ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
      },
    });

    return NextResponse.json(item);
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    await requireAdmin();
    const { itemId } = await params;
    await db.quotationItem.delete({ where: { id: itemId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

async function requireAdmin() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id: quotationId } = await params;
    const body = await req.json();

    const { itemName, filamentType, quality, infillPercent, printMinutes, weightGrams, sellingPrice } = body;

    // Get current max sortOrder
    const maxItem = await db.quotationItem.findFirst({
      where: { quotationId },
      orderBy: { sortOrder: "desc" },
    });
    const sortOrder = (maxItem?.sortOrder ?? -1) + 1;

    const item = await db.quotationItem.create({
      data: {
        quotationId,
        sortOrder,
        itemName: itemName ?? "Unnamed Item",
        filamentType: filamentType ?? "PLA",
        quality: quality ?? "Standard",
        infillPercent: infillPercent ?? 15,
        printMinutes: printMinutes ?? 0,
        weightGrams: weightGrams ?? 0,
        sellingPrice: sellingPrice ?? 0,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

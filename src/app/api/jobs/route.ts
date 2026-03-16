import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

async function requireAdmin() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
}

export async function GET() {
  try {
    await requireAdmin();
    const jobs = await db.printJob.findMany({ orderBy: { date: "desc" } });
    return NextResponse.json(jobs);
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const job = await db.printJob.create({
      data: {
        name: body.name,
        filamentType: body.filamentType,
        materialCost: body.materialCost,
        laborCost: body.laborCost,
        electricityCost: body.electricityCost,
        postProcessingCost: body.postProcessingCost,
        packagingCost: body.packagingCost,
        totalCost: body.totalCost,
        sellingPrice: body.sellingPrice,
        profit: body.profit,
        markupPercent: body.markupPercent,
      },
    });
    return NextResponse.json(job, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

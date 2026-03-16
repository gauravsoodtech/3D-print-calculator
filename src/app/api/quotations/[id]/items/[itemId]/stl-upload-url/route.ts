import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2, R2_BUCKET } from "@/lib/r2";
import { getSession } from "@/lib/auth";
import { randomUUID } from "crypto";

async function requireAdmin() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    await requireAdmin();
    const { itemId } = await params;

    const key = `stl/${itemId}/${randomUUID()}.stl`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    });

    const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 300 }); // 5 min

    return NextResponse.json({ uploadUrl, key });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

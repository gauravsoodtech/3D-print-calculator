"use client";

import { useState, useRef } from "react";

interface Props {
  quotationId: string;
  itemId: string;
  onConfirmed: (stlKey: string) => void;
}

export default function STLUploadButton({ quotationId, itemId, onConfirmed }: Props) {
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("uploading");

    try {
      // 1. Get presigned upload URL
      const res = await fetch(`/api/quotations/${quotationId}/items/${itemId}/stl-upload-url`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to get upload URL");
      const { uploadUrl, key } = await res.json();

      // 2. PUT directly to R2
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
      });
      if (!uploadRes.ok) {
        const text = await uploadRes.text().catch(() => uploadRes.status.toString());
        throw new Error(`R2 upload failed (${uploadRes.status}): ${text}`);
      }

      // 3. Confirm stlKey in DB
      const confirmRes = await fetch(`/api/quotations/${quotationId}/items/${itemId}/stl-confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      if (!confirmRes.ok) throw new Error("Failed to confirm upload");

      setStatus("done");
      onConfirmed(key);
    } catch (err) {
      console.error("STL upload error:", err);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }

    // Reset input so same file can be re-uploaded
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".stl"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        type="button"
        disabled={status === "uploading"}
        onClick={() => inputRef.current?.click()}
        className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition-all ${
          status === "done"
            ? "border-emerald-500/50 text-emerald-400"
            : status === "error"
            ? "border-red-500/50 text-red-400"
            : status === "uploading"
            ? "border-zinc-600 text-zinc-500 cursor-wait"
            : "border-zinc-700 hover:border-zinc-600 text-zinc-400 hover:text-zinc-100"
        }`}
      >
        {status === "uploading" ? "Uploading…" : status === "done" ? "✓ STL" : status === "error" ? "Failed" : "Upload STL"}
      </button>
    </>
  );
}

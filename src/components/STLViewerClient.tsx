"use client";

import dynamic from "next/dynamic";

const STLViewer = dynamic(() => import("./STLViewer"), { ssr: false });

export default function STLViewerClient({ stlUrl }: { stlUrl: string }) {
  return <STLViewer stlUrl={stlUrl} />;
}

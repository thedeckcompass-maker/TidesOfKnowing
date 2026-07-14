import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_PDF_BYTES = 12 * 1024 * 1024;

function sanitisePdfFilename(name: string): string {
  const base = name
    .replace(/[/\\]/g, "")
    .replace(/[^\w.\- ()[\]]+/g, "_")
    .trim()
    .slice(0, 180);
  if (!base.toLowerCase().endsWith(".pdf")) {
    return `${base || "Ask-Leilia-Reading"}.pdf`;
  }
  return base || "Ask-Leilia-Reading.pdf";
}

export async function uploadAskLeiliaDeliveryPdf(
  service: SupabaseClient,
  requestId: string,
  file: File,
): Promise<
  | {
      deliveryPdfPath: string;
      deliveryPdfFilename: string;
      deliveryPdfSizeBytes: number;
      deliveryPdfUploadedAt: string;
    }
  | { error: string }
> {
  const lowerName = file.name.toLowerCase();
  if (file.type !== "application/pdf" && !lowerName.endsWith(".pdf")) {
    return { error: "Please upload a PDF file." };
  }

  if (file.type && file.type !== "application/pdf") {
    return { error: "Please upload a PDF file." };
  }

  if (file.size > MAX_PDF_BYTES) {
    return { error: "Please keep PDF uploads under 12 MB." };
  }

  if (file.size < 1) {
    return { error: "The uploaded PDF is empty." };
  }

  const deliveryPdfPath = `deliveries/${requestId}/${crypto.randomUUID()}.pdf`;
  const { error: uploadError } = await service.storage
    .from("ask-leilia-uploads")
    .upload(deliveryPdfPath, file, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (uploadError) {
    console.error("Ask Leilia delivery PDF upload failed:", uploadError);
    return { error: "Unable to upload the delivery PDF right now." };
  }

  return {
    deliveryPdfPath,
    deliveryPdfFilename: sanitisePdfFilename(file.name || "Ask-Leilia-Reading.pdf"),
    deliveryPdfSizeBytes: file.size,
    deliveryPdfUploadedAt: new Date().toISOString(),
  };
}

export async function downloadAskLeiliaDeliveryPdf(
  service: SupabaseClient,
  deliveryPdfPath: string,
): Promise<{ contentBase64: string } | { error: string }> {
  const { data, error } = await service.storage.from("ask-leilia-uploads").download(deliveryPdfPath);

  if (error || !data) {
    console.error("Ask Leilia delivery PDF download failed:", error);
    return { error: "Unable to load the delivery PDF." };
  }

  const bytes = new Uint8Array(await data.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return { contentBase64: btoa(binary) };
}

export async function removeAskLeiliaDeliveryPdfObject(
  service: SupabaseClient,
  deliveryPdfPath: string,
): Promise<{ ok: true } | { error: string }> {
  const { error } = await service.storage.from("ask-leilia-uploads").remove([deliveryPdfPath]);
  if (error) {
    console.error("Ask Leilia delivery PDF remove failed:", error);
    return { error: "Unable to remove the completed reading PDF." };
  }
  return { ok: true };
}

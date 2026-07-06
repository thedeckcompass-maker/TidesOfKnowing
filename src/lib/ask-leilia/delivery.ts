import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_PDF_BYTES = 12 * 1024 * 1024;

export async function uploadAskLeiliaDeliveryPdf(
  service: SupabaseClient,
  requestId: string,
  file: File,
): Promise<{ deliveryPdfPath: string } | { error: string }> {
  if (file.type !== "application/pdf") {
    return { error: "Please upload a PDF file." };
  }

  if (file.size > MAX_PDF_BYTES) {
    return { error: "Please keep PDF uploads under 12 MB." };
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

  return { deliveryPdfPath };
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

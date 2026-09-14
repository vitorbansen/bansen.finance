import { NextResponse, type NextRequest } from "next/server";
import { cloudinary, deleteImage } from "@/lib/cloudinary";

const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Envie uma imagem (JPG, PNG ou WebP)" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Imagem muito grande (máx. 8MB)" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: "nk-iphones", resource_type: "image" }, (error, res) => {
        if (error || !res) reject(error ?? new Error("Upload falhou"));
        else resolve(res as { secure_url: string });
      })
      .end(buffer);
  });

  return NextResponse.json({ url: result.secure_url });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const url = typeof body?.url === "string" ? body.url : null;
  if (!url) return NextResponse.json({ ok: true });
  try {
    await deleteImage(url);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[upload DELETE]", err);
    return NextResponse.json({ error: "Erro ao excluir imagem" }, { status: 500 });
  }
}

import { readFileSync } from "fs";
import { join } from "path";
import { ImageResponse } from "next/og";

/** Favicon: o logo recortado em círculo, com fundo transparente. Gerado no build. */
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  const logo = `data:image/jpeg;base64,${readFileSync(join(process.cwd(), "public", "logo.jpg")).toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} width={64} height={64} alt="" style={{ borderRadius: "50%", objectFit: "cover" }} />
      </div>
    ),
    size,
  );
}

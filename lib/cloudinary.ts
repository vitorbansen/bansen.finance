import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// https://res.cloudinary.com/cloud/image/upload/v123/nk-iphones/abc.jpg → "nk-iphones/abc"
export function extractPublicId(url: string): string | null {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/i);
  return match ? match[1] : null;
}

export function isCloudinaryUrl(url: string): boolean {
  return url.includes("res.cloudinary.com");
}

export async function deleteImage(url: string | null | undefined): Promise<void> {
  if (!url || !isCloudinaryUrl(url)) return;
  const publicId = extractPublicId(url);
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
}

export { cloudinary };

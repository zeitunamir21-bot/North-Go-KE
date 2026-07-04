import { supabase } from "@/integrations/supabase/client";

const BUCKET = "driver-photos";
const MARKER = `/${BUCKET}/`;

/** Extract the storage object path from either a stored full URL or a bare path. */
export function toDriverPhotoPath(urlOrPath: string): string {
  if (!urlOrPath) return "";
  const idx = urlOrPath.indexOf(MARKER);
  if (idx >= 0) return urlOrPath.slice(idx + MARKER.length).split("?")[0];
  return urlOrPath.replace(/^\/+/, "");
}

/** Create a short-lived signed URL for a driver photo. */
export async function signDriverPhotoUrl(
  urlOrPath: string,
  expiresIn = 60 * 60,
): Promise<string | null> {
  const path = toDriverPhotoPath(urlOrPath);
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresIn);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

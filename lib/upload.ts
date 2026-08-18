import { supabase } from "./supabase";

// Uploads a file to the public "photos" storage bucket and returns its
// public URL plus whether it's an image or video, based on its type.
export async function uploadMedia(file: File, folder: string): Promise<{ url: string; mediaType: "image" | "video" }> {
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `${folder}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from("photos").upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from("photos").getPublicUrl(path);
  const mediaType = file.type.startsWith("video/") ? "video" : "image";
  return { url: data.publicUrl, mediaType };
}

// Kept for any other code still calling the old single-purpose helper.
export async function uploadImage(file: File, folder: string): Promise<string> {
  const { url } = await uploadMedia(file, folder);
  return url;
}

import { supabase } from "./supabase";

// Uploads a file to the public "photos" storage bucket and returns its
// public URL. Used anywhere the admin panel lets you attach an image.
export async function uploadImage(file: File, folder: string): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `${folder}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from("photos").upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from("photos").getPublicUrl(path);
  return data.publicUrl;
}

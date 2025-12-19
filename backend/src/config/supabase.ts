import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

// Supabase client for storage
export const supabase = createClient(
    env.supabaseUrl,
    env.supabaseServiceKey
);

export const uploadToSupabase = async (
    bucket: string,
    path: string,
    file: Buffer,
    contentType: string
): Promise<string> => {
    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
            contentType,
            upsert: false,
        });

    if (error) {
        throw new Error(`Supabase upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

    return publicUrl;
};

export const deleteFromSupabase = async (
    bucket: string,
    path: string
): Promise<void> => {
    const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

    if (error) {
        throw new Error(`Supabase delete failed: ${error.message}`);
    }
};

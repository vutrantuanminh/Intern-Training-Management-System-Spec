import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

// Validate Supabase configuration
if (!env.supabaseUrl || !env.supabaseServiceKey) {
    console.warn('⚠️  Supabase not configured. File uploads will fail.');
    console.warn('   Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env');
}

// Supabase client for storage
export const supabase = createClient(
    env.supabaseUrl || 'https://placeholder.supabase.co',
    env.supabaseServiceKey || 'placeholder-key'
);

export const uploadToSupabase = async (
    bucket: string,
    path: string,
    file: Buffer,
    contentType: string
): Promise<string> => {
    try {
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, file, {
                contentType,
                upsert: false,
            });

        if (error) {
            console.error('Supabase upload error:', error);
            throw new Error(`Supabase upload failed: ${error.message}`);
        }

        if (!data) {
            throw new Error('Supabase upload returned no data');
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(path);

        return publicUrl;
    } catch (error: any) {
        console.error('Upload to Supabase failed:', error);
        throw new Error(`File upload failed: ${error.message}`);
    }
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

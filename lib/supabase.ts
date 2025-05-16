import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Helper functions for type-safe database operations
export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateProfile(userId: string, updates: Partial<Database['public']['Tables']['profiles']['Update']>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getBookmarks(userId: string) {
  const { data, error } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('user_id', userId);
  
  if (error) throw error;
  return data;
}

export async function toggleBookmark(userId: string, contentType: 'video' | 'comic', contentId: string) {
  const { data: existing } = await supabase
    .from('bookmarks')
    .select()
    .eq('user_id', userId)
    .eq('content_type', contentType)
    .eq('content_id', contentId)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', existing.id);
    
    if (error) throw error;
    return null;
  } else {
    const { data, error } = await supabase
      .from('bookmarks')
      .insert({
        user_id: userId,
        content_type: contentType,
        content_id: contentId
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}

export async function updateHistory(
  userId: string,
  contentType: 'video' | 'comic',
  contentId: string,
  progress?: number,
  chapterId?: string
) {
  const { data, error } = await supabase
    .from('history')
    .upsert({
      user_id: userId,
      content_type: contentType,
      content_id: contentId,
      progress,
      chapter_id: chapterId,
      last_accessed: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getHistory(userId: string) {
  const { data, error } = await supabase
    .from('history')
    .select('*')
    .eq('user_id', userId)
    .order('last_accessed', { ascending: false });
  
  if (error) throw error;
  return data;
}
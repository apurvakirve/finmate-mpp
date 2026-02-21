import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://srltjqgnvshunzxjqifn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNybHRqcWdudnNodW56eGpxaWZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2ODAzNzIsImV4cCI6MjA4NzI1NjM3Mn0.op3NYpCXpLiSIJPIoM0w0D484wyuqmXc72YEd_47g2E';// anon key


export const supabase = createClient(supabaseUrl, supabaseKey);
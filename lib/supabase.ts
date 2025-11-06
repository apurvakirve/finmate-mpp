import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mboowamamlhrlarhgqyv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ib293YW1hbWxocmxhcmhncXl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNzI0OTcsImV4cCI6MjA3Nzg0ODQ5N30.S06LWLE8M6EFz30cB0M_kmTfaysPIX7TDD6gWtYu0kE';


export const supabase = createClient(supabaseUrl, supabaseKey);
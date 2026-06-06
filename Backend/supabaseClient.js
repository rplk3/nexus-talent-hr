import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://txsotycqqrxbrqoxpowo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4c290eWNxcXJ4YnJxb3hwb3dvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY2ODg0OCwiZXhwIjoyMDk2MjQ0ODQ4fQ.P4ZUTjnLu4xjVXjftlzmkzMHkYsU9zli-HgJMO2fkf0'; // from Project Settings > API > Service Role Key

export const supabase = createClient(supabaseUrl, supabaseKey);

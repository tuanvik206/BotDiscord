import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('❌ Missing Supabase credentials! Check .env file.');
}

// Create Supabase client with optimized settings
export const supabase = createClient(supabaseUrl, supabaseKey, {
    db: {
        schema: 'public'
    },
    auth: {
        persistSession: false // Bot doesn't need session persistence
    },
    global: {
        headers: { 'x-application-name': 'discord-bot' }
    }
});

// Test connection
export async function testConnection() {
    try {
        const { data, error } = await supabase
            .from('projects')
            .select('count')
            .limit(1);
        
        if (error && error.code !== 'PGRST116') {
            console.error('❌ Supabase connection error:', error.message);
            return false;
        }
        
        console.log('✅ Supabase connected');
        return true;
    } catch (error) {
        console.error('❌ Supabase connection failed');
        return false;
    }
}

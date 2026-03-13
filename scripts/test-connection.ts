
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import dns from 'dns';
import { promisify } from 'util';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log('URL:', supabaseUrl);

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

// Extract hostname
try {
    const url = new URL(supabaseUrl);
    const hostname = url.hostname;
    console.log('Resolving DNS for:', hostname);

    const resolve = promisify(dns.resolve);
    try {
        const addresses = await resolve(hostname);
        console.log('DNS Resolved:', addresses);
    } catch (dnsErr) {
        console.error('DNS Resolution Failed:', dnsErr);
    }
} catch (e) {
    console.error('Invalid URL format:', e);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    try {
        console.log('Testing Auth connection...');
        const { data, error } = await supabase.auth.signInWithPassword({
            email: 'test@example.com',
            password: 'wrongpassword',
        });

        if (error) {
            console.log('Auth Error Message:', error.message);
            console.log('Auth Error Details:', JSON.stringify(error, null, 2));

            if (error.message.includes('Invalid login credentials')) {
                console.log('SUCCESS: Auth service is reachable.');
            } else if (error.message.includes('fetch failed')) {
                console.log('FAILURE: Network error (fetch failed). Check URL or internet connection.');
            } else {
                console.log('WARNING: Unexpected error type.');
            }
        } else {
            console.log('Unexpected success with fake credentials?');
        }
    } catch (err) {
        console.error('Connection failed (Exception):', err);
    }
}

testConnection();

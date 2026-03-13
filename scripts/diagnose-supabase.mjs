
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('--- Supabase Connection Diagnostic (v2) ---');

const envPath = path.join(rootDir, '.env');
console.log('Loading .env from:', envPath);

// Debug: Print raw file content (first 100 chars)
try {
    const raw = fs.readFileSync(envPath);
    console.log('File exists. Size:', raw.length);
    console.log('First 100 chars:', raw.slice(0, 100).toString());
} catch (e) {
    console.error('Error reading file raw:', e.message);
}

// Load with dotenv
const result = dotenv.config({ path: envPath });
if (result.error) {
    console.error('Dotenv failed to load:', result.error);
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in process.env');
    console.log('Loaded keys:', Object.keys(process.env).filter(k => k.startsWith('VITE_')));
    process.exit(1);
}

console.log(`Supabase URL: ${supabaseUrl}`);
console.log(`Supabase Key: ${supabaseKey.substring(0, 10)}...`);

// Test Connection via fetch
async function testConnection() {
    try {
        console.log('\nTest 1: Checking URL reachability...');
        try {
            const res = await fetch(supabaseUrl, { method: 'HEAD' });
            console.log(`URL Reachability: Status ${res.status} ${res.statusText}`);
        } catch (e) {
            console.error('URL Reachability Failed:', e.message);
            if (e.cause) console.error('Cause:', e.cause);
        }

        console.log('\nTest 2: Testing Auth API (SignIn)...');
        const authUrl = `${supabaseUrl}/auth/v1/token?grant_type=password`;
        const body = JSON.stringify({
            email: 'diagnostic_fake_user@example.com',
            password: 'wrong_password_123'
        });

        const authRes = await fetch(authUrl, {
            method: 'POST',
            headers: {
                'apikey': supabaseKey,
                'Content-Type': 'application/json'
            },
            body: body
        });

        console.log(`Auth Response Status: ${authRes.status}`);
        const authData = await authRes.json();
        console.log('Auth Response Body:', JSON.stringify(authData, null, 2));

        if (authRes.status === 400 && (authData.error_description === 'Invalid login credentials' || authData.msg === 'Invalid login credentials')) {
            console.log('\nRESULT: SUCCESS ✅');
            console.log('Supabase Auth is working.');
        } else {
            console.log('\nRESULT: UNEXPECTED RESPONSE ⚠️');
        }

    } catch (error) {
        console.error('\nFATAL ERROR during test:', error);
    }
}

testConnection();

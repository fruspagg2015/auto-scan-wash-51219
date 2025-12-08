
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedData() {
    console.log('Seeding service_orders...');

    // First, ensure we have some vehicles
    // We'll try to get existing vehicles or insert dummy ones if possible (usually restricted)
    // For this script to work with anon key, RLS must allow it.

    // 1. Get a vehicle ID
    const { data: vehicles, error: vError } = await supabase
        .from('veiculos')
        .select('idplaca')
        .limit(3);

    if (vError) {
        console.error('Error fetching vehicles:', vError);
        return;
    }

    if (!vehicles || vehicles.length === 0) {
        console.error('No vehicles found to link service orders to. Please create vehicles first.');
        return;
    }

    const sampleServices = [
        { service_type: 'Lavagem Completa', status: 'in_progress', estimated_time: '25 min' },
        { service_type: 'Lavagem + Cera', status: 'pending', estimated_time: '40 min' },
        { service_type: 'Detalhamento', status: 'completed', estimated_time: '-' }
    ];

    for (let i = 0; i < Math.min(vehicles.length, 3); i++) {
        const vehicle = vehicles[i];
        const service = sampleServices[i];

        const { error: insertError } = await supabase
            .from('service_orders')
            .insert({
                vehicle_id: vehicle.idplaca,
                service_type: service.service_type,
                status: service.status,
                estimated_time: service.estimated_time,
                arrival_time: new Date().toISOString()
            });

        if (insertError) {
            console.error(`Error inserting order for vehicle ${vehicle.idplaca}:`, insertError);
        } else {
            console.log(`Inserted order for vehicle ${vehicle.idplaca}`);
        }
    }
}

seedData();

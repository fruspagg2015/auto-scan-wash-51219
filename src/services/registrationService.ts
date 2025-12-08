
import { supabase } from "@/integrations/supabase/client";

interface ClientData {
    nome: string;
    telefone: string;
    email?: string;
    company_id: string; // Assuming we need this from context
}

interface VehicleData {
    placa: string;
    modelo: string;
    marca?: string;
    cor?: string;
    ano?: string;
    idplaca?: number; // Might already exist
}

interface ServiceData {
    vehicle_id: number;
    service_type: string;
    status: 'pending' | 'in_progress' | 'completed';
    estimated_time?: string;
}

/**
 * Ensures a client exists in the database.
 * Checks by phone (and email if provided).
 * @returns The client ID.
 */
export async function ensureClient(clientData: ClientData): Promise<string> {
    // 1. Check if client exists
    const { data: existingClients, error: searchError } = await supabase
        .from('clients')
        .select('id')
        .eq('company_id', clientData.company_id)
        .or(`telefone.eq.${clientData.telefone}${clientData.email ? `,email.eq.${clientData.email}` : ''}`)
        .limit(1);

    if (searchError) {
        throw new Error(`Error searching for client: ${searchError.message}`);
    }

    if (existingClients && existingClients.length > 0) {
        return existingClients[0].id;
    }

    // 2. Insert new client
    const { data: newClient, error: insertError } = await supabase
        .from('clients')
        .insert({
            nome: clientData.nome,
            telefone: clientData.telefone,
            email: clientData.email || null,
            company_id: clientData.company_id,
            status: 'Ativo',
            tipo: 'Pessoa Física' // Default
        })
        .select('id')
        .single();

    if (insertError) {
        throw new Error(`Error creating client: ${insertError.message}`);
    }

    return newClient.id;
}

/**
 * Ensures a vehicle exists in the database.
 * Checks by plate.
 * @returns The vehicle ID (idplaca).
 */
export async function ensureVehicle(vehicleData: VehicleData): Promise<number> {
    // 1. Check if vehicle exists
    const { data: existingVehicle, error: searchError } = await supabase
        .from('veiculos')
        .select('idplaca')
        .eq('placa', vehicleData.placa)
        .maybeSingle();

    if (searchError) {
        throw new Error(`Error searching for vehicle: ${searchError.message}`);
    }

    if (existingVehicle) {
        return existingVehicle.idplaca;
    }

    // 2. Insert new vehicle
    const { data: newVehicle, error: insertError } = await supabase
        .from('veiculos')
        .insert({
            placa: vehicleData.placa,
            modelo: vehicleData.modelo,
            marca: vehicleData.marca || null,
            cor: vehicleData.cor || null,
            ano: vehicleData.ano || null,
            datainclusao: new Date().toISOString()
        })
        .select('idplaca')
        .single();

    if (insertError) {
        throw new Error(`Error creating vehicle: ${insertError.message}`);
    }

    return newVehicle.idplaca;
}

/**
 * Links a client to a vehicle if not already linked.
 */
export async function linkClientVehicle(clientId: string, vehicleId: number, observations?: string): Promise<void> {
    // 1. Check for existing link
    const { data: existingLink, error: searchError } = await supabase
        .from('clientes_veiculos')
        .select('id')
        .eq('cliente_id', clientId)
        .eq('veiculo_idplaca', vehicleId)
        .maybeSingle();

    if (searchError) {
        throw new Error(`Error checking client-vehicle link: ${searchError.message}`);
    }

    if (existingLink) {
        return; // Already linked
    }

    // 2. Create link
    const { error: insertError } = await supabase
        .from('clientes_veiculos')
        .insert({
            cliente_id: clientId,
            veiculo_idplaca: vehicleId,
            observacoes: observations || null,
            data_vinculo: new Date().toISOString() // Assuming column exists, else standard created_at
        });

    if (insertError) {
        throw new Error(`Error linking client to vehicle: ${insertError.message}`);
    }
}

/**
 * Creates a service order.
 */
export async function createServiceOrder(serviceData: ServiceData): Promise<string> {
    const { data: newOrder, error } = await supabase
        .from('service_orders')
        .insert({
            vehicle_id: serviceData.vehicle_id,
            service_type: serviceData.service_type,
            status: serviceData.status,
            estimated_time: serviceData.estimated_time
        })
        .select('id')
        .single();

    if (error) {
        throw new Error(`Error creating service order: ${error.message}`);
    }
    return newOrder.id;
}

/**
 * Orchestrates the full registration and service creation process.
 */
export async function registerFullService(
    clientData: ClientData,
    vehicleData: VehicleData,
    services: string[], // List of service names
    totalTime: string,
    observations?: string
): Promise<{ orderId: string, clientId: string, vehicleId: number }> {

    // 1. Ensure Client
    const clientId = await ensureClient(clientData);

    // 2. Ensure Vehicle
    const vehicleId = await ensureVehicle(vehicleData);

    // 3. Link them
    await linkClientVehicle(clientId, vehicleId, observations);

    // 4. Create Service Order
    // For now, joining service names into a string or creating multiple rows?
    // Dashboard expects a single 'service_type' string for now.
    const serviceTypeString = services.join(', ');

    const orderId = await createServiceOrder({
        vehicle_id: vehicleId,
        service_type: serviceTypeString,
        status: 'in_progress', // Default to active
        estimated_time: totalTime
    });

    return { orderId, clientId, vehicleId };
}

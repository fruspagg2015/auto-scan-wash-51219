// Mock data for vehicle and client information

export interface VehicleData {
  placa: string;
  modelo: string;
  marca: string;
  ano: string;
  cor: string;
  imagem: string;
  hora_chegada: string;
  status: 'em_andamento' | 'finalizado' | 'entregue';
  cliente: {
    nome: string;
    telefone: string;
    email?: string;
    cadastrado: boolean;
  };
  fonte: 'cadastro_local' | 'api_externa' | 'manual';
  valorTotal?: number;
}

// Banco de dados local simulado - veículos já cadastrados
export const localDatabase: VehicleData[] = [
  {
    placa: "ABC-1234",
    modelo: "Civic",
    marca: "Honda",
    ano: "2022",
    cor: "Prata",
    imagem: "",
    hora_chegada: "",
    status: 'em_andamento',
    cliente: {
      nome: "João Silva",
      telefone: "(11) 99999-1234",
      email: "joao.silva@email.com",
      cadastrado: true
    },
    fonte: 'cadastro_local',
    valorTotal: 25.00
  },
  {
    placa: "XYZ-5678",
    modelo: "Corolla",
    marca: "Toyota",
    ano: "2021",
    cor: "Branco",
    imagem: "",
    hora_chegada: "",
    status: 'em_andamento',
    cliente: {
      nome: "Maria Santos",
      telefone: "(11) 98888-5678",
      email: "maria.santos@email.com",
      cadastrado: true
    },
    fonte: 'cadastro_local',
    valorTotal: 35.00
  },
  {
    placa: "DEF-9999",
    modelo: "Gol",
    marca: "Volkswagen",
    ano: "2020",
    cor: "Azul",
    imagem: "",
    hora_chegada: "",
    status: 'finalizado',
    cliente: {
      nome: "Pedro Oliveira",
      telefone: "(11) 97777-9999",
      cadastrado: true
    },
    fonte: 'cadastro_local',
    valorTotal: 15.00
  }
];

// Função para atualizar status do veículo
export const atualizarStatusVeiculo = (placa: string, novoStatus: VehicleData['status']): boolean => {
  const index = localDatabase.findIndex(v => v.placa === placa);
  if (index !== -1) {
    localDatabase[index].status = novoStatus;
    return true;
  }
  return false;
};

// API externa simulada - apenas dados do veículo
export const externalAPIData: Record<string, Omit<VehicleData, 'cliente' | 'imagem' | 'hora_chegada'>> = {
  "GHI-4567": {
    placa: "GHI-4567",
    modelo: "Onix",
    marca: "Chevrolet",
    ano: "2023",
    cor: "Preto",
    status: 'em_andamento',
    fonte: 'api_externa'
  },
  "JKL-1111": {
    placa: "JKL-1111",
    modelo: "HB20",
    marca: "Hyundai",
    ano: "2022",
    cor: "Vermelho",
    status: 'em_andamento',
    fonte: 'api_externa'
  },
  "MNO-2222": {
    placa: "MNO-2222",
    modelo: "Kwid",
    marca: "Renault",
    ano: "2021",
    cor: "Prata",
    status: 'em_andamento',
    fonte: 'api_externa'
  }
};

// Simulação de consulta no banco local
export const consultarCadastroLocal = async (placa: string): Promise<VehicleData | null> => {
  // Simular delay de consulta
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const vehicle = localDatabase.find(v => v.placa === placa);
  if (vehicle) {
    return {
      ...vehicle,
      hora_chegada: new Date().toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  }
  return null;
};

// Simulação de consulta na API externa
export const consultarAPIExterna = async (placa: string): Promise<Omit<VehicleData, 'cliente' | 'imagem' | 'hora_chegada'> | null> => {
  // Simular delay de API
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return externalAPIData[placa] || null;
};

// Simulação de OCR da placa
export const simularOCR = async (imagemBase64: string): Promise<string> => {
  // Simular processamento OCR
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Placas mockadas para teste - rotaciona entre elas
  const placasMock = ["ABC-1234", "GHI-4567", "PQR-3333", "XYZ-5678", "JKL-1111"];
  const randomIndex = Math.floor(Math.random() * placasMock.length);
  
  return placasMock[randomIndex];
};
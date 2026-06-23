export interface ClientVehicle {
  idveiculo: number;
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
}

export interface BackendClient {
  id: number;
  nome: string;
  telefone: string;
  telefoneformatado?: string;
  datainclusaoformatada?: string;
  email?: string;
  endereco?: string;
  cidade?: string;
  observacoes?: string;
  status?: boolean;
  documento?: string;
  logradouro?: string;
  numero?: string;
  idcidade?: number;
  idbairro?: number;
  veiculos?: ClientVehicle[];
}


export interface ClientListResponse {
  retorno: number;
  msgerro: string;
  payload: {
    lista: BackendClient[];
    paginacao: {
      paginaatual: number;
      totalregistro: number;
    };
  } | "";
}

export interface ClientSavePayload {
  nome: string;
  email?: string;
  documento?: string;
  logradouro?: string;
  numero?: string;
  idcidade?: number;
  idbairro?: number;
  telefone: string;
  status: boolean;
  idcliente?: number; // Only for update
  idveiculo?: number;
  "idveiculo:"?: number; // Caso a API realmente espere com os dois pontos devido ao typo
}

export interface ClientSaveResponse {
  retorno: number;
  msgerro: string;
  payload: any;
}

const getAuthData = () => {
  const token = localStorage.getItem('auth_token') || '';
  const idsessao = Number(localStorage.getItem('auth_idsessao') || '0');
  return { token, idsessao };
};

const checkAuthError = (msgerro: string) => {
  if (msgerro === "Token expirado" || msgerro === "Not authenticated") {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_idsessao');
    localStorage.removeItem('auth_user');
    window.location.href = '/login';
    return true;
  }
  return false;
};

async function handleResponse<T>(response: Response, defaultError: string): Promise<T> {
  let data: any;
  try {
    data = await response.json();
  } catch (e) {
    if (!response.ok) {
      throw new Error(`Falha na comunicação com o servidor: ${defaultError}`);
    }
    throw new Error('Resposta do servidor inválida.');
  }

  if (data && typeof data === 'object' && 'retorno' in data) {
    if (data.retorno !== 0) {
      checkAuthError(data.msgerro);
      throw new Error(data.msgerro || defaultError);
    }
  } else if (!response.ok) {
    throw new Error(`Falha na comunicação com o servidor: ${defaultError}`);
  }

  return data as T;
}

/**
 * Lista os clientes utilizando o novo endpoint da API.
 * @param nomeFilter Filtro opcional por nome
 */
export async function listClientsApi(nomeFilter: string = ""): Promise<BackendClient[]> {
  const { token, idsessao } = getAuthData();
  const BASE_URL = import.meta.env.DEV ? '' : 'https://nexus.frconnect.com.br';
  const url = `${BASE_URL}/carwash/v1/services/cliente_listar`;

  const payload = {
    idsessao,
    module: "lavajatonatal",
    request: {
      parameters: {
        filter: {
          nome: nomeFilter
        },
        paginacao: {
          enabled: true,
          atual: 1,
          total: 100
        }
      }
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await handleResponse<ClientListResponse>(response, 'Erro ao listar clientes.');

  if (!data.payload || typeof data.payload === 'string') {
    return [];
  }

  return data.payload.lista || [];
}

/**
 * Salva ou atualiza um cliente no novo endpoint da API.
 */
export async function saveClientApi(clientData: ClientSavePayload): Promise<void> {
  const { token, idsessao } = getAuthData();
  const BASE_URL = import.meta.env.DEV ? '' : 'https://nexus.frconnect.com.br';
  const url = `${BASE_URL}/carwash/v1/services/cliente_salvar`;

  const payload = {
    idsessao,
    module: "lavajatonatal",
    request: {
      parameters: clientData
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await handleResponse<ClientSaveResponse>(response, 'Erro ao salvar cliente.');

  return data.payload;
}

/**
 * Exclui um cliente utilizando o novo endpoint da API.
 */
export async function deleteClientApi(clientId: number): Promise<void> {
  const { token, idsessao } = getAuthData();
  const BASE_URL = import.meta.env.DEV ? '' : 'https://nexus.frconnect.com.br';
  const url = `${BASE_URL}/carwash/v1/services/cliente_excluir`;

  const payload = {
    idsessao,
    module: "lavajatonatal",
    request: {
      parameters: {
        idcliente: clientId
      }
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  await handleResponse<ClientSaveResponse>(response, 'Erro ao excluir cliente.');
}

/**
 * Exclui ou desvincula um veículo utilizando o endpoint veiculo_excluir.
 */
export async function deleteVehicleApi(idveiculo: number): Promise<void> {
  const { token, idsessao } = getAuthData();
  const BASE_URL = import.meta.env.DEV ? '' : 'https://nexus.frconnect.com.br';
  const url = `${BASE_URL}/carwash/v1/services/veiculo_excluir`;

  const payload = {
    idsessao,
    module: "lavajatonatal",
    request: {
      parameters: {
        idveiculo
      }
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  await handleResponse<any>(response, 'Erro ao desvincular veículo.');
}


export interface ConsultarPlacaResponse {
  retorno: number;
  msgerro: string;
  payload: {
    idveiculo: number;
    placa: string;
    marca: string;
    modelo?: string;
    anofabricacao: number;
    anomodelo: number;
    uf: string;
    cliente?: {
      idcliente: number;
      nome: string;
      telefone: string;
    };
    status: string;
  };
}

/**
 * Consulta a placa utilizando o novo endpoint da API.
 */
export async function consultarPlacaApi(placa: string): Promise<ConsultarPlacaResponse> {
  const { token, idsessao } = getAuthData();
  const BASE_URL = import.meta.env.DEV ? '' : 'https://nexus.frconnect.com.br';
  const url = `${BASE_URL}/carwash/v1/services/placa_consultar`;

  const payload = {
    idsessao,
    module: "lavajatonatal",
    request: {
      parameters: {
        placa
      }
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  return await handleResponse<ConsultarPlacaResponse>(response, 'Erro ao consultar placa.');
}

export interface BackendServiceItem {
  idservicoitem: number;
  descricao: string;
  incluso: boolean;
  ordem: number;
}

export interface BackendService {
  idservico: number;
  nome: string;
  descricao: string;
  categoria: string;
  valor: number;
  tempoestimado: number;
  ativo: boolean;
  itens: BackendServiceItem[];
}

export interface ServiceListResponse {
  retorno: number;
  msgerro: string;
  payload: {
    paginacao: any;
    dados: BackendService[];
  };
}

/**
 * Lista os serviços utilizando o novo endpoint da API.
 */
export async function listServicesApi(): Promise<BackendService[]> {
  const { token, idsessao } = getAuthData();
  const BASE_URL = import.meta.env.DEV ? '' : 'https://nexus.frconnect.com.br';
  const url = `${BASE_URL}/carwash/v1/services/servico_listar`;

  const payload = {
    idsessao,
    module: "lavajatonatal",
    request: {
      parameters: {}
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await handleResponse<ServiceListResponse>(response, 'Erro ao listar serviços.');

  return data.payload?.dados || [];
}

export interface AddServiceItem {
  idservico: number;
  quantidade: number;
  valor_unitario: number;
  observacao?: string;
}

export interface AddServicePayload {
  idcliente: number;
  idveiculo: number;
  tipo_atendimento: 'fila' | 'agendado';
  data_agendamento: string | null;
  observacao_geral?: string;
  servicos: AddServiceItem[];
}

/**
 * Vincula múltiplos serviços ao cliente e veículo utilizando o novo endpoint da API.
 */
export async function addServiceToClientApi(payloadData: AddServicePayload): Promise<void> {
  const { token, idsessao } = getAuthData();
  const BASE_URL = import.meta.env.DEV ? '' : 'https://nexus.frconnect.com.br';
  const url = `${BASE_URL}/carwash/v1/services/cliente_servico`;

  const payload = {
    idsessao,
    module: "lavajatonatal",
    request: {
      parameters: payloadData
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  await handleResponse<any>(response, 'Erro ao registrar serviço.');
}

export interface APIVehicleInService {
  idlavagem: number;
  status: string;
  entrada: string;
  minutos: number;
  cliente: {
    idcliente: number;
    nome: string;
    telefone: string;
  };
  veiculo: {
    idveiculo: number;
    placa: string;
    modelo: string;
    marca: string;
    cor?: string;
  };
  servicos: {
    idservico: number;
    nome: string;
    quantidade: number;
    valor: number;
  }[];
  total: number;
}

/**
 * Lista os veículos que estão atualmente em atendimento utilizando o endpoint cliente_ematendimento.
 */
export async function listVehiclesInServiceApi(): Promise<APIVehicleInService[]> {
  const { token, idsessao } = getAuthData();
  const BASE_URL = import.meta.env.DEV ? '' : 'https://nexus.frconnect.com.br';
  const url = `${BASE_URL}/carwash/v1/services/cliente_ematendimento`;

  const payload = {
    idsessao,
    module: "lavajatonatal",
    request: {
      parameters: {}
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await handleResponse<any>(response, 'Erro ao listar veículos em atendimento.');

  return data.payload?.lista || [];
}

/**
 * Conclui um veículo em atendimento utilizando o endpoint veiculo_concluir.
 */
export async function concluirVeiculoApi(idlavagem: number): Promise<void> {
  const { token, idsessao } = getAuthData();
  const BASE_URL = import.meta.env.DEV ? '' : 'https://nexus.frconnect.com.br';
  const url = `${BASE_URL}/carwash/v1/services/veiculo_concluir`;

  const payload = {
    idsessao,
    module: "lavajatonatal",
    request: {
      parameters: {
        idlavagem
      }
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  await handleResponse<any>(response, 'Erro ao concluir o veículo.');
}

/**
 * Lista os veículos prontos para entrega utilizando o endpoint veiculo_entregar_listar.
 */
export async function listVehiclesToDeliverApi(): Promise<APIVehicleInService[]> {
  const { token, idsessao } = getAuthData();
  const BASE_URL = import.meta.env.DEV ? '' : 'https://nexus.frconnect.com.br';
  const url = `${BASE_URL}/carwash/v1/services/veiculo_entregar_listar`;

  const payload = {
    idsessao,
    module: "lavajatonatal",
    request: {
      parameters: {}
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await handleResponse<any>(response, 'Erro ao listar veículos para entrega.');

  return data.payload?.lista || [];
}

/**
 * Confirma a entrega do veículo utilizando o endpoint veiculo_entregar.
 */
export async function entregarVeiculoApi(idlavagem: number): Promise<void> {
  const { token, idsessao } = getAuthData();
  const BASE_URL = import.meta.env.DEV ? '' : 'https://nexus.frconnect.com.br';
  const url = `${BASE_URL}/carwash/v1/services/veiculo_entregar`;

  const payload = {
    idsessao,
    module: "lavajatonatal",
    request: {
      parameters: {
        idlavagem
      }
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  await handleResponse<any>(response, 'Erro ao confirmar entrega do veículo.');
}




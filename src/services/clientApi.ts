export interface ClientVehicle {
  idveiculo: number;
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
}

export interface BackendClient {
  id: number;
  idcliente?: number;
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
  uf?: string;
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
 * Busca clientes utilizando o endpoint cliente_listar filtrando por telefone.
 */
export async function searchClientByPhoneApi(phoneFilter: string): Promise<BackendClient[]> {
  const { token, idsessao } = getAuthData();
  const BASE_URL = import.meta.env.DEV ? '' : 'https://nexus.frconnect.com.br';
  const url = `${BASE_URL}/carwash/v1/services/cliente_listar`;

  const payload = {
    idsessao,
    module: "lavajatonatal",
    request: {
      parameters: {
        filter: {
          telefone: phoneFilter
        },
        paginacao: {
          enabled: false,
          atual: 1,
          total: 10
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

  const data = await handleResponse<ClientListResponse>(response, 'Erro ao buscar cliente por telefone.');

  if (!data.payload || typeof data.payload === 'string') {
    return [];
  }

  return data.payload.lista || [];
}

/**
 * Salva ou atualiza um cliente no novo endpoint da API.
 */
export async function saveClientApi(clientData: ClientSavePayload): Promise<any> {
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
 * Interfaces para o payload de entrega agrupado por cliente.
 */
export interface DeliveryVehicleService {
  idservico?: number;
  nome: string;
  quantidade?: number;
  valor: number;
}

export interface DeliveryVehicle {
  idveiculo: number;
  idlavagem?: number; // Identificador da lavagem associada a este veículo
  placa: string;
  modelo: string;
  marca: string;
  cor?: string;
  servicos: DeliveryVehicleService[];
  valor: number;
}

export interface DeliveryClient {
  idcliente: number;
  cliente: {
    nome: string;
    telefone: string;
  };
  veiculos: DeliveryVehicle[];
  totalapagar: number;
}

/**
 * Lista os veículos prontos para entrega utilizando o endpoint veiculo_entregar_listar.
 * O payload retorna agrupado por cliente.
 */
export async function listVehiclesToDeliverApi(): Promise<DeliveryClient[]> {
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
 * Aceita um ID de lavagem individual ou um array de IDs de lavagem.
 */
export async function entregarVeiculoApi(idlavagem: number | number[]): Promise<void> {
  const { token, idsessao } = getAuthData();
  const BASE_URL = import.meta.env.DEV ? '' : 'https://nexus.frconnect.com.br';
  const url = `${BASE_URL}/carwash/v1/services/veiculo_entregar`;

  const payload = {
    idsessao,
    module: "lavajatonatal",
    request: {
      parameters: {
        idlavagem: Array.isArray(idlavagem) ? idlavagem : [idlavagem]
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

export interface APIDashboardResumo {
  carros_hoje: number;
  tempo_medio: number;
  receitas_hoje: number;
  em_atendimento: number;
}

export interface APIDashboardPerformanceSemanal {
  dia: string;
  receita: number;
  quantidade: number;
}

export interface APIDashboardDistribuicaoServico {
  servico: string;
  percentual: number;
  quantidade: number;
}

export interface APIDashboardData {
  resumo: APIDashboardResumo;
  performance_semanal: APIDashboardPerformanceSemanal[];
  cliente_ematendimento: {
    lista: APIVehicleInService[];
    paginacao: {
      paginaatual: number;
      totalpaginas: number;
      totalregistro: number;
    };
  };
  distribuicao_servicos: APIDashboardDistribuicaoServico[];
}

export interface DashboardResponse {
  retorno: number;
  msgerro: string;
  payload: APIDashboardData;
}

/**
 * Consulta os dados do dashboard utilizando o endpoint dashboardprincipal_listar.
 */
export async function getDashboardDataApi(): Promise<APIDashboardData> {
  const { token, idsessao } = getAuthData();
  const BASE_URL = import.meta.env.DEV ? '' : 'https://nexus.frconnect.com.br';
  const url = `${BASE_URL}/carwash/v1/services/dashboardprincipal_listar`;

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

  const data = await handleResponse<DashboardResponse>(response, 'Erro ao carregar dados do dashboard.');
  return data.payload;
}
export interface APIRelatoriosResumo {
  tempo_medio: number;
  ticket_medio: number;
  carros_atendidos: number;
  faturamento_total: number;
}

export interface APIRelatoriosTopCliente {
  nome: string;
  total: number;
  atendimentos: number;
}

export interface APIRelatoriosVendaMensal {
  mes: string;
  total: number;
}

export interface APIRelatoriosRankingServico {
  total: number;
  descricao: string;
}

export interface APIRelatoriosPerformanceDiaria {
  dia: string;
  receita: number;
  quantidade: number;
}

export interface APIRelatoriosAtendimentoMensal {
  mes: string;
  quantidade: number;
}

export interface APIRelatoriosServicoMaisVendido {
  descricao: string;
  quantidade: number;
}

export interface APIRelatoriosData {
  resumo: APIRelatoriosResumo;
  top_clientes: APIRelatoriosTopCliente[];
  vendas_por_mes: APIRelatoriosVendaMensal[];
  ranking_servicos: APIRelatoriosRankingServico[];
  performance_diaria: APIRelatoriosPerformanceDiaria[];
  atendimentos_mensais: APIRelatoriosAtendimentoMensal[];
  servicos_mais_vendidos: APIRelatoriosServicoMaisVendido[];
}

export interface RelatoriosResponse {
  retorno: number;
  msgerro: string;
  payload: APIRelatoriosData;
}

/**
 * Consulta os dados de faturamento e vendas utilizando o endpoint dashboardvendas_listar.
 */
export async function getRelatoriosDataApi(datainicio: string, datafim: string): Promise<APIRelatoriosData> {
  const { token, idsessao } = getAuthData();
  const BASE_URL = import.meta.env.DEV ? '' : 'https://nexus.frconnect.com.br';
  const url = `${BASE_URL}/carwash/v1/services/dashboardvendas_listar`;

  const payload = {
    idsessao,
    module: "lavajatonatal",
    request: {
      parameters: {
        datainicio,
        datafim
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

  const data = await handleResponse<RelatoriosResponse>(response, 'Erro ao carregar dados do relatório.');
  return data.payload;
}

export interface CompanyConfig {
  cnpj: string;
  email: string;
  telefone: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  cidade: string;
  uf: string;
  bairro: string;
  nomeempresa: string | null;
  descricao?: string;
  codigo?: string;
}

export interface CompanyConfigResponse {
  retorno: number;
  msgerro: string;
  payload: CompanyConfig | "";
}

/**
 * Consulta os dados de configuração do módulo/empresa.
 */
export async function getCompanyConfigApi(): Promise<CompanyConfig | null> {
  const { token, idsessao } = getAuthData();
  const BASE_URL = import.meta.env.DEV ? '' : 'https://nexus.frconnect.com.br';
  const url = `${BASE_URL}/carwash/v1/services/modulo_consultar`;

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

  const data = await handleResponse<CompanyConfigResponse>(response, 'Erro ao consultar configurações da empresa.');

  if (!data.payload || typeof data.payload === 'string') {
    return null;
  }

  return data.payload;
}

/**
 * Salva as configurações do módulo/empresa.
 */
export async function saveCompanyConfigApi(configData: Partial<CompanyConfig>): Promise<void> {
  const { token, idsessao } = getAuthData();
  const BASE_URL = import.meta.env.DEV ? '' : 'https://nexus.frconnect.com.br';
  const url = `${BASE_URL}/carwash/v1/services/modulo_salvar`;

  const payload = {
    idsessao,
    module: "lavajatonatal",
    request: {
      parameters: {
        cnpj: configData.cnpj || '',
        email: configData.email || '',
        telefone: configData.telefone || '',
        cep: configData.cep || '',
        logradouro: configData.logradouro || '',
        numero: configData.numero || '',
        complemento: configData.complemento || '',
        cidade: configData.cidade || '',
        uf: configData.uf || '',
        bairro: configData.bairro || '',
        nomeempresa: configData.nomeempresa || ''
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

  await handleResponse<{ retorno: number; msgerro: string; payload: any }>(response, 'Erro ao salvar configurações da empresa.');
}

export interface BackendUser {
  idusuario: number;
  nomeusuario: string;
  email: string;
  status: boolean;
  idperfil: number;
  nomeperfil: string;
  telefone: string;
  datacadastro: string;
  registro: string;
  ultimologin: string;
  dataexclusao: string;
}

export interface UserListResponse {
  retorno: number;
  msgerro: string;
  payload: {
    lista: BackendUser[];
    paginacao: {
      paginaatual: number;
      totalregistro: number;
    };
  } | "";
}

/**
 * Lista os usuários utilizando o endpoint carwash usuario_listar.
 */
export async function listUsersApi(): Promise<BackendUser[]> {
  const { token, idsessao } = getAuthData();
  const BASE_URL = import.meta.env.DEV ? '' : 'https://nexus.frconnect.com.br';
  const url = `${BASE_URL}/carwash/v1/services/usuario_listar`;

  const payload = {
    idsessao,
    module: "lavajatonatal",
    request: {
      parameters: {
        filter: {},
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

  const data = await handleResponse<UserListResponse>(response, 'Erro ao listar usuários.');

  if (!data.payload || typeof data.payload === 'string') {
    return [];
  }

  return data.payload.lista || [];
}

export interface UserSavePayload {
  idusuario?: number;
  nomeusuario: string;
  email: string;
  telefone?: string;
  status: boolean;
  idperfil: number;
}

export interface UserSaveResponse {
  retorno: number;
  msgerro: string;
  payload: any;
}

/**
 * Salva ou atualiza um usuário no novo endpoint da API.
 */
export async function saveUserApi(userData: UserSavePayload): Promise<void> {
  const { token, idsessao } = getAuthData();
  const BASE_URL = import.meta.env.DEV ? '' : 'https://nexus.frconnect.com.br';
  const url = `${BASE_URL}/carwash/v1/services/usuario_salvar`;

  const payload = {
    idsessao,
    module: "lavajatonatal",
    request: {
      parameters: userData
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

  await handleResponse<UserSaveResponse>(response, 'Erro ao salvar usuário.');
}

export interface ZapMessage {
  idmensagem?: number;
  codigo: string;
  titulo: string;
  texto: string;
}

export interface ZapMessageListResponse {
  retorno: number;
  msgerro: string;
  payload: ZapMessage[];
}

/**
 * Lista as mensagens de WhatsApp automáticas.
 */
export async function listZapMessagesApi(): Promise<ZapMessage[]> {
  const { token, idsessao } = getAuthData();
  const BASE_URL = import.meta.env.DEV ? '' : 'https://nexus.frconnect.com.br';
  const url = `${BASE_URL}/carwash/v1/services/mensagemzap_listar`;

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

  const data = await handleResponse<ZapMessageListResponse>(response, 'Erro ao listar mensagens automáticas.');
  return data.payload || [];
}

/**
 * Salva/atualiza uma mensagem de WhatsApp automática.
 */
export async function saveZapMessageApi(messageData: ZapMessage): Promise<void> {
  const { token, idsessao } = getAuthData();
  const BASE_URL = import.meta.env.DEV ? '' : 'https://nexus.frconnect.com.br';
  const url = `${BASE_URL}/carwash/v1/services/mensagemzap_salvar`;

  // Mapeia o idmensagem caso não tenha vindo da listagem (fallback de segurança)
  let idmensagem = messageData.idmensagem;
  if (!idmensagem) {
    switch (messageData.codigo) {
      case 'boasvindas':
        idmensagem = 1;
        break;
      case 'veiculopronto':
        idmensagem = 2;
        break;
      case 'obrigadopelapreferencia':
        idmensagem = 3;
        break;
      default:
        idmensagem = 0;
    }
  }

  const payload = {
    idsessao,
    module: "lavajatonatal",
    request: {
      parameters: {
        idmensagem,
        titulo: messageData.titulo,
        texto: messageData.texto
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

  await handleResponse<any>(response, 'Erro ao salvar mensagem automática.');
}




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

  if (!response.ok) {
    throw new Error('Falha na comunicação com o servidor ao listar clientes.');
  }

  const data: ClientListResponse = await response.json();

  if (data.retorno !== 0) {
    checkAuthError(data.msgerro);
    throw new Error(data.msgerro || 'Erro ao listar clientes.');
  }

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

  if (!response.ok) {
    throw new Error('Falha na comunicação com o servidor ao salvar cliente.');
  }

  const data: ClientSaveResponse = await response.json();

  if (data.retorno !== 0) {
    checkAuthError(data.msgerro);
    throw new Error(data.msgerro || 'Erro ao salvar cliente.');
  }
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

  if (!response.ok) {
    throw new Error('Falha na comunicação com o servidor ao excluir cliente.');
  }

  const data: ClientSaveResponse = await response.json();

  if (data.retorno !== 0) {
    checkAuthError(data.msgerro);
    throw new Error(data.msgerro || 'Erro ao excluir cliente.');
  }
}

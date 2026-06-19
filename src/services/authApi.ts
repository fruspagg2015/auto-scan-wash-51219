export interface ApiUser {
  idusuario: number;
  usuario: string;
  nome: string;
  email: string;
  perfil: string;
}

export interface ApiLoginPayload {
  token: string;
  idsessao: number;
  user: ApiUser;
}

export interface ApiLoginResponse {
  retorno: number;
  msgerro: string;
  payload: ApiLoginPayload | "";
}

/**
 * Realiza o login do usuário utilizando a nova API.
 * @param username E-mail/usuário
 * @param password Senha em texto puro (será codificada em base64)
 */
export async function signInApi(username: string, password: string): Promise<ApiLoginPayload> {
  const BASE_URL = import.meta.env.DEV ? '' : 'https://nexus.frconnect.com.br';
  const url = `${BASE_URL}/carwash/v1/signin`;
  
  // Codifica a senha em Base64
  const base64Password = btoa(password);

  const payload = {
    module: "lavajatonatal",
    request: {
      parameters: {
        username: username,
        password: base64Password
      }
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  let data: ApiLoginResponse;
  try {
    data = await response.json();
  } catch (e) {
    if (!response.ok) {
      throw new Error('Falha na comunicação com o servidor de autenticação.');
    }
    throw new Error('Retorno da autenticação inválido.');
  }

  if (data.retorno !== 0) {
    throw new Error(data.msgerro || 'Erro desconhecido na autenticação.');
  }

  if (!data.payload || typeof data.payload === 'string') {
    throw new Error('Retorno da autenticação inválido.');
  }

  return data.payload;
}

# Relatório de Diagnóstico: Conexão Supabase

## Problema Identificado
A aplicação não consegue se conectar ao Supabase devido a um erro de **DNS (ENOTFOUND)**.

Isso significa que o endereço do seu projeto Supabase não foi encontrado na internet.

## Detalhes Técnicos
- **URL Tentada:** `https://iqakufcekclrgsfmvzwi.supabase.co`
- **Erro:** `ENOTFOUND` (Domínio não encontrado)
- **Project ID:** `iqakufcekclrgsfmvzwi`

## Possíveis Causas
1. **ID do Projeto Incorreto:** O ID `iqakufcekclrgsfmvzwi` no arquivo `.env` pode estar errado.
2. **Projeto Deletado:** O projeto pode ter sido deletado no painel do Supabase.
3. **Projeto Pausado:** Projetos gratuitos do Supabase são pausados após inatividade. Geralmente eles retornam um erro diferente, mas vale verificar.

## Como Resolver
1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard/projects).
2. Verifique o **Project ID** correto do seu projeto `scan-wash`.
3. Abra o arquivo `.env` na raiz do projeto.
4. Corrija as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_PROJECT_ID` se estiverem diferentes.
   - A URL deve ser: `https://[SEU-PROJECT-ID].supabase.co`
5. Se o projeto estiver pausado, clique em "Restore Project" no dashboard.

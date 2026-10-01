# ChamaVet Admin — Painel Administrativo

Painel operacional e de gestão interna da plataforma **ChamaVet**, construído com **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Radix UI**, **TanStack Table**, **Recharts** e integrado com **Supabase**.

---

## 1. Como rodar localmente

### 1.1 Pré-requisitos
- Node.js 18+ (recomendado v20 ou v24)
- Gerenciador de pacotes `npm`

### 1.2 Instalação e execução
```bash
# Instalar dependências
npm install

# Iniciar o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

### 1.3 Modo de Demonstração / Dev Mode
Em ambiente de desenvolvimento (`NEXT_PUBLIC_APP_ENV=dev`), você pode utilizar os botões de **Acesso Rápido de Testes** na tela de login para navegar imediatamente com os perfis de:
- **Administrador:** Acesso a todos os 11 módulos da plataforma.
- **Suporte:** Visualização com restrição automática de menus sensíveis (Financeiro, Configurações, Equipe e Comunicados são ocultados).

---

## 2. Configuração de Variáveis de Ambiente (.env.local)

Copie o arquivo `.env.example` para `.env.local`:
```bash
cp .env.example .env.local
```

Preencha com as credenciais do seu projeto Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<SEU_PROJECT_ID>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<SUA_CHAVE_ANON>
SUPABASE_SERVICE_ROLE_KEY=<SUA_CHAVE_SERVICE_ROLE>
NEXT_PUBLIC_APP_ENV=dev # ou prod para ambiente de produção
```

> **Aviso de Segurança:** A chave `SUPABASE_SERVICE_ROLE_KEY` é estritamente privada, nunca deve possuir o prefixo `NEXT_PUBLIC_` e é isolada no servidor com a diretiva `server-only`.

---

## 3. O que configurar no Supabase

1. **Ativar Autenticação Multifator (MFA TOTP):**
   - Acesse o painel do Supabase -> **Authentication** -> **MFA**.
   - Habilite o tipo **TOTP** (Time-based One-Time Password).
2. **Redirect URLs:**
   - Em **Authentication** -> **URL Configuration**, adicione:
     - `http://localhost:3000/login`
     - `http://localhost:3000/login/mfa`
     - `https://admin.chamavet.com.br/login` (em produção)
3. **Atribuir papel à equipe:**
   - Os membros da equipe devem possuir o atributo `admin_role` em `app_metadata` (`admin` ou `support`).
   - Exemplo via SQL no Supabase:
     ```sql
     UPDATE auth.users
     SET raw_app_meta_data = raw_app_meta_data || '{"admin_role": "admin"}'::jsonb
     WHERE email = 'seu-email@chamavet.com.br';
     ```

---

## 4. Como ativar o MFA e entrar pela primeira vez

1. Acesse `/login` e insira o e-mail corporativo e senha cadastrados pelo administrador.
2. O sistema detectará o primeiro acesso e redirecionará para `/login/mfa?setup=true`.
3. Abra seu aplicativo autenticador preferido (*Google Authenticator*, *1Password*, *Authy*).
4. Escaneie o QR Code gerado na tela (ou copie a chave secreta manual).
5. Digite o código de 6 dígitos gerado e confirme.
6. A sessão será promovida para o nível **AAL2** e o painel será liberado.

---

## 5. Rotina de Operação (Quem cuida de quê no dia a dia)

| Frequência | Tarefa | Quem | Onde |
|---|---|---|---|
| **Diário (manhã)** | Zerar a fila de **verificações** (meta: até 48h) | Suporte | *Verificações* |
| **Diário** | Tratar **denúncias** (meta: 24h; alta prioridade: 4h) | Suporte | *Denúncias* |
| **Diário** | Olhar as **urgentes sem interessados** e acionar profissionais | Suporte | *Dashboard → Solicitações* |
| **Diário** | Checar **webhooks com erro** e pagamentos com falha | Admin | *Financeiro → Webhooks* |
| **Semanal** | Revisar os **KPIs** (cadastros, preenchimento, tempo até 1º interesse) | Admin | *Dashboard* |
| **Semanal** | Revisar as **avaliações 1 estrela** e comentários destacados | Suporte | *Avaliações* |
| **Mensal** | Exportar os **pagamentos** para o contador | Admin | *Financeiro* |
| **Mensal** | Revisar a **auditoria** e os acessos da equipe (MFA de todos ativo) | Admin | *Auditoria / Equipe* |
| **Sob demanda** | Pedidos de **LGPD** (exportar/excluir dados em até 15 dias) | Admin | *Usuários* |

---

## 6. Módulos Implementados

1. **Dashboard (Início):**
   - Cards de atenção imediata com contadores dinâmicos.
   - Indicadores de cadastros, solicitações, taxa de preenchimento e MRR.
   - Gráficos interativos com Recharts.
2. **Verificações (CRMV e CNPJ):**
   - Abas separadas para Profissionais e Clínicas.
   - Checklist de validação manual do CRMV com link para o portal CFMV.
   - Consulta integrada à BrasilAPI para validação cadastral de CNPJ da clínica.
   - Atalhos de teclado: `A` (Aprovar), `R` (Recusar), `→` (Próximo).
3. **Usuários:**
   - Busca em tempo real com debounce por nome, documento, e-mail e telefone.
   - Detalhe estruturado em 8 abas temáticas.
   - Proteção de dados com mascaramento de telefone e auditoria na visualização.
   - Modais com confirmação forte para suspensão, banimento e exclusão LGPD.
4. **Solicitações:**
   - Acompanhamento do mercado e filtro de urgentes sem resposta há mais de 2 horas.
   - Linha do tempo visual de eventos desde o rascunho até a conclusão.
   - Moderação com ação de ocultação imediata.
5. **Denúncias:**
   - Separação por status e monitoramento de SLA (4h alta prioridade e 24h geral).
   - Painel com prévia do alvo e histórico de reincidência.
6. **Avaliações:**
   - Destaque automático de palavras ofensivas e notas 1 estrela.
   - Ocultação que recalcula a média no banco.
7. **Financeiro (Apenas Admin):**
   - Resumo de receitas e MRR com cálculos em centavos (sem arredondamentos de float).
   - Extrato de pagamentos com botão de estorno no gateway.
   - Diagnóstico de falhas de webhooks com botão de reprocessamento.
8. **Comunicados (Apenas Admin):**
   - Disparo segmentado por papel e localidade.
   - Prévia visual da notificação no celular e limite de 1 disparo diário por público.
9. **Configurações (Apenas Admin):**
   - Chaves de `app_config` com switch de `billing_enabled` com confirmação forte.
   - Tabela de preços (`pricing`) e cadastro de especialidades ativas/desativadas.
10. **Auditoria:**
    - Trilha imutável com visualizador de diff (*before* vs *after*).
11. **Equipe (Apenas Admin):**
    - Controle de operadores, convites e garantia de preservação do último admin.

---

## 7. Como fazer o deploy

Recomendado na **Vercel** ou qualquer infraestrutura com suporte a Next.js (Node.js runtime):

1. Conecte o repositório Git ao painel da Vercel.
2. Configure as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_ENV=prod`
3. Execute o build (`npm run build`).
4. Configure seu domínio interno (ex: `admin.chamavet.com.br`).

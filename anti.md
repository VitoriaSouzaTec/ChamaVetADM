# Fase 10 — Painel Admin do ChamaVet (projeto Next.js separado)

> Especificação para construir **do zero** o painel administrativo do ChamaVet, como um **projeto Next.js totalmente separado** do app mobile (que é em Expo).
> Leia **tudo** antes de começar. O documento é autossuficiente: explica o produto, o que o painel faz, quem cuida de cada parte, o contrato com o banco e como construir com segurança.

---

## 0. Como trabalhar com este documento

1. **Este é um projeto novo e independente** (repositório próprio, ex: `chamavet-admin`). Ele **não** tem o código do app mobile.
2. O painel usa **o mesmo projeto Supabase** do app (mesmo banco, mesmo Auth). O banco é do repositório do app: **não crie migrations, tabelas nem funções aqui.** Tudo o que o painel precisa no banco (seção 4) já foi criado lá antes.
3. Antes de codar, **gere os tipos do banco** a partir do projeto Supabase (seção 3) e confira se as funções `admin_*` da seção 4 existem. **Se alguma faltar ou tiver outro nome/assinatura, pare e me avise**, sem criar nada no banco.
4. **Antes de codar, mostre um plano** (estrutura, dependências, telas, ordem) e espere minha confirmação.
5. **Pare nos pontos marcados com 🛑** para eu testar.
6. **Não invente regra de negócio.** Se algo não estiver definido aqui, pergunte ou escolha a opção mais segura e liste no final.
7. Textos da interface em **português do Brasil**. Código em inglês.

---

## 1. O que é o ChamaVet

App que conecta **clínicas veterinárias** a **veterinários** e **auxiliares veterinários** próximos, para atendimentos pontuais (ex: "preciso de um ultrassonografista hoje às 15h"), diárias, plantões e vagas fixas.

**Fluxo principal:**
1. A clínica publica uma **solicitação** (tipo, especialidade, data/horário, valor ou "a combinar", urgente ou não)
2. Os profissionais compatíveis (especialidade + tipo de trabalho + dentro do raio em km) recebem uma notificação
3. O profissional envia **interesse** (com mensagem opcional). A clínica também pode **convidar** um profissional.
4. A clínica **aceita** um interessado; os outros são recusados automaticamente
5. O telefone/WhatsApp e o endereço completo são liberados **só após o aceite**
6. Depois do trabalho, os dois se **avaliam** (1 a 5 estrelas)

**Papéis no app mobile:** `VET`, `AUXILIAR`, `CLINIC`.

**Modelo de cobrança:**
- Clínica: **R$ 6,90 por solicitação publicada** (Pix ou cartão, via gateway Asaas). Pode ter **créditos** (1 crédito = 1 publicação).
- Vet e auxiliar: **assinatura de R$ 9,90/mês**, com **teste grátis de 30 dias** e carência de 3 dias no atraso
- Flag `billing_enabled` em `app_config`: com `false` (modo piloto), tudo fica grátis

**Stack atual:** Expo (React Native) + Supabase (Postgres, PostGIS, Auth, Storage, Edge Functions, pg_cron, pg_net), com migrations em SQL puro e `supabase-js`.

**Identidade visual:**

| Token | Hex | Uso |
|---|---|---|
| primary | `#0F766E` | Marca, menu ativo, botões principais |
| primary-light | `#CCFBF1` | Fundos de destaque, chips |
| text | `#1E293B` | Textos |
| muted | `#64748B` | Textos secundários |
| accent | `#F97316` | Alertas, urgente, pendências |
| success | `#16A34A` | Aprovado, pago, resolvido |
| danger | `#DC2626` | Suspender, banir, excluir |
| background | `#F8FAFC` | Fundo |
| surface | `#FFFFFF` | Cards e tabelas |
| border | `#E2E8F0` | Bordas |

Fontes: **Plus Jakarta Sans** (títulos) e **Inter** (textos). Estilo simples e limpo, com cantos arredondados e ícones em linha (lucide).

---

## 2. O que é o painel e quem usa

O painel é um **site interno** (só para a equipe do ChamaVet) para **operar e proteger** a plataforma sem mexer direto no banco.

### Objetivos
- **Confiança:** verificar CRMV e CNPJ, moderar conteúdo, tratar denúncias e suspender quem abusa
- **Operação:** acompanhar solicitações, usuários, pagamentos e assinaturas
- **Suporte:** achar rapidamente qualquer usuário e entender o que aconteceu com ele
- **Negócio:** métricas (cadastros, solicitações, preenchimento, receita)
- **Configuração:** preços, flags, especialidades e habilidades, sem novo deploy

### Papéis da equipe

| Papel | Quem é | O que pode |
|---|---|---|
| `admin` | Fundadores/sócios | **Tudo**, incluindo financeiro, configurações, excluir contas e gerenciar a equipe |
| `support` | Atendimento/moderação | Ver usuários e solicitações, **verificar CRMV/CNPJ**, tratar denúncias, moderar avaliações, suspender temporariamente. **Não** mexe em preço, configuração, estorno, exclusão nem equipe. |

O papel fica no **`app_metadata`** do usuário no Supabase Auth (ex: `app_metadata.admin_role = 'admin' | 'support'`), que o próprio usuário **não consegue editar**. Se o backend já usar outra chave para admin (ex: `app_metadata.role = 'admin'`), **mantenha o que existe** e adapte.

### Matriz de permissões

| Ação | support | admin |
|---|:---:|:---:|
| Ver dashboard | ✅ | ✅ |
| Ver usuários, solicitações e avaliações | ✅ | ✅ |
| Aprovar/recusar verificação (CRMV/CNPJ) | ✅ | ✅ |
| Tratar denúncias | ✅ | ✅ |
| Ocultar avaliação ou solicitação | ✅ | ✅ |
| Suspender até 7 dias | ✅ | ✅ |
| Suspender mais de 7 dias / banir / reativar banido | ❌ | ✅ |
| Editar dados do usuário (nome, CRMV, CNPJ) | ❌ | ✅ |
| Dar créditos / estender teste | ❌ | ✅ |
| Estornar pagamento / reprocessar webhook | ❌ | ✅ |
| Alterar preços e flags | ❌ | ✅ |
| Gerenciar especialidades e habilidades | ❌ | ✅ |
| Enviar comunicado em massa | ❌ | ✅ |
| Excluir conta (LGPD) e exportar dados | ❌ | ✅ |
| Ver auditoria | ✅ (só as próprias ações) | ✅ (todas) |
| Gerenciar a equipe (admins e suporte) | ❌ | ✅ |

**A permissão é checada no banco** (nas funções), e não só escondendo botão na tela.

---

## 3. Stack e estrutura

| Camada | Escolha |
|---|---|
| Framework | **Next.js (App Router) + TypeScript estrito** |
| UI | Tailwind CSS + **shadcn/ui** + lucide-react |
| Tabelas | TanStack Table (paginação, ordenação e filtros **no servidor**) |
| Gráficos | Recharts |
| Formulários | React Hook Form + Zod |
| Supabase | `@supabase/ssr` (sessão em cookies httpOnly) |
| Datas | date-fns com locale `pt-BR`, fuso `America/Fortaleza` |
| Deploy | Vercel (o plano Hobby não permite uso comercial: use o Pro ou outra hospedagem) |

Projeto novo, **repositório próprio** (ex: `chamavet-admin`), sem nenhuma dependência do app Expo.

**Tipos do banco** (fonte da verdade das tabelas e funções):
```bash
npx supabase login
npx supabase gen types typescript --project-id <ID_DO_PROJETO> > src/types/database.ts
```
Crie o script `npm run types` com esse comando e rode de novo sempre que o banco mudar.

```
chamavet-admin/
  src/
    app/
      (auth)/login/            # login + MFA
      (panel)/
        layout.tsx             # sidebar + header + checagem de admin
        page.tsx               # dashboard
        verificacoes/
        usuarios/  usuarios/[id]/
        solicitacoes/  solicitacoes/[id]/
        denuncias/  denuncias/[id]/
        avaliacoes/
        financeiro/ (pagamentos, assinaturas, creditos, webhooks)
        comunicados/
        configuracoes/ (geral, precos, especialidades, habilidades)
        auditoria/
        equipe/
      api/                     # só se precisar (ex: exportação CSV)
    components/                # ui/ (shadcn), data-table/, charts/, layout/
    lib/
      supabase/ (server.ts, client.ts, admin.ts ← service role, SÓ servidor)
      permissions.ts           # matriz de permissões (espelho da do banco)
      format.ts                # moeda, datas, telefone, CNPJ, CRMV
    server/
      actions/                 # server actions por módulo
      queries/                 # leituras por módulo
    middleware.ts
```

**Regras de arquitetura:**
- Leituras e mutações acontecem **no servidor** (Server Components + Server Actions). O navegador nunca fala direto com tabelas sensíveis.
- Mutações chamam **funções RPC `admin_*`** do Postgres (que checam a permissão e gravam auditoria). A **service role** só é usada no servidor e **só** quando não houver alternativa (ex: Admin API do Supabase Auth para banir, gerar URL assinada ou excluir usuário).
- O arquivo `lib/supabase/admin.ts` tem `import 'server-only'` e **nunca** é importado em componente cliente.

---

## 4. Contrato com o banco (já existe; não criar aqui)

Tudo abaixo foi criado no repositório do app (migrations do Supabase). O painel **só consome**. Confira os nomes reais nos tipos gerados.


### 4.1 O que já existe (resumo; confira nas migrations)

| Tabela | Conteúdo |
|---|---|
| `profiles` | `id` (= auth.users), `role` (`VET`/`AUXILIAR`/`CLINIC`), `full_name`, `phone`, `avatar_path`, `onboarding_completed`, `notification_prefs` |
| `vets` | profissionais (vet e auxiliar): `professional_type`, `crmv`, `crmv_state`, `crmv_verified`, `bio`, `job_types`, `equipment`, `max_distance_km`, `available`, `city`, `base_location`, `rating_avg`, `rating_count` |
| `clinics` | `name`, `cnpj`, endereço, `location`, `about`, `rating_avg`, `rating_count` |
| `specialties`, `vet_specialties` | especialidades |
| `requests` | solicitações: `clinic_id`, `specialty_id`, `type`, `target_professional`, `description`, datas, `price`, `urgent`, `status` (`DRAFT`/`OPEN`/`FILLED`/`CANCELED`/`CLOSED`), `accepted_vet_id`, `published_at` |
| `interests` | candidaturas (`PENDING`/`ACCEPTED`/`REJECTED`/`WITHDRAWN`) |
| `invitations` | convites da clínica |
| `reviews` | avaliações (1–5 + comentário) |
| `vet_documents` | currículo e certificados (bucket privado `documents`) |
| `notifications`, `notification_outbox`, `push_tokens` | notificações |
| `payments`, `subscriptions`, `billing_customers`, `payment_events`, `clinic_credits` | cobrança (valores em **centavos**) |
| `app_config`, `pricing` | flags e preços |
| `audit_logs` | `actor_id`, `action`, `entity`, `entity_id`, `metadata`, `created_at` |
| `rate_limit_events` | rate limit |

### 4.2 Estruturas do painel (criadas no repositório do app)

**Helper de permissão:**
- `is_staff()` → `true` se `admin_role` ∈ (`admin`, `support`) **e** a sessão tiver MFA (`auth.jwt() ->> 'aal' = 'aal2'`)
- `is_admin()` → idem, mas só `admin`
- `staff_role()` → retorna o papel

**Verificação:**
- `vets`: `verification_status` (`PENDING`/`VERIFIED`/`REJECTED`/`NEEDS_INFO`), `verified_at`, `verified_by`, `verification_note`. Mantenha o `crmv_verified` em sincronia (ou substitua, ajustando o app).
- `clinics`: os mesmos campos para o **CNPJ**

**Status da conta:**
- `profiles`: `account_status` (`ACTIVE`/`SUSPENDED`/`BANNED`/`DELETED`), `suspended_until`, `suspension_reason`, `status_changed_by`, `status_changed_at`
- Função `is_account_active(uid)`, que passa a ser exigida nas RPCs do app (`send_interest`, `create_request_draft`, `accept_interest`, `submit_review` etc.) com o erro `ACCOUNT_SUSPENDED`
- Profissionais suspensos/banidos **não** entram em `get_vets_to_notify` nem nas buscas da clínica; clínicas suspensas não publicam

**Moderação:**
- `requests.moderation_status` (`VISIBLE`/`HIDDEN`) + `moderation_reason`; solicitação `HIDDEN` some para os profissionais
- `reviews.moderation_status` (`VISIBLE`/`HIDDEN`) + `moderation_reason`; avaliação oculta **não entra na média** (ajuste o trigger que calcula `rating_avg`)

**Denúncias (novo):**
- Tabela `reports`: `id`, `reporter_id`, `target_type` (`PROFILE`/`REQUEST`/`REVIEW`), `target_id`, `reason` (`FAKE_PROFILE`/`INAPPROPRIATE_CONTENT`/`NO_SHOW`/`PAYMENT_ISSUE`/`HARASSMENT`/`SPAM`/`OTHER`), `description` (≤1000), `status` (`OPEN`/`IN_REVIEW`/`RESOLVED`/`DISMISSED`), `priority` (`LOW`/`NORMAL`/`HIGH`), `assigned_to`, `resolution_note`, `resolved_at`, `created_at`
- RPC do app `create_report(...)`, com rate limit de 10 por dia por usuário e bloqueio de duplicada (mesmo alvo e usuário, aberta)
- Prioridade `HIGH` automática para `HARASSMENT` e `NO_SHOW`, e quando o mesmo alvo tiver 3 ou mais denúncias abertas

**Notas internas (novo):**
- Tabela `staff_notes`: `id`, `target_type`, `target_id`, `author_id`, `body` (≤2000), `created_at`. Anotações da equipe sobre um usuário ou solicitação ("ligou reclamando dia 10/10"). Invisível para os usuários.

**Comunicados (novo):**
- Tabela `announcements`: `id`, `title` (≤60), `body` (≤200), `audience` (jsonb: papéis, cidades), `url` (opcional, deep link do app), `status` (`DRAFT`/`SENT`), `recipients_count`, `created_by`, `sent_at`

**Auditoria:**
- Garanta em `audit_logs`: `actor_role`, `reason` (texto) e `before`/`after` (jsonb), além do que já existe
- **Imutável:** sem `update`/`delete` para ninguém, nem admin (revogue, e crie um trigger que bloqueie)
- Registrar também **visualização de dado sensível** (abrir documento, ver telefone, exportar dados)

**RLS do painel:**
- Policies de **leitura** para `is_staff()` nas tabelas que o painel lista
- **Nenhuma** policy de escrita para staff: toda escrita vai por RPC `admin_*`

### 4.3 Funções RPC do painel

Já criadas no banco. Todas: `security definer`, `set search_path = public`, checam `is_staff()`/`is_admin()` conforme a matriz, **exigem `p_reason` (texto, mín. 5 caracteres) nas ações destrutivas**, gravam `audit_logs` com o antes/depois, e têm `revoke execute from public, anon`.

| Função | Papel | O que faz |
|---|---|---|
| `admin_dashboard_metrics(p_from, p_to)` | staff | KPIs agregados do período (ver módulo 6.1) |
| `admin_search_users(p_query, p_role, p_status, p_verification, p_limit, p_offset)` | staff | Busca por nome, e-mail, telefone, CNPJ ou CRMV |
| `admin_get_user(p_user_id)` | staff | Perfil completo + contagens + últimas atividades |
| `admin_set_verification(p_user_id, p_status, p_note)` | staff | Aprova/recusa/pede info; notifica o usuário |
| `admin_suspend_user(p_user_id, p_until, p_reason)` | staff (≤7 dias) / admin | Suspende; notifica |
| `admin_ban_user(p_user_id, p_reason)` | admin | Bane; cancela as solicitações abertas e os interesses pendentes |
| `admin_reactivate_user(p_user_id, p_reason)` | staff (suspenso) / admin (banido) | Reativa |
| `admin_update_user_fields(p_user_id, p_fields jsonb, p_reason)` | admin | Corrige nome/CRMV/UF/CNPJ (lista fechada de campos) |
| `admin_set_request_moderation(p_request_id, p_status, p_reason)` | staff | Oculta/reexibe a solicitação |
| `admin_cancel_request(p_request_id, p_reason, p_give_credit bool)` | admin | Cancela em nome da clínica (opcionalmente dá o crédito) |
| `admin_set_review_moderation(p_review_id, p_status, p_reason)` | staff | Oculta/reexibe a avaliação e recalcula a média |
| `admin_update_report(p_report_id, p_status, p_priority, p_assigned_to, p_note)` | staff | Trata denúncia |
| `admin_add_note(p_target_type, p_target_id, p_body)` | staff | Nota interna |
| `admin_grant_credits(p_clinic_id, p_amount, p_reason)` | admin | Dá créditos (já pode existir: reaproveite) |
| `admin_extend_trial(p_user_id, p_days, p_reason)` | admin | Estende o teste (já pode existir) |
| `admin_update_config(p_key, p_value, p_reason)` | admin | Altera `app_config` (lista fechada de chaves) |
| `admin_update_price(p_key, p_amount_cents, p_reason)` | admin | Altera preço (valida: > 0 e ≤ 100000) |
| `admin_upsert_specialty(...)` / `admin_set_specialty_active(...)` | admin | Especialidades (nunca apaga em uso: só desativa) |
| `admin_create_announcement(...)` / `admin_send_announcement(p_id)` | admin | Comunicado (enviar usa o `notification_outbox`) |
| `admin_list_audit(p_filters, p_limit, p_offset)` | staff (só as próprias) / admin | Auditoria |

Ações que precisam da **Admin API do Supabase Auth** ou do **gateway** (banir no Auth, excluir usuário, URL assinada de documento, estorno, reprocessar webhook) ficam em **Server Actions** que: 1) checam o papel pela sessão; 2) chamam a RPC que valida e audita; 3) só então usam a service role ou a Edge Function.

---

## 5. Segurança (obrigatório)

- **Login só para a equipe:** e-mail + senha **+ MFA TOTP obrigatório** (Supabase Auth MFA). Sem MFA, a sessão não passa do `aal1` e o painel **não abre**. No primeiro acesso, a tela obriga a cadastrar o autenticador.
- **Sem cadastro público.** Contas da equipe são criadas por um admin (tela Equipe) ou, no primeiro admin, pelo passo a passo em `supabase/ADMIN.md`, no repositório do app.
- **Middleware** em todas as rotas `(panel)`: exige sessão, `admin_role` válido e `aal2`. Senão, redireciona para `/login`.
- **Dupla checagem:** a UI esconde o que o papel não pode, **e** o banco recusa de qualquer jeito
- **Service role** só no servidor (`server-only`), nunca em variável `NEXT_PUBLIC_*`
- **Confirmação forte** nas ações destrutivas (banir, excluir conta, estornar, mudar preço, desligar/ligar a cobrança): modal com o motivo obrigatório + digitar o nome/e-mail do alvo ou a palavra `CONFIRMAR`
- **Sessão:** expira após 30 minutos sem uso e 8 horas no total
- **Rate limit** nas Server Actions sensíveis (ex: 30 ações destrutivas por hora por membro da equipe)
- **Dados sensíveis mascarados** nas listas (telefone `(85) 9****-1234`, e-mail `vi***@gmail.com`); dado completo só no detalhe, com registro na auditoria
- **Documentos** (currículo, certificados) só por **URL assinada de 5 minutos**, gerada no servidor, com registro na auditoria
- Headers de segurança (CSP, `X-Frame-Options: DENY`, `Referrer-Policy`), `robots: noindex, nofollow` e nenhum link público para o painel
- Nenhum `console.log` com dados pessoais; erros para o usuário em pt-BR, sem stack trace
- **Tudo que muda dados gera `audit_logs`**, sem exceção

---

## 6. Módulos (o que cada um faz e quem cuida)

Cada módulo abaixo tem: **para que serve**, **quem cuida**, **telas**, **ações** e **regras**.

### 6.1 Dashboard (Início)
**Para que serve:** a saúde da plataforma num relance e o que precisa de atenção hoje.
**Quem cuida:** todos (os fundadores olham os números; o suporte olha as pendências).

**Topo — "Precisa de atenção"** (cards clicáveis que levam à fila filtrada):
- Verificações pendentes (CRMV + CNPJ)
- Denúncias abertas (com destaque para as de prioridade alta)
- Pagamentos com falha / webhooks com erro (só admin)
- Solicitações urgentes abertas há mais de 2h sem interessados

**KPIs do período** (seletor: hoje, 7 dias, 30 dias, personalizado; com a comparação com o período anterior em %):
- Novos cadastros por papel (vet, auxiliar, clínica)
- Solicitações publicadas
- **Taxa de preenchimento** (% de publicadas que viraram `FILLED`)
- **Tempo mediano até o 1º interesse**
- Interesses enviados e convites enviados
- Assinaturas: em teste, ativas, em atraso, canceladas no período
- **Receita** (só admin): publicações pagas + assinaturas pagas, e o **MRR** (assinaturas ativas × preço)
- Avaliação média geral

**Gráficos:**
- Linha: solicitações publicadas vs preenchidas por dia
- Barras: cadastros por dia, por papel
- Barras: top 10 especialidades mais pedidas
- Linha: receita por dia (só admin)

**Regras:** os números vêm de `admin_dashboard_metrics` (agregação no banco, nunca baixando tabelas inteiras). Se ficar lento, crie uma materialized view atualizada por `pg_cron` a cada 15 minutos e mostre "Atualizado às HH:MM".

### 6.2 Verificações (CRMV e CNPJ)
**Para que serve:** garantir que o vet é veterinário de verdade e que a clínica existe. É o coração da **confiança**.
**Quem cuida:** suporte (diariamente).

**Tela: fila de verificação**
- Abas: **Profissionais (CRMV)** · **Clínicas (CNPJ)**
- Filtro por status: Pendente (padrão) · Aguardando info · Recusado · Verificado
- Ordenação: mais antigos primeiro
- Colunas: nome, CRMV-UF ou CNPJ, cidade, data do cadastro, tempo na fila (destaque se passar de 48h)

**Tela: detalhe da verificação** (painel lateral ou página):
- **Profissional:** nome, CRMV, UF, cidade, especialidades, foto, **currículo e certificados** (botão "Abrir", com URL assinada)
  - Botão **"Consultar no CFMV"**: abre em nova aba a consulta pública de profissionais do CFMV (a checagem é **manual**: não há API oficial)
  - Checklist: nome confere · CRMV ativo · UF confere
- **Clínica:** nome, CNPJ, endereço
  - Consulta automática do CNPJ pela **BrasilAPI** (`https://brasilapi.com.br/api/cnpj/v1/{cnpj}`), feita no servidor, com cache de 24h: mostra a razão social, o nome fantasia, a **situação cadastral** (destaque vermelho se não for ATIVA), o CNAE e o endereço, para comparar
  - Se a BrasilAPI falhar: aviso e link para a consulta da Receita Federal
- **Ações:**
  - **Aprovar** → `VERIFIED`; o selo "Verificado" aparece no app; notificação "Seu cadastro foi verificado ✓"
  - **Pedir informação** → `NEEDS_INFO` + mensagem (ex: "Envie uma foto da carteira do CRMV"); notificação
  - **Recusar** → `REJECTED` + motivo obrigatório; notificação; e, se a flag `require_verification` estiver ligada, o usuário fica bloqueado de agir
- Atalhos de teclado: `A` aprova, `R` recusa, `→` próximo da fila

**Regras:**
- Flag nova em `app_config`: **`require_verification`** (padrão `false` no piloto). Com `true`, profissional não verificado não envia interesse e clínica não verificada não publica.
- Mudou o CRMV ou o CNPJ no app → a verificação volta para `PENDING` automaticamente (trigger)

### 6.3 Usuários
**Para que serve:** encontrar qualquer pessoa e resolver problemas de conta.
**Quem cuida:** suporte (atendimento) e admin (ações graves).

**Tela: lista**
- Busca única (nome, e-mail, telefone, CNPJ, CRMV), com debounce
- Filtros: papel · status da conta · verificação · assinatura (teste/ativa/atraso/cancelada) · cidade · data de cadastro
- Colunas: avatar, nome, papel (badge), cidade, verificação (badge), status (badge), assinatura (profissional) ou créditos (clínica), cadastro, último acesso
- Paginação no servidor (25 por página); exportar CSV (só admin, com auditoria)

**Tela: detalhe do usuário** (abas):
1. **Resumo:** dados do perfil, e-mail, telefone (mascarado, com o botão "Mostrar", que é auditado), papel, status, verificação, avaliação média, datas (cadastro, último login), onboarding completo sim/não
2. **Atividade:** solicitações (clínica) ou interesses e convites (profissional), com links
3. **Financeiro:** pagamentos, assinatura (status, período, método), créditos
4. **Avaliações:** recebidas e feitas
5. **Denúncias:** feitas por ele e contra ele
6. **Documentos** (profissional): currículo e certificados
7. **Notas internas:** lista + adicionar
8. **Histórico:** tudo que a equipe fez nessa conta (`audit_logs`)

**Ações** (menu no topo, conforme o papel):
- **Suspender** (1, 3, 7 dias; admin: 30 dias ou data personalizada) + motivo. O usuário vê a tela "Conta suspensa até DD/MM" no app.
- **Banir** (admin) + motivo: `account_status = BANNED`, ban no Supabase Auth (invalida as sessões), solicitações abertas canceladas, interesses pendentes retirados
- **Reativar**
- **Editar dados** (admin): nome, CRMV/UF, CNPJ, com motivo
- **Dar créditos** (admin, clínica) / **Estender teste** (admin, profissional)
- **Reenviar e-mail de confirmação**
- **Exportar dados (LGPD)** (admin): gera um JSON com tudo do usuário para download
- **Excluir conta (LGPD)** (admin): confirmação digitando o e-mail; chama a exclusão existente (Edge Function `delete-account` ou equivalente); mantém em `audit_logs` só o id e a ação

**Regras:** ninguém da equipe suspende ou exclui a **própria conta** nem outro admin pelo painel de usuários (só pela tela Equipe).

### 6.4 Solicitações
**Para que serve:** acompanhar o mercado e intervir em casos problemáticos.
**Quem cuida:** suporte (moderação) e admin (cancelamento e crédito).

**Tela: lista**
- Filtros: status (incluindo `DRAFT`) · especialidade · tipo · alvo (vet/auxiliar) · urgente · cidade · período · moderação (visível/oculta) · "sem interessados há +2h"
- Colunas: clínica, especialidade, tipo, data do trabalho, valor, status, nº de interessados, publicada em, urgente

**Tela: detalhe**
- Todos os dados da solicitação e a clínica (link para o usuário)
- **Linha do tempo:** criada → paga → publicada → notificados (quantos) → interesses → convites → aceite → encerrada/cancelada, com data e hora
- Interessados e convidados (com status e link)
- Pagamento vinculado
- Avaliações do trabalho
- Notas internas

**Ações:**
- **Ocultar/Reexibir** (staff) + motivo (ex: conteúdo impróprio, valor abusivo, solicitação falsa)
- **Cancelar em nome da clínica** (admin) + motivo + opção "Devolver 1 crédito"

### 6.5 Denúncias
**Para que serve:** tratar reclamações dos usuários (perfil falso, profissional que não apareceu, assédio, conteúdo impróprio).
**Quem cuida:** suporte, com **meta de resposta de 24h** (prioridade alta: 4h).

**Tela: fila**
- Abas: Abertas · Em análise · Resolvidas · Descartadas
- Ordenação: prioridade e depois a mais antiga
- Colunas: prioridade (badge), motivo, alvo (tipo + nome), quem denunciou, idade (destaque se passar da meta), responsável

**Tela: detalhe**
- Denúncia completa + **prévia do alvo** (o perfil, a solicitação ou a avaliação, com link)
- **Outras denúncias sobre o mesmo alvo** (reincidência)
- Histórico do denunciante (para detectar denúncias de má-fé)
- **Ações:** "Assumir" (vira responsável) · mudar prioridade · **Resolver** (com nota obrigatória e, opcionalmente, uma ação no alvo: ocultar a avaliação, ocultar a solicitação, suspender o usuário) · **Descartar** (com nota)
- Ao resolver/descartar: notificação neutra ao denunciante ("Analisamos sua denúncia. Obrigado por ajudar a manter o ChamaVet seguro.") sem revelar a punição aplicada

### 6.6 Avaliações
**Para que serve:** manter as estrelas confiáveis.
**Quem cuida:** suporte.

- Lista com filtros: nota (1–5) · com comentário · ocultas · período · denunciadas
- Colunas: avaliador → avaliado, nota, comentário (truncado), data, status
- **Ocultar/Reexibir** + motivo (a média é recalculada)
- Destaque automático para comentários com palavras ofensivas (lista simples de termos em `app_config`) e para avaliações 1 estrela

### 6.7 Financeiro (só admin)
**Para que serve:** acompanhar a receita e resolver problemas de pagamento.
**Quem cuida:** admin (semanalmente, e na hora quando houver falha).

**Abas:**
1. **Visão geral:** receita do mês (publicações + assinaturas), MRR, assinaturas por status, ticket de créditos concedidos, e um gráfico mensal
2. **Pagamentos:** filtros por tipo (publicação/assinatura), status, método, período e usuário; colunas: data, usuário, tipo, valor, método, status, id no gateway; no detalhe, o link "Abrir no gateway", os eventos de webhook relacionados e o botão **Estornar** (com confirmação forte, via Edge Function; registra o `REFUNDED`)
3. **Assinaturas:** filtros por status; colunas: profissional, status, fim do teste/período, método, próxima cobrança; ações: estender teste, ver pagamentos
4. **Créditos:** livro-caixa (quem ganhou, por quê, quem deu); ação: dar créditos
5. **Webhooks:** `payment_events` com erro ou não processados; botão **Reprocessar** (chama a rotina de reconciliação existente); payload visível para diagnóstico
6. **Exportar CSV** de pagamentos por período (para o contador), com auditoria

**Regras:** todos os valores exibidos a partir de **centavos** (`R$ 6,90`); nenhum cálculo em float.

### 6.8 Comunicados (só admin)
**Para que serve:** avisar grupos de usuários (novidade, manutenção, campanha).
**Quem cuida:** admin.

- Criar: título (≤60), texto (≤200), público (papéis + cidades), link opcional para uma tela do app
- **Prévia** de como aparece na notificação + **contagem de destinatários** antes de enviar
- Enviar: confirmação forte; a entrega vai pelo `notification_outbox` existente (caixa do app + push, respeitando as preferências de notificação)
- **Limite:** no máximo 1 comunicado por dia para o mesmo público
- Histórico dos enviados

### 6.9 Configurações (só admin)
**Para que serve:** mudar regras e preços sem novo deploy.
**Quem cuida:** admin.

1. **Geral (`app_config`)**, com descrição de cada chave e um switch/campo:
   - `billing_enabled`: cobrança ligada/desligada (**confirmação forte**, com o aviso do impacto)
   - `require_verification`: exigir verificação para agir
   - `trial_days`, `grace_days`, `pix_expiration_minutes`
   - `blocked_words`: lista de termos para o destaque de avaliações
2. **Preços (`pricing`):** publicação de solicitação e assinatura mensal; editar com o valor em reais convertido para centavos, motivo e confirmação. Mostra o histórico de mudanças (da auditoria). Novos preços valem só para **novas** cobranças.
3. **Especialidades:** lista (nome, ícone lucide, ativa, nº de profissionais e de solicitações que usam); criar, renomear, trocar o ícone, **desativar** (nunca apagar se estiver em uso)
4. **Habilidades de auxiliar:** o mesmo esquema

### 6.10 Auditoria
**Para que serve:** saber **quem fez o quê, quando e por quê**. Protege a empresa e a equipe.
**Quem cuida:** admin (revisão mensal).

- Lista: data/hora, quem (nome + papel), ação, alvo (link), motivo
- Filtros: pessoa da equipe, ação, tipo de alvo, período
- Detalhe: `before`/`after` lado a lado (diff dos campos)
- Somente leitura, sem editar nem apagar
- Suporte vê só as próprias ações

### 6.11 Equipe (só admin)
**Para que serve:** controlar quem acessa o painel.
**Quem cuida:** admin.

- Lista da equipe: nome, e-mail, papel, MFA ativo sim/não, último acesso
- **Convidar:** e-mail + papel → cria o usuário no Auth com o `app_metadata.admin_role` e envia o convite (via Server Action com service role)
- **Mudar papel** e **remover acesso** (tira o `admin_role` e encerra as sessões), com motivo
- Regra: não é possível remover o **último admin**, nem remover a si mesmo

---

## 7. Layout e UX

- **Desktop first** (largura mínima confortável: 1280px), mas usável em notebook de 1024px e com leitura razoável no celular (sidebar vira menu)
- **Sidebar** com: Início · Verificações (badge com a contagem) · Usuários · Solicitações · Denúncias (badge) · Avaliações · Financeiro · Comunicados · Configurações · Auditoria · Equipe. Itens que o papel não pode usar **não aparecem**.
- **Header:** busca global (usuário por nome/e-mail/CNPJ/CRMV, com atalho `Ctrl+K`), ambiente (**selo "SANDBOX/DEV"** em laranja quando não for produção), nome e papel do membro da equipe, sair
- Tabelas com estado de carregamento (skeleton), vazio ("Nenhuma denúncia aberta 🎉") e erro ("Tentar novamente")
- Toasts de sucesso/erro em pt-BR
- Badges de status com cores consistentes (pendente = accent, aprovado/pago = success, recusado/banido = danger, neutro = muted)
- Datas em pt-BR ("30/09/2026 15:59") e relativas nas filas ("há 3 h")
- Acessibilidade: navegação por teclado, foco visível, contraste AA, `aria-label` nos botões de ícone
- Seguir a identidade visual da seção 1 (tokens no Tailwind; nada de cor solta)

---

## 8. App mobile

O app Expo é outro projeto e **não faz parte desta tarefa**. Os ajustes nele (tela de conta suspensa, selo verificado, botão "Denunciar", esconder conteúdo oculto) são feitos no repositório do app, junto com o banco.

---

## 9. Testes

Os testes do banco (pgTAP) ficam no repositório do app. Aqui, só os do painel:

**Painel (Playwright, fluxos principais):**
- Login com MFA → dashboard
- Suporte não vê o menu Financeiro nem Configurações, e o acesso direto pela URL dá "Sem permissão"
- Aprovar uma verificação e ver o status mudar
- Suspender um usuário e ver o registro na auditoria

`npx tsc --noEmit` e `npm run lint` sem erros.

---

## 10. Deploy e ambientes

- **Dois ambientes**, cada um apontando para o seu projeto Supabase: `dev` (sandbox) e `prod`
- Variáveis (`.env.local` + painel da hospedagem): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (**sem** `NEXT_PUBLIC_`), `NEXT_PUBLIC_APP_ENV` (`dev`/`prod`, para o selo). Um `.env.example` documentado.
- Domínio sugerido: `admin.chamavet.com.br` (sem link público em lugar nenhum)
- Configure no Supabase Auth a URL do painel nos **Redirect URLs** (convite, reset de senha)
- Documente em `README.md`: como rodar local, como criar o primeiro admin, como ativar o MFA e como fazer o deploy

---

## 11. Rotina de operação (quem cuida de quê no dia a dia)

Inclua esta tabela no `README.md`:

| Frequência | Tarefa | Quem | Onde |
|---|---|---|---|
| Diário (manhã) | Zerar a fila de **verificações** (meta: até 48h) | Suporte | Verificações |
| Diário | Tratar **denúncias** (meta: 24h; alta prioridade: 4h) | Suporte | Denúncias |
| Diário | Olhar as **urgentes sem interessados** e acionar profissionais, se preciso | Suporte | Dashboard → Solicitações |
| Diário | Checar **webhooks com erro** e pagamentos com falha | Admin | Financeiro → Webhooks |
| Semanal | Revisar os **KPIs** (cadastros, preenchimento, tempo até o 1º interesse) | Admin | Dashboard |
| Semanal | Revisar as **avaliações 1 estrela** e os comentários destacados | Suporte | Avaliações |
| Mensal | Exportar os **pagamentos** para o contador | Admin | Financeiro |
| Mensal | Revisar a **auditoria** e os acessos da equipe (quem ainda precisa de acesso, MFA de todos ativo) | Admin | Auditoria / Equipe |
| Sob demanda | Pedidos de **LGPD** (exportar/excluir dados): responder em até 15 dias | Admin | Usuários |

---

## 12. Ordem de execução

1. Ler este documento, gerar os tipos do banco e **conferir se as funções `admin_*` e as tabelas da seção 4 existem**. Se faltar algo, parar e me avisar.
2. **Mostrar o plano.** Aguardar confirmação.
3. **Base do painel:** projeto Next.js, Tailwind/shadcn com os tokens, clientes Supabase (`server`, `client`, `admin` com `server-only`), middleware, login + MFA (cadastro do autenticador no 1º acesso), layout (sidebar, header, busca global, selo de ambiente).
4. 🛑 **Parar**: eu testo o login com MFA e as permissões do menu (admin vs suporte).
5. Módulos, nesta ordem: **Dashboard → Verificações → Usuários → Solicitações → Denúncias → Avaliações**.
6. 🛑 **Parar** para eu testar.
7. Módulos: **Financeiro → Configurações → Comunicados → Auditoria → Equipe**.
8. Testes Playwright, `tsc`, lint e o README com a rotina (seção 11).
9. No final, me entregue:
   - como rodar local e fazer o deploy
   - como ativar o MFA e entrar pela primeira vez
   - o que configurar no Supabase (Redirect URLs do painel, MFA)
   - a lista do que foi decidido por você ou ficou pendente
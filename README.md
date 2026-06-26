# Call Intelligence — Sales Coaching com IA

Sistema para **análise de calls comerciais de Closers** com IA: recebe a transcrição,
gera uma análise estruturada (notas por critério, resumo, momentos importantes), produz
um **feedback final prático**, envia um **resumo no Slack** e acompanha a **evolução** de
cada Closer ao longo do tempo.

> Pasta do repositório: `AdBalanceBilling/` (git + infra) · App em `web/`.

---

## ✨ Funcionalidades (MVP)

- **Closers**: cadastro e perfil com evolução.
- **Calls**: cadastro com transcrição (ou link), status (`pendente → em análise → concluída → revisada`).
- **Análise por IA (Gemini)**: nota 0–10 por critério, resumo, tempo de fala, momentos importantes, feedback e ações — tudo via **saída estruturada (responseSchema do Gemini, validada por Zod)**. Sem chave = **modo manual** (app funciona, IA desativada).
- **Feedback final**: o que manter, o que corrigir, pontos fortes/fracos, e *como conduzir melhor* com exemplos concretos.
- **Slack**: resumo automático (Block Kit) por Incoming Webhook + histórico de envios.
- **Dashboard de evolução**: ranking de Closers, médias por critério, linha de evolução, radar de competências, comparativo recentes × anteriores.

---

## 🏗️ Arquitetura

```
Next.js 16 (App Router, RSC, Server Actions)  ← frontend + backend num só app
        │
        ├── lib/ai      → Gemini Flash via HTTP REST (responseSchema validado por Zod)
        ├── lib/slack   → Incoming Webhook (Block Kit)
        ├── lib/data    → queries + métricas de evolução
        └── lib/supabase→ cliente server-side (service_role)
        │
Supabase (Postgres + RLS + Storage)
```

**Princípios:** serviços de IA e Slack desacoplados atrás de interfaces; todo acesso ao banco
é server-side com `service_role` (o browser nunca consulta o banco direto); scores numa tabela
própria (1 linha por critério) para comparação histórica sem migração.

### Estrutura de pastas

```
AdBalanceBilling/
├── supabase/
│   ├── migrations/0001_init.sql          # schema + RLS
│   ├── migrations/0002_seed_criteria.sql # rubrica de critérios
│   └── seed.sql                          # dados de exemplo (opcional)
└── web/
    └── src/
        ├── app/            # páginas (dashboard, closers, calls, feedback, settings…)
        ├── components/     # UI kit, charts (SVG), sidebar
        └── lib/
            ├── ai/         # schema, prompt, analyze
            ├── slack/      # notify (Block Kit)
            ├── data/       # queries + metrics
            ├── actions/    # Server Actions (closers, calls, analysis, slack)
            ├── supabase/   # admin client
            ├── criteria.ts # rubrica (espelho do banco)
            └── types.ts
```

---

## 🚀 Setup

### 1. Banco de dados (Supabase)

No **SQL Editor** do seu projeto, rode na ordem:

1. `supabase/migrations/0001_init.sql`
2. `supabase/migrations/0002_seed_criteria.sql`
3. (opcional) `supabase/seed.sql` — cria 2 Closers e 1 call de exemplo.

### 2. Variáveis de ambiente

Copie `web/.env.example` para `web/.env.local` e preencha:

| Variável | Onde obter |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | idem (publishable / anon — pública) |
| `SUPABASE_SERVICE_ROLE_KEY` | idem (**service_role — secreta**) |
| `GEMINI_API_KEY` | aistudio.google.com/app/apikey (**vazia = modo manual, sem IA**) |
| `GEMINI_MODEL` | ex.: `gemini-2.0-flash` (padrão — leve/free) |
| `SLACK_WEBHOOK_URL` | api.slack.com/messaging/webhooks |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` em dev |

> Sem `SUPABASE_SERVICE_ROLE_KEY` o app abre, mas as escritas são bloqueadas por RLS.
> Sem `GEMINI_API_KEY` o sistema roda em **modo manual**: cadastro, dashboard e Slack funcionam; a análise automática fica desativada (com aviso claro na interface).

### 3. Rodar

```bash
cd web
npm install
npm run dev
# http://localhost:3000
```

---

## 🔄 Fluxo principal

1. **Closers** → cadastre um Closer.
2. **Calls → Nova call** → selecione o Closer, cole a transcrição, marque *Analisar com IA*.
3. A IA gera notas + resumo + feedback → status vira **Concluída** → resumo é enviado ao **Slack**.
4. **Feedback** → veja o feedback prático; marque ações como *Aplicada*.
5. **Dashboard / Closer** → acompanhe a evolução.

---

## 🔌 Integração com o Tactiq (webhook)

Quando o **Tactiq** transcreve uma call, o sistema pode recebê-la automaticamente,
salvar no Supabase e disparar a análise com Gemini.

**Endpoint:** `POST /api/webhooks/tactiq`
- Local: `http://localhost:3000/api/webhooks/tactiq`
- Produção: `NEXT_PUBLIC_APP_URL` + `/api/webhooks/tactiq`

A URL pronta para copiar aparece em **Configurações → Webhook do Tactiq**.

### Payload esperado (JSON)

```json
{
  "titulo_da_call": "Reunião comercial — Loja XPTO",
  "data_da_call": "2026-06-26",
  "closer": "Ana Closer",
  "cliente": "Maria",
  "empresa": "Loja XPTO Materiais",
  "link_da_reuniao": "https://meet.google.com/...",
  "transcricao": "Closer: ... Cliente: ...",
  "participantes": ["Ana", "Maria"],
  "origem": "tactiq"
}
```

| Campo | Obrigatório | Observação |
|---|---|---|
| `transcricao` | **Sim** | Mín. 40 caracteres. Sem ela → erro amigável 400. |
| `closer` | Não | Casa pelo nome (ou cria o Closer). Sem nome → "Não informado". |
| `cliente` / `empresa` | Não | Viram o nome do cliente da call. |
| `data_da_call` | Não | Sem data válida → usa a data atual. |
| `link_da_reuniao` | Não | Salvo como link da gravação. |
| `participantes` | Não | String ou array; entra no contexto da análise. |

### Comportamento

1. Valida a transcrição (erro 400 amigável se faltar).
2. Salva a call com status **`recebida`**.
3. Dispara a análise com Gemini e grava o resultado nas tabelas atuais.
4. Se `SLACK_WEBHOOK_URL` estiver definido, envia o resumo ao Slack.
5. Se a análise falhar, a call **continua salva** com status **`erro_na_analise`** e o erro vai para `webhook_logs`.
6. Sem `GEMINI_API_KEY` (modo manual), a call fica como `recebida` (sem análise).

> Requer a migration **0003** aplicada (novos status + tabela `webhook_logs`).
> Rode `supabase/migrations/0003_tactiq_webhook.sql` ou re-cole o `supabase/schema.sql`.

### Segurança (opcional)

Defina `TACTIQ_WEBHOOK_SECRET` no `.env.local`. Com isso, o request precisa enviar
o header `x-webhook-secret` (ou `?secret=`) com o mesmo valor — caso contrário, `401`.

### Conectando Tactiq + Zapier/Make

O Tactiq não chama webhooks arbitrários direto; use **Zapier** ou **Make** como ponte:

**Zapier**
1. **Trigger:** Tactiq → "New Meeting Transcript" (conecte sua conta Tactiq).
2. **Action:** "Webhooks by Zapier" → **POST**.
   - URL: a URL do webhook (Configurações → Webhook do Tactiq).
   - Payload Type: **JSON**.
   - Data: mapeie os campos do Tactiq para `titulo_da_call`, `data_da_call`, `closer`,
     `cliente`, `empresa`, `link_da_reuniao`, `transcricao`, `participantes`.
   - Headers (se usar segredo): `x-webhook-secret: SEU_SEGREDO`.
3. Teste o Zap — uma call de teste deve aparecer em **Calls**.

**Make (Integromat)**
1. **Módulo Tactiq** (ou Watch via webhook do Tactiq) como gatilho.
2. **HTTP → Make a request:** método **POST**, URL do webhook, Body type **Raw / JSON**,
   header `Content-Type: application/json` (e `x-webhook-secret` se aplicável).
3. Monte o JSON com os campos acima e rode o cenário.

**Teste rápido (curl)**

```bash
curl -X POST http://localhost:3000/api/webhooks/tactiq \
  -H "Content-Type: application/json" \
  -d '{"closer":"Ana Closer","cliente":"Maria","empresa":"Loja XPTO","transcricao":"Closer: Oi Maria... Cliente: Quanto custa?..."}'
```

---

## 🧭 Roadmap (fase 2+)

- Transcrição automática de áudio/vídeo com diarização (Whisper/Deepgram).
- Slack App/Bot interativo (multi-canal, ações inline).
- Autenticação (Supabase Auth) + papéis (admin/gestor/closer) com RLS por usuário.
- Editor de rubrica na interface (pesos e critérios versionados).
- Importação automática de Zoom/Meet/Google Drive.
- Processamento assíncrono via fila para calls longas.

---

## 🧱 Stack

Next.js 16 · React 19 · TypeScript · Tailwind v4 · Supabase (Postgres) · Google Gemini (Flash) · Zod · lucide-react.
Gráficos em SVG próprio (sem dependência de chart lib).

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

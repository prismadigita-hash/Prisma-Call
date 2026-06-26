# Deploy no EasyPanel — Call Intelligence

App Next.js 16 (standalone) containerizado. Build context = `web/`.

> Pré-requisitos: etapas de segurança aplicadas no Supabase e app funcionando
> localmente. O deploy NÃO altera o comportamento atual.

## 1. Criar o serviço

No EasyPanel: **Create → App** e conecte o repositório Git (ou suba via Docker).

- **Source / Build:** selecione **Dockerfile**.
- **Build Path / Context:** `web` (o app está na subpasta `web/`, não na raiz).
- **Dockerfile:** `web/Dockerfile` (já incluso).
- **Port:** `3000`.

## 2. Variáveis de ambiente

As `NEXT_PUBLIC_*` são embutidas no **build** (precisam estar como **Build Args**
e/ou Environment no momento do build). Os segredos são lidos em **runtime**.

**Build Args (e Environment):**
```
NEXT_PUBLIC_SUPABASE_URL       = https://SEU-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY  = sb_publishable_...
NEXT_PUBLIC_APP_URL            = https://SEU-DOMINIO   (URL pública do EasyPanel)
```

**Environment (runtime, secretos — NÃO commitar):**
```
SUPABASE_SERVICE_ROLE_KEY  = sb_secret_...
GEMINI_API_KEY             = AIza...
GEMINI_MODEL               = gemini-2.5-flash
SLACK_WEBHOOK_URL          = (opcional)
TACTIQ_WEBHOOK_SECRET      = (opcional, recomendado em produção)
```

> Importante: `NEXT_PUBLIC_APP_URL` deve ser a URL pública final — ela monta o
> link "Ver análise completa" no Slack e a URL do webhook do Tactiq.

## 3. Domínio e HTTPS

- Configure o domínio no EasyPanel (ele provê HTTPS/Let's Encrypt).
- Com HTTPS ativo, o header `Strict-Transport-Security` passa a valer.
- Quando estiver tudo certo, troque no `next.config.ts` o header
  `Content-Security-Policy-Report-Only` por `Content-Security-Policy` para
  **aplicar** o CSP (hoje está em modo report-only para não quebrar nada).

## 4. Webhook do Tactiq em produção

Após o deploy, a URL do webhook fica:
```
https://SEU-DOMINIO/api/webhooks/tactiq
```
Atualize o Zapier/Make para essa URL. Ela também aparece pronta em
**Configurações → Webhook do Tactiq** (usa `NEXT_PUBLIC_APP_URL`).

## 5. Checklist de deploy

- [ ] Migrations aplicadas no Supabase (0001…0010).
- [ ] Build Args `NEXT_PUBLIC_*` definidos.
- [ ] Segredos de runtime definidos (service_role, Gemini).
- [ ] Porta 3000 exposta; domínio + HTTPS ativos.
- [ ] `NEXT_PUBLIC_APP_URL` = domínio público.
- [ ] Teste: abrir a home, criar/abrir uma call, rodar análise.
- [ ] Teste do webhook Tactiq com a URL pública.
- [ ] (Pós-validação) Trocar CSP report-only por enforcing.

## 6. Build local de teste (opcional)

```bash
cd web
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="https://SEU-REF.supabase.co" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_..." \
  --build-arg NEXT_PUBLIC_APP_URL="http://localhost:3000" \
  -t call-intelligence .

docker run --rm -p 3000:3000 \
  -e SUPABASE_SERVICE_ROLE_KEY="sb_secret_..." \
  -e GEMINI_API_KEY="AIza..." \
  -e GEMINI_MODEL="gemini-2.5-flash" \
  call-intelligence
```

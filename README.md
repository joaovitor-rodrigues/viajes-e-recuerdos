# Viajes e Recuerdos

Um mapa interativo pessoal e privado para registrar memórias de viagem. Cada pin no mapa representa um momento: uma cidade visitada, um restaurante inesquecível, um pôr do sol. O projeto é minimalista por intenção — sem redes sociais, sem compartilhamento. Apenas um casal e suas histórias.

---

## Stack e Arquitetura

**Frontend:** Next.js 14 (App Router) com TypeScript. As rotas são divididas em dois grupos: `(auth)` para o login e `(app)` para as páginas protegidas. O layout raiz carrega as cinco fontes via `next/font/google` com `display: swap`. Todos os componentes de mapa usam `dynamic(() => import(...), { ssr: false })` porque o Leaflet acessa `window` e não é compatível com SSR.

**Banco de dados:** Supabase (PostgreSQL) com Row Level Security habilitado. Todas as escritas exigem `auth.role() = 'authenticated'`. A autenticação é anônima — o usuário não tem e-mail nem senha no Supabase; a senha do app é verificada localmente via bcrypt e, se correta, gera uma sessão anônima com `signInAnonymously()`. O hash da senha fica em variável de ambiente no servidor, nunca exposto ao cliente.

**Estado global:** Zustand com três stores — `pinsStore` (lista de pins), `mapStore` (referência ao mapa Leaflet, modo de criação) e `themeStore` (tema visual com CSS variables). O Supabase Realtime mantém os dois estados sincronizados em tempo real via `postgres_changes`.

**Media:** Fotos e vídeos ficam no Google Drive do usuário. O app só armazena a URL e extrai o `fileId` para gerar URLs de embed (`/preview`) e download direto (`lh3.googleusercontent.com`). Nenhum arquivo passa pelo servidor.

**Deploy:** Vercel com os headers de segurança em `vercel.json`. O domínio `viajes.joaovrodrigues.com.br` aponta via CNAME para o projeto na Vercel. O Supabase pode ser o tier gratuito (projetos pausam após 1 semana de inatividade) ou um plano pago para uso contínuo.

---

## Setup Local

```bash
# 1. Clonar e instalar
git clone <url>
cd viajes-e-recuerdos
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env.local
# Preencher NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, APP_PASSWORD_HASH

# 3. Criar schema no Supabase
npx supabase db push
# ou executar manualmente: supabase/migrations/001_initial_schema.sql

# 4. (Opcional) Popular com pins de exemplo
# Executar supabase/seed.sql no SQL editor do Supabase

# 5. Rodar
npm run dev
# → http://localhost:3000  (redireciona para /login)
```

### Gerar o hash da senha

```bash
npx ts-node scripts/generate-hash.ts "minha-senha-aqui"
# → APP_PASSWORD_HASH=$2b$10$...
# Copiar o valor para .env.local
```

---

## Variáveis de Ambiente

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública (anon) do Supabase |
| `APP_PASSWORD_HASH` | Hash bcrypt da senha do app |

---

## Deploy na Vercel

```bash
# Via CLI
npx vercel --prod

# Ou conectar o repositório em vercel.com e adicionar as variáveis de ambiente
# em Project Settings → Environment Variables
```

### Subdomínio `viajes.joaovrodrigues.com.br`

1. No painel Vercel: **Project → Settings → Domains → Add Domain**
2. Digitar `viajes.joaovrodrigues.com.br`
3. No provedor DNS (Cloudflare, Registro.br, etc.), adicionar:
   ```
   CNAME  viajes  cname.vercel-dns.com
   ```
4. Aguardar propagação DNS (até 48h, geralmente minutos no Cloudflare)

---

## Backup

```bash
# Dump completo do banco Supabase
pg_dump "postgresql://postgres:[SENHA]@db.[PROJECT_REF].supabase.co:5432/postgres" \
  --schema=public \
  --no-owner \
  -f backup_$(date +%Y%m%d).sql
```

A senha e o host estão em **Supabase → Settings → Database → Connection string**.

---

## Migrar de Banco (Neon / Railway / Oracle)

1. Exportar dados do Supabase atual:
   ```bash
   pg_dump <supabase-url> --data-only --schema=public -f data.sql
   ```
2. No novo banco, executar o schema:
   ```bash
   psql <novo-banco-url> -f supabase/migrations/001_initial_schema.sql
   ```
3. Importar os dados:
   ```bash
   psql <novo-banco-url> -f data.sql
   ```
4. Atualizar `.env.local` (e variáveis na Vercel) com a nova connection string
5. Recriar as políticas RLS se o novo banco não suportar `auth.role()` do Supabase — substituir pela política adequada ao novo provider de autenticação

---

## Estrutura de Pastas

```
viajes-e-recuerdos/
├── app/
│   ├── (auth)/login/          # Tela de login (isolada do layout da app)
│   ├── (app)/
│   │   ├── layout.tsx         # Layout client: aplica CSS variables do tema
│   │   ├── mapa/page.tsx      # Mapa principal (server → passa dados ao MapContainer)
│   │   └── pin/[id]/
│   │       ├── page.tsx       # Página de detalhe do pin
│   │       └── editar/        # Formulário de edição
│   ├── api/
│   │   ├── auth/login|logout  # Autenticação bcrypt + Supabase anônimo
│   │   ├── pins/              # CRUD de pins (GET, POST, PUT, DELETE)
│   │   ├── theme/             # GET + PATCH do visual_theme
│   │   └── geocoding/         # Proxy Nominatim com cache in-memory
│   ├── layout.tsx             # Root: Google Fonts (5 famílias) + metadata
│   └── globals.css            # CSS variables, scrollbar, media queries mobile
│
├── components/
│   ├── map/                   # MapContainer, MapPin, CitySearchBox, PinCreationMarker
│   │                          # MapSkeleton, MapErrorBoundary
│   ├── pins/                  # PinCreateModal, PinEditForm, MediaInput, EditPinClient
│   ├── pin-page/              # PinHero, PinGallery, PinVideoPlayer, PinMiniMap
│   ├── sidebar/               # Sidebar, StatsBar, PinList
│   └── theme/                 # ThemePanel, ParticleCanvas
│
├── hooks/
│   ├── usePins.ts             # CRUD + optimistic updates + Realtime subscription
│   └── useTheme.ts            # CSS vars + Realtime + updateAndSync + resetToDefault
│
├── stores/
│   ├── pinsStore.ts           # Zustand: lista de pins
│   ├── mapStore.ts            # Zustand: mapRef, modo criação, flyTo
│   └── themeStore.ts          # Zustand: tema visual + DEFAULT_THEME
│
├── lib/
│   ├── supabase/client.ts     # Browser client (@supabase/ssr)
│   ├── supabase/server.ts     # Server client com cookies()
│   ├── auth.ts                # verifyPassword / generatePasswordHash (bcryptjs)
│   ├── geocoding.ts           # searchCity / reverseGeocode (Nominatim)
│   ├── drive.ts               # parseGoogleDriveUrl / getEmbedUrl / getDirectImageUrl
│   └── validations.ts         # Zod schemas: PinSchema, PinUpdateSchema
│
├── types/
│   └── database.ts            # Pin, MediaItem, VisualTheme, PinInsert, PinUpdate
│
├── supabase/
│   ├── migrations/001_initial_schema.sql
│   └── seed.sql               # 5 pins de exemplo
│
├── scripts/
│   └── generate-hash.ts       # npx ts-node scripts/generate-hash.ts "senha"
│
├── middleware.ts              # Protege /(app)/*, /api/pins, /api/theme
├── vercel.json                # Security headers + redirect / → /login
└── .env.local                 # NEXT_PUBLIC_SUPABASE_URL, ANON_KEY, APP_PASSWORD_HASH
```

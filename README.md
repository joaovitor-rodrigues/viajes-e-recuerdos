# Viajes e Recuerdos

Um mapa interativo pessoal e privado para registrar memórias de viagem. Cada pin no mapa representa um momento: uma cidade visitada, um restaurante inesquecível, um pôr do sol. O projeto é minimalista por intenção — sem redes sociais, sem compartilhamento. Apenas um casal e suas histórias.

---

## Stack e Arquitetura

**Frontend:** Next.js 14 (App Router) com TypeScript. As rotas são divididas em dois grupos: `(auth)` para o login e `(app)` para as páginas protegidas. Todos os componentes de mapa usam `dynamic(() => import(...), { ssr: false })` porque o Leaflet acessa `window` e não é compatível com SSR.

**Banco de dados:** Supabase (PostgreSQL) com Row Level Security habilitado em todas as tabelas. A autenticação é anônima — o usuário não tem e-mail nem senha no Supabase; a senha do app é verificada localmente via bcrypt e, se correta, gera uma sessão anônima com `signInAnonymously()`. O hash da senha fica em variável de ambiente no servidor, nunca exposto ao cliente.

**Estado global:** Zustand com três stores — `pinsStore` (lista de pins), `mapStore` (referência ao mapa Leaflet, modo de criação) e `themeStore` (tema visual com CSS variables). O Supabase Realtime sincroniza pins e tema em tempo real via `postgres_changes`.

**Mídia — Google Photos:** Fotos e vídeos podem ser adicionados via Google Photos Picker API. Cada conta Google conectada passa por um fluxo OAuth (`/api/auth/google`), e o token é armazenado na tabela `google_tokens` (service role only). No banco, a mídia é salva como URL `gphotos://label/sessionId/itemId`. Para servir, o Edge Function `/api/photos/proxy` resolve a URL (com cache na tabela `google_photos_url_cache`), adiciona o Bearer token e faz streaming do Google CDN para o cliente. O Edge Runtime elimina o limite de 4.5 MB das funções serverless e não tem cold start.

**Mídia — Google Drive:** Também é possível adicionar mídia via Google Drive Picker. O app extrai o `fileId` e gera URLs de embed (`/preview`) e download direto (`lh3.googleusercontent.com`). Esses arquivos não passam pelo servidor.

**Deploy:** Vercel (plano Hobby compatível) com headers de segurança em `vercel.json`. O domínio `viajes.joaovrodrigues.com.br` aponta via CNAME para o projeto na Vercel.

---

## Setup Local

```bash
# 1. Clonar e instalar
git clone <url>
cd viajes-e-recuerdos
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env.local
# Preencher todas as variáveis (ver tabela abaixo)

# 3. Criar schema no Supabase (executar todas as migrations em ordem)
# No SQL editor do Supabase, rodar:
#   supabase/migrations/001_initial_schema.sql
#   supabase/migrations/002_date_range.sql
#   supabase/migrations/003_google_tokens.sql
#   supabase/migrations/004_photos_url_cache.sql

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
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service role (acesso a tabelas com RLS deny_all) |
| `APP_PASSWORD_HASH` | Hash bcrypt da senha do app |
| `GOOGLE_CLIENT_ID` | Client ID do app OAuth no Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Client Secret do app OAuth no Google Cloud Console |
| `NEXTAUTH_SECRET` | String aleatória para assinar cookies de sessão |
| `NEXT_PUBLIC_APP_URL` | URL pública do app (ex: `https://viajes.joaovrodrigues.com.br`) |

### Configurar Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → Create OAuth 2.0 Client ID
2. Tipo: Web Application
3. Authorized redirect URIs: `{NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
4. Ativar as APIs: **Google Photos Picker API** e **Google Drive API**
5. Copiar Client ID e Secret para `.env.local`

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
3. No provedor DNS, adicionar:
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

## Estrutura de Pastas

```
viajes-e-recuerdos/
├── app/
│   ├── (auth)/login/              # Tela de login
│   ├── (app)/
│   │   ├── layout.tsx             # Layout client: CSS variables do tema
│   │   ├── mapa/page.tsx          # Mapa principal
│   │   └── pin/[id]/
│   │       ├── page.tsx           # Página de detalhe do pin
│   │       └── editar/            # Formulário de edição
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login|logout/      # Autenticação bcrypt + Supabase anônimo
│   │   │   └── google/            # OAuth flow: /google → Google → /google/callback
│   │   ├── pins/                  # CRUD de pins (GET, POST, PUT, DELETE)
│   │   ├── theme/                 # GET + PATCH do visual_theme
│   │   ├── geocoding/             # Proxy Nominatim com cache in-memory
│   │   └── photos/
│   │       ├── proxy/             # Edge Runtime: resolve + stream com Bearer token
│   │       ├── resolve/           # Resolve gphotos:// → displayUrl (CDN-cached)
│   │       ├── accounts/          # Lista contas Google conectadas
│   │       ├── token/             # Retorna access token válido para o Drive Picker
│   │       └── session/           # Cria e consulta sessões do Google Photos Picker
│   ├── layout.tsx                 # Root: fontes + metadata
│   └── globals.css                # CSS variables, scrollbar, media queries
│
├── components/
│   ├── map/
│   │   ├── MapContainer.tsx       # Leaflet map, pins, overlays
│   │   ├── MapPin.tsx             # Marcador com bandeira do país
│   │   ├── CitySearchBox.tsx      # Busca de cidades (Nominatim)
│   │   ├── PinCreationMarker.tsx  # Marcador arrastável ao criar pin
│   │   ├── PinDetailOverlay.tsx   # Overlay flutuante com detalhes do pin
│   │   ├── PinEditOverlay.tsx     # Overlay de edição rápida no mapa
│   │   ├── StarField.tsx          # Globo 3D com estrelas (react-globe.gl)
│   │   ├── MapSkeleton.tsx        # Placeholder durante SSR
│   │   └── MapErrorBoundary.tsx
│   ├── pins/
│   │   ├── PinCreateModal.tsx     # Modal de criação de pin
│   │   ├── PinEditForm.tsx        # Formulário de edição completo
│   │   ├── MediaInput.tsx         # Input de mídia (foto/vídeo) com preview
│   │   ├── EditPinClient.tsx      # Client wrapper da página de edição
│   │   ├── GooglePhotosPicker.tsx # Picker do Google Photos (Picker API)
│   │   └── GoogleDrivePicker.tsx  # Picker do Google Drive
│   ├── pin-page/
│   │   ├── PinHero.tsx            # Cabeçalho da página do pin
│   │   ├── PinGallery.tsx         # Grade de fotos com lightbox
│   │   ├── PinVideoPlayer.tsx     # Acordeão de vídeos com pré-fetch de metadados
│   │   └── PinMiniMap.tsx         # Mini-mapa estático na página do pin
│   ├── sidebar/
│   │   ├── Sidebar.tsx            # Painel lateral com lista de pins e controles
│   │   ├── FloatingPinPanel.tsx   # Painel flutuante com status das contas Google
│   │   ├── PinList.tsx            # Lista de pins com busca e filtros
│   │   └── StatsBar.tsx           # Contadores: pins, países, cidades
│   ├── theme/
│   │   ├── ThemePanel.tsx         # Editor visual do tema (cores, partículas)
│   │   └── ParticleCanvas.tsx     # Canvas de partículas animadas
│   └── ui/
│       └── VideoPlayer.tsx        # Player de vídeo customizado com seek bar
│
├── hooks/
│   ├── usePins.ts                 # CRUD + optimistic updates + Realtime
│   ├── useResolvedMedia.ts        # Resolve gphotos:// → URL do proxy
│   └── useTheme.ts                # CSS vars + Realtime + reset
│
├── stores/
│   ├── pinsStore.ts               # Zustand: lista de pins
│   ├── mapStore.ts                # Zustand: mapRef, modo criação, flyTo
│   └── themeStore.ts              # Zustand: tema visual + DEFAULT_THEME
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Browser client (@supabase/ssr)
│   │   ├── server.ts              # Server client com cookies()
│   │   └── service.ts             # Service role client (bypassa RLS)
│   ├── auth.ts                    # verifyPassword / generatePasswordHash
│   ├── geocoding.ts               # searchCity / reverseGeocode (Nominatim)
│   ├── drive.ts                   # parseGoogleDriveUrl, embedUrl, displayUrl
│   ├── googlePhotos.ts            # Picker API: tokens, sessões, resolve + cache
│   ├── dateRange.ts               # Helpers para intervalo de datas da viagem
│   ├── flags.ts                   # Mapeamento país → emoji de bandeira
│   ├── flagColors.ts              # Cores dominantes das bandeiras por país
│   └── validations.ts             # Zod schemas: PinSchema, PinUpdateSchema
│
├── types/
│   └── database.ts                # Pin, MediaItem, VisualTheme, PinInsert, PinUpdate
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql # Tabelas pins, visual_theme, funções RLS
│   │   ├── 002_date_range.sql     # Campos start_date / end_date nos pins
│   │   ├── 003_google_tokens.sql  # OAuth tokens Google (service role only)
│   │   └── 004_photos_url_cache.sql # Cache de baseUrls do Picker (TTL 45 min)
│   └── seed.sql                   # Pins de exemplo
│
├── scripts/
│   └── generate-hash.ts           # Gera APP_PASSWORD_HASH
│
├── public/
│   └── data/country-labels.json   # Nomes e coordenadas de países para o globo
│
├── middleware.ts                  # Protege /(app)/*, /api/pins, /api/theme, /api/photos
├── vercel.json                    # Security headers + redirect / → /login
└── .env.local                     # Variáveis de ambiente (não commitado)
```

---

## Fluxo de Mídia do Google Photos

```
Adicionar foto/vídeo:
  Picker UI → Google Photos Picker API → gphotos://label/sessionId/itemId
  → salvo no banco como MediaItem.url

Exibir:
  gphotos://... → /api/photos/proxy (Edge Runtime)
    ├── Supabase cache (google_photos_url_cache, TTL 45 min)  ← hit: rápido
    │   └── miss: listPickerSessionItems → Google Picker API → upsert cache
    ├── getValidAccessToken → google_tokens (auto-refresh via refresh_token)
    └── fetch(baseUrl=dv|w1600, Bearer token) → stream para o cliente
```

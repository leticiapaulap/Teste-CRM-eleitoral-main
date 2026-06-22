# SIV - Cadastro e Backend

Site estatico com backend em Vercel Functions.

## Stack detectada

- Front-end: HTML, CSS e JavaScript puro.
- Backend existente: Vercel Serverless Functions em `api/`.
- Banco anterior: nenhum.
- ORM anterior: nenhum.
- Banco novo: PostgreSQL no Neon via `DATABASE_URL`.
- ORM novo: nenhum; acesso SQL direto com `pg`, para manter a base simples.
- Rotas: `/api/siv` e uma funcao central `/api/index.js`, com rewrites em `vercel.json`, para ficar dentro do limite do plano Hobby da Vercel.
- Autenticacao: JWT Bearer token com senha criptografada via bcrypt.

## Variaveis de ambiente

Configure localmente e na Vercel:

```env
DATABASE_URL=
JWT_SECRET=
JWT_EXPIRES_IN=7d
APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
STORAGE_PROVIDER=mock
UPLOAD_MAX_SIZE=5242880
UPLOAD_DIR=.uploads/profile-photos
STORAGE_PUBLIC_BASE_URL=
ALLOW_ADMIN_REGISTER=false
ADMIN_EMAIL=
ADMIN_PASSWORD=
ADMIN_NAME=Administrador SIV
ADMIN_PHONE=61999999999
ADMIN_ROLE=EQUIPE
ADMIN_PHOTO_URL=
ADMIN_LOCALIDADE=Distrito Federal
ADMIN_REGIAO_ADMINISTRATIVA=Distrito Federal
```

Use `APP_URL` para o dominio publico. Exemplo futuro:

```env
APP_URL=https://meudominio.com.br
FRONTEND_URL=https://meudominio.com.br
```

## Instalar dependencias

```bash
npm install
```

## Neon

1. Crie um projeto no Neon.
2. Copie a connection string PostgreSQL.
3. Defina `DATABASE_URL` com essa connection string.
4. Rode a migration:

```bash
npm run db:migrate
```

Se preferir executar manualmente:

```bash
psql "$DATABASE_URL" -f db/migrations/001_init.sql
```

## Rodar localmente

Para simular a Vercel:

```bash
npm install
npx vercel dev
```

O front atual continua consumindo `POST /api/siv`. As novas APIs ficam disponiveis em `/api/auth/*`, `/api/admin/*`, `/api/leaders/*`, `/api/map/*` e `/api/upload/*`.

No plano Hobby da Vercel, o limite e de 12 funcoes serverless por deploy. Por isso as APIs novas foram consolidadas em `api/index.js` e roteadas por `vercel.json`; mesmo assim as URLs publicas continuam iguais.

## Deploy na Vercel

1. Importe o projeto na Vercel.
2. Configure as variaveis em Project Settings > Environment Variables.
3. Rode a migration apontando para o Neon antes de usar o sistema.
4. Configure o dominio em Project Settings > Domains.
5. Atualize `APP_URL` e `FRONTEND_URL` para o dominio final.

O deploy usa apenas 2 funcoes serverless:

- `api/siv.js`
- `api/index.js`

## Storage de fotos

`STORAGE_PROVIDER=mock` valida a foto e retorna um caminho mockado, util para desenvolvimento sem storage externo.

`STORAGE_PROVIDER=local` salva em disco somente em desenvolvimento. Nao use em producao na Vercel.

Para producao, conecte um provider externo futuramente, como Vercel Blob, Cloudinary, Supabase Storage ou S3, mantendo o contrato `photoUrl`.

## Endpoints principais

Autenticacao:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

Coordenadores e lideres:

- `GET /api/leaders/me/network`
- `GET /api/leaders/me/referral-link`
- `GET /api/leaders/me/metrics`

Admin:

- `GET /api/admin/leaders`
- `GET /api/admin/users`
- `POST /api/admin/users`
- `GET /api/admin/network`
- `GET /api/admin/leaders/:id/network`
- `GET /api/admin/users/:id`
- `PATCH /api/admin/users/:id`
- `DELETE /api/admin/users/:id`
- `GET /api/admin/metrics`

Mapa:

- `GET /api/map/leaders`
- `GET /api/map/users`
- `GET /api/map/network`
- `GET /api/map/geojson`

Upload:

- `POST /api/upload/profile-photo`

Contato:

- `POST /api/contact/messages`
- `GET /api/contact/messages` somente `EQUIPE`

## Testar no Postman/Insomnia

Upload de foto de perfil:

```http
POST /api/upload/profile-photo
Content-Type: multipart/form-data

photo=@perfil.png
```

Resposta:

```json
{
  "ok": true,
  "photoUrl": "mock://profile-photos/arquivo.png"
}
```

Cadastro:

```http
POST /api/auth/register
Content-Type: application/json
```

```json
{
  "name": "Maria Souza",
  "email": "maria@example.com",
  "phone": "(61) 99999-0000",
  "password": "senha-segura",
  "role": "LIDERES",
  "photoUrl": "mock://profile-photos/perfil.png",
  "localidade": "Taguatinga",
  "regiao_administrativa": "Taguatinga",
  "latitude": -15.835,
  "longitude": -48.056,
  "referralCode": null,
  "consent_accepted": true
}
```

Login:

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "email": "maria@example.com",
  "password": "senha-segura"
}
```

Consultar link de indicacao:

```http
GET /api/leaders/me/referral-link
Authorization: Bearer TOKEN
```

Resposta usa `APP_URL`:

```json
{
  "ok": true,
  "referralCode": "SIVABC12345",
  "referralUrl": "https://meudominio.com.br/cadastro?ref=SIVABC12345"
}
```

Cadastro por indicacao:

```json
{
  "name": "Joao Silva",
  "email": "joao@example.com",
  "phone": "(61) 98888-0000",
  "password": "senha-segura",
  "role": "CADASTRADOS",
  "photoUrl": "mock://profile-photos/joao.png",
  "localidade": "Ceilandia",
  "regiao_administrativa": "Ceilandia",
  "latitude": -15.81,
  "longitude": -48.11,
  "referralCode": "SIVABC12345",
  "consent_accepted": true
}
```

Rede do responsavel:

```http
GET /api/leaders/me/network?format=tree
Authorization: Bearer TOKEN_DO_RESPONSAVEL
```

Rede completa administrativa:

```http
GET /api/admin/network?format=tree
Authorization: Bearer TOKEN_EQUIPE
```

GeoJSON:

```http
GET /api/map/geojson?role=LIDERES
Authorization: Bearer TOKEN_EQUIPE
```

## Backend para mapa satelite do DF

As rotas de mapa retornam dados prontos para o front plotar marcadores em bibliotecas como Leaflet, Mapbox ou Google Maps. Nenhum mapa visual foi criado no front.

Regras:

- `EQUIPE` visualiza tudo, cria, edita, exclui e pode compor email para a lista filtrada no painel.
- `COORDENADORES`, `LIDERES` e `CADASTRADOS` visualizam os proprios dados e a propria sub-rede.
- `CADASTRADOS` visualiza somente quem for cadastrado abaixo dele.
- Envio real de email em massa ainda depende de configurar um provedor SMTP/SendGrid/etc.; por enquanto o painel abre o cliente de email com BCC.

Campos principais retornados por ponto:

```json
{
  "id": "uuid",
  "name": "Maria Souza",
  "role": "LIDERES",
  "localidade": "Taguatinga",
  "regiao_administrativa": "Taguatinga",
  "latitude": -15.835,
  "longitude": -48.056,
  "root_leader_id": "uuid",
  "root_leader_name": "Responsavel",
  "parent_user_id": "uuid",
  "parent_user_name": "Indicador direto",
  "level": 1,
  "created_at": "2026-06-19T10:00:00.000Z"
}
```

Filtros aceitos:

- `role=COORDENADORES`, `role=LIDERES` ou `role=CADASTRADOS`
- `leader_id=uuid`
- `localidade=Taguatinga`
- `regiao_administrativa=Taguatinga`
- `level=1`
- `referralCode=SIVABC12345`
- `from=2026-06-01`
- `to=2026-06-30`

Exemplo de lista para mapa:

```http
GET /api/map/users?regiao_administrativa=Taguatinga
Authorization: Bearer TOKEN
```

Resposta inclui agrupamentos:

```json
{
  "ok": true,
  "items": [],
  "summary": {
    "total": 25,
    "byRegion": [
      { "regiaoAdministrativa": "Taguatinga", "total": 25 }
    ],
    "byLeader": [
      { "leaderId": "uuid", "leaderName": "Maria Souza", "total": 25 }
    ]
  }
}
```

GeoJSON:

```http
GET /api/map/geojson?role=LIDERES
Authorization: Bearer TOKEN
```

Rede de indicacao para mapa:

```http
GET /api/map/network?leader_id=UUID_DO_RESPONSAVEL
Authorization: Bearer TOKEN_EQUIPE
```

## Criar primeiro usuario administrativo

O cadastro publico bloqueia `EQUIPE`. Crie o primeiro admin por SQL controlado ou habilite temporariamente `ALLOW_ADMIN_REGISTER=true` apenas em ambiente seguro, cadastre o admin, e volte para `false`.

Tambem existe um script para criar ou atualizar o primeiro admin sem gravar senha no codigo:

```bash
ADMIN_EMAIL=lelekapaula@hotmail.com ADMIN_PASSWORD=12345678 ADMIN_ROLE=EQUIPE npm run admin:create
```

No PowerShell:

```powershell
$env:ADMIN_EMAIL="lelekapaula@hotmail.com"
$env:ADMIN_PASSWORD="12345678"
$env:ADMIN_ROLE="EQUIPE"
npm run admin:create
```

A senha precisa ter pelo menos 8 caracteres.

## Testes

```bash
npm test
```

Cobertura basica:

- validacao de email, telefone e coordenadas;
- foto opcional para equipe e obrigatoria para coordenadores/lideres/cadastrados;
- geracao de link por `APP_URL`;
- arvore de indicacoes;
- papeis administrativos.

## Observacoes para conectar o front futuramente

- O front atual ainda usa `/api/siv` e nao foi alterado.
- Para usar o novo backend, o front precisara enviar credenciais. A foto e opcional apenas para equipe; coordenadores, lideres e cadastrados precisam enviar foto.
- O cadastro visual atual nao possui campos de email, senha e foto.
- As telas de login, painel administrativo, painel dos responsaveis e mapa ainda precisam ser criadas ou conectadas no front.

# Guests — Sumário Executivo

Modo convidado: visitantes de uma empresa podem se registrar e enviar posts (imagem/vídeo + mensagem) sem criar conta. Autenticação via cookie `guest_entry_id`.

## Responsabilidades

| Aspecto | Responsável |
|---------|-------------|
| Entidade | `GuestEntry` — id, name, email, companyId; @@unique(email, companyId) |
| Entidade | `GuestPost` — id, guestId, message, imageUrl, mediaType (IMAGE/VIDEO) |
| Registro | `registerGuest` — cria GuestEntry + seta cookie |
| Confirmação | `confirmExistingGuest` — guest existente se reconecta (seta cookie) |
| Posts CRUD | `createGuestPost`, `updateGuestPost`, `deleteGuestPost` |
| Admin | `deleteGuestAsAdmin`, `updateGuestAsAdmin`, `deleteGuestPostAsAdmin`, `updateGuestPostAsAdmin`, `toggleGuestMode` |

## Actions (`src/modules/guests/actions/`)

| Action | Guard | Descrição |
|--------|-------|-----------|
| `registerGuest` | Nenhum | Valida empresa com `guestModeEnabled`; se email já existe retorna `existingEntry: true` |
| `confirmExistingGuest` | Nenhum | Busca guest por id + email; seta cookie se match |
| `createGuestPost` | Cookie `guest_entry_id` | Message + imageUrl + mediaType; valida guest existe |
| `updateGuestPost` | Cookie `guest_entry_id` | Atualiza message e/ou imageUrl |
| `deleteGuestPost` | Cookie `guest_entry_id` | Hard delete (verifica ownership) |

## Autenticação

- **Sem NextAuth** — usa cookie HTTP-Only `guest_entry_id` (maxAge: 30 dias)
- Sign-out via `/api/guest/signout` (POST) — deleta o cookie
- Middleware/layout valida cookie para proteger rotas `/{slug}/guest/*`

## Páginas

```
/{slug}/guest           — tela de registro/login de convidado
/{slug}/guest/posts     — listagem de posts do guest (GuestSidebar)
/{slug}/guest/posts/new — criar novo post (upload + mensagem)
```

## Admin (Painel Administrativo)

- `/dashboard-admin/guests` — listagem global de GuestEntries
- `/dashboard-admin/guests/{guestId}/posts` — posts de um guest específico
- `/dashboard-admin/companies/{companyId}/guests` — guests de uma empresa
- `toggleGuestMode` — liga/desliga `company.guestModeEnabled`

## Para usar este módulo, você deve saber

- [ ] `company.guestModeEnabled` deve ser `true` para o registro funcionar
- [ ] Email é unique por empresa (@@unique([email, companyId]))
- [ ] Autenticação é por cookie, NÃO por NextAuth session
- [ ] `registerGuest` retorna `existingEntry: true` se já existe — client mostra tela de confirmação
- [ ] Posts suportam IMAGE e VIDEO (mediaType enum)
- [ ] Admin pode CRUD guests e posts de qualquer empresa

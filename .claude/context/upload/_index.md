# Upload — Sumário Executivo

Upload de mídia para BunnyCDN. Imagens são convertidas para AVIF (quality 80). Vídeos são enviados raw.

## Responsabilidades

| Aspecto | Responsável |
|---------|-------------|
| Imagens | `uploadImage` — converte para .avif via sharp; suporta subpastas (folder: 'avatars') |
| Mídia | `uploadMedia` — image (→AVIF) + video (direto raw); valida tipo e tamanho |

## Actions (`src/modules/upload/actions/`)

| Action | Params | Retorno |
|--------|--------|---------|
| `uploadImage` | `{ file: File, folder?: string }` | `{ ok, url?, error? }` |
| `uploadMedia` | `{ file: File, folder?: string }` | `{ ok, url?, error? }` |

## Configuração (ENV)

```env
BUNNY_HOST=storage.bunnycdn.com
BUNNY_STORAGE_ZONE=janus-media
BUNNY_ACCESS_KEY=xxx
BUNNY_PULL_ZONE=https://cdn.janus.app
```

## Fluxo

```
Client envia File via FormData
  → Server Action recebe File
  → Se imagem: sharp → .avif (quality 80)
  → Se vídeo: buffer direto (raw)
  → PUT https://{BUNNY_HOST}/{STORAGE_ZONE}/{folder}/{uid-timestamp}.{ext}
  → Retorna URL pública: https://{PULL_ZONE}/{folder}/{filename}
```

## Limites

- Imagem: 5MB máximo
- Vídeo: 200MB máximo
- Formato saída imagem: sempre `.avif`
- Nomes: `uid-{Date.now()}.{ext}`

## Onde é usado

- Avatar do usuário (`updateAvatar`) → folder: `avatars`
- DynamicForm (CMS) → tipo `image` e `video` → folder por projeto/página
- GuestPost → imagem/vídeo do post do convidado
- Blog → cover image dos posts

## Para usar este módulo, você deve saber

- [ ] Sempre use `uploadMedia` (suporta image + video); `uploadImage` é image-only
- [ ] URL retornada já é a URL pública do CDN (pull zone)
- [ ] Não há cleanup automático de arquivos antigos
- [ ] Conversion para AVIF pode falhar com formatos exóticos (TIFF raw, etc.)

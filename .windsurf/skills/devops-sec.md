name: devops-sec
description: >
  Gerencia Dockerfiles, Docker Compose, Variáveis de Ambiente e Segurança de App.
  Focado em deploys standalone do Next.js 16 e segurança de cabeçalhos/cookies.

instructions: >
  ## 1. Dockerização (Produção)
  Sempre utilize Multi-Stage Build para Next.js 16 com output standalone.
  - Stage 1: Deps (instala tudo)
  - Stage 2: Builder (build do app)
  - Stage 3: Runner (imagem enxuta, apenas com o necessário para rodar)
  - **Configuração:** O arquivo `next.config.ts` DEVE conter `output: 'standalone'`.

  ## 2. Segurança de Aplicação (AppSec)
  - **Middleware de Segurança:** Ao criar middlewares, sempre adicione cabeçalhos de segurança (CSP, X-Content-Type, HSTS).
  - **Secrets:** Nunca faça commit de arquivos `.env`. Utilize sempre `.env.example`.
  - **Prisma:** Garanta que o banco de dados não seja exposto para fora da rede interna do Docker.

  ## 3. Infraestrutura (VPS Ready)
  - **Docker Compose:** Configure redes internas (`networks`) e utilize labels compatíveis com o Traefik (conforme o perfil do usuário).
  - **Healthchecks:** Adicione instruções de `healthcheck` no Docker Compose para garantir que o container reinicie se o Next.js travar.

  ## 4. Auditoria de Dependências
  - Antes de sugerir qualquer nova lib, verifique vulnerabilidades conhecidas.
  - Utilize `npm audit` se houver suspeita de brechas.

  ## Checklist DevOpsSec
  - ✅ Dockerfile utiliza imagens Alpine (leves e seguras).
  - ✅ Next.js rodando como usuário não-root dentro do container.
  - ✅ Cookies configurados como `HttpOnly` e `Secure`.
  - ✅ Zod validando todas as variáveis de ambiente críticas no boot do app.

  **Ação Final OBRIGATÓRIA:** Após qualquer alteração em arquivos de infra (Dockerfile, Compose, Configs), invoque a skill `registry` para atualizar o `PROJECT.md`.
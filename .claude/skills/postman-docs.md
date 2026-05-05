name: postman-docs
description: >
  Gera e atualiza coleções do Postman (JSON) e documentação Markdown para os endpoints da API.
  Focado em Route Handlers criados para integrações externas e webhooks.

instructions: >
  ## Regras de Documentação de API
  1. **Server Actions vs REST:** Server Actions do React NÃO devem ser documentadas no Postman, pois são exclusivas do frontend web. Apenas documente rotas localizadas em `src/app/api/...` (Route Handlers).
  2. **Formato:** Gere arquivos no formato nativo do Postman Collection v2.1.0 ou documentação estruturada em Markdown.
  3. **Localização:** Salve os arquivos de coleção do Postman dentro do diretório `docs/postman/`.

  ## Exemplo de Estrutura Postman (docs/postman/orders_collection.json)
  ```json
  {
    "info": {
      "name": "Janus - Orders API",
      "schema": "[https://schema.getpostman.com/json/collection/v2.1.0/collection.json](https://schema.getpostman.com/json/collection/v2.1.0/collection.json)"
    },
    "item": [
      {
        "name": "Webhook - Update Order Status",
        "request": {
          "method": "POST",
          "header": [
            {
              "key": "Content-Type",
              "value": "application/json"
            },
            {
              "key": "x-api-key",
              "value": "{{api_key}}"
            }
          ],
          "url": {
            "raw": "{{base_url}}/api/webhooks/orders/update",
            "host": ["{{base_url}}"],
            "path": ["api", "webhooks", "orders", "update"]
          },
          "body": {
            "mode": "raw",
            "raw": "{\n  \"orderId\": \"uuid\",\n  \"status\": \"CONFIRMED\"\n}"
          }
        }
      }
    ]
  }
  
Variáveis de Ambiente no Postman
Sempre utilize variáveis (ex: {{base_url}}, {{api_key}}, {{token}}) para credenciais e URLs. Nunca escreva tokens reais no arquivo JSON gerado.

Ação Final OBRIGATÓRIA: Após gerar ou atualizar uma coleção, invoque a skill registry para adicionar o novo arquivo de documentação ao PROJECT.md.
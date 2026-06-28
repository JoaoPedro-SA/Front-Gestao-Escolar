# Front Gestao Escolar

Frontend estatico para consumir as APIs do Sistema Escolar.

## Desenvolvimento Local

```bash
python -m http.server 5003
```

Acesse:

```text
http://localhost:5003
```

Para testar localmente com outras URLs, edite temporariamente `config.js` ou gere a pasta `public` com as variaveis desejadas.

## Render

Este projeto deve ser criado no Render como **Static Site**.

Configuracao principal:

- Build Command: definido em `render.yaml`
- Publish Directory: `public`

O build gera:

- `public/index.html`
- `public/config.js`
- `public/static/app.js`
- `public/static/styles.css`
- `public/health`

Variaveis usadas no build:

- `GESTAO_API_BASE_URL`
- `RESERVA_API_BASE_URL`
- `ATIVIDADE_API_BASE_URL`

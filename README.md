# Front Gestao Escolar

Frontend estatico para consumir e operar as APIs do Sistema Escolar.

Recursos principais:

- Alternancia visual entre APIs locais e APIs hospedadas no Render.
- Painel de status para gestao, reservas e atividades.
- Cadastros de professores, turmas, alunos, reservas e atividades.
- Busca global nas tabelas.
- Resumo operacional com contadores, proxima reserva e media de notas.

## Desenvolvimento Local

```bash
python -m http.server 5003
```

Acesse:

```text
http://localhost:5003
```

Para alternar entre APIs da nuvem e APIs locais, use o seletor **Ambiente** na tela ou edite `config.js`:

```js
apiTarget: "local"
```

Use `apiTarget: "render"` para voltar para as APIs hospedadas no Render. Se precisar trocar apenas uma URL, tambem pode definir `gestaoApiUrl`, `reservaApiUrl` ou `atividadeApiUrl` no `config.js`.

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

- `API_TARGET`
- `GESTAO_API_BASE_URL`
- `RESERVA_API_BASE_URL`
- `ATIVIDADE_API_BASE_URL`

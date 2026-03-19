# evolutionapinex

Deploy do **Evolution API** no **Render**.

## Endpoints (Evolution)

Os endpoints são os do próprio Evolution API. O healthcheck do Render usa `GET /health`.

## Deploy no Render

Este repo inclui `Dockerfile` e `render.yaml` para subir **a imagem oficial** `atendai/evolution-api`.

No Render, configure as env vars:

- `AUTHENTICATION_API_KEY` (obrigatório): sua chave (vai no header `apikey`)
- `SERVER_URL` (recomendado): a URL pública do Render (ex.: `https://seu-servico.onrender.com`)

O `SERVER_PORT` já está fixado em `10000` para compatibilidade com o Render.

## Persistência (importante)

O `render.yaml` cria um disco em `/evolution` (inclui `store` e `instances`), para evitar perder sessões/instâncias em restart.

## Rodar local (Docker)

```bash
docker run -p 8080:8080 -e AUTHENTICATION_API_KEY=change-me atendai/evolution-api
```


# BV Seguros

Repositório com dois projectos independentes:

- **Site institucional** (esta pasta) — HTML/CSS/JS estático, sem build.
- **[`crm/`](crm/)** — CRM interno (leads, clientes, apólices), React + Vite + Supabase.

Ver [`documento.md`](documento.md) para a visão geral do projecto e o que ainda está
por confirmar com o cliente, e [`AGENTS.md`](AGENTS.md) para as convenções (regras
específicas do CRM em [`crm/AGENTS.md`](crm/AGENTS.md)).

## Site institucional

Requer [Node.js](https://nodejs.org) 18+ só para o servidor de desenvolvimento (o site
publicado não tem dependências nem build).

```bash
npm start
```

Abre em <http://localhost:8090>.

Conteúdo actual (morada, telefone, texto institucional) é placeholder — ver
`documento.md` secção 4 e os avisos `[por preencher]` no próprio `index.html`.

### Publicar (Vercel)

Projecto Vercel com **Root Directory = `.`** (raiz). `vercel.json` já define
`"framework": null` e `"outputDirectory": "."`. O `.vercelignore` impede que
`server.js` seja interpretado como função serverless — ver comentário no ficheiro.

### Publicar (cPanel)

Enviar para `public_html`: `index.html`, `styles.css`, `script.js`, `robots.txt`,
`images/`, `.htaccess`. Não enviar `server.js`, `package.json` nem os `.md`.

## CRM

Ver [`crm/README.md`](crm/README.md) — instalação, configuração do Supabase e deploy.

```bash
cd crm
npm install
npm run dev
```

Abre em <http://localhost:5183>.

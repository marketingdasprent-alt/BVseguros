# AGENTS.md — BV Seguros (monorepo)

Fonte de verdade para developers humanos e agentes IA (Claude, Codex, Cursor, etc.).
Regra do AGENTS.md: **o ficheiro mais próximo do que estás a editar prevalece.**

Este repositório tem três projectos independentes, cada um com o seu deploy:

| Pasta | O quê | Stack | Regras | Porta de dev |
| --- | --- | --- | --- | --- |
| `/` (raiz) | Site institucional público, v1 | HTML + CSS + JS nativo, sem build | este ficheiro | 8090 |
| `site-blueprint/` | Site institucional público, v2 (mesmo conteúdo, outra fundação) | React + TS + Vite + Tailwind v4, sobre o Web Blueprint | [`site-blueprint/BLUEPRINT.md`](site-blueprint/BLUEPRINT.md) + `site-blueprint/docs/` | 5190 |
| `crm/` | CRM interno (leads, clientes, apólices) | React 18 + TS + Vite + Tailwind + Supabase | [`crm/AGENTS.md`](crm/AGENTS.md) | 5183 |

`site-blueprint/` existe porque a v1 (HTML/CSS/JS à mão) não satisfez visualmente;
`site-blueprint/` reconstrói o mesmo conteúdo sobre uma fundação com design tokens e
componentes já testados. As duas versões coexistem até se decidir qual fica — ver
`documento.md` secção 4. **Não apagar a v1 sem essa decisão ser tomada
explicitamente.**

Ver [`documento.md`](documento.md) para a visão geral do projecto, o que está por
confirmar com o cliente e o estado actual.

---

## Regras gerais (aplicam-se aos três projectos)

1. **Não misturar os projectos.** Uma alteração num não mexe nos outros dois, salvo
   pedido explícito. São deploys Vercel separados.
2. **Não inventar dados reais da empresa** (morada, telefone, texto institucional,
   ramos de seguro vendidos) — usar o que já está marcado como placeholder
   (`[por preencher]`, classe `.por-preencher`) até o cliente confirmar. Ver
   `documento.md` secção 4.
3. **PT-PT** em todo o texto visível e nomes de variáveis/domínio.
4. Comentário curto, só o "porquê". Nunca bloco de texto tipo relatório.
5. Antes de remover algo, confirmar — não eliminar funcionalidades sem aprovação
   explícita.

---

## Site institucional v1 (raiz) — convenções

Site estático de página única, sem passo de build, seguindo o mesmo padrão do
`AbreuEPereira` e do `Sentinela100Erro` (outros projectos da mesma equipa).

### Estrutura

```
index.html      ← estrutura da página (secções: hero, sobre, serviços, contacto)
styles.css      ← estilos (custom properties em :root para cores)
script.js       ← comportamento mínimo, sem dependências
server.js       ← servidor de dev nativo (node, sem npm install), porta 8090
package.json    ← só scripts (start/dev → node server.js)
images/         ← imagens usadas pelo site (cópia da fonte em brand/)
robots.txt, vercel.json, .vercelignore, .htaccess  ← deploy (Vercel + cPanel)
```

### Regras

- **Sem framework, sem build step.** Se uma feature parecer justificar React/Vite,
  discutir antes de introduzir — é uma decisão de arquitectura, não trivial.
- **Cabeçalhos de segurança vivem em três sítios e têm de ficar iguais:**
  `index.html` (meta CSP, se existir), `server.js` (`SECURITY_HEADERS`), `vercel.json`
  (`headers`) e `.htaccess` (mod_headers). Mexeu num, mexe nos outros três.
- **`.vercelignore` é essencial**, não cosmético — sem ele o Vercel tenta correr
  `server.js` como função serverless (ver comentário no próprio ficheiro). Inclui
  `crm/` e `site-blueprint/` para não interferir no deploy do site v1.
- **`server.js` bloqueia `/crm/`** propositadamente — o CRM não vive neste servidor.
- Cores em custom properties CSS (`:root`), não hardcoded espalhadas pelo código.
- Formulário de contacto usa `action="mailto:..."` (sem backend) — funciona em
  qualquer alojamento estático, mas depende do visitante ter cliente de email
  configurado. Trocar por Formspree/função serverless é uma decisão a validar com o
  cliente, não a fazer por conta própria.
- Placeholders de conteúdo têm de ficar **visualmente marcados** (classe
  `.por-preencher` / `.por-preencher-inline`) até serem substituídos — nunca publicar
  dados inventados como se fossem reais.

### Antes de declarar tarefa concluída (agentes IA)

1. `npm start` corre sem erros e a página carrega em `http://localhost:8090`.
2. Testar visualmente no browser — HTML/CSS não tem verificação de tipos que apanhe
   erros por ti.
3. Se mexeu em cabeçalhos de segurança, confirmar que os três sítios (secção acima)
   ficaram consistentes.
4. Sem `console.log` esquecido, sem credenciais, sem dados reais inventados.

---

_Última actualização: 2026-09-18 · BV Seguros_

# Prompt master: links de email e sessão no CRM

> Para aprovação antes de implementar. Âmbito: só `crm/` (e os templates em
> `crm/supabase/emails/`). Nada muda no site.

## 1. O problema relatado

Um administrador com sessão iniciada no CRM abriu, no mesmo browser, o link do
convite enviado para outra pessoa ("luiz"). Sem definir senha e sem confirmar
nada, a sessão do administrador foi substituída pela do "luiz". Fechou a página
e ficou com sessão do "luiz".

Isto não pode acontecer. Um clique num link de email nunca deve, por si só,
iniciar sessão nem trocar a sessão de quem já está no CRM.

## 2. Porque acontece (confirmado no código)

1. **O link verifica o token logo no clique.** Os templates usam
   `{{ .ConfirmationURL }}`, que aponta para `.../auth/v1/verify`. A Supabase
   consome o token nesse pedido GET, cria a sessão e redireciona para
   `crm.bvseguros.pt/#access_token=...&type=invite`.
2. **O cliente guarda essa sessão sem perguntar.** `src/lib/supabase.ts` cria o
   cliente com `persistSession: true` e `detectSessionInUrl` ativo por omissão:
   lê o `#access_token` e grava-o em `localStorage` na mesma chave da sessão do
   administrador. Os outros separadores abertos mudam também (evento `storage`).
3. **O "estou a definir senha" só vive no URL.** `authFlowType` é lido do hash
   no arranque (`src/lib/supabase.ts`) e decide em `App.tsx` se mostra
   `DefinirSenha`. Ao fechar e reabrir o CRM, o hash já não existe: a pessoa
   entra no CRM completo, sem nunca ter definido senha.
4. **O convite fica dado como aceite.** O clique preenche `email_confirmed_at`.
   `api/utilizadores.js` passa a dizer "Esta pessoa já aceitou o convite" e não
   deixa reenviar. A conta fica ativa sem senha.
5. **Os scanners de links consomem o token.** Filtros de email (Outlook Safe
   Links, antivírus corporativos) abrem o link para o analisar. Como é um GET que
   consome o token, a pessoa chega a "link expirado", ou pior, a sessão é criada
   no scanner.

O mesmo mecanismo existe em **todos** os links de email da autenticação:
convite, recuperar senha, alterar email e confirmar registo.

## 3. Comportamento pretendido

| Situação | Tem de acontecer |
| --- | --- |
| Clicar no link (qualquer tipo) | Abre uma página do CRM **sem** consumir o token nem criar sessão. |
| Fechar a página sem concluir | Nada muda. A sessão anterior (se havia) continua igual; o link continua válido até expirar. |
| Já há sessão de outra pessoa no browser | Aviso explícito: "Tem sessão iniciada como X. Para continuar como Y, a sessão de X é terminada." Botões "Continuar como Y" e "Cancelar". Sem escolha, nada muda. |
| Convite / recuperar senha | A sessão nova só é gravada **depois** de a senha ser definida com sucesso. |
| Falha a meio (senha recusada, rede) | Nenhuma sessão fica gravada. Mensagem clara e possibilidade de tentar de novo enquanto o link for válido. |
| Link expirado ou já usado | Mensagem em PT ("Este link já foi usado ou expirou") e o caminho certo: pedir novo convite ao admin, ou "Esqueci a senha". |
| Link antigo (formato atual, `#access_token`) | Ignorado: não cria sessão. Mostra a mesma mensagem de link expirado. |
| Alterar email | Confirmar o novo email não troca a sessão de ninguém; no fim pede para entrar com o email novo. |
| Outro separador aberto | Nunca muda de utilizador em silêncio. Se a sessão mudar noutra janela, a app recarrega e mostra quem está agora com sessão, sem dados do utilizador anterior em memória. |

## 4. Solução proposta

### 4.1 Templates: link para o CRM, não para a Supabase

Trocar `{{ .ConfirmationURL }}` (botão e link de recurso) por um link para uma
página do CRM com o `token_hash`:

| Template | Link |
| --- | --- |
| `convite.html` | `{{ .SiteURL }}/acesso?token_hash={{ .TokenHash }}&type=invite` |
| `recuperar-senha.html` | `{{ .SiteURL }}/acesso?token_hash={{ .TokenHash }}&type=recovery` |
| `alterar-email.html` | `{{ .SiteURL }}/acesso?token_hash={{ .TokenHash }}&type=email_change` |
| `confirmar-registo.html` | `{{ .SiteURL }}/acesso?token_hash={{ .TokenHash }}&type=signup` |

Abrir a página é um GET que não consome nada: os scanners deixam de estragar o
link. `{{ .SiteURL }}` é o Site URL da Supabase (`https://crm.bvseguros.pt`).
Confirmar na documentação da Supabase o `type` exato do `verifyOtp` para cada
caso antes de implementar.

### 4.2 Página `/acesso` com cliente isolado

Nova página `src/pages/Acesso.tsx`, fora da `AreaPrivada`:

- Usa um **segundo cliente Supabase só para esta página**, com
  `persistSession: false` (sessão só em memória). O `verifyOtp` e o
  `updateUser({ password })` correm nesse cliente; o `localStorage` e a sessão do
  administrador ficam intactos até ao fim.
- Ordem no envio do formulário: `verifyOtp({ token_hash, type })` → `updateUser({ password })`
  → `rpc('senha_trocada')` → só então a sessão passa para o cliente principal
  (`supabase.auth.setSession(...)`, depois de terminar a sessão anterior se a
  pessoa escolheu "Continuar como Y") → entrar no CRM.
- Se qualquer passo falhar depois do `verifyOtp`, termina a sessão em memória
  (`signOut({ scope: 'local' })` no cliente isolado) e não grava nada.
- Lê a sessão atual do cliente principal só para mostrar o aviso "Tem sessão
  iniciada como X".
- `email_change`: botão "Confirmar novo email" (sem campo de senha), no cliente
  isolado; no fim, mensagem "Email alterado. Entre com o novo email." e não
  grava sessão.
- `signup`: o CRM não tem registo público. Confirmar que "Allow new users to sign
  up" está desligado na Supabase; se estiver, a página trata o tipo como os
  restantes (confirma sem iniciar sessão).

### 4.3 Cliente principal mais fechado

- `src/lib/supabase.ts`: `detectSessionInUrl: false`. Nenhum `#access_token` no
  URL volta a criar sessão. O `authFlowType` lido do hash e o ramo
  `authFlowType === 'invite' || 'recovery'` em `App.tsx` saem (substituídos pela
  página `/acesso`).
- `pedirRecuperacaoSenha` (`useAuth.tsx`): o `redirectTo` deixa de ser preciso
  (o link é montado no template); manter `{{ .SiteURL }}` como fonte única.
- `useAuth.tsx`: se o `onAuthStateChange` trouxer um utilizador diferente do que
  está carregado (outro separador), `window.location.reload()` em vez de trocar
  o perfil por baixo da app.

### 4.4 Defesa no servidor: convite sem senha não entra

- `api/utilizadores.js`: ao convidar (sem senha escolhida pelo admin), marcar
  `deve_trocar_senha = true`, como já acontece com a senha definida pelo admin.
  Assim, mesmo que exista uma sessão de convite por outro caminho (links antigos
  já enviados), o `App.tsx` mostra `DefinirSenha obrigatoria` e não o CRM.
- Migração `supabase/migrations/2026-10-01_convite_sem_senha.sql` (e o bloco em
  `schema.sql`): marcar `deve_trocar_senha = true` nos perfis cujo utilizador foi
  convidado e nunca definiu senha, para cobrir os convites já enviados. Definir
  com rigor como se identifica "nunca definiu senha" (por exemplo, sem
  `senha_definida` em `eventos_acesso` e com `invited_at`), testado no `test:db`.
- "Reenviar convite": aceitar reenviar quando a pessoa clicou no link mas nunca
  definiu senha (hoje dá 409 "já aceitou o convite").

## 5. Casos a validar (todos, antes de dar por concluído)

Testar em `crm.bvseguros.pt` (ou num deploy de pré-visualização), com dois
utilizadores reais de teste, A (admin) e B (convidado):

1. A com sessão; abrir o convite de B no mesmo browser; **fechar sem fazer nada**:
   A continua com sessão, nos dois separadores.
2. Igual a 1, mas **Cancelar** no aviso: A continua; o link de B continua válido.
3. Igual a 1, mas **Continuar como B** e definir senha: sessão de B; a de A
   terminou; ao reabrir, entra B.
4. Sem sessão; abrir o convite de B; fechar sem definir senha; reabrir o CRM:
   mostra o login. B não entra sem senha.
5. Convite: senha recusada (curta, diferente da confirmação): nenhuma sessão gravada.
6. Convite já usado / expirado: mensagem em PT, sem sessão, com o caminho certo.
7. Link do formato antigo (`#access_token=...&type=invite`): não cria sessão.
8. Recuperar senha com A com sessão e o link de B: mesmos resultados de 1 a 3.
9. Recuperar senha do próprio A, com A com sessão: pode definir a nova senha; no
   fim continua A.
10. Alterar email: confirmar o novo email não troca a sessão aberta.
11. Dois separadores com A; login de B noutro separador: o primeiro recarrega e
    mostra B (ou o login), nunca dados de A com sessão de B.
12. Terminar sessão limpa tudo: voltar atrás no browser não mostra dados.
13. Link aberto antes por um "scanner" (pedido GET à página `/acesso`, sem
    submeter): o link continua a funcionar para a pessoa.
14. Admin "Definir senha" para B (já existente): B entra com essa senha e é
    obrigado a trocá-la; a sessão do admin não muda.
15. Reenviar convite a quem clicou mas nunca definiu senha: permitido.

Automatizar o que der em teste (`vitest` para a lógica de `/acesso` com o cliente
simulado, `test:db` para a migração). Os casos com browser e email real ficam numa
lista no PR, marcados um a um.

## 6. Ordem e impacto

1. Código: `Acesso.tsx`, `supabase.ts`, `App.tsx`, `useAuth.tsx`,
   `api/utilizadores.js`, migração + `schema.sql`, testes.
2. Templates em `crm/supabase/emails/` com o link novo.
3. Deploy do CRM.
4. Correr a migração no SQL Editor.
5. Colar os quatro templates novos na Supabase (o utilizador).
6. Reenviar os convites pendentes (os já enviados usam o formato antigo, que
   deixa de iniciar sessão).
7. Validar os 15 casos.

Entre 3 e 5, os links novos ainda não existem e os antigos já não iniciam
sessão: convites e recuperações enviados nesse intervalo não funcionam. Fazer 3 a
5 seguidos, em poucos minutos.

## 7. Fora de âmbito

Sem alterações ao site, às permissões, ao RLS das tabelas de negócio nem ao
desenho dos emails (só o link muda).

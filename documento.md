# BV Seguros — Documento do Projecto

> **Estado:** arranque. Este documento e o [`AGENTS.md`](AGENTS.md) são o primeiro
> commit do repositório, escritos antes de qualquer pedido de "criar o CRM do zero" —
> por pedido do João, para que o Claude/Codex tenham contexto e regras antes de gerar
> código.

## 1. O que é a BV Seguros

Corretora de seguros — "**BV Seguros · Seguros e Soluções**". Logótipo em
[`brand/logo-bv-seguros.png`](brand/logo-bv-seguros.png): escudo azul-marinho com
check e casa, comunicando protecção patrimonial/residencial.

Ainda por confirmar com o cliente:

- Ramos de seguro que a corretora efectivamente vende (auto, vida, saúde,
  multirriscos habitação, acidentes de trabalho, ...)
- Morada, NIF, contactos oficiais
- Se já existe site institucional/domínio, ou se este projecto também o inclui
- Seguradoras parceiras (para eventual integração ou apenas registo manual)

## 2. Objectivo do projecto

Construir um **CRM de gestão de leads e clientes** para a equipa comercial da BV
Seguros. Inferido do padrão que a equipa (marketingdasprent) já construiu para outros
clientes — nomeadamente `razao-dinamica/crm` — não de um requisito ainda escrito pelo
cliente. Funcionalidades prováveis, por analogia:

- Pipeline de leads em Kanban (novo → contactado → proposta enviada → convertido/perdido)
- Ficha de cliente e apólices associadas
- Registo de conversas (possivelmente integração WhatsApp, como no `razao-dinamica/crm`)
- Gestão de utilizadores internos (mediadores/corretores) com permissões
- Dashboard com métricas de conversão e carteira

**Antes de implementar qualquer uma destas**, confirmar o âmbito real com o
cliente/João — a lista acima é ponto de partida, não especificação fechada.

## 3. Arquitectura

```
Page (src/pages/*.tsx)              ← compõe layout + componentes + hooks
  └─ Component (src/components/**)  ← UI, props in/out
      └─ Hook (src/hooks/use*.ts)   ← acesso a dados, mutations
          └─ src/lib/supabase.ts    ← cliente Supabase
              └─ Supabase + RLS     ← segurança real, dados de clientes/apólices
```

Detalhe completo de convenções, nomenclatura e regras para agentes IA em
[`AGENTS.md`](AGENTS.md).

## 4. Stack tecnológico

| Camada          | Escolha                          | Porquê                                                    |
| ----------------- | ----------------------------------- | -------------------------------------------------------------- |
| Frontend          | React 18 + TypeScript + Vite        | Stack mais recente já usada pela equipa em CRMs (`razao-dinamica/crm`) |
| Estilo            | Tailwind CSS                        | Idem                                                            |
| Routing           | React Router                        | Idem                                                            |
| Dados/Auth        | Supabase (Postgres + Auth + RLS)    | Idem — evita reinventar auth e backend                          |
| Drag-and-drop     | `@dnd-kit` (se houver Kanban)       | Já usado em `razao-dinamica/crm` para o pipeline de leads       |
| Deploy            | Vercel                              | Padrão da equipa para todos os projectos actuais                |

**Não** inclui TanStack Query nem Capacitor — esses vêm de um exemplo de `agents.md`
de outro projecto (WeGest), com stack diferente. Ver [`AGENTS.md`](AGENTS.md) secção 0
para o raciocínio completo.

## 5. Estrutura de pastas planeada

```
BVseguros/
├── AGENTS.md              ← regras para agentes IA
├── documento.md            ← este ficheiro
├── brand/                  ← logótipo e activos de marca
├── src/
│   ├── pages/               ← Dashboard, Leads, Clientes, Apolices, Login, ...
│   ├── components/
│   │   ├── ui/               ← primitivos reutilizáveis
│   │   └── crm/               ← componentes específicos do domínio
│   ├── hooks/                ← acesso a dados (useLeads, useAuth, ...)
│   ├── lib/                  ← cliente Supabase, tipos, lógica de negócio
│   └── assets/
├── package.json
├── vite.config.ts
└── vercel.json
```

Ainda não criado — este documento descreve o que será gerado quando o pedido
"criar o CRM" for feito.

## 6. Por decidir antes de codificar features

- [ ] Confirmar ramos de seguro e vocabulário de domínio (ver `AGENTS.md` secção 3)
- [ ] Confirmar se há integração WhatsApp desde o início ou fica para fase 2
- [ ] Perfis de utilizador e permissões (admin, mediador, ...)
- [ ] Se existirá também um site institucional público (como
      `AbreuEPereira`/`Sentinela100Erro`) além do CRM, ou só o CRM
- [ ] Nome de domínio e conta Vercel/Supabase a usar

## 7. Próximos passos

1. Validar este documento e o `AGENTS.md` com o João/cliente.
2. Confirmar respostas à secção 6.
3. Só então: scaffold do projecto Vite + criação do schema Supabase inicial (tabelas
   `leads`, `clientes`, `apolices` com RLS desde a primeira migration).

---

_Última actualização: 2026-09-18._

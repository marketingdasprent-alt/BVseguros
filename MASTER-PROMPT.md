# Master Prompt: Starting a New Project on Web Blueprint

## Blueprint vs. Creative Direction

**Blueprint = HOW to build correctly.** Containers, tokens, component
contracts, accessibility, responsive strategy, architecture. Defined in
`BLUEPRINT.md` and `docs/`. Stays constant across projects.

**Creative Direction = HOW the project should look.** Palette,
typography, tone, composition, motion personality, Hero treatment.
Defined per project, below. Changes completely from project to project.

Never let one substitute for the other: a strict Creative Direction
doesn't relax the accessibility baseline; a permissive Blueprint isn't
license to skip having a Creative Direction.

## New project brief

Fill this out to start a new project. An AI agent (or a person) should
treat it as configuration, not as prose to interpret loosely.

```
PROJECT NAME:         BV Seguros
PROJECT TYPE:         corporate (corretora de seguros: confiável, próxima,
                       sem o registo frio de banca/fintech)
INDUSTRY:             Seguros (mediação/corretagem)
LANGUAGE:             pt-PT
TARGET AUDIENCE:      Famílias e pequenas empresas em Portugal à procura de
                       seguro auto, vida, saúde, habitação ou acidentes de
                       trabalho
PRIMARY GOAL:         Gerar pedidos de contacto/proposta (o site alimenta o
                       CRM em crm/, não vende diretamente)

VISUAL DIRECTION:     Profissional e claro, sem jargão financeiro nem
                       linguagem de startup. Navy sóbrio, muito espaço
                       branco, hierarquia óbvia.
DESIGN REFERENCES:    Nenhuma fornecida pelo cliente ainda. Direção acima
                       inferida do sector e do logótipo existente.
BRAND COLORS:         #184070 (navy do logótipo), única cor de marca
                       confirmada; secondary/accent são derivações
                       sistemáticas dela e do neutro, não cores inventadas
                       (ver DECISIONS.md)
TYPOGRAPHY:           Plus Jakarta Sans (display) + Inter (body), via Google
                       Fonts: mesma tipografia já usada no CRM (crm/), para
                       consistência de marca entre as duas partes
DESIRED PERSONALITY:  Confiável, próxima, clara. Nem corporativo frio nem
                       startup descontraída

TECH STACK:           React + TypeScript (strict) + Vite + Tailwind CSS v4
                       (default, sem alterações)
REQUIRED FEATURES:    Hero, Sobre, Seguros (6 ramos), Porquê a BV, Contacto
                       (formulário mailto:), CookieConsent + páginas legais
                       (Privacy/Terms/Cookies): RGPD real
INTEGRATIONS:         Nenhuma ainda (sem GA4/conta de Ads). O default-denied
                       do Consent Mode v2 já deixa isso pronto para quando
                       existir
RESTRICTIONS:         Não inventar morada, telefone, texto institucional,
                       estatísticas ou ano de fundação. Usar
                       `PorConfirmar`/`[por confirmar]` até o cliente
                       confirmar (ver Home.tsx e as páginas legais)
```

Ver [`documento.md`](documento.md) para o estado geral do projeto BV Seguros
(este site na raiz, CRM em `crm/`).

## What an agent does with this brief

1. Set `LANGUAGE` once, at the start, and never mix variants afterward.
2. Translate `BRAND COLORS` / `TYPOGRAPHY` into `src/styles/tokens.css`:
   replace the placeholder palette's *values*, keep the token *names*.
   Re-check contrast after the swap (see
   `docs/accessibility.md#contrast`).
3. Let `PROJECT TYPE` and `DESIRED PERSONALITY` drive Level 4 (Hero
   composition, imagery, motion): this is exactly the layer that
   should look different for a luxury brand vs. a SaaS dashboard vs. an
   experimental portfolio, even though both sit on the same Container/
   Section/token system underneath.
4. Run every new visual decision through the test in
   `docs/anti-ai.md#the-design-decision-test` before adding it.
5. Build only what `REQUIRED FEATURES` actually calls for: see
   `docs/design-system.md#not-yet-implemented` for the components not
   yet built, and build them when a real requirement needs them, not
   preemptively.
6. Never invent content to fill `RESTRICTIONS` gaps: placeholder
   content stays visibly a placeholder (`BLUEPRINT.md#content-integrity`).

## Quality bar before calling a project (or this Blueprint) done

- Would this hold up for a corporate site? A luxury site? A portfolio?
  A SaaS product? An experimental 3D/WebGL experience?
- Is horizontal alignment consistent across every section?
- Is responsive behavior consistent, validated at the checkpoints in
  `docs/responsive.md`?
- Are arbitrary, non-token values close to zero?
- Would a change scoped to one section stay scoped to one section?
- Is reuse happening before creation?
- Is the component count proportional to actual need, not padded?
- Are dependencies each individually justified?
- Does it avoid the default AI look (`docs/anti-ai.md`)?
- Does it still allow a strong, specific creative direction?
- Is the declared language consistent throughout?
- Could another agent, with no prior context, pick this up and
  understand it from `BLUEPRINT.md` + `docs/` alone?
- Would it stay sustainable after dozens more changes?
- Are justified exceptions documented (`DECISIONS.md` Override System)
  rather than silently overriding the rules?
- Is it simple enough to actually get used, rather than admired and
  ignored?

If the answer to any of these is no, that's what to fix before calling
the work finished.

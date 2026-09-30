// Testa a base de dados num Postgres local (PGlite), sem tocar no Supabase: `npm run test:db`.
// Cenário A: projeto novo só com schema.sql. Cenário B: produção de 23/09 + migrações pela
// ordem "depois de ..." de cada ficheiro. Os dois têm de dar a mesma estrutura e as mesmas regras.
import { PGlite } from '@electric-sql/pglite'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const AQUI = dirname(fileURLToPath(import.meta.url))
const SUPA = join(AQUI, '..')
const MIG = join(SUPA, 'migrations')
const ler = (f) => readFileSync(f, 'utf8')

// O mínimo que o Supabase já traz: roles, auth.users, auth.uid() e os grants por defeito.
const STUB = `
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema auth;
grant usage on schema auth to anon, authenticated, service_role;
create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb default '{}'::jsonb,
  invited_at timestamptz, email_confirmed_at timestamptz, last_sign_in_at timestamptz, created_at timestamptz default now());
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
`

const oks = []
const falhas = []
const ok = (m) => oks.push(m)
const falha = (m) => falhas.push(m)

// Ordem pela cadeia "depois de X.sql" dos cabeçalhos; tem de ser uma linha única, sem ramos.
function ordemMigracoes() {
  const ficheiros = readdirSync(MIG).filter((f) => f.endsWith('.sql'))
  const anterior = Object.fromEntries(ficheiros.map((f) => [f, ler(join(MIG, f)).slice(0, 600).match(/depois de (\S+\.sql)/)?.[1] ?? null]))
  const primeiros = ficheiros.filter((f) => !anterior[f])
  if (primeiros.length !== 1) throw new Error(`Só a primeira migração pode não ter "depois de ...": ${primeiros.join(', ')}`)
  const ordem = [primeiros[0]]
  while (ordem.length < ficheiros.length) {
    const seguintes = ficheiros.filter((f) => anterior[f] === ordem.at(-1))
    if (seguintes.length !== 1) throw new Error(`Depois de ${ordem.at(-1)} esperava uma migração, encontrei: ${seguintes.join(', ') || 'nenhuma'}`)
    ordem.push(seguintes[0])
  }
  return ordem
}

async function novaBase(ficheiros) {
  const db = new PGlite()
  await db.exec(STUB)
  for (const [nome, sql] of ficheiros) {
    try { await db.exec(sql) } catch (e) { throw new Error(`Erro a aplicar ${nome}: ${e.message}`) }
  }
  return db
}

const CATALOGO = {
  colunas: `select table_name||'.'||column_name||' '||data_type||' null='||is_nullable||' def='||coalesce(column_default,'') x from information_schema.columns where table_schema='public'`,
  restricoes: `select conrelid::regclass||' '||conname||' '||pg_get_constraintdef(oid) x from pg_constraint where connamespace='public'::regnamespace`,
  indices: `select indexdef x from pg_indexes where schemaname='public'`,
  funcoes: `select p.proname||'('||pg_get_function_identity_arguments(p.oid)||') '||pg_get_functiondef(p.oid) x from pg_proc p where pronamespace='public'::regnamespace`,
  politicas: `select tablename||' '||policyname||' '||cmd||' '||roles::text||' '||coalesce(qual,'')||' | '||coalesce(with_check,'') x from pg_policies where schemaname='public'`,
  triggers: `select pg_get_triggerdef(t.oid) x from pg_trigger t join pg_class c on c.oid=t.tgrelid where not t.tgisinternal and (c.relnamespace='public'::regnamespace or c.relname='users')`,
  rls: `select relname||' rls='||relrowsecurity x from pg_class where relnamespace='public'::regnamespace and relkind='r'`,
  grants: `select p.proname||' '||coalesce(array_to_string(p.proacl,','),'default') x from pg_proc p where pronamespace='public'::regnamespace`,
}

// Comentários e quebras de linha (CRLF/LF) não contam como diferença.
const normalizar = (s) => s.replace(/--[^\n]*/g, '').replace(/\s+/g, ' ').trim()

async function catalogo(db) {
  const r = {}
  for (const [k, q] of Object.entries(CATALOGO)) r[k] = (await db.query(q)).rows.map((l) => normalizar(l.x)).sort()
  return r
}

function comparar(a, b) {
  let iguais = true
  for (const k of Object.keys(a)) {
    const sa = new Set(a[k]), sb = new Set(b[k])
    const soA = a[k].filter((x) => !sb.has(x)), soB = b[k].filter((x) => !sa.has(x))
    if (soA.length || soB.length) {
      iguais = false
      const curto = (l) => l.map((x) => x.slice(0, 160)).join('\n     ') || '-'
      falha(`schema.sql e produção+migrações diferem em ${k}:\n   só no schema.sql:\n     ${curto(soA)}\n   só em produção+migrações:\n     ${curto(soB)}`)
    }
  }
  if (iguais) ok('schema.sql e produção+migrações dão a mesma estrutura')
}

async function como(db, uid, fn) {
  await db.exec(`set role ${uid === 'anon' ? 'anon' : 'authenticated'}; select set_config('request.jwt.claim.sub', '${uid === 'anon' ? '' : uid}', false);`)
  try { return await fn() } finally { await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`) }
}

// deveFalhar: a operação tem de ser recusada (com a mensagem que casa com `padrao`, se indicado).
async function espera(rotulo, promessa, deveFalhar = false, padrao) {
  try {
    const r = await promessa
    deveFalhar ? falha(`${rotulo}: devia ter sido recusado`) : ok(rotulo)
    return r
  } catch (e) {
    if (!deveFalhar) falha(`${rotulo}: falhou com "${e.message}"`)
    else if (padrao && !padrao.test(e.message)) falha(`${rotulo}: recusado com mensagem inesperada "${e.message}"`)
    else ok(rotulo)
  }
}

// Consultas que não podem devolver linhas (a RLS esconde, não dá erro).
const semLinhas = (q) => q.then((r) => { if (r.rows.length) throw new Error(`devolveu ${r.rows.length} linha(s)`) })

async function comportamento(db, c) {
  const p = `[${c}]`
  const ids = {}
  for (const [k, email, nome] of [['admin', 'admin@bv.pt', 'Ana Admin'], ['med', 'med@bv.pt', 'Miguel Mediador'], ['med2', 'med2@bv.pt', 'Marta Mediadora'], ['inativo', 'ina@bv.pt', 'Ivo Inativo']]) {
    ids[k] = (await db.query(`insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id`, [email, { nome }])).rows[0].id
  }
  const perfil = (await db.query(`select nome, ativo from public.profiles where id = $1`, [ids.med])).rows[0]
  perfil?.nome === 'Miguel Mediador' && perfil.ativo === false ? ok(`${p} conta nova fica inativa, com o nome do convite`) : falha(`${p} perfil criado errado: ${JSON.stringify(perfil)}`)
  await db.query(`update public.profiles set ativo = true, is_admin = true where id = $1`, [ids.admin])
  await db.query(`update public.profiles set ativo = true, grupo_id = (select id from public.grupos where nome = 'Mediador') where id in ($1, $2)`, [ids.med, ids.med2])

  await como(db, 'anon', async () => {
    await espera(`${p} site: anónimo não lê leads`, semLinhas(db.query(`select * from public.leads`)))
    await espera(`${p} site: anónimo não insere leads diretamente`, db.query(`insert into public.leads (nome, telefone, ramo_interesse) values ('Xy', '912345678', 'auto')`), true)
    await espera(`${p} site: formulário cria lead`, db.query(`select public.criar_lead_site('Joana Site', 'joana@ex.pt', '912 345 678', 'auto', 'Quero um seguro', true)`))
    await espera(`${p} site: recusa sem consentimento`, db.query(`select public.criar_lead_site('Joana', 'j@ex.pt', '912345678', 'auto', '', false)`), true, /consentimento/)
    await espera(`${p} site: recusa email inválido`, db.query(`select public.criar_lead_site('Joana', 'nao-e-email', '912345678', 'auto', '', true)`), true, /dados_invalidos/)
    await espera(`${p} site: recusa ramo inexistente`, db.query(`select public.criar_lead_site('Joana', 'j@ex.pt', '912345678', 'barcos', '', true)`), true, /dados_invalidos/)
    await db.query(`select public.criar_lead_site('Joana Site', 'joana@ex.pt', '912345678', 'auto', '', true)`)
    await db.query(`select public.criar_lead_site('Joana Site', 'joana@ex.pt', '912345678', 'auto', '', true)`)
    await espera(`${p} site: bloqueia o 4.º pedido do mesmo contacto na hora`, db.query(`select public.criar_lead_site('Joana Site', 'joana@ex.pt', '912345678', 'auto', '', true)`), true, /limite/)
    await espera(`${p} site: anónimo não converte leads`, db.query(`select public.converter_lead(gen_random_uuid(), now(), 'a', 'b', 'c', 'd', 'e')`), true)
    await espera(`${p} site: anónimo não lê perfis`, semLinhas(db.query(`select * from public.profiles`)))
  })
  const siteLead = (await db.query(`select * from public.leads where origem = 'site' limit 1`)).rows[0]
  siteLead?.responsavel_id == null && siteLead?.estado === 'novo' && siteLead?.telefone === '912345678'
    ? ok(`${p} site: lead entra sem responsável, estado novo, telefone limpo`) : falha(`${p} lead do site mal gravado: ${JSON.stringify(siteLead)}`)

  await como(db, ids.inativo, async () => {
    await espera(`${p} inativo: não vê leads`, semLinhas(db.query(`select * from public.leads`)))
    await espera(`${p} inativo: não cria leads`, db.query(`insert into public.leads (nome, telefone, ramo_interesse) values ('Xy', '912345678', 'auto')`), true)
    await espera(`${p} inativo: não se ativa a si próprio`, semLinhas(db.query(`update public.profiles set ativo = true where id = '${ids.inativo}' returning id`)))
  })

  let leadMed
  await como(db, ids.med, async () => {
    const n = (await db.query(`select count(*)::int n from public.leads`)).rows[0].n
    n > 0 ? ok(`${p} mediador: vê os leads (carteira partilhada)`) : falha(`${p} mediador não vê leads`)
    leadMed = (await db.query(`insert into public.leads (nome, telefone, ramo_interesse, responsavel_id) values ('Lead Med', '913000000', 'vida', '${ids.med2}') returning *`)).rows[0]
    leadMed.responsavel_id === ids.med ? ok(`${p} mediador: quem cria fica responsável`) : falha(`${p} responsável errado ao criar: ${leadMed.responsavel_id}`)
    await espera(`${p} mediador: não apaga leads`, semLinhas(db.query(`delete from public.leads where id = '${leadMed.id}' returning id`)))
    await espera(`${p} mediador: não passa lead a outro`, db.query(`update public.leads set responsavel_id = '${ids.med2}' where id = '${leadMed.id}'`), true, /permissão para atribuir/)
    await espera(`${p} mediador: assume lead do site sem responsável`, db.query(`update public.leads set responsavel_id = '${ids.med}' where id = '${siteLead.id}'`))
    await espera(`${p} mediador: não se promove a admin`, semLinhas(db.query(`update public.profiles set is_admin = true where id = '${ids.med}' returning id`)))
    const equipa = (await db.query(`select * from public.listar_equipa()`)).rows
    equipa.length === 4 && !('email' in equipa[0]) ? ok(`${p} mediador: vê a equipa só com nomes`) : falha(`${p} listar_equipa: ${JSON.stringify(equipa)}`)
    const perfis = (await db.query(`select id from public.profiles`)).rows
    perfis.length === 1 ? ok(`${p} mediador: só vê o próprio perfil`) : falha(`${p} mediador vê ${perfis.length} perfis`)
    await espera(`${p} mediador: não lê o histórico de acessos`, semLinhas(db.query(`select * from public.eventos_acesso`)))
    await espera(`${p} mediador: não importa CSV`, db.query(`select public.importar_clientes('[]'::jsonb)`), true, /administrador/)
    await espera(`${p} validação: lead com nome só de espaços é recusado`, db.query(`insert into public.leads (nome, telefone, ramo_interesse) values ('   ', '913000001', 'auto')`), true, /leads_nome_valido/)
    await espera(`${p} validação: cliente sem telefone é recusado`, db.query(`insert into public.clientes (nome, telefone) values ('Cliente Válido', '  ')`), true, /clientes_telefone_valido/)
    await db.query(`insert into public.propostas (lead_id, seguradora, ramo) values ('${leadMed.id}', 'Fidelidade', 'vida')`)
  })
  const med = (await db.query(`select is_admin from public.profiles where id = $1`, [ids.med])).rows[0]
  med.is_admin === false ? ok(`${p} mediador continua mediador`) : falha(`${p} mediador promoveu-se`)

  await como(db, ids.med, async () => {
    const lead = (await db.query(`select * from public.leads where id = '${leadMed.id}'`)).rows[0]
    await espera(`${p} conversão: recusa versão antiga do lead`, db.query(`select * from public.converter_lead($1, now() - interval '1 day', 'Cliente Med', '913000000', 'c@ex.pt', '123456789', 'Rua 1')`, [lead.id]), true, /alterado/)
    const r = await espera(`${p} conversão: mediador converte lead em cliente`, db.query(`select * from public.converter_lead($1, $2, 'Cliente Med', '913000000', 'c@ex.pt', '123456789', 'Rua 1')`, [lead.id, lead.atualizado_em]))
    const cliente = r?.rows?.[0]
    if (!cliente) return
    cliente.responsavel_id === ids.med ? ok(`${p} conversão: cliente herda o responsável`) : falha(`${p} cliente com responsável ${cliente.responsavel_id}`)
    const propostas = (await db.query(`select lead_id from public.propostas where cliente_id = '${cliente.id}'`)).rows
    propostas.length === 1 && propostas[0].lead_id == null ? ok(`${p} conversão: propostas passam para o cliente`) : falha(`${p} propostas não passaram: ${JSON.stringify(propostas)}`)
    const depois = (await db.query(`select estado, atualizado_em from public.leads where id = '${lead.id}'`)).rows[0]
    depois.estado === 'convertido' ? ok(`${p} conversão: lead fica convertido`) : falha(`${p} lead ficou ${depois.estado}`)
    await espera(`${p} conversão: não converte duas vezes`, db.query(`select * from public.converter_lead($1, $2, 'Xy', '913000000', '', '', '')`, [lead.id, depois.atualizado_em]), true, /já foi convertido/)
  })

  await como(db, ids.admin, async () => {
    const r = await espera(`${p} importação: admin importa clientes`, db.query(`select public.importar_clientes($1::jsonb) r`, [JSON.stringify([
      { nome: 'Imp Um', telefone: '914000001', nif: '111111111' }, { nome: 'Imp Dois', telefone: '914000002' }, { nome: '', telefone: '' }, { nome: 'Imp Três', telefone: '914000003', nif: '111111111' },
    ])]))
    const res = r?.rows[0].r
    res?.inseridos === 2 && res.ignorados.length === 2 ? ok(`${p} importação: linha vazia e NIF repetido ficam de fora`) : falha(`${p} importar_clientes: ${JSON.stringify(res)}`)
    const r2 = await espera(`${p} importação: admin importa apólices`, db.query(`select public.importar_apolices($1::jsonb) r`, [JSON.stringify([
      { numero_apolice: 'AP-1', nif_cliente: '111111111', seguradora: 'Fidelidade', ramo: 'auto', data_inicio: '2026-01-01', data_fim: '2027-01-01', premio_anual: '350' },
    ])]))
    r2?.rows[0].r.inseridos === 1 ? ok(`${p} importação: apólice ligada ao cliente pelo NIF`) : falha(`${p} importar_apolices: ${JSON.stringify(r2?.rows[0].r)}`)
    await espera(`${p} admin: passa lead a outro mediador`, db.query(`update public.leads set responsavel_id = '${ids.med2}' where id = '${siteLead.id}'`))
    await espera(`${p} admin: responsável tem de ter acesso ativo`, db.query(`update public.leads set responsavel_id = '${ids.inativo}' where id = '${siteLead.id}'`), true, /ativo/)
    await espera(`${p} admin: dá acesso a conta inativa`, db.query(`update public.profiles set ativo = true where id = '${ids.inativo}'`))
    const ev = (await db.query(`select alteracao, realizado_por_nome from public.eventos_acesso order by criado_em desc limit 1`)).rows[0]
    ev?.alteracao === 'acesso_dado' && ev.realizado_por_nome === 'Ana Admin' ? ok(`${p} admin: histórico de acessos regista quem deu acesso`) : falha(`${p} eventos_acesso: ${JSON.stringify(ev)}`)
    await espera(`${p} admin: último admin não se despromove`, db.query(`update public.profiles set is_admin = false where id = '${ids.admin}'`), true, /administrador/)
    await espera(`${p} admin: não altera o email de uma conta`, db.query(`update public.profiles set email = 'x@x.pt' where id = '${ids.med}'`), true, /email/)
    const apagados = (await db.query(`delete from public.leads where id = '${siteLead.id}' returning id`)).rows.length
    apagados === 1 ? ok(`${p} admin: apaga leads`) : falha(`${p} admin não conseguiu apagar o lead`)
    const hist = (await db.query(`select count(*)::int n from public.historico_registos`)).rows[0].n
    hist > 0 ? ok(`${p} histórico de alterações está a registar`) : falha(`${p} historico_registos vazio`)
    await espera(`${p} dashboard: resumo carrega`, db.query(`select * from public.obter_resumo_dashboard()`))
  })
  await espera(`${p} contas: excluir o último admin é bloqueado`, db.query(`delete from auth.users where id = '${ids.admin}'`), true, /administrador/)
  await espera(`${p} contas: excluir um mediador funciona`, db.query(`delete from auth.users where id = '${ids.med}'`))
  const orfaos = (await db.query(`select count(*)::int n from public.clientes where responsavel_id is null`)).rows[0].n
  orfaos > 0 ? ok(`${p} contas: clientes do mediador excluído ficam sem responsável, não são apagados`) : falha(`${p} clientes do mediador excluído desapareceram`)
}

// Grupos configuráveis: só ver, sem acesso, carteira própria, apagar/atribuir como extras.
async function grupos(db, c) {
  const p = `[${c}] grupos:`
  const ids = {}
  for (const k of ['admin', 'med', 'ver', 'nada', 'prop', 'chefe']) {
    ids[k] = (await db.query(`insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id`, [`${k}@bv.pt`, { nome: `Conta ${k}` }])).rows[0].id
  }
  await db.query(`update public.profiles set ativo = true, is_admin = true where id = $1`, [ids.admin])
  const todos = (nivel, extras = {}) => ['dashboard', 'leads', 'propostas', 'clientes', 'apolices', 'renovacoes', 'sinistros', 'atividades']
    .map((modulo) => ({ modulo, nivel: modulo === 'dashboard' && nivel === 'editar' ? 'ver' : nivel, ...(modulo !== 'dashboard' ? extras : {}) }))
  const g = {}
  await como(db, ids.admin, async () => {
    const guardar = (nome, carteira, perms) => db.query(`select public.guardar_grupo(null, $1, null, $2, $3::jsonb) id`, [nome, carteira, JSON.stringify(perms)]).then((r) => r.rows[0].id)
    g.ver = await guardar('Só ver', 'toda', todos('ver'))
    g.nada = await guardar('Sem nada', 'toda', [])
    g.prop = await guardar('Carteira própria', 'propria', todos('editar'))
    g.chefe = await guardar('Chefe de equipa', 'toda', todos('editar', { apagar: true }).map((x) => ['leads', 'clientes'].includes(x.modulo) ? { ...x, atribuir: true } : x))
    ok(`${p} admin cria grupos pelo CRM`)
    await espera(`${p} nome repetido é recusado`, db.query(`select public.guardar_grupo(null, ' só VER ', null, 'toda', '[]'::jsonb)`), true, /grupos_nome_unico/)
    await espera(`${p} "atribuir" só existe em leads e clientes`, db.query(`select public.guardar_grupo(null, 'Mau', null, 'toda', $1::jsonb)`, [JSON.stringify([{ modulo: 'apolices', nivel: 'editar', atribuir: true }])]), true, /atribuir_valido/)
    await espera(`${p} "apagar" exige poder editar`, db.query(`select public.guardar_grupo(null, 'Mau', null, 'toda', $1::jsonb)`, [JSON.stringify([{ modulo: 'leads', nivel: 'ver', apagar: true }])]), true, /extras_validos/)
  })
  const mediador = (await db.query(`select id from public.grupos where nome = 'Mediador'`)).rows[0].id
  for (const [k, grupo] of [['med', mediador], ['ver', g.ver], ['nada', g.nada], ['prop', g.prop], ['chefe', g.chefe]]) {
    await db.query(`update public.profiles set ativo = true, grupo_id = $2 where id = $1`, [ids[k], grupo])
  }
  const ev = (await db.query(`select detalhe from public.eventos_acesso where alteracao = 'grupo_alterado' and perfil_id = $1`, [ids.prop])).rows[0]
  ev?.detalhe === 'Carteira própria' ? ok(`${p} mudança de grupo fica no histórico de acessos`) : falha(`${p} evento de grupo: ${JSON.stringify(ev)}`)

  // Dados: um lead e um cliente de cada mediador, mais um lead sem responsável.
  const lead = async (uid, nome) => como(db, uid, () => db.query(`insert into public.leads (nome, telefone, ramo_interesse) values ($1, '912000000', 'auto') returning id`, [nome]).then((r) => r.rows[0].id))
  const cliente = async (uid, nome) => como(db, uid, () => db.query(`insert into public.clientes (nome, telefone) values ($1, '912000000') returning id`, [nome]).then((r) => r.rows[0].id))
  const leadMed = await lead(ids.med, 'Lead do Med'), leadProp = await lead(ids.prop, 'Lead do Prop')
  const clienteMed = await cliente(ids.med, 'Cliente do Med'), clienteProp = await cliente(ids.prop, 'Cliente do Prop')
  await db.query(`insert into public.leads (nome, telefone, ramo_interesse) values ('Lead livre', '912000000', 'vida')`)
  const apolice = async (uid, cid, n) => como(db, uid, () => db.query(`insert into public.apolices (cliente_id, numero_apolice, ramo, seguradora, data_inicio) values ($1, $2, 'auto', 'Fidelidade', '2026-01-01') returning id`, [cid, n]).then((r) => r.rows[0].id))
  const apMed = await apolice(ids.med, clienteMed, 'AP-MED')
  await apolice(ids.prop, clienteProp, 'AP-PROP')
  await como(db, ids.med, () => db.query(`insert into public.sinistros (apolice_id, data_ocorrencia, descricao) values ($1, '2026-02-01', 'Toque')`, [apMed]))
  const nomes = async (uid, tabela, col = 'nome') => como(db, uid, () => db.query(`select ${col} x from public.${tabela} order by 1`).then((r) => r.rows.map((l) => l.x)))

  await como(db, ids.med, async () => {
    await espera(`${p} mediador não gere grupos`, db.query(`select public.guardar_grupo(null, 'Meu', null, 'toda', '[]'::jsonb)`), true, /administrador/)
    const perm = (await db.query(`select public.minhas_permissoes() j`)).rows[0].j
    perm.grupo === 'Mediador' && perm.modulos.leads?.nivel === 'editar' && perm.modulos.leads.apagar === false ? ok(`${p} minhas_permissoes devolve o grupo e os módulos`) : falha(`${p} minhas_permissoes: ${JSON.stringify(perm)}`)
    await espera(`${p} mediador só vê o próprio grupo`, db.query(`select nome from public.grupos`).then((r) => { if (r.rows.length !== 1) throw new Error(`viu ${r.rows.length}`) }))
  })

  await como(db, ids.ver, async () => {
    const n = (await db.query(`select count(*)::int n from public.leads`)).rows[0].n
    n === 3 ? ok(`${p} "só ver" vê a carteira toda`) : falha(`${p} "só ver" viu ${n} leads`)
    await espera(`${p} "só ver" não cria leads`, db.query(`insert into public.leads (nome, telefone, ramo_interesse) values ('Xy', '912000000', 'auto')`), true, /row-level security/)
    await espera(`${p} "só ver" não edita leads`, semLinhas(db.query(`update public.leads set notas = 'x' returning id`)))
    await espera(`${p} "só ver" não converte leads`, db.query(`select * from public.converter_lead($1, now(), 'X y', '912000000', '', '', '')`, [leadMed]), true, /permissão para converter/)
    await espera(`${p} "só ver" não renova apólices`, db.query(`select public.marcar_renovada($1, null, '2026-12-31', '2027-12-31', null)`, [apMed]), true, /permissão para renovar/)
  })

  await como(db, ids.nada, async () => {
    for (const t of ['leads', 'clientes', 'apolices', 'sinistros', 'atividades', 'historico_registos']) {
      await espera(`${p} grupo sem módulos não vê ${t}`, semLinhas(db.query(`select * from public.${t}`)))
    }
  })

  const leadsProp = await nomes(ids.prop, 'leads')
  JSON.stringify(leadsProp) === JSON.stringify(['Lead do Prop', 'Lead livre']) ? ok(`${p} carteira própria: vê os seus leads e os sem responsável`) : falha(`${p} carteira própria viu leads: ${leadsProp}`)
  const clientesProp = await nomes(ids.prop, 'clientes')
  JSON.stringify(clientesProp) === JSON.stringify(['Cliente do Prop']) ? ok(`${p} carteira própria: só vê os seus clientes`) : falha(`${p} carteira própria viu clientes: ${clientesProp}`)
  const apProp = await nomes(ids.prop, 'apolices', 'numero_apolice')
  JSON.stringify(apProp) === JSON.stringify(['AP-PROP']) ? ok(`${p} carteira própria: só vê apólices dos seus clientes`) : falha(`${p} carteira própria viu apólices: ${apProp}`)
  const sinProp = await nomes(ids.prop, 'sinistros', 'descricao')
  sinProp.length === 0 ? ok(`${p} carteira própria: não vê sinistros de clientes de outros`) : falha(`${p} carteira própria viu sinistros: ${sinProp}`)
  const histProp = await como(db, ids.prop, () => db.query(`select resumo from public.historico_registos where cliente_id = $1`, [clienteMed]).then((r) => r.rows))
  histProp.length === 0 ? ok(`${p} carteira própria: não vê o histórico de clientes de outros`) : falha(`${p} carteira própria viu histórico: ${JSON.stringify(histProp)}`)
  await como(db, ids.prop, async () => {
    await espera(`${p} carteira própria: não cria apólice para cliente de outro`, db.query(`insert into public.apolices (cliente_id, numero_apolice, ramo, seguradora, data_inicio) values ($1, 'AP-X', 'auto', 'Fidelidade', '2026-01-01')`, [clienteMed]), true, /row-level security/)
    await espera(`${p} carteira própria: não edita lead de outro`, semLinhas(db.query(`update public.leads set notas = 'x' where id = $1 returning id`, [leadMed])))
    await espera(`${p} carteira própria: não converte lead de outro`, db.query(`select * from public.converter_lead($1, now(), 'X y', '912000000', '', '', '')`, [leadMed]), true, /já não existe/)
    await espera(`${p} carteira própria: não apaga (sem o extra "apagar")`, semLinhas(db.query(`delete from public.leads where id = $1 returning id`, [leadProp])))
  })

  await como(db, ids.chefe, async () => {
    await espera(`${p} com "atribuir": passa lead a outro`, db.query(`update public.leads set responsavel_id = $2 where id = $1`, [leadMed, ids.prop]))
    const apagado = (await db.query(`delete from public.leads where id = $1 returning id`, [leadProp])).rows.length
    apagado === 1 ? ok(`${p} com "apagar": apaga leads`) : falha(`${p} chefe não conseguiu apagar`)
  })
  const leadsDepois = await nomes(ids.prop, 'leads')
  leadsDepois.includes('Lead do Med') ? ok(`${p} lead atribuído passa a aparecer na carteira de quem o recebe`) : falha(`${p} carteira própria depois da atribuição: ${leadsDepois}`)

  await como(db, ids.admin, async () => {
    await espera(`${p} não se apaga um grupo com pessoas`, db.query(`delete from public.grupos where id = $1`, [g.prop]), true, /foreign key/)
    await db.query(`update public.profiles set grupo_id = null where id = $1`, [ids.nada])
    await espera(`${p} grupo vazio pode ser apagado`, db.query(`delete from public.grupos where id = $1`, [g.nada]))
  })
}

// Senha inicial definida pelo admin: a pessoa só consegue desligar o próprio aviso.
async function senhas(db, c) {
  const p = `[${c}] senha inicial:`
  const novo = async (email) => (await db.query(`insert into auth.users (email, raw_user_meta_data) values ($1, '{"nome":"Conta Teste"}') returning id`, [email])).rows[0].id
  const [admin, ana, rui] = [await novo('adm2@bv.pt'), await novo('ana@bv.pt'), await novo('rui@bv.pt')]
  await db.query(`update public.profiles set ativo = true, is_admin = true where id = $1`, [admin])
  await como(db, admin, () => db.query(`update public.profiles set ativo = true, deve_trocar_senha = true where id in ($1, $2)`, [ana, rui]))
  const flag = async (id) => (await db.query(`select deve_trocar_senha f from public.profiles where id = $1`, [id])).rows[0].f
  ;(await flag(ana)) && (await flag(rui)) ? ok(`${p} o admin marca contas para trocar a senha`) : falha(`${p} o admin não conseguiu marcar`)
  await como(db, ana, () => db.query(`select public.senha_trocada()`))
  !(await flag(ana)) && (await flag(rui)) ? ok(`${p} senha_trocada só desliga o aviso da própria conta`) : falha(`${p} senha_trocada mexeu na conta errada`)
  await como(db, rui, () => espera(`${p} a pessoa não desliga o aviso a editar o perfil`, semLinhas(db.query(`update public.profiles set deve_trocar_senha = false where id = '${rui}' returning id`))))
  const eventos = await db.query(`insert into public.eventos_acesso (perfil_id, perfil_nome, alteracao) values ($1, 'Rui', 'conta_criada'), ($1, 'Rui', 'senha_definida')`, [rui]).then(() => true, () => false)
  eventos ? ok(`${p} o histórico aceita "conta criada" e "senha definida"`) : falha(`${p} eventos novos recusados`)
}

// Pedidos de sinistro do site: só entram pela função pública; quem tem Sinistros trata e converte.
async function pedidosSinistro(db, c) {
  const p = `[${c}] pedidos de sinistro:`
  const novo = async (email) => (await db.query(`insert into auth.users (email, raw_user_meta_data) values ($1, '{"nome":"Conta Teste"}') returning id`, [email])).rows[0].id
  const [admin, med, semGrupo] = [await novo('adm3@bv.pt'), await novo('med3@bv.pt'), await novo('sg@bv.pt')]
  await db.query(`update public.profiles set ativo = true, is_admin = true where id = $1`, [admin])
  await db.query(`update public.profiles set ativo = true, grupo_id = (select id from public.grupos where nome = 'Mediador') where id = $1`, [med])
  await db.query(`update public.profiles set ativo = true where id = $1`, [semGrupo])
  let apolice
  await como(db, admin, async () => {
    const cli = (await db.query(`insert into public.clientes (nome, telefone) values ('Cliente Sinistro', '915000000') returning id`)).rows[0].id
    apolice = (await db.query(`insert into public.apolices (cliente_id, numero_apolice, seguradora, ramo, data_inicio) values ($1, 'AP-SIN', 'Fidelidade', 'auto', '2026-01-01') returning id`, [cli])).rows[0].id
  })

  const pedir = (over = {}) => {
    const v = { nome: 'Rita Site', email: 'rita@ex.pt', telefone: '916 000 000', ramo: 'auto', apolice: 'AP-SIN', seguradora: '', data: 'current_date - 1', local: 'Lisboa', descricao: 'Colisão num cruzamento, sem feridos.', detalhes: '{"matricula":"AA-00-AA"}', consentimento: 'true', ...over }
    return db.query(`select public.criar_pedido_sinistro_site($1, $2, $3, $4, $5, $6, ${v.data}, $7, $8, $9::jsonb, ${v.consentimento})`, [v.nome, v.email, v.telefone, v.ramo, v.apolice, v.seguradora, v.local, v.descricao, v.detalhes])
  }
  await como(db, 'anon', async () => {
    await espera(`${p} site cria o pedido`, pedir())
    await espera(`${p} recusa sem consentimento`, pedir({ consentimento: 'false' }), true, /consentimento/)
    await espera(`${p} recusa data no futuro`, pedir({ data: 'current_date + 1' }), true, /dados_invalidos/)
    await espera(`${p} recusa descrição demasiado curta`, pedir({ descricao: 'curta' }), true, /dados_invalidos/)
    await espera(`${p} recusa ramo inexistente`, pedir({ ramo: 'barcos' }), true, /dados_invalidos/)
    await espera(`${p} recusa detalhes que não são texto simples`, pedir({ detalhes: '{"x":{"y":1}}' }), true, /dados_invalidos/)
    await espera(`${p} anónimo não lê pedidos`, semLinhas(db.query(`select * from public.pedidos_sinistro`)))
    await espera(`${p} anónimo não insere diretamente`, db.query(`insert into public.pedidos_sinistro (nome, email, telefone, ramo, data_ocorrencia, descricao, consentimento_em) values ('X', 'x@x.pt', '912345678', 'auto', current_date, 'descrição longa', now())`), true)
    await pedir(); await pedir()
    await espera(`${p} bloqueia o 4.º pedido do mesmo contacto na hora`, pedir(), true, /limite/)
    await espera(`${p} anónimo não converte pedidos`, db.query(`select public.converter_pedido_sinistro(gen_random_uuid(), gen_random_uuid(), '')`), true)
  })
  const pedido = (await db.query(`select * from public.pedidos_sinistro order by criado_em limit 1`)).rows[0]
  pedido?.estado === 'novo' && pedido.telefone === '916000000' && pedido.detalhes?.matricula === 'AA-00-AA'
    ? ok(`${p} entra como novo, telefone limpo, detalhes guardados`) : falha(`${p} pedido mal gravado: ${JSON.stringify(pedido)}`)

  await como(db, semGrupo, () => espera(`${p} conta sem o módulo Sinistros não vê pedidos`, semLinhas(db.query(`select * from public.pedidos_sinistro`))))
  await como(db, med, async () => {
    const n = (await db.query(`select count(*)::int n from public.pedidos_sinistro`)).rows[0].n
    n === 3 ? ok(`${p} mediador vê os pedidos`) : falha(`${p} mediador vê ${n} pedidos`)
    await espera(`${p} mediador marca em tratamento`, db.query(`update public.pedidos_sinistro set estado = 'em_tratamento', tratado_por = $2 where id = $1`, [pedido.id, med]))
    const r = await espera(`${p} mediador converte em sinistro`, db.query(`select public.converter_pedido_sinistro($1, $2, '') id`, [pedido.id, apolice]))
    const sin = r?.rows?.[0]?.id && (await db.query(`select apolice_id, estado, descricao from public.sinistros where id = $1`, [r.rows[0].id])).rows[0]
    sin?.apolice_id === apolice && sin.estado === 'participado' && sin.descricao === pedido.descricao
      ? ok(`${p} sinistro criado na apólice, participado, com a descrição do pedido`) : falha(`${p} sinistro errado: ${JSON.stringify(sin)}`)
    const depois = (await db.query(`select estado, cliente_id, sinistro_id from public.pedidos_sinistro where id = $1`, [pedido.id])).rows[0]
    depois.estado === 'convertido' && depois.cliente_id && depois.sinistro_id ? ok(`${p} pedido fica convertido e ligado ao cliente`) : falha(`${p} pedido depois: ${JSON.stringify(depois)}`)
    await espera(`${p} não converte duas vezes`, db.query(`select public.converter_pedido_sinistro($1, $2, '')`, [pedido.id, apolice]), true, /já foi convertido/)
    await espera(`${p} mediador não apaga pedidos`, semLinhas(db.query(`delete from public.pedidos_sinistro where id = '${pedido.id}' returning id`)))
  })
}

try {
  const ordem = ordemMigracoes()
  ok(`ordem das migrações: ${ordem.join(' → ')}`)
  const schema = [['schema.sql', ler(join(SUPA, 'schema.sql'))]]
  const producao = [['base-2026-09-23.sql', ler(join(AQUI, 'base-2026-09-23.sql'))], ...ordem.map((f) => [f, ler(join(MIG, f))])]

  const a = await novaBase(schema)
  ok('cenário A: schema.sql aplica num projeto novo')
  const b = await novaBase(producao)
  ok('cenário B: todas as migrações aplicam sobre a produção de 23/09')
  comparar(await catalogo(a), await catalogo(b))

  for (const [f, sql] of producao.slice(1)) {
    await b.exec(sql).then(() => ok(`voltar a correr ${f} não parte nada`), (e) => falha(`voltar a correr ${f} falha: ${e.message}`))
  }

  await comportamento(a, 'A')
  await comportamento(await novaBase(producao), 'B')
  await grupos(await novaBase(schema), 'A')
  await grupos(await novaBase(producao), 'B')
  await senhas(await novaBase(schema), 'A')
  await senhas(await novaBase(producao), 'B')
  await pedidosSinistro(await novaBase(schema), 'A')
  await pedidosSinistro(await novaBase(producao), 'B')
} catch (e) {
  falha(e.message)
}

for (const m of oks) console.log(`  ✓ ${m}`)
for (const m of falhas) console.log(`  ✗ ${m}`)
console.log(`\n${oks.length} ok, ${falhas.length} falha(s)`)
process.exit(falhas.length ? 1 : 0)

import { useState } from "react";
import type { FormEvent } from "react";
import Button from "../components/ui/Button";
import CaixaVerificacao from "../components/forms/VerificacaoHumana";
import { useVerificacaoHumana } from "../components/forms/useVerificacaoHumana";
import Input from "../components/forms/Input";
import CamposRamo, { PREFIXO_CAMPO } from "../components/forms/CamposRamo";
import { CamposContacto, CamposFecho, SeletorRamo } from "../components/forms/CamposBase";
import { EnvioContactoError, MENSAGEM_ERRO } from "../utils/enviarContacto";
import type { ErroContacto, RamoCrm } from "../utils/enviarContacto";
import { enviarPedidoSinistro } from "../utils/enviarPedidoSinistro";
import { anuncioPerguntas } from "../utils/anuncioPerguntas";
import { normalizarTelefone } from "../utils/validacoes";
import { CAMPOS_SINISTRO } from "../data/formulariosSinistro";
import { SEGUROS, SEGUROS_FORMULARIO } from "../data/seguros";
import type { RamoKey } from "../data/seguros";

type Estado = "inicial" | "a_enviar" | "enviado";

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/**
 * Pedido de ajuda com um sinistro: vai para o CRM como pedido de sinistro
 * (pedidos_sinistro), não como lead. O tipo de seguro vem primeiro e as
 * perguntas desse ramo aparecem por baixo. Sem perguntas de saúde.
 */
export default function SinistroForm({ ramoInicial, onConcluido }: { ramoInicial?: RamoKey; onConcluido?: () => void }) {
  const [estado, setEstado] = useState<Estado>("inicial");
  const [erro, setErro] = useState<ErroContacto | null>(null);
  const verificacao = useVerificacaoHumana();
  const [ramo, setRamo] = useState<RamoCrm | "">(SEGUROS.find((s) => s.key === ramoInicial)?.ramoCrm ?? "");

  const seguro = SEGUROS.find((s) => s.ramoCrm === ramo);
  const campos = seguro ? CAMPOS_SINISTRO[seguro.key] : [];
  const hoje = new Date();
  // A função no Supabase aceita ocorrências até 2 anos atrás e nunca no futuro.
  const limiteAntigo = new Date(hoje.getFullYear() - 2, hoje.getMonth(), hoje.getDate() + 1);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const dados = new FormData(form);
    const texto = (nome: string) => String(dados.get(nome) ?? "").trim();
    setErro(null);

    if (dados.get("empresa")) {
      setEstado("enviado");
      return;
    }

    setEstado("a_enviar");
    try {
      const token = await verificacao.obterToken();
      await enviarPedidoSinistro({
        nome: texto("nome"),
        email: texto("email"),
        telefone: normalizarTelefone(texto("telefone")),
        ramo: ramo as RamoCrm,
        numeroApolice: texto("numero_apolice"),
        seguradora: texto("seguradora"),
        dataOcorrencia: texto("data_ocorrencia"),
        local: texto("local"),
        descricao: texto("descricao"),
        // O NIF segue nos detalhes: ajuda a equipa a encontrar o cliente no CRM.
        detalhes: Object.fromEntries(
          [["nif", texto("nif").replace(/\D/g, "")], ...campos.map((c) => [c.nome, texto(PREFIXO_CAMPO + c.nome)])].filter(
            ([, v]) => v !== ""
          )
        ),
        consentimento: dados.get("consentimento") === "sim",
      }, token);
      form.reset();
      setEstado("enviado");
    } catch (error: unknown) {
      setErro(error instanceof EnvioContactoError ? error.motivo : "falha_envio");
      setEstado("inicial");
    } finally {
      verificacao.reiniciar();
    }
  };

  if (estado === "enviado") {
    return (
      <div className="contact-form-done" role="status">
        <h3>Pedido recebido.</h3>
        <p className="text-secondary">
          Vamos contactá-lo para tratar do sinistro. Lembre-se: em regra, a participação à seguradora deve ser
          feita no prazo de 8 dias.
        </p>
        {onConcluido && <Button onClick={onConcluido}>Fechar</Button>}
      </div>
    );
  }

  const isEnviando = estado === "a_enviar";

  return (
    <form onSubmit={handleSubmit} className="stack">
      <div className="claim-notice" role="note">
        <p>
          <strong>Em caso de feridos ou perigo, ligue 112.</strong>
        </p>
        <p className="text-body-small">
          Este pedido chega à BV Seguros, que o acompanha junto da seguradora. Não substitui a participação à
          seguradora, que em regra deve ser feita no prazo de 8 dias.
        </p>
      </div>

      <SeletorRamo
        rotulo="Que seguro vai acionar?"
        ramos={SEGUROS_FORMULARIO}
        valor={ramo}
        onChange={setRamo}
        anuncio={anuncioPerguntas(campos.length, seguro)}
      />

      <p className="form-section-title">Os seus dados</p>
      <CamposContacto />
      <div className="form-grid">
        <Input className="form-grid__half" label="Nº da apólice, se souber" name="numero_apolice" maxLength={60} autoComplete="off" />
        <Input className="form-grid__half" label="Seguradora, se souber" name="seguradora" maxLength={80} autoComplete="off" />
      </div>

      <p className="form-section-title">O que aconteceu</p>
      <div className="form-grid">
        <Input
          className="form-grid__half"
          label="Data da ocorrência"
          name="data_ocorrencia"
          type="date"
          required
          min={iso(limiteAntigo)}
          max={iso(hoje)}
        />
        <Input className="form-grid__half" label="Local" name="local" maxLength={160} placeholder="Ex.: Lisboa, A5" />
      </div>
      <div className="field">
        <label className="field__label" htmlFor="descricao">
          Descreva o que aconteceu
        </label>
        <textarea
          id="descricao"
          name="descricao"
          rows={4}
          required
          minLength={10}
          maxLength={1500}
          className="field__control"
          aria-describedby="descricao-nota"
        />
        <span id="descricao-nota" className="field__message">
          Não inclua informação sobre lesões ou saúde: tratamos disso diretamente consigo.
        </span>
      </div>

      {campos.length > 0 && seguro && (
        <>
          <p className="form-section-title">{seguro.key === "outros" ? "Sobre o seguro" : `Sobre o seguro ${seguro.nome.toLowerCase()}`}</p>
          <CamposRamo key={seguro.key} campos={campos} />
        </>
      )}

      <CamposFecho finalidade="tratar este pedido de sinistro" />
      <CaixaVerificacao verificacao={verificacao} />

      {erro && (
        <p className="contact-form-error" role="alert">
          {MENSAGEM_ERRO[erro]}
        </p>
      )}

      <Button type="submit" loading={isEnviando}>
        {isEnviando ? "A enviar…" : "Enviar pedido de sinistro"}
      </Button>
    </form>
  );
}

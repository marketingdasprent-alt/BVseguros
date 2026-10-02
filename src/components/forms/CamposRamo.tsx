import { useCallback, useId, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import InputValidado from "./InputValidado";
import CampoMatricula from "./CampoMatricula";
import CampoPessoas from "./CampoPessoas";
import CampoCodigoPostal from "./CampoCodigoPostal";
import type { ValorExterno } from "./CampoCodigoPostal";
import CampoMorada from "./CampoMorada";
import CardGrid from "../layout/CardGrid";
import { mensagemNativa } from "./mensagemNativa";
import { PREFIXO_CAMPO, lerValores } from "./valores";
import { MARCAS_AUTO, campoObrigatorio, campoVisivel, limiteData } from "../../data/formularios";
import type { Campo, Valores } from "../../data/formularios";

type Contexto = {
  valores: Valores;
  /** O campo em destaque do passo (ex.: a matrícula grande, ao centro). */
  destaque?: string;
  aoMudar: () => void;
  externos: Record<string, ValorExterno>;
  definir: (nome: string, valor: string) => void;
};

/** "(opcional)" no rótulo do que não é obrigatório, salvo quando já tem resposta por omissão. */
function rotuloDe(campo: Campo, obrigatorio: boolean): string {
  if (obrigatorio || campo.padrao || /se tiver|opcional/i.test(campo.rotulo)) return campo.rotulo;
  return `${campo.rotulo} (opcional)`;
}

/** Rádios, cartões e caixas de várias escolhas: o erro aparece uma vez, por baixo do grupo. */
function GrupoOpcoes({ campo, rotulo, obrigatorio, classe }: { campo: Campo; rotulo: string; obrigatorio: boolean; classe: string }) {
  const [comErro, setComErro] = useState(false);
  const idErro = useId();
  const idAjuda = useId();
  const name = PREFIXO_CAMPO + campo.nome;
  const multipla = campo.tipo === "multipla";
  const opcoes = campo.opcoes ?? [];
  const descritoPor = [campo.ajuda ? idAjuda : "", comErro ? idErro : ""].filter(Boolean).join(" ") || undefined;

  const entrada = (opcao: string) => (
    <input
      type={multipla ? "checkbox" : "radio"}
      name={name}
      value={opcao}
      required={!multipla && obrigatorio}
      defaultChecked={campo.padrao === opcao}
    />
  );

  return (
    <fieldset
      className={`choice-group ${classe}`}
      aria-describedby={descritoPor}
      onInvalidCapture={() => setComErro(true)}
      onChange={() => setComErro(false)}
    >
      <legend className="field__label">{rotulo}</legend>
      {campo.tipo === "cartoes" ? (
        <CardGrid cols={2} colsTablet={2} className="option-cards" style={{ "--gap": "var(--space-sm)" } as CSSProperties}>
          {opcoes.map((opcao, i) => (
            <label key={opcao} className="option-card">
              {entrada(opcao)}
              <span className="option-card__body">
                <span className="option-card__title">{opcao}</span>
                {campo.descricoes?.[i] && <span className="option-card__text">{campo.descricoes[i]}</span>}
              </span>
            </label>
          ))}
        </CardGrid>
      ) : (
        <div className="choice-group__options">
          {opcoes.map((opcao) => (
            <label key={opcao} className="choice">
              {entrada(opcao)}
              <span>{opcao}</span>
            </label>
          ))}
        </div>
      )}
      {campo.ajuda && (
        <span id={idAjuda} className="field__message">
          {campo.ajuda}
        </span>
      )}
      {comErro && (
        <span id={idErro} className="field__message field__message--error">
          Escolha uma opção.
        </span>
      )}
    </fieldset>
  );
}

/** Select e textarea com a mesma frase de erro por baixo que os outros campos. */
function CampoLivre({ campo, rotulo, obrigatorio, classe }: { campo: Campo; rotulo: string; obrigatorio: boolean; classe: string }) {
  const [erro, setErro] = useState<string | null>(null);
  const id = `campo-${campo.nome}`;
  const idErro = `${id}-erro`;
  const idAjuda = `${id}-ajuda`;
  const comuns = {
    id,
    name: PREFIXO_CAMPO + campo.nome,
    required: obrigatorio,
    className: "field__control",
    "aria-invalid": erro ? true : undefined,
    "aria-describedby": erro ? idErro : campo.ajuda ? idAjuda : undefined,
    onInvalid: (e: { currentTarget: HTMLSelectElement | HTMLTextAreaElement }) => setErro(mensagemNativa(e.currentTarget)),
    onChange: () => setErro(null),
  };
  return (
    <div className={["field", erro ? "field--error" : "", classe].filter(Boolean).join(" ")}>
      <label className="field__label" htmlFor={id}>
        {rotulo}
      </label>
      {campo.tipo === "select" ? (
        <select {...comuns} defaultValue="">
          <option value="">Escolha uma opção</option>
          {campo.opcoes?.map((opcao) => (
            <option key={opcao} value={opcao}>
              {opcao}
            </option>
          ))}
        </select>
      ) : (
        <textarea {...comuns} rows={4} minLength={campo.minLength} maxLength={campo.maxLength} />
      )}
      {erro ? (
        <span id={idErro} className="field__message">
          {erro}
        </span>
      ) : (
        campo.ajuda && (
          <span id={idAjuda} className="field__message">
            {campo.ajuda}
          </span>
        )
      )}
    </div>
  );
}

function CampoRamo({ campo, ctx }: { campo: Campo; ctx: Contexto }) {
  const { valores } = ctx;
  if (!campoVisivel(campo, valores)) return null;

  const obrigatorio = campoObrigatorio(campo, valores);
  const rotulo = rotuloDe(campo, obrigatorio);
  const name = PREFIXO_CAMPO + campo.nome;
  const classe = campo.largura === "meia" ? "form-grid__half" : "form-grid__full";

  switch (campo.tipo) {
    case "radio":
    case "cartoes":
    case "multipla":
      return <GrupoOpcoes campo={campo} rotulo={rotulo} obrigatorio={obrigatorio} classe={classe} />;
    case "select":
    case "textarea":
      return <CampoLivre campo={campo} rotulo={rotulo} obrigatorio={obrigatorio} classe={classe} />;
    case "matricula":
      return (
        <CampoMatricula
          name={name}
          label={rotulo}
          grande={ctx.destaque === campo.nome}
          required={obrigatorio}
          permitirSemMatricula={campo.permitirSemMatricula}
          aoMudar={ctx.aoMudar}
        />
      );
    case "pessoas":
      return (
        <CampoPessoas
          name={name}
          label={campo.rotulo}
          maxPessoas={campo.maxPessoas ?? 10}
          comTitular={campo.titularSe?.(valores) ?? false}
          aoMudar={ctx.aoMudar}
        />
      );
    case "codigo_postal":
      return (
        <CampoCodigoPostal
          className={classe}
          name={name}
          label={rotulo}
          required={obrigatorio}
          valorExterno={ctx.externos[campo.nome]}
          aoMudar={ctx.aoMudar}
        />
      );
    case "morada":
      return (
        <CampoMorada
          name={name}
          label={campo.rotulo}
          placeholder={campo.placeholder}
          maxLength={campo.maxLength}
          aoEscolherCodigo={(cp7) => {
            if (campo.codigoPostal) ctx.definir(campo.codigoPostal, cp7);
          }}
        />
      );
    default: {
      const marcas = campo.tipo === "marca" && valores.tipo_veiculo !== "Motociclo";
      const aviso = campo.aviso?.(valores) ?? null;
      const mensagem: ReactNode = aviso ? <span className="field__message--warning">{aviso}</span> : campo.ajuda;
      return (
        <>
          <InputValidado
            id={`campo-${campo.nome}`}
            className={classe}
            label={rotulo}
            name={name}
            type={campo.tipo === "numero" ? "number" : campo.tipo === "data" ? "date" : "text"}
            inputMode={campo.inputMode}
            min={limiteData(campo.min)}
            max={limiteData(campo.max)}
            minLength={campo.minLength}
            maxLength={campo.maxLength}
            placeholder={campo.placeholder}
            autoComplete={campo.autoComplete ?? "off"}
            required={obrigatorio}
            list={marcas ? "marcas-auto" : undefined}
            validar={campo.validar}
            formatar={campo.formatar}
            filtrar={campo.filtrar}
            message={mensagem}
          />
          {marcas && (
            <datalist id="marcas-auto">
              {MARCAS_AUTO.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          )}
        </>
      );
    }
  }
}

export type CamposRamoProps = {
  campos: Campo[];
  /** Campo em destaque, grande e ao centro (ver PassoRamo.destaque). */
  destaque?: string;
  /** Respostas do formulário inteiro (o ContactoForm segue-as, para as regras entre passos). */
  valores?: Valores;
  aoMudar?: () => void;
};

/**
 * Perguntas de um ramo. Cada campo pode aparecer só nalguns casos
 * (`mostrarSe`): as respostas são lidas do DOM a cada mudança, sem
 * controlar cada input. Um campo escondido não é desenhado, por isso não
 * é enviado nem validado.
 */
export default function CamposRamo({ campos, valores, aoMudar, destaque }: CamposRamoProps) {
  const raiz = useRef<HTMLDivElement>(null);
  const [proprios, setProprios] = useState<Valores>({});
  const [externos, setExternos] = useState<Record<string, ValorExterno>>({});

  const recalcularProprios = useCallback(() => {
    if (!raiz.current) return;
    const novos = lerValores(raiz.current);
    setProprios((antes) => (JSON.stringify(antes) === JSON.stringify(novos) ? antes : novos));
  }, []);

  const mudou = aoMudar ?? recalcularProprios;
  const definir = useCallback((nome: string, valor: string) => {
    setExternos((e) => ({ ...e, [nome]: { valor, versao: (e[nome]?.versao ?? 0) + 1 } }));
  }, []);

  const ctx: Contexto = { valores: valores ?? proprios, aoMudar: mudou, externos, definir, destaque };

  return (
    <div ref={raiz} className="form-grid" onChange={mudou}>
      {campos.map((campo) => (
        <CampoRamo key={campo.nome} campo={campo} ctx={ctx} />
      ))}
    </div>
  );
}

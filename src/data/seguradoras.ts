/**
 * Seguradoras com quem a BV trabalha, por ramo. Vazio até o cliente
 * confirmar: a secção "Seguradoras com quem trabalhamos" não aparece
 * enquanto estiver vazio (ver docs/anti-ai.md#content-integrity).
 * Só nomes em texto; logótipos de terceiros precisam de autorização.
 */
import type { RamoKey } from "./seguros";

export const SEGURADORAS: { nome: string; ramos: RamoKey[] }[] = [];

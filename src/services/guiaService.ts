import moment from "moment";
import { api, apiDB } from "../config/api";

export const guiaService = {
	/**
	 * Busca a lista de guias SADT do paciente
	 */
	loadGuiasSadt: async (pacienteId: number) => {
		try {
			const response = await apiDB.post(`loadguiassadt`, {
				paciente: { id: pacienteId },
			});
			const dados = response.data.Table || [];
			return dados.filter((item: any) => item.DATA_UTILIZA === null);
		} catch (error) {
			console.error("Erro loadGuiasSadt:", error);
			throw error;
		}
	},

	/**
	 * Busca documentos gerais do paciente (Aba DOCS)
	 */
	loadDocsPaciente: async (pacienteId: number) => {
		try {
			const response = await apiDB.post(`loaddoctospaciente`, {
				paciente: { id: pacienteId },
			});
			return response.data.Table || [];
		} catch (error) {
			console.error("Erro loadDocsPaciente:", error);
			throw error;
		}
	},

	/**
	 * Busca a URL de visualização da Guia SADT
	 */
	carregarGuiaSadt: async (idDoc: string | number) => {
		try {
			const response = await api.post(`/carregarguiasadt`, {
				id: idDoc,
			});
			return response.data; // Contém a .url
		} catch (error) {
			console.error("Erro carregarGuiaSadt:", error);
			throw error;
		}
	},

	/**
	 * LISTAGEM de receitas (Filtra apenas as que não têm idarquivo)
	 */
	loadReceitasSigh: async (pacienteIddw: number | string) => {
		try {
			const response = await api.post(`/carregareceitassighAsync`, {
				iddw: pacienteIddw,
			});

			const rawData =
				response.data.resultSigh ||
				response.data.Table ||
				response.data.data ||
				[];

			if (!Array.isArray(rawData)) return [];

			return rawData.filter(
				(item: any) => item.idarquivo === undefined || item.idarquivo === null,
			);
		} catch (error) {
			console.error("Erro loadReceitasSigh:", error);
			throw error;
		}
	},

	/**
	 * Busca a URL de uma receita específica
	 */
	carregarReceitaSigh: async (receitaId: string | number) => {
		try {
			const response = await api.post(`/carregareceitasighAsync`, {
				id: receitaId,
			});

			// console.log(response.data);

			// IMPORTANTE: Retorne response.data para que o componente
			// acesse direto as propriedades: id, url, dataconvertida, etc.
			return response.data;
		} catch (error) {
			console.error("Erro carregarReceitaSigh:", error);
			throw error;
		}
	},
	/**
	 * Carrega o PDF para a aba DOCS
	 */
	carregarFile: async (idDoc: string | number) => {
		try {
			const response = await api.post(`/carregarfile`, { id: idDoc });
			return response.data;
		} catch (error) {
			console.error("Erro carregarFile:", error);
			throw error;
		}
	},

	/**
	 * Busca Laudos do paciente
	 */
	loadLaudos: async (pacienteId: number) => {
		try {
			const response = await api.post(`/carregalaudos`, {
				paciente: { id: pacienteId },
				dtIni: moment().subtract(1, "year").format("DD/MM/YYYY"),
				dtFim: moment().format("DD/MM/YYYY"),
			});
			return response.data.data || [];
		} catch (error) {
			console.error("Erro loadLaudos:", error);
			throw error;
		}
	},

	/**
	 * Busca documentos TFD
	 */
	async loadTFD(idPaciente: number, dtIni: string, dtFim: string) {
		try {
			const response = await fetch(
				"https://webapiicr.icr.usp.br/api/Sigma/tfd",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						paciente: { id: idPaciente },
						dtIni,
						dtFim,
					}),
				},
			);
			const textoPuro = await response.text();
			return textoPuro.replace(/"/g, "").trim();
		} catch (error) {
			return null;
		}
	},
};

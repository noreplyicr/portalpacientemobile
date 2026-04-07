// 1. IMPORTANTE: Verifique se o caminho ../config/api está correto
import { api, apiDB } from "../config/api";

export const exameService = {
	// Para Laboratório (Preparo)
	getPreparoExames: async (letra: string) => {
		const response = await api.post("/preparoexames", { letra });
		return response.data.result || response.data.data || [];
	},

	// Para Imagem (Preparo)
	getPreparoExamesSADT: async (letra: string) => {
		const response = await api.post("/preparoexamessadt", { letra });
		return response.data.result || response.data.data || [];
	},

	// Busca a lista de exames
	getExames: async (
		pacienteId: number,
		datainicial: string,
		datafinal: string,
		filtro: string,
		agrupado: boolean,
	) => {
		const resp = await api.post(`/exames`, {
			paciente: { id: pacienteId },
			datainicial,
			datafinal,
			filtro,
			agrupado,
		});
		return resp.data.result;
	},

	// Busca PDF de exames selecionados (múltiplos no Modal)
	getResultadoPdf: async (selecionados: any[]) => {
		const resp = await api.post(`/resultadoexames`, { data: selecionados });
		return resp.data;
	},

	getLaudoSadt: async (solicitacao: string) => {
		const resp = await api.post(`/resultadolaudoSadt`, { solicitacao });
		return resp.data;
	},

	getLaudoEnterprise: async (ssolicitacao: string, idPaciente: number) => {
		try {
			console.log(apiDB);
			const response = await apiDB.post(`/laudoEnterPrise`, {
				ssolicitacao: ssolicitacao,
				paciente: { id: idPaciente },
			});
			return response.data; // Retorna a string/URL do PDF
		} catch (error) {
			console.error("Erro ao buscar laudo Enterprise:", error);
			throw error;
		}
	},
};

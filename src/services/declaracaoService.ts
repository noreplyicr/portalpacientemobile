import moment from "moment";
import { api } from "../config/api";

export const declaracaoService = {
	/**
	 * Busca o histórico de passagens do paciente
	 */
	async getPassagens(pacienteId: number) {
		const resp = await api.post(`/carregapassagens`, {
			paciente: { id: pacienteId },
		});
		return resp.data.data || [];
	},

	/**
	 * Busca a URL do PDF da declaração baseada no tipo e data
	 */
	async getUrlPdf(pacienteId: number, tipo: string, data: string) {
		const dataFormatada = moment(data).format("DD/MM/YYYY");

		const endpoint =
			tipo === "PS" || tipo === "INTERNACAO"
				? `/declaracaoComparecimentopsint?tipo=${tipo}&data=${dataFormatada}`
				: `/declaracaoComparecimento?data=${dataFormatada}`;

		const resp = await api.post(endpoint, { nome: pacienteId });

		// Retorna a URL se existir no corpo da resposta
		if (resp.data && String(resp.data).includes(".pdf")) {
			return resp.data;
		}

		throw new Error("Documento não encontrado");
	},
};

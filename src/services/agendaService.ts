import _ from "lodash";
import moment from "moment";
import { api } from "../config/api";

export const agendaService = {
	// Busca e filtra a agenda
	async getAgenda(pacienteId: number, filtro: string) {
		const dtIni =
			filtro === "CONSULTA" || filtro === "EXAME"
				? moment().format("DD/MM/YYYY")
				: moment().subtract(30, "days").format("DD/MM/YYYY");

		const dtFim =
			filtro === "CONSULTA" || filtro === "EXAME"
				? "10/03/2099"
				: moment().subtract(1, "days").format("DD/MM/YYYY");

		const resp = await api.post(`/agendamentos`, {
			paciente: { id: pacienteId },
			dtIni,
			dtFim,
			agrupado: false,
		});

		const rawData = resp.data.result || [];

		return _.filter(rawData, (item: any) => {
			if (filtro === "CONSULTA" || filtro === "EXAME") {
				return (
					item.tpagendamento === filtro &&
					item.statusagendamento?.descricao !== "REMARCADO"
				);
			} else {
				return (
					item.tpagendamento === "CONSULTA" &&
					item.statusagendamento?.descricao === "FALTOU" &&
					item.futuras === 0
				);
			}
		});
	},

	// Salva ou solicita reagendamento
	async saveReagendamento(
		values: any,
		agendamento: any,
		img1: string,
		img2: string,
	) {
		return api.post(`/cadastrareagendamento`, {
			idreagendamento: agendamento.idreagendamento,
			id: agendamento.id,
			procedimento: agendamento.agenda?.clinica?.descricao,
			statusreagendar: 1,
			data: agendamento.data,
			horario: agendamento.horario,
			paciente: {
				iddw: agendamento.paciente?.iddw,
				nome: agendamento.paciente?.nome,
				matricula: agendamento.paciente?.matricula,
			},
			origem: agendamento.instituto,
			motivoreagendamento: values.justificativa,
			img1: img1,
			img2: img2,
		});
	},

	// Remove/Cancela a solicitação
	async removerSolicitacao(idreagendamento: number) {
		return api.post(`/removereagendamento`, { idreagendamento });
	},
};

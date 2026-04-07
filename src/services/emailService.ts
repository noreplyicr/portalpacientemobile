import { api } from "../config/api";

export const emailService = {
	async getEmails(pacienteId: number) {
		const resp = await api.post(`/carregaemails`, {
			paciente: { id: pacienteId },
		});
		return resp.data.data || [];
	},

	async saveEmail(pacienteId: number, email: string) {
		const resp = await api.post(`/cadastraemails`, {
			paciente: { id: pacienteId },
			descricao: email.toUpperCase(),
		});
		return resp.data; // Retorna o ID ou erro
	},

	async deleteEmail(emailId: number) {
		const resp = await api.post(`/removeemails`, { id: emailId });
		return resp.data;
	},
};

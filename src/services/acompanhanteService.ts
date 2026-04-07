import { api } from "../config/api";

export const acompanhanteService = {
	// Lista acompanhantes do paciente
	listar: async (pacienteId: number, tipoId?: number) => {
		const response = await api.post("/carregacompanhantes", {
			paciente: { id: pacienteId },
			tipoacomp: tipoId,
		});
		// Retorne a resposta bruta para a tela decidir o que fazer
		return response.data;
	},

	// Carrega tipos (Mãe, Pai, Cônjuge, etc) para o seu FormSelect
	listarTipos: async () => {
		const response = await api.post("/carregatipoacompanhantes", {});
		return response.data.Table;
	},

	// Salva ou Edita
	salvar: async (dados: any) => {
		const response = await api.post("/cadastraacompanhante", dados);
		return response.data;
	},

	// Exclui
	excluir: async (id: number) => {
		const response = await api.post("/excluiacompanhante", {
			id,
		});
		return response.data;
	},
};

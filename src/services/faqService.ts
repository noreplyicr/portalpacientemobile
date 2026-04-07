// 1. Importa a instância oficial com os interceptores
import { api } from "../config/api";

export interface FAQItem {
	descricao: string;
	resposta: string;
}

interface FAQResponse {
	perguntas: FAQItem[];
}

// REMOVIDO: const api = axios.create(...)

export const faqService = {
	getFaq: async (): Promise<FAQItem[]> => {
		try {
			// Usa a api centralizada
			const response = await api.post<FAQResponse>("/getFaq");
			return response.data.perguntas || [];
		} catch (error) {
			console.error("Erro ao buscar FAQ:", error);
			throw error;
		}
	},

	// Função para resetar a senha via API
	resetSenha: async (identificador: string) => {
		try {
			// Limpa a matrícula (mantém apenas números)
			const matriculaLimpa = identificador.replace(/\D/g, "");

			// Endpoint POST usando a instância central
			const response = await api.post("/resetsenha", {
				matricula: matriculaLimpa,
			});

			return response.data;
		} catch (error) {
			console.error("Erro ao resetar senha:", error);
			throw error;
		}
	},
};

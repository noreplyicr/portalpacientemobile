// 1. Importa a instância central que já tem o token e os interceptores
import { api } from "../config/api";

export const medicamentoService = {
	// 2. Não precisa mais do parâmetro 'token' aqui
	getMedicamentos: async (letra: string) => {
		// 3. A chamada fica simples, o token é injetado automaticamente
		const response = await api.post("/medicamentos", { letra });

		// Retorna o resultado (ajuste conforme a estrutura da sua API: .result ou .data)
		return response.data.result || response.data || [];
	},
};

import { api } from "../config/api";

export const senhaService = {
	/**
	 * Altera a senha no PRIMEIRO ACESSO (sem precisar da senha atual)
	 * Rota: /alterasenha
	 */
	alterarPrimeiroAcesso: async (pacienteId: number, novaSenha: string) => {
		const response = await api.post("/alterasenha", {
			id: pacienteId,
			senha: novaSenha,
		});
		if (!response.data || response.data === "" || response.data.length === 0) {
			return "SUCESSO";
		}
		// Retorna a string de resposta (Ex: "SENHA ALTERADA COM SUCESSO")
		return response.data;
	},

	/**
	 * Altera a senha logado (Validando a senha antiga)
	 * Rota: /alterasenhaconfirmacao
	 */
	alterarComConfirmacao: async (
		pacienteId: number,
		senhaAtual: string,
		novaSenha: string,
	) => {
		const response = await api.post("/alterasenhaconfirmacao", {
			id: pacienteId,
			senhaatual: senhaAtual,
			senha: novaSenha,
		});

		return response.data;
	},
};

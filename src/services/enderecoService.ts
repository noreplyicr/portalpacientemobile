import { apiPaciente } from "../config/api";

export const enderecoService = {
	// Lista endereços do paciente
	getEnderecos: async (idpaciente: number) => {
		const resp = await apiPaciente.post(`/carregaenderecospaciente`, {
			idpaciente,
		});
		return resp.data.data;
	},

	// Consulta CEP
	consultaCep: async (cep: string) => {
		const numeroLimpo = cep.replace("-", "");
		const resp = await apiPaciente.post(`/consultaendereco`, {
			cep: { numero: numeroLimpo },
		});
		return resp.data;
	},

	// Salva novo endereço
	saveEndereco: async (payload: any) => {
		const resp = await apiPaciente.post(`/cadastraendereco`, payload);
		return resp.data;
	},

	// Deleta endereço
	deleteEndereco: async (id: number) => {
		const resp = await apiPaciente.post(`/removeendereco`, { id });
		return resp.data;
	},

	// Define como principal
	setPrincipal: async (payload: any) => {
		const resp = await apiPaciente.post(`/cadastraenderecoprincipal`, payload);
		return resp.data;
	},
};

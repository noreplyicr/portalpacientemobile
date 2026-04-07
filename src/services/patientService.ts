import { Platform } from "react-native";
import { api, apiPaciente } from "../config/api";

/**
 * 1. Avisa o backend que o paciente visualizou os dados pendentes.
 */
export async function updatePatientDataFlag(pacienteId: string, tipo: number) {
	try {
		const response = await apiPaciente.post(`/flagalteradados`, {
			id: pacienteId,
			tipobusca: tipo,
			device: Platform.OS,
		});
		return response.data;
	} catch (error) {
		console.error("Erro ao atualizar flag:", error);
		throw error;
	}
}

/**
 * 2. Busca o link do PDF do Slip de retorno.
 */
export async function getPatientSlip(pacienteId: string) {
	try {
		const response = await api.post(`/slipretorno`, {
			nome: pacienteId,
		});
		return response.data;
	} catch (error) {
		console.error("Erro ao buscar Slip:", error);
		throw error;
	}
}

/**
 * 3. NOVO: Busca a posição na fila (integrando aquele código antigo)
 */
export async function getPatientQueue(pacienteId: string) {
	try {
		const response = await api.post(`/posicaofila`, {
			id: pacienteId,
		});
		// Retorna o array de filas (ex: [{AGENDA: '...', POSICAO: 2, linklaudo: '...'}])
		return response.data;
	} catch (error) {
		console.error("Erro ao buscar Fila:", error);
		throw error;
	}
}
/**
 * 4. NOVO: Cadastra ou atualiza o CPF do paciente.
 */
export async function updatePatientCpf(
	pacienteId: number | string,
	cpf: string,
) {
	try {
		const response = await api.post(`/cadastracpf`, {
			id: pacienteId,
			cpf: cpf,
		});

		// O backend retorna uma string que pode conter 'ERRO'
		// Se houver erro, lançamos uma exceção para o componente tratar
		if (typeof response.data === "string" && response.data.includes("ERRO")) {
			throw new Error(response.data);
		}

		return response.data;
	} catch (error: any) {
		console.error("Erro ao cadastrar CPF:", error);
		// Repassa o erro para ser capturado pelo catch do componente (onde está o Toast)
		throw error;
	}
}

/**
 * Realiza o upload da foto do paciente (Avatar) usando Base64
 * Evita o erro 415 enviando JSON em vez de FormData
 */
export async function uploadPatientAvatar(paciente: any, base64Image: string) {
	try {
		// Montamos o objeto exatamente como o seu backend espera
		const payload = {
			id: paciente.id,
			nome: paciente.nome,
			matricula: paciente.matricula,
			efoto: base64Image, // Enviamos a string Base64 aqui
			dirfoto: "AVATAR",
		};

		// Enviamos como um POST comum (JSON)
		// O axios vai usar automaticamente "Content-Type: application/json"
		const response = await api.post(`/efotos`, payload);

		// O retorno do seu servidor costuma ser a URL da imagem ou "OK"
		if (typeof response.data === "string" && response.data.includes("http")) {
			return response.data;
		}

		return response.data;
	} catch (error) {
		console.error("Erro no upload da foto (Base64):", error);
		throw error;
	}
}

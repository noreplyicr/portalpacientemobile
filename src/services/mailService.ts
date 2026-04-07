import { Platform } from "react-native";
// 1. Corrigido: Importando da fonte central de configuração da API
import { api } from "../config/api";

interface SendMailProps {
	matricula: string;
	nome: string;
	email: string;
	motivo: string;
	mensagem: string;
}

export const mailService = {
	async sendContactEmail(values: SendMailProps) {
		// Centraliza a construção do HTML aqui
		const body = `
            <table>
                <tr><td><b>MATRICULA:</b></td><td>${values.matricula}</td></tr>
                <tr><td><b>NOME:</b></td><td>${values.nome}</td></tr>
                <tr><td><b>EMAIL:</b></td><td>${values.email}</td></tr>
                <tr><td><b>MOTIVO:</b></td><td>${values.motivo}</td></tr>
                <tr><td><b>MENSAGEM:</b></td><td>${values.mensagem}</td></tr>
            </table>
        `;

		// Regra de negócio de destinatários centralizada
		const destinatario =
			values.motivo === "OUVIDORIA"
				? "ouvidoria.icr@hc.fm.usp.br"
				: "cstis.icr@hc.fm.usp.br";

		const subject = `${values.motivo} - MENSAGEM PORTAL PACIENTE - APP-${Platform.OS.toUpperCase()}`;

		// Agora usa a instância 'api' oficial que já tem o token do paciente logado
		return api.post(`/sendContact`, {
			origem: "noreply.icr@hc.fm.usp.br",
			destinatario,
			subject,
			body,
		});
	},
};

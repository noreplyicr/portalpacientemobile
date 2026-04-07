import { api } from "../config/api";

// Interfaces para manter o código organizado e com autocompletar
export interface PhoneEntry {
	descricao: string;
	numero: string;
}

export interface Servico {
	servico: string;
	phones: PhoneEntry[];
}

export const phoneService = {
	// 1. Busca a lista de ramais úteis da instituição (ICR)
	getTelefones: async (): Promise<Servico[]> => {
		const resp = await api.post(`/gettelefonesicr`);
		return resp.data.servicos || [];
	},

	// 2. Busca Tipos de Telefone (Celular, Fixo, etc)
	getPhoneTypes: async () => {
		const resp = await api.post(`/carregatipophones`);
		return (resp.data.Table || []).map((item: any) => ({
			value: `${item.VALUE}¨${item.LABEL}`,
			label: item.LABEL,
		}));
	},

	// 3. Busca Tipos de Responsáveis (Próprio, Pai, Mãe)
	getResponsibleTypes: async () => {
		const resp = await api.post(`/carregatipophonesresponsaveis`);
		return (resp.data.Table || []).map((item: any) => ({
			value: `${item.VALUE}¨${item.LABEL}`,
			label: item.LABEL,
		}));
	},

	// 4. Busca a lista de telefones cadastrados do paciente
	getPhones: async (pacienteId: number) => {
		const resp = await api.post(`/carregaphones`, {
			paciente: { id: pacienteId },
		});
		return resp.data.data || [];
	},

	// 5. Remove um telefone do cadastro
	deletePhone: async (id: number, db: string) => {
		const resp = await api.post(`/removetelefones`, { id, db });
		return resp.data;
	},

	// 6. Salva um novo telefone seguindo as regras de extração de ID e limpeza
	savePhone: async (pacienteId: number, data: any) => {
		const cleanPhone = data.numero.replace(/\D/g, "");

		// Extração dos IDs das strings compostas "ID¨LABEL"
		const tipoId = data.tipoContato.split("¨")[0].split("#")[0];
		const respId = data.tipoResponsavel.split("¨")[0];

		const payload = {
			paciente: { id: pacienteId },
			numero: cleanPhone,
			tipotelefone: { id: tipoId },
			responsavel: { id: respId },
			cidade: { ddd: cleanPhone.substring(0, 2) },
		};

		const resp = await api.post(`/cadastratelefones`, payload);
		return resp.data;
	},
};

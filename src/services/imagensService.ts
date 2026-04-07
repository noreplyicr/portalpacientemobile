import { api } from "../config/api";

export const imagensService = {
	upload: async (payload: {
		id: number | string | undefined;
		nome: string | undefined;
		matricula: string | undefined;
		efoto: string;
		dirfoto: string;
	}) => {
		// O endpoint deve ser o mesmo que você usava no projeto anterior
		const response = await api.post("/efotos", payload);
		return response.data;
	},
};

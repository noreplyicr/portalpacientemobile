import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { authEvents } from "../services/authEvents";

const isWeb = Platform.OS === "web";
const STORAGE_KEY = "hcfm_user_data";

export const api = axios.create({
	baseURL: "https://webapiicr.icr.usp.br/api/PortalPaciente",
	timeout: 15000,
	headers: {
		"Content-Type": "application/json",
		Accept: "application/json",
	},
});

export const apiDB = axios.create({
	baseURL: "https://webapiicr.icr.usp.br/api/db",
	timeout: 15000,
	headers: {
		"Content-Type": "application/json",
		Accept: "application/json",
	},
});

export const apiPaciente = axios.create({
	baseURL: "https://webapiicr.icr.usp.br/api/Paciente",
	timeout: 15000,
	headers: {
		"Content-Type": "application/json",
		Accept: "application/json",
	},
});

// --- INTERCEPTOR DE REQUISIÇÃO ---
api.interceptors.request.use(
	async (config) => {
		try {
			let storagedUser = isWeb
				? localStorage.getItem(STORAGE_KEY)
				: await SecureStore.getItemAsync(STORAGE_KEY);

			if (storagedUser) {
				const parsed = JSON.parse(storagedUser);
				const agora = Date.now();

				// --- ADICIONE ESTA TRAVA AQUI ---
				// Se o tempo local acabou, nem tenta enviar o token
				if (parsed.expiresAt && agora > parsed.expiresAt) {
					console.warn(
						"Tentativa de requisição com token expirado localmente.",
					);
					authEvents.emit(); // Força o logout se tentar usar algo vencido
					return Promise.reject("Token expirado localmente");
				}

				if (parsed.token) {
					config.headers.Authorization = `Bearer ${parsed.token}`;
				}
			}
		} catch (error) {
			console.error("Erro ao recuperar token no interceptor", error);
		}
		return config;
	},
	(error) => Promise.reject(error),
);

// --- INTERCEPTOR DE RESPOSTA (Trata erro 401) ---
api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response && error.response.status === 401) {
			// Se NÃO for a rota de login e der 401, desloga
			if (!error.config.url?.includes("login")) {
				console.log("Sessão expirada. Redirecionando para login...");
				authEvents.emit();
			}
		}
		return Promise.reject(error);
	},
);

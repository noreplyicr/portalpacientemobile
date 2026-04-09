import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { api } from "../config/api";

export async function registerAndSavePushToken(pacienteId: string) {
	// 1. TRAVA DE SEGURANÇA: Expo Go não suporta FCM nativo customizado
	if (Constants.appOwnership === "expo") {
		return null;
	}

	try {
		// 2. Verifica permissão
		const { status: existingStatus } =
			await Notifications.getPermissionsAsync();
		let finalStatus = existingStatus;

		if (existingStatus !== "granted") {
			const { status } = await Notifications.requestPermissionsAsync();
			finalStatus = status;
		}

		if (finalStatus !== "granted") {
			console.log("Push: Permissão negada pelo usuário.");
			return null;
		}

		// 3. Obtém o token com Timeout para não travar o app
		// Se o Google não responder em 10s, ele lança um erro que cai no catch interno
		const projectId = "f2f844b8-cc0c-4faa-9a0d-f5bf75cea84d";

		const tokenPromise = Notifications.getExpoPushTokenAsync({ projectId });
		const timeoutPromise = new Promise((_, reject) =>
			setTimeout(() => reject(new Error("Timeout ao buscar token")), 10000),
		);

		const response = await (Promise.race([
			tokenPromise,
			timeoutPromise,
		]) as any);
		const token = response.data;

		if (token) {
			console.log("Push Token Gerado:", token);

			// 4. Envia para o Backend (com catch isolado para não afetar o app)
			await api
				.post("/tokendevice", {
					paciente: { id: pacienteId },
					vtoken: token,
					device: Platform.OS,
				})
				.then(() => {
					console.log("Push: Token salvo no servidor com sucesso.");
				})
				.catch((apiError) => {
					console.log(
						"Push: Erro ao salvar na API (Backend):",
						apiError?.message,
					);
				});

			return token;
		}

		return null;
	} catch (error) {
		// MOSTRA NO LOG: Para você saber o que houve
		// NADA PRO USUÁRIO: O try/catch consome o erro e retorna null silenciosamente
		console.log("--- Erro Silencioso ao registrar Push ---");
		console.log(error);
		console.log("------------------------------------------");

		return null;
	}
}

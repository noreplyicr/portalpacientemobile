import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { api } from "../config/api";

export async function registerAndSavePushToken(pacienteId: string) {
	// 1. TRAVA DE SEGURANÇA: Se estiver no Expo Go, para tudo aqui.
	// Isso evita o erro de "Uncaught Error" e protege seu layout.
	if (Constants.appOwnership === "expo") {
		return null;
	}

	try {
		// 2. Verifica se temos permissão
		const { status: existingStatus } =
			await Notifications.getPermissionsAsync();
		let finalStatus = existingStatus;

		if (existingStatus !== "granted") {
			const { status } = await Notifications.requestPermissionsAsync();
			finalStatus = status;
		}

		if (finalStatus !== "granted") {
			console.log("Permissão de notificação negada.");
			return null;
		}

		// 3. Obtém o token do Expo
		// Certifique-se que o projectId está no seu app.json
		const projectId =
			Constants.expoConfig?.extra?.eas?.projectId ||
			Constants.easConfig?.projectId;

		const token = (
			await Notifications.getExpoPushTokenAsync({
				projectId,
			})
		).data;

		console.log("Push Token Gerado:", token);

		// 4. Envia para o seu Backend
		// Substitua pela sua chamada de API real
		console.log("Enviando para o banco. ID:", pacienteId, "Token:", token);
		await api.post("/tokendevice", {
			paciente: { id: pacienteId },
			vtoken: token,
			device: Platform.OS,
		});

		return token;
	} catch (error) {
		console.log("Erro ao registrar push:", error);
		return null;
	}
}

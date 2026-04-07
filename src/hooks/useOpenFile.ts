import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { Linking, Platform } from "react-native";

export const useOpenFile = () => {
	const [loadingOpen, setLoadingOpen] = useState(false);
	const [downloadProgress] = useState(0); // Mantido em 0 para compatibilidade com o componente OpenFileButton
	const [modalConfig, setModalConfig] = useState({
		visible: false,
		type: "error" as "success" | "error",
		title: "",
		message: "",
	});

	const closeModal = () =>
		setModalConfig((prev) => ({ ...prev, visible: false }));

	const onOpen = async (url: string) => {
		if (!url) return;

		setLoadingOpen(true);
		try {
			// ESTRATÉGIA ANTI-CRASH PARA ANDROID:
			// Links http:// ou de visualizadores da USP/SIGH podem ser instáveis no WebBrowser interno do Expo Go.
			// Abrir no navegador externo (Chrome/Samsung) garante que o App não feche ao voltar.
			if (
				Platform.OS === "android" &&
				(url.startsWith("http://") ||
					url.includes("aspx") ||
					url.includes("php"))
			) {
				await Linking.openURL(url);
				// Pequeno delay apenas para o loading do botão não sumir instantaneamente
				setTimeout(() => setLoadingOpen(false), 1000);
				return;
			}

			// iOS e links HTTPS seguros usam o WebBrowser interno (In-App Browser)
			const result = await WebBrowser.openBrowserAsync(url, {
				toolbarColor: "#1e1b54",
				showTitle: true,
				enableBarCollapsing: true,
				secondaryToolbarColor: "black",
				presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
			});

			// Limpeza manual para iOS ao cancelar/fechar
			if (result.type === "cancel" && Platform.OS === "ios") {
				await WebBrowser.dismissBrowser();
			}
		} catch (e: any) {
			console.error("Erro ao abrir link:", e);
			// Plano B: Se o WebBrowser falhar por qualquer motivo, tenta o Linking nativo
			try {
				await Linking.openURL(url);
			} catch (err) {
				setModalConfig({
					visible: true,
					type: "error",
					title: "Erro de Conexão",
					message: "Não foi possível abrir o visualizador de documentos.",
				});
			}
		} finally {
			setLoadingOpen(false);
		}
	};

	return { onOpen, loadingOpen, downloadProgress, modalConfig, closeModal };
};

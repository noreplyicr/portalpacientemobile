// IMPORTANTE: Mudamos a importação para /legacy para funcionar o Resumable
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { useState } from "react";

export const useShareFile = () => {
	const [loadingshare, setLoadingShare] = useState<boolean>(false);
	const [downloadProgress, setDownloadProgress] = useState<number>(0);

	const [modalConfig, setModalConfig] = useState({
		visible: false,
		type: "success" as "success" | "error",
		title: "",
		message: "",
	});

	const closeModal = () =>
		setModalConfig((prev) => ({ ...prev, visible: false }));

	const onShare = async (url: string) => {
		console.log("--- INICIANDO DOWNLOAD (LEGACY) ---");
		setLoadingShare(true);
		setDownloadProgress(0);

		try {
			// No legacy, o documentDirectory costuma estar na raiz do FileSystem
			const fs: any = FileSystem;
			const baseDir = fs.documentDirectory;
			const fileUri = baseDir + "prescricao.pdf";

			const callback = (downloadProgress: any) => {
				const progress =
					downloadProgress.totalBytesWritten /
					downloadProgress.totalBytesExpectedToWrite;
				setDownloadProgress(progress * 100);
			};

			const downloadResumable = FileSystem.createDownloadResumable(
				url,
				fileUri,
				{},
				callback,
			);

			const result = await downloadResumable.downloadAsync();

			if (result && result.uri) {
				const isAvailable = await Sharing.isAvailableAsync();
				if (isAvailable) {
					await Sharing.shareAsync(result.uri);
				}
			}
		} catch (e: any) {
			console.error("Erro no download:", e.message);
			setModalConfig({
				visible: true,
				type: "error",
				title: "Falha no Download",
				message: "Ocorreu um erro ao processar o arquivo. Tente novamente.",
			});
		} finally {
			setLoadingShare(false);
			setDownloadProgress(0);
		}
	};

	return {
		onShare,
		loadingshare,
		downloadProgress,
		modalConfig,
		closeModal,
	};
};

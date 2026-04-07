import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	Modal,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

// Componentes Customizados
import { Footer } from "@/src/components/Footer";
import { OpenFileButton } from "@/src/components/OpenFileButton";
import { PageHeader } from "@/src/components/PageHeader";
import { SegmentedControl } from "@/src/components/SegmentedControl";
import { ShareButton } from "@/src/components/ShareButton";
import { StatusModal } from "@/src/components/StatusModal";

// Hooks e Services
import { useOpenFile } from "@/src/hooks/useOpenFile";
import { useShareFile } from "@/src/hooks/useShareFile";
import { exameService } from "../../src/services/exameService";

export default function PreparoExames() {
	const [abaAtiva, setAbaAtiva] = useState<"LAB" | "IMG">("LAB");
	const [letraSelecionada, setLetraSelecionada] = useState("A");
	const [exames, setExames] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);

	const [modalTextoVisible, setModalTextoVisible] = useState(false);
	const [modalPdfVisible, setModalPdfVisible] = useState(false);
	const [exameSelecionado, setExameSelecionado] = useState<any>(null);

	const [itemProcessando, setItemProcessando] = useState<{
		id: string;
		mode: "open" | "share";
	} | null>(null);

	const {
		onOpen,
		loadingOpen,
		downloadProgress: openProgress,
		modalConfig: openModal,
		closeModal: closeOpenModal,
	} = useOpenFile();

	const {
		onShare,
		loadingshare,
		downloadProgress: shareProgress,
		modalConfig: shareModal,
		closeModal: closeShareModal,
	} = useShareFile();

	const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

	const carregarDados = useCallback(async () => {
		setLoading(true);
		try {
			let dados;
			if (abaAtiva === "LAB") {
				dados = await exameService.getPreparoExames(letraSelecionada);
			} else {
				dados = await exameService.getPreparoExamesSADT("");
			}
			setExames(Array.isArray(dados) ? dados : []);
		} catch (error) {
			console.log("Erro ao carregar dados:", error);
			setExames([]);
		} finally {
			setLoading(false);
		}
	}, [abaAtiva, letraSelecionada]);

	useEffect(() => {
		carregarDados();
	}, [carregarDados]);

	const handleFileAction = async (mode: "open" | "share") => {
		const link = exameSelecionado?.linklaudo || exameSelecionado?.link_laudo;
		if (!link) return;

		const itemId = exameSelecionado?.descricao;
		setItemProcessando({ id: itemId, mode });

		try {
			if (mode === "open") {
				await onOpen(link);
			} else {
				await onShare(link);
			}
			// Só fecha o modal se a ação foi disparada com sucesso
			setModalPdfVisible(false);
		} catch (error) {
			console.error("Erro ao processar arquivo:", error);
		} finally {
			setItemProcessando(null);
		}
	};

	const handleAcaoExame = (item: any) => {
		if (!item || typeof item !== "object") return;
		setExameSelecionado(item);

		if (abaAtiva === "IMG" && (item.linklaudo || item.link_laudo)) {
			setModalPdfVisible(true);
		} else {
			setModalTextoVisible(true);
		}
	};

	return (
		<View style={{ flex: 1, backgroundColor: "#F8F9FA" }}>
			<View style={{ flex: 1 }}>
				<PageHeader
					titulo="Preparo de Exames"
					subtitulo="CONSULTE AS INSTRUÇÕES"
				>
					<View className="mt-4">
						<SegmentedControl
							valorAtual={abaAtiva}
							onChange={(novoValor: string) => {
								setExames([]);
								setAbaAtiva(novoValor as any);
							}}
							opcoes={[
								{ label: "LABORATÓRIO", value: "LAB" },
								{ label: "IMAGEM (SADT)", value: "IMG" },
							]}
						/>
					</View>
				</PageHeader>

				{abaAtiva === "LAB" && (
					<View className="h-16 mt-2 mb-2">
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={{
								paddingHorizontal: 20,
								alignItems: "center",
							}}
						>
							{letras.map((letra) => {
								const selecionada = letraSelecionada === letra;
								return (
									<TouchableOpacity
										key={letra}
										onPress={() => setLetraSelecionada(letra)}
										className={`w-12 h-12 rounded-full items-center justify-center mx-1.5 shadow-md border-2 ${
											selecionada
												? "bg-[#00877C] border-[#00877C]"
												: "bg-white border-gray-200"
										}`}
									>
										<Text
											className={`font-hcf-bold text-lg ${selecionada ? "text-white" : "text-[#191455]"}`}
										>
											{letra}
										</Text>
									</TouchableOpacity>
								);
							})}
						</ScrollView>
					</View>
				)}

				<View style={{ flex: 1, marginTop: abaAtiva === "IMG" ? 20 : 0 }}>
					{loading ? (
						<View className="flex-1 justify-center items-center">
							<ActivityIndicator size="large" color="#00877C" />
						</View>
					) : (
						<FlatList
							data={exames}
							keyExtractor={(_, index) => index.toString()}
							contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
							ListEmptyComponent={() => (
								<View className="p-10 items-center">
									<Text className="text-gray-400 font-hcf-regular">
										Nenhum exame encontrado.
									</Text>
								</View>
							)}
							renderItem={({ item }) => (
								<TouchableOpacity
									className="bg-white mx-4 mb-3 p-4 rounded-2xl flex-row justify-between items-center shadow-sm border border-gray-50"
									onPress={() => handleAcaoExame(item)}
								>
									<View className="flex-1 pr-4">
										<Text className="text-[#191455] font-hcf-bold text-[13px] uppercase">
											{item.descricao}
										</Text>
										<View className="flex-row items-center mt-2">
											<MaterialCommunityIcons
												name={
													abaAtiva === "IMG"
														? "file-pdf-box"
														: "text-box-search-outline"
												}
												size={14}
												color="#00877C"
											/>
											<Text className="text-gray-500 text-[10px] ml-1 uppercase font-hcf-bold">
												{abaAtiva === "IMG" ? "Preparo em PDF" : "Instruções"}
											</Text>
										</View>
									</View>
									<MaterialCommunityIcons
										name="chevron-right"
										size={24}
										color="#00877C"
									/>
								</TouchableOpacity>
							)}
						/>
					)}
				</View>
			</View>

			<Footer />

			{/* MODAL TEXTO */}
			<Modal
				transparent
				visible={modalTextoVisible}
				animationType="slide"
				onRequestClose={() => setModalTextoVisible(false)}
			>
				<View className="flex-1 justify-end bg-black/60">
					<View className="bg-white rounded-t-[40px] p-8 h-[70%]">
						<View className="w-12 h-1.5 bg-gray-200 rounded-full self-center mb-6" />
						<Text className="text-[#191455] font-hcf-bold text-lg mb-2">
							{exameSelecionado?.descricao}
						</Text>
						<ScrollView className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
							<Text className="leading-6 text-gray-600 font-hcf-regular">
								{exameSelecionado?.preparo || "Nenhuma instrução encontrada."}
							</Text>
						</ScrollView>
						<TouchableOpacity
							onPress={() => setModalTextoVisible(false)}
							className="bg-[#191455] mt-6 py-4 rounded-2xl items-center"
						>
							<Text className="text-white font-hcf-bold">FECHAR</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>

			{/* MODAL PDF */}
			<Modal
				transparent
				visible={modalPdfVisible}
				animationType="fade"
				onRequestClose={() => setModalPdfVisible(false)}
			>
				<View className="flex-1 justify-center items-center bg-black/70 px-6">
					<View className="bg-white w-full rounded-[32px] p-6 shadow-2xl">
						<View className="items-center mb-6">
							<View className="bg-red-50 p-4 rounded-full mb-3">
								<MaterialCommunityIcons
									name="file-pdf-box"
									size={42}
									color="#D32F2F"
								/>
							</View>
							<Text className="text-[#191455] font-hcf-bold text-center text-base uppercase px-2">
								{exameSelecionado?.descricao}
							</Text>
						</View>

						<View className="flex-row justify-center items-center mb-10 mt-4">
							<View className="items-center mx-6">
								<OpenFileButton
									size={60}
									onPress={() => handleFileAction("open")}
									loading={
										(itemProcessando?.id === exameSelecionado?.descricao &&
											itemProcessando?.mode === "open") ||
										loadingOpen
									}
									progress={openProgress}
								/>
								<Text className="text-[#191455] font-hcf-bold text-[10px] mt-3 uppercase tracking-wider">
									Visualizar
								</Text>
							</View>

							<View className="items-center mx-6">
								<ShareButton
									size={60}
									onPress={() => handleFileAction("share")}
									loading={
										(itemProcessando?.id === exameSelecionado?.descricao &&
											itemProcessando?.mode === "share") ||
										loadingshare
									}
									progress={shareProgress}
								/>
								<Text className="text-[#191455] font-hcf-bold text-[10px] mt-3 uppercase tracking-wider">
									Enviar
								</Text>
							</View>
						</View>

						<TouchableOpacity
							onPress={() => setModalPdfVisible(false)}
							className="bg-gray-50 py-3 rounded-2xl items-center border border-gray-100"
						>
							<Text className="text-gray-400 font-hcf-bold uppercase text-xs">
								Voltar
							</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>

			<StatusModal config={openModal} onClose={closeOpenModal} />
			<StatusModal config={shareModal} onClose={closeShareModal} />
		</View>
	);
}

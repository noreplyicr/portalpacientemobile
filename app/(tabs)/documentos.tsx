import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import {
	ActivityIndicator,
	SectionList,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

// Componentes Customizados
import { EmptyState } from "@/src/components/EmptyState";
import { Footer } from "@/src/components/Footer";
import { OpenFileButton } from "@/src/components/OpenFileButton";
import { PageHeader } from "@/src/components/PageHeader";
import { SegmentedControl } from "@/src/components/SegmentedControl";
import { ShareButton } from "@/src/components/ShareButton";
import { StatusModal } from "@/src/components/StatusModal";

// Hooks e Services
import { useAuth } from "@/src/contexts/AuthContext";
import { useOpenFile } from "@/src/hooks/useOpenFile";
import { useShareFile } from "@/src/hooks/useShareFile";
import { guiaService } from "@/src/services/guiaService";

// --- AJUSTE DE COMPATIBILIDADE ---
const FS = FileSystem as any;
// Usamos cache como prioridade, mas documentDirectory como reserva
const BASE_DIR = FS.cacheDirectory || FS.documentDirectory;

type AbaType = "GUIAS" | "LAUDOS" | "REC" | "TFD" | "DOCS";

export default function Documentos() {
	const { user } = useAuth();
	const [abaAtiva, setAbaAtiva] = useState<AbaType>("GUIAS");
	const [loading, setLoading] = useState(false);
	const [dataSource, setDataSource] = useState<any[]>([]);
	const [fetchingUrl, setFetchingUrl] = useState<string | number | null>(null);

	const [errorModal, setErrorModal] = useState({
		visible: false,
		type: "info" as "error" | "info" | "success",
		title: "",
		message: "",
	});

	const [dataInicio, setDataInicio] = useState(
		new Date(new Date().setMonth(new Date().getMonth() - 2)),
	);
	const [dataFim, setDataFim] = useState(new Date());
	const [showPicker, setShowPicker] = useState<{
		show: boolean;
		mode: "inicio" | "fim";
	}>({ show: false, mode: "inicio" });

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

	const formatarParaAPI = (date: Date) => {
		const d = date.getDate().toString().padStart(2, "0");
		const m = (date.getMonth() + 1).toString().padStart(2, "0");
		const y = date.getFullYear();
		return `${d}/${m}/${y}`;
	};

	useEffect(() => {
		if (user?.id || user?.iddw) {
			fetchDados();
		}
	}, [abaAtiva, user?.id, user?.iddw, dataInicio, dataFim]);

	const fetchDados = async () => {
		setLoading(true);
		try {
			let dadosBrutos: any[] = [];

			if (abaAtiva === "GUIAS") {
				dadosBrutos = await guiaService.loadGuiasSadt(user?.id as any);
			} else if (abaAtiva === "DOCS") {
				dadosBrutos = await guiaService.loadDocsPaciente(user?.id as any);
			} else if (abaAtiva === "LAUDOS") {
				dadosBrutos = await guiaService.loadLaudos(user?.id as any);
			} else if (abaAtiva === "REC") {
				dadosBrutos = await guiaService.loadReceitasSigh(user?.iddw as any);
			} else if (abaAtiva === "TFD") {
				const urlTfdRaw = await guiaService.loadTFD(
					user?.id as any,
					formatarParaAPI(dataInicio),
					formatarParaAPI(dataFim),
				);
				const urlTfd =
					typeof urlTfdRaw === "string"
						? urlTfdRaw.replace(/"/g, "").trim()
						: null;

				dadosBrutos =
					urlTfd && urlTfd.startsWith("http")
						? [
								{
									URL: urlTfd,
									DESCRICAO: "Documento TFD Gerado",
									DATA: formatarParaAPI(dataFim),
									SOLICITANTE: "SISTEMA TFD",
								},
							]
						: [];
			}

			if (!dadosBrutos || dadosBrutos.length === 0) {
				setDataSource([]);
				return;
			}

			if (abaAtiva === "REC") {
				const agrupado = agruparPorAno(dadosBrutos);
				setDataSource(agrupado);
			} else {
				setDataSource([{ title: "", data: dadosBrutos }]);
			}
		} catch (error) {
			setDataSource([]);
		} finally {
			setLoading(false);
		}
	};

	const agruparPorAno = (dados: any[]) => {
		const agrupado = _.groupBy(dados, (item) => {
			const dataStr = String(item.data || "")
				.replace("DATA:", "")
				.trim();
			const partes = dataStr.split("/");
			return partes.length === 3 ? partes[2] : "Outros";
		});
		return Object.keys(agrupado)
			.sort((a, b) => b.localeCompare(a))
			.map((ano) => ({ title: ano, data: agrupado[ano] }));
	};

	const handleAction = async (item: any, action: "open" | "share") => {
		let finalUrl = "";
		const currentId = item.id || item.ID || item.nrsolicitacao;

		try {
			setFetchingUrl(currentId);

			// 1. Obter a URL correta conforme a aba
			if (abaAtiva === "REC") {
				const res = await guiaService.carregarReceitaSigh(item.id);
				finalUrl = res?.url || "";
			} else if (abaAtiva === "GUIAS") {
				const res = await guiaService.carregarGuiaSadt(item.ID_DOC);
				finalUrl = res?.url || "";
			} else if (abaAtiva === "DOCS") {
				const res = await guiaService.carregarFile(item.ID_DOC);
				finalUrl = res?.url || "";
			} else if (abaAtiva === "LAUDOS") {
				finalUrl = item.linklaudo;
			} else if (abaAtiva === "TFD") {
				finalUrl = item?.URL || "";
			}

			finalUrl = (finalUrl || "").replace(/"/g, "").trim();

			if (!finalUrl || !finalUrl.toLowerCase().startsWith("http")) {
				setErrorModal({
					visible: true,
					type: "info",
					title: "Documento indisponível",
					message: "O link deste documento ainda não foi gerado pelo sistema.",
				});
				return;
			}

			// 2. Lógica Especial para Visualizador ASPX (Baixar e Compartilhar)
			if (finalUrl.toLowerCase().includes("pdfviewer.aspx") && BASE_DIR) {
				const fileUri = `${BASE_DIR}documento_${currentId}.pdf`;

				try {
					const downloadRes = await FS.downloadAsync(finalUrl, fileUri);
					if (downloadRes.status === 200) {
						await Sharing.shareAsync(downloadRes.uri, {
							mimeType: "application/pdf",
							dialogTitle: "Visualizar Documento",
							UTI: "com.adobe.pdf",
						});
						return; // Sucesso, interrompe aqui
					}
				} catch (downloadErr) {
					console.log("Falha no download, tentando abrir via navegador...");
				}
			}

			// 3. Fallback: Se não for ASPX ou se o download falhou, abre no navegador padrão
			action === "open" ? onOpen(finalUrl) : onShare(finalUrl);
		} catch (err) {
			console.error("Erro handleAction:", err);
			onOpen(finalUrl); // Última tentativa: joga pro navegador
		} finally {
			setFetchingUrl(null);
		}
	};

	const renderEmpty = () => {
		if (loading) return null;
		const configs = {
			GUIAS: {
				titulo: "Nenhuma Guia",
				msg: "Sem guias SADT pendentes.",
				icone: "file-document-outline" as const,
			},
			DOCS: {
				titulo: "Sem Documentos",
				msg: "Nenhum documento disponível.",
				icone: "folder-open-outline" as const,
			},
			LAUDOS: {
				titulo: "Sem Laudos",
				msg: "Não encontramos laudos.",
				icone: "test-tube" as const,
			},
			REC: {
				titulo: "Sem Receitas",
				msg: "Não há registros de receitas.",
				icone: "clipboard-text-outline" as const,
			},
			TFD: {
				titulo: "Sem TFD",
				msg: "Nenhum registro no período selecionado.",
				icone: "bus-clock" as const,
			},
		};
		const atual = configs[abaAtiva];
		return (
			<EmptyState
				titulo={atual.titulo}
				mensagem={atual.msg}
				icone={atual.icone}
			/>
		);
	};

	return (
		<View style={{ flex: 1, backgroundColor: "#F8F9FA" }}>
			<PageHeader titulo="MEUS DOCUMENTOS" subtitulo={user?.nome || "Paciente"}>
				<View className="mt-6">
					<SegmentedControl
						valorAtual={abaAtiva}
						onChange={(v: string) => setAbaAtiva(v as AbaType)}
						opcoes={[
							{ label: "GUIAS", value: "GUIAS" },
							{ label: "LAUDOS", value: "LAUDOS" },
							{ label: "RECEITAS", value: "REC" },
							{ label: "TFD", value: "TFD" },
							{ label: "DOCS", value: "DOCS" },
						]}
					/>
				</View>
			</PageHeader>

			{abaAtiva === "TFD" && (
				<View className="flex-row bg-white px-5 py-4 border-b border-slate-100 justify-between items-center">
					<TouchableOpacity
						onPress={() => setShowPicker({ show: true, mode: "inicio" })}
						className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 flex-1 mr-2"
					>
						<Text className="text-[10px] text-slate-400 font-bold uppercase">
							De:
						</Text>
						<Text className="text-slate-700 font-bold">
							{dataInicio.toLocaleDateString("pt-BR")}
						</Text>
					</TouchableOpacity>
					<Feather name="arrow-right" size={16} color="#cbd5e1" />
					<TouchableOpacity
						onPress={() => setShowPicker({ show: true, mode: "fim" })}
						className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 flex-1 ml-2"
					>
						<Text className="text-[10px] text-slate-400 font-bold uppercase">
							Até:
						</Text>
						<Text className="text-slate-700 font-bold">
							{dataFim.toLocaleDateString("pt-BR")}
						</Text>
					</TouchableOpacity>
				</View>
			)}

			{showPicker.show && (
				<DateTimePicker
					value={showPicker.mode === "inicio" ? dataInicio : dataFim}
					mode="date"
					display="default"
					onChange={(e, date) => {
						setShowPicker({ ...showPicker, show: false });
						if (date)
							showPicker.mode === "inicio"
								? setDataInicio(date)
								: setDataFim(date);
					}}
				/>
			)}

			<View style={{ flex: 1 }}>
				{loading ? (
					<ActivityIndicator
						size="large"
						color="#1e1b54"
						style={{ marginTop: 40 }}
					/>
				) : (
					<SectionList
						sections={dataSource}
						keyExtractor={(item, index) => index.toString()}
						contentContainerStyle={{
							paddingTop: 20,
							paddingBottom: 120,
							flexGrow: 1,
						}}
						stickySectionHeadersEnabled={true}
						ListEmptyComponent={renderEmpty}
						renderSectionHeader={({ section: { title } }) =>
							title ? (
								<View className="bg-gray-100 px-6 py-2 mb-2">
									<Text className="text-gray-500 font-bold text-[11px] uppercase tracking-wider">
										Arquivos de {title}
									</Text>
								</View>
							) : null
						}
						renderItem={({ item }) => {
							const isLaudo = abaAtiva === "LAUDOS";
							const isRec = abaAtiva === "REC";
							const dataExibicao = isLaudo
								? item?.datasolicitacaof
								: isRec
									? item?.data?.replace("DATA:", "").trim()
									: item?.DATA_FORMATADA || item?.data || item?.DATA;
							const tituloDoc = isLaudo
								? `Solicitação #${item.nrsolicitacao}`
								: isRec
									? item?.servico?.split(" - ")[1] || item?.servico
									: item?.NOMEFILE || item?.DESCRICAO;
							const subtitulo = isLaudo
								? item?.tipolaudo
								: item?.especialidade?.split("-")[1] ||
									item?.siglaespecialidade;
							const currentId = item.id || item.ID || item.nrsolicitacao;
							const isLocalLoading = fetchingUrl === currentId;
							const podeExibirBotoes = isLaudo
								? (item?.linklaudo || "").includes("https")
								: true;

							return (
								<View className="bg-white mx-5 mb-6 rounded-[30px] border border-slate-100 shadow-sm overflow-hidden">
									<View className="p-6">
										<View className="flex-row justify-between items-end mb-4">
											<Text className="text-slate-900 font-black text-[18px]">
												{dataExibicao}
											</Text>
											<View className="bg-slate-100 px-3 py-1 rounded-full">
												<Text className="text-slate-500 text-[10px] font-bold uppercase">
													{isRec ? "RECEITUÁRIO" : abaAtiva}
												</Text>
											</View>
										</View>
										<View className="h-[1px] bg-slate-100 w-full mb-5" />
										<Text className="text-slate-800 font-bold text-[19px] leading-6 mb-1 capitalize">
											{tituloDoc?.toLowerCase()}
										</Text>
										{subtitulo && (
											<Text className="text-teal-600 font-medium text-[13px] uppercase tracking-tight mb-4">
												{subtitulo?.toLowerCase()}
											</Text>
										)}
										{!isLaudo && (
											<View className="flex-row items-center mt-2 mb-6">
												<View className="w-10 h-10 rounded-full bg-slate-50 items-center justify-center border border-slate-100">
													<Feather name="user" size={18} color="#94a3b8" />
												</View>
												<View className="ml-3">
													<Text className="text-[10px] font-bold text-slate-400 uppercase">
														Responsável
													</Text>
													<Text className="text-slate-700 font-bold text-[15px] capitalize">
														{item?.prescritor ||
															item?.SOLICITANTE ||
															"Não informado"}
													</Text>
												</View>
											</View>
										)}
										{isLaudo && (
											<Text className="text-slate-700 font-bold text-[15px] capitalize mb-4">
												{item?.status}
											</Text>
										)}
										{podeExibirBotoes && (
											<View className="flex-row gap-3">
												<View className="flex-1">
													<OpenFileButton
														onPress={() => handleAction(item, "open")}
														loading={loadingOpen || isLocalLoading}
														progress={openProgress}
														size={52}
													/>
												</View>
												<View className="bg-slate-100 rounded-2xl px-1">
													<ShareButton
														onPress={() => handleAction(item, "share")}
														loading={loadingshare || isLocalLoading}
														progress={shareProgress}
														size={52}
													/>
												</View>
											</View>
										)}
									</View>
								</View>
							);
						}}
					/>
				)}
			</View>

			<StatusModal config={openModal} onClose={closeOpenModal} />
			<StatusModal config={shareModal} onClose={closeShareModal} />
			<StatusModal
				config={errorModal}
				onClose={() => setErrorModal({ ...errorModal, visible: false })}
			/>
			<Footer />
		</View>
	);
}

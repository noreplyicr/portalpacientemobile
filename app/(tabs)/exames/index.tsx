import { OpenFileButton } from "@/src/components/OpenFileButton";
import { ShareButton } from "@/src/components/ShareButton";
import { useOpenFile } from "@/src/hooks/useOpenFile";
import { useShareFile } from "@/src/hooks/useShareFile";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { useFocusEffect } from "@react-navigation/native";
import moment from "moment";
import "moment/locale/pt-br"; // Configura o idioma para português
import React, { useCallback, useMemo, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	Linking,
	Modal,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

import { Footer } from "@/src/components/Footer";
import { PageHeader } from "@/src/components/PageHeader";
import { StatusModal } from "@/src/components/StatusModal";
import { ViewImageButton } from "@/src/components/ViewImageButton";
import { useAuth } from "../../../src/contexts/AuthContext";
import { exameService } from "../../../src/services/exameService";

// Força o uso do local pt-br
moment.locale("pt-br");

// --- Interfaces ---
interface DetalheExame {
	tipo: string;
	solicitacao: string;
	descricao?: string;
	status?: string;
	nome?: string;
	linkimg: string;
	linklaudo: string;
	etiqueta: string;
}

interface RegistroExame {
	data: string;
	qtd?: number;
	exames: DetalheExame[];
	bloqueio: boolean;
	status: string;
	linkimg: string;
	linklaudo: string;
	etiqueta: string;
}

const Tab = createMaterialTopTabNavigator();

function TelaResultados({ filtro }: { filtro: string }) {
	const { user } = useAuth();
	const idUsuario = user?.id;
	const {
		onOpen,
		loadingOpen,
		modalConfig: openModal,
		closeModal: closeOpenModal,
	} = useOpenFile();
	const {
		onShare,
		loadingshare,
		modalConfig: shareModal,
		closeModal: closeShareModal,
	} = useShareFile();

	const [loading, setLoading] = useState(false);
	const [apiLoading, setApiLoading] = useState(false);
	const [dataSource, setDataSource] = useState<RegistroExame[]>([]);
	const [filtroAtivo, setFiltroAtivo] = useState(
		filtro === "1" ? moment().format("MM/YYYY") : "10",
	);
	const [modalVisible, setModalVisible] = useState(false);
	const [selecionado, setSelecionado] = useState<RegistroExame | null>(null);
	const [itensMarcados, setItensMarcados] = useState<DetalheExame[]>([]);
	const [statusModal, setStatusModal] = useState({
		visible: false,
		type: "success" as "success" | "error",
		title: "",
		message: "",
	});

	const qtdLiberados = useMemo(() => {
		if (!selecionado) return 0;
		return selecionado.exames.filter((ex) =>
			ex.status?.toLowerCase().includes("liberado"),
		).length;
	}, [selecionado]);

	const filtrosDisponiveis = useMemo(() => {
		if (filtro === "1") {
			const mesesParaImagem = [];
			for (let i = 0; i < 36; i++) {
				const dataMes = moment().subtract(i, "months");
				const labelMes = dataMes.format("MMMM/YYYY");
				mesesParaImagem.push({
					label: labelMes.charAt(0).toUpperCase() + labelMes.slice(1),
					value: dataMes.format("MM/YYYY"),
					isMes: true,
				});
			}
			return mesesParaImagem;
		}

		const baseDias = ["10", "15", "30", "60", "90"];
		const anoAtual = moment().year();
		const anos = Array.from({ length: 10 }, (_, i) =>
			(anoAtual - i).toString(),
		);

		return baseDias.concat(anos).map((item) => ({
			label: item.length === 4 ? item : `${item} dias`,
			value: item,
			isMes: false,
		}));
	}, [filtro]);

	const gerarPdfMultiplo = async (acao: "abrir" | "compartilhar") => {
		if (itensMarcados.length === 0) return;
		setApiLoading(true);

		try {
			const examesSelecionados = itensMarcados.map((ex) => ({
				tipo: ex.tipo || "SIGH",
				solicitacao: ex.solicitacao,
			}));

			const res = await exameService.getResultadoPdf(examesSelecionados);
			const urlFinal =
				typeof res === "string" ? res : res?.urlPdf || res?.linklaudo;

			if (urlFinal && urlFinal.includes("http")) {
				// USANDO OS HOOKS AQUI:
				if (acao === "abrir") {
					await onOpen(urlFinal);
				} else {
					await onShare(urlFinal);
				}
				setModalVisible(false);
			} else {
				throw new Error("URL inválida");
			}
		} catch (error) {
			// ... tratamento de erro existente
		} finally {
			setApiLoading(false);
		}
	};

	const gerenciarLaudo = async (
		ex: DetalheExame,
		acao: "abrir" | "compartilhar",
	) => {
		// Busca a URL (Enterprise ou Direta)
		const url = await obterUrlLaudo(ex);
		console.log(url);

		if (!url) {
			setStatusModal({
				visible: true,
				type: "error",
				title: "Erro",
				message: "Não foi possível recuperar o link do laudo.",
			});
			return;
		}

		const nomeArquivo = `Laudo_${ex.solicitacao}.pdf`;

		if (acao === "abrir") {
			await onOpen(url);
		} else {
			await onShare(url);
		}
	};

	const carregarDados = useCallback(
		async (valorFiltro: string) => {
			let dIni = "";
			let dFim = moment().format("DD/MM/YYYY");

			if (valorFiltro.includes("/")) {
				dIni = moment(valorFiltro, "MM/YYYY")
					.startOf("month")
					.format("DD/MM/YYYY");
				dFim = moment(valorFiltro, "MM/YYYY")
					.endOf("month")
					.format("DD/MM/YYYY");
			} else if (valorFiltro.length === 4) {
				dIni = `01/01/${valorFiltro}`;
				dFim = `31/12/${valorFiltro}`;
			} else {
				dIni = moment()
					.subtract(Number(valorFiltro), "days")
					.format("DD/MM/YYYY");
			}

			setLoading(true);
			try {
				const res = await exameService.getExames(
					idUsuario as any,
					dIni,
					dFim,
					filtro,
					true,
				);
				setDataSource(res || []);
			} catch (error) {
				setDataSource([]);
			} finally {
				setLoading(false);
			}
		},
		[filtro, idUsuario],
	);

	useFocusEffect(
		useCallback(() => {
			carregarDados(filtroAtivo);
		}, [filtroAtivo, carregarDados]),
	);

	// AÇÃO 1: Trata apenas a Imagem (Botão de "Olhinho")
	const verImagem = async (link: string) => {
		if (!link) return;
		try {
			await Linking.openURL(link);
		} catch (error) {
			// Tratar erro de link inválido
		}
	};

	const obterUrlLaudo = async (ex: any): Promise<string> => {
		try {
			if (!ex.ssolicitacao || !ex.ssolicitacao.includes("_")) {
				return ex.linklaudo;
			} else {
				const res = await exameService.getLaudoEnterprise(
					ex.ssolicitacao,
					idUsuario as any,
				);
				return res && res.includes(".pdf") ? res : "";
			}
		} catch (error) {
			return "";
		}
	};

	const toggleSelecaoLiberados = () => {
		const liberados =
			selecionado?.exames.filter((ex) =>
				ex.status?.toLowerCase().includes("liberado"),
			) || [];
		setItensMarcados(
			itensMarcados.length === liberados.length ? [] : liberados,
		);
	};

	const renderItem = ({ item }: { item: RegistroExame }) => {
		const isLab = filtro === "0";
		if (isLab) {
			return (
				<TouchableOpacity
					style={[styles.card, item.bloqueio && styles.cardDisabled]}
					onPress={async () => {
						if (item.bloqueio) {
							setStatusModal({
								visible: true,
								type: "error",
								title: "Acesso Restrito",
								message: "Exame em período de internação.",
							});
							return;
						}
						setApiLoading(true);
						try {
							const data = await exameService.getExames(
								idUsuario as any,
								item.data,
								item.data,
								filtro,
								false,
							);
							if (data?.[0]) {
								setSelecionado(data[0]);
								setItensMarcados([]);
								setModalVisible(true);
							}
						} finally {
							setApiLoading(false);
						}
					}}
				>
					<View style={styles.cardRow}>
						<View
							style={[
								styles.numberBadge,
								item.bloqueio && { backgroundColor: "#FEE2E2" },
							]}
						>
							{item.bloqueio ? (
								<MaterialCommunityIcons name="lock" size={20} color="#E11D48" />
							) : (
								<Text style={styles.numberText}>
									{item.qtd || item.exames.length}
								</Text>
							)}
						</View>
						<View style={styles.info}>
							<Text style={styles.date}>{item.data}</Text>
							<Text style={styles.status}>Exames Laboratoriais</Text>
						</View>
						<MaterialCommunityIcons
							name={item.bloqueio ? "lock-outline" : "chevron-right"}
							size={24}
							color={item.bloqueio ? "#FDA4AF" : "#CBD5E1"}
						/>
					</View>
				</TouchableOpacity>
			);
		}

		return (
			<View style={styles.card}>
				{item.exames.map((ex, idx) => (
					<View
						key={idx}
						style={[styles.cardRow, idx > 0 && styles.cardDivider]}
					>
						<View style={[styles.numberBadge, { backgroundColor: "#F1F5F9" }]}>
							<MaterialCommunityIcons
								name={ex.linkimg ? "image-outline" : "file-document-outline"}
								size={22}
								color="#1e1b54"
							/>
						</View>

						<View style={styles.info}>
							<Text style={styles.exameNomeDireto} numberOfLines={1}>
								{ex.descricao || ex.etiqueta || "Exame"}
							</Text>
							<Text style={styles.status}>{item.data}</Text>
						</View>

						{/* --- ÁREA DE AÇÕES ALTERADA --- */}
						<View
							style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
						>
							{ex.linkimg ? (
								<ViewImageButton
									onPress={() => verImagem(ex.linkimg)}
									size={44} // Um pouco menor se quiser economizar espaço na linha
								/>
							) : null}

							{/* Botão de PDF com Loading do Hook */}
							<OpenFileButton
								onPress={() => gerenciarLaudo(ex, "abrir")}
								loading={loadingOpen}
								progress={0} // Adicione isso (0 se não quiser mostrar progresso individual)
							/>

							<ShareButton
								onPress={() => gerenciarLaudo(ex, "compartilhar")}
								loading={loadingshare}
								progress={0} // Adicione isso
							/>
						</View>
					</View>
				))}
			</View>
		);
	};

	return (
		<View style={styles.container}>
			<View style={styles.filterArea}>
				<FlatList
					horizontal
					showsHorizontalScrollIndicator={false}
					data={filtrosDisponiveis}
					keyExtractor={(it) => it.value}
					contentContainerStyle={{ paddingHorizontal: 15 }}
					renderItem={({ item }) => (
						<TouchableOpacity
							style={[
								styles.pill,
								filtroAtivo === item.value && styles.pillActive,
							]}
							onPress={() => setFiltroAtivo(item.value)}
						>
							<Text
								style={[
									styles.pillText,
									filtroAtivo === item.value && styles.pillTextActive,
								]}
							>
								{item.label}
							</Text>
						</TouchableOpacity>
					)}
				/>
			</View>

			{loading ? (
				<ActivityIndicator
					style={{ marginTop: 50 }}
					size="large"
					color="#00877C"
				/>
			) : (
				<FlatList
					data={dataSource}
					keyExtractor={(_, i) => i.toString()}
					contentContainerStyle={{ padding: 15, paddingBottom: 100 }}
					ListEmptyComponent={
						<View style={styles.emptyContainer}>
							<MaterialCommunityIcons
								name="clipboard-text-search-outline"
								size={80}
								color="#CBD5E1"
							/>
							<Text style={styles.emptyTitle}>Nenhum registro</Text>
						</View>
					}
					renderItem={renderItem}
				/>
			)}

			<Modal visible={modalVisible} animationType="fade" transparent={true}>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<View style={styles.modalHeader}>
							<View style={{ flex: 1 }}>
								<Text style={styles.modalTitle}>
									Exames de {selecionado?.data}
								</Text>
								<TouchableOpacity
									onPress={toggleSelecaoLiberados}
									style={{ marginTop: 5 }}
								>
									<Text
										style={{
											color: "#00877C",
											fontWeight: "bold",
											fontSize: 13,
										}}
									>
										{itensMarcados.length > 0
											? "✕ Desmarcar Todos"
											: `✓ Selecionar ${qtdLiberados} Liberados`}
									</Text>
								</TouchableOpacity>
							</View>
							<TouchableOpacity onPress={() => setModalVisible(false)}>
								<MaterialCommunityIcons
									name="close"
									size={24}
									color="#64748B"
								/>
							</TouchableOpacity>
						</View>
						<ScrollView style={{ maxHeight: 350 }}>
							{selecionado?.exames.map((ex, idx) => {
								const isLiberado = ex.status
									?.toLowerCase()
									.includes("liberado");
								const isChecked = itensMarcados.some(
									(i) => i.solicitacao === ex.solicitacao,
								);
								return (
									<TouchableOpacity
										key={idx}
										style={[styles.checkItem, !isLiberado && { opacity: 0.5 }]}
										disabled={!isLiberado}
										onPress={() =>
											setItensMarcados((prev) =>
												isChecked
													? prev.filter((i) => i.solicitacao !== ex.solicitacao)
													: [...prev, ex],
											)
										}
									>
										<MaterialCommunityIcons
											name={
												!isLiberado
													? "lock-outline"
													: isChecked
														? "checkbox-marked"
														: "checkbox-blank-outline"
											}
											size={24}
											color={isChecked ? "#00877C" : "#CBD5E1"}
										/>
										<View style={{ flex: 1, marginLeft: 12 }}>
											<Text style={styles.exameNome}>{ex.descricao}</Text>
											<Text
												style={{
													fontSize: 12,
													color: isLiberado ? "#64748B" : "#E11D48",
												}}
											>
												{ex.status}
											</Text>
										</View>
									</TouchableOpacity>
								);
							})}
						</ScrollView>
						<View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
							{/* BOTÃO COMPARTILHAR COM LOADING */}
							<TouchableOpacity
								style={[
									styles.btnConfirm,
									{ flex: 1, backgroundColor: "#64748B" },
									(itensMarcados.length === 0 || apiLoading) && {
										opacity: 0.5,
									},
								]}
								disabled={itensMarcados.length === 0 || apiLoading}
								onPress={() => gerarPdfMultiplo("compartilhar")}
							>
								{apiLoading ? (
									<ActivityIndicator size="small" color="#FFF" />
								) : (
									<MaterialCommunityIcons
										name="share-variant"
										size={22}
										color="#FFF"
									/>
								)}
							</TouchableOpacity>

							{/* BOTÃO VISUALIZAR COM LOADING */}
							<TouchableOpacity
								style={[
									styles.btnConfirm,
									{ flex: 4 },
									(itensMarcados.length === 0 || apiLoading) && {
										backgroundColor: "#CBD5E1",
									},
								]}
								disabled={itensMarcados.length === 0 || apiLoading}
								onPress={() => gerarPdfMultiplo("abrir")}
							>
								{apiLoading ? (
									<View style={{ flexDirection: "row", alignItems: "center" }}>
										<ActivityIndicator
											size="small"
											color="#FFF"
											style={{ marginRight: 10 }}
										/>
										<Text style={styles.btnConfirmText}>GERANDO...</Text>
									</View>
								) : (
									<Text style={styles.btnConfirmText}>
										VER RESULTADOS ({itensMarcados.length})
									</Text>
								)}
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			{/* MODAIS DOS HOOKS DE ARQUIVO */}
			<StatusModal
				visible={openModal.visible}
				type={openModal.type as any}
				title={openModal.title}
				message={openModal.message}
				onClose={closeOpenModal}
			/>

			<StatusModal
				visible={shareModal.visible}
				type={shareModal.type as any}
				title={shareModal.title}
				message={shareModal.message}
				onClose={closeShareModal}
			/>

			<StatusModal
				visible={statusModal.visible}
				type={statusModal.type}
				title={statusModal.title}
				message={statusModal.message}
				onClose={() => setStatusModal({ ...statusModal, visible: false })}
			/>
		</View>
	);
}

export default function ExamesPage() {
	return (
		<View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
			<PageHeader
				titulo="Resultado Exames"
				subtitulo={`RESULTADOS DISPONÍVEIS`}
			/>
			<Tab.Navigator
				screenOptions={{
					tabBarActiveTintColor: "#1e1b54",
					tabBarIndicatorStyle: { backgroundColor: "#1e1b54", height: 3 },
					tabBarLabelStyle: { fontWeight: "700", fontSize: 13 },
					tabBarStyle: { elevation: 0 },
				}}
			>
				<Tab.Screen name="Laboratório">
					{() => <TelaResultados filtro="0" />}
				</Tab.Screen>
				<Tab.Screen name="Imagem">
					{() => <TelaResultados filtro="1" />}
				</Tab.Screen>
				<Tab.Screen name="Externo">
					{() => <TelaResultados filtro="2" />}
				</Tab.Screen>
			</Tab.Navigator>
			<Footer />
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#F8FAFC" },
	topHeader: {
		backgroundColor: "#1e1b54",
		paddingHorizontal: 25,
		paddingBottom: 40, // Aumentado para dar espaço à curva
		paddingTop: 60,
		borderBottomLeftRadius: 40, // Valor padrão que você usou na outra tela
		borderBottomRightRadius: 40, // Valor padrão que você usou na outra tela
	},
	topTitle: { color: "#FFF", fontSize: 22, fontWeight: "bold" },
	filterArea: { paddingVertical: 15, backgroundColor: "#FFF" },
	pill: {
		paddingHorizontal: 15,
		height: 36,
		borderRadius: 18,
		backgroundColor: "#F1F5F9",
		justifyContent: "center",
		marginRight: 8,
		borderWidth: 1,
		borderColor: "#E2E8F0",
	},
	pillActive: { backgroundColor: "#00877C", borderColor: "#00877C" },
	pillText: { color: "#64748B", fontWeight: "600", fontSize: 12 },
	pillTextActive: { color: "#FFF" },
	card: {
		backgroundColor: "#FFF",
		borderRadius: 12,
		padding: 16,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: "#EDF2F7",
		elevation: 2,
	},
	cardDisabled: { backgroundColor: "#FFFBFB", borderColor: "#FDA4AF" },
	cardRow: { flexDirection: "row", alignItems: "center" },
	cardDivider: {
		marginTop: 15,
		paddingTop: 15,
		borderTopWidth: 1,
		borderTopColor: "#F1F5F9",
	},
	numberBadge: {
		width: 40,
		height: 40,
		borderRadius: 10,
		backgroundColor: "#E6F4F1",
		justifyContent: "center",
		alignItems: "center",
	},
	numberText: { color: "#00877C", fontWeight: "bold", fontSize: 16 },
	info: { flex: 1, marginLeft: 12 },
	date: { fontSize: 15, fontWeight: "700", color: "#1E293B" },
	status: { fontSize: 12, color: "#64748B", marginTop: 2 },
	exameNomeDireto: { fontSize: 14, fontWeight: "bold", color: "#1E293B" },
	actionsContainer: { flexDirection: "row", alignItems: "center" },
	actionBtn: { padding: 5 },
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.5)",
		justifyContent: "center",
		padding: 20,
	},
	modalContent: { backgroundColor: "#FFF", borderRadius: 20, padding: 20 },
	modalHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 15,
	},
	modalTitle: { fontSize: 17, fontWeight: "bold", color: "#1e1b54" },
	checkItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: "#F1F5F9",
	},
	exameNome: { fontSize: 14, color: "#1E293B", fontWeight: "600" },
	btnConfirm: {
		backgroundColor: "#00877C",
		height: 48,
		borderRadius: 12,
		justifyContent: "center",
		alignItems: "center",
	},
	btnConfirmText: { color: "#FFF", fontWeight: "bold", fontSize: 14 },
	emptyContainer: { alignItems: "center", marginTop: 100 },
	emptyTitle: {
		fontSize: 16,
		fontWeight: "bold",
		color: "#94A3B8",
		marginTop: 10,
	},
});

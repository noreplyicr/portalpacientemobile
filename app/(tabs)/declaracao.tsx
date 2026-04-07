import _ from "lodash";
import moment from "moment";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, SectionList, Text, View } from "react-native";

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
import { declaracaoService } from "@/src/services/declaracaoService";

type AbaType = "AMBULATORIO" | "INTERNACAO" | "TELECONSULTA" | "PS";

export default function Declaracao() {
	const { user } = useAuth();
	const [abaAtiva, setAbaAtiva] = useState<AbaType>("AMBULATORIO");
	const [loading, setLoading] = useState(false);
	const [dataSource, setDataSource] = useState<any[]>([]);

	// NOVO: Estado para identificar qual item específico está processando a URL
	const [itemProcessando, setItemProcessando] = useState<{
		id: string;
		mode: "open" | "share";
	} | null>(null);

	// Hooks de Gerenciamento de Arquivo
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

	useEffect(() => {
		if (user?.id) fetchDados();
	}, [user?.id]);

	const fetchDados = async () => {
		setLoading(true);
		try {
			const dados = await declaracaoService.getPassagens(user?.id as any);

			// Agrupa por ano para o SectionList
			const agrupado = _.groupBy(dados, (item) =>
				moment(item.data).format("YYYY"),
			);

			const secoes = Object.keys(agrupado)
				.sort((a, b) => b.localeCompare(a))
				.map((ano) => ({
					title: ano,
					data: agrupado[ano],
				}));

			setDataSource(secoes);
		} catch (error) {
			console.error("Erro ao buscar passagens:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleAction = async (item: any, mode: "open" | "share") => {
		const itemId = `${item.data}-${item.tipo}`;

		// Inicia o loading visual no botão clicado
		setItemProcessando({ id: itemId, mode });

		try {
			// 1. Busca a URL do PDF (Isso costuma ser o que demora)
			const url = await declaracaoService.getUrlPdf(
				user?.id as any,
				item.tipo,
				item.data,
			);

			// 2. Dispara a ação do hook correspondente
			if (mode === "open") {
				await onOpen(url);
			} else {
				await onShare(url);
			}
		} catch (error) {
			console.error("Erro ao processar documento:", error);
		} finally {
			// Finaliza o estado de processamento local
			setItemProcessando(null);
		}
	};

	// Filtra as passagens dinamicamente com base na aba selecionada
	const dadosFiltrados = dataSource
		.map((secao) => ({
			...secao,
			data: secao.data.filter((i: any) => i.tipo === abaAtiva),
		}))
		.filter((secao) => secao.data.length > 0);

	return (
		<View style={{ flex: 1, backgroundColor: "#F8F9FA" }}>
			<PageHeader titulo="DECLARAÇÕES">
				<View className="mt-6">
					<SegmentedControl
						valorAtual={abaAtiva}
						onChange={(v) => setAbaAtiva(v as AbaType)}
						opcoes={[
							{ label: "AMBULATÓRIO", value: "AMBULATORIO" },
							{ label: "INTERNAÇÃO", value: "INTERNACAO" },
							{ label: "TELECONSULTA", value: "TELECONSULTA" },
							{ label: "PS", value: "PS" },
						]}
					/>
				</View>
			</PageHeader>

			<View style={{ flex: 1 }}>
				{loading ? (
					<ActivityIndicator
						size="large"
						color="#1e1b54"
						style={{ marginTop: 40 }}
					/>
				) : (
					<SectionList
						sections={dadosFiltrados}
						keyExtractor={(item, index) => `${item.data}-${index}`}
						contentContainerStyle={{
							paddingTop: 20,
							paddingBottom: 120,
							flexGrow: 1,
						}}
						stickySectionHeadersEnabled={true}
						ListEmptyComponent={() => (
							<EmptyState
								titulo="Nenhuma passagem"
								mensagem={`Não encontramos registros de ${abaAtiva.toLowerCase()} para este paciente.`}
								icone="calendar"
							/>
						)}
						renderSectionHeader={({ section: { title } }) => (
							<View className="bg-gray-100 px-6 py-2 mb-2">
								<Text className="text-gray-500 font-bold text-[11px] uppercase tracking-wider">
									Passagens de {title}
								</Text>
							</View>
						)}
						renderItem={({ item }) => {
							const itemId = `${item.data}-${item.tipo}`;

							// Define se o botão de abrir deve mostrar loading
							const isOpening =
								(itemProcessando?.id === itemId &&
									itemProcessando?.mode === "open") ||
								loadingOpen;

							// Define se o botão de compartilhar deve mostrar loading
							const isSharing =
								(itemProcessando?.id === itemId &&
									itemProcessando?.mode === "share") ||
								loadingshare;

							return (
								<View className="bg-white mx-5 mb-6 rounded-[30px] border border-slate-100 shadow-sm overflow-hidden">
									<View className="p-6">
										<View className="flex-row justify-between items-end mb-4">
											<Text className="text-slate-900 font-black text-[18px]">
												{item.dataf}
											</Text>
											<View className="bg-slate-100 px-3 py-1 rounded-full">
												<Text className="text-slate-500 text-[10px] font-bold">
													{item.tipo}
												</Text>
											</View>
										</View>

										<View className="h-[1px] bg-slate-100 w-full mb-5" />

										<Text className="text-slate-800 font-bold text-[17px] mb-6">
											Declaração de Comparecimento
										</Text>

										<View className="flex-row gap-3">
											<View className="flex-1">
												<OpenFileButton
													onPress={() => handleAction(item, "open")}
													loading={isOpening}
													progress={openProgress}
													size={52}
												/>
											</View>
											<View className="bg-slate-100 rounded-2xl px-1">
												<ShareButton
													onPress={() => handleAction(item, "share")}
													loading={isSharing}
													progress={shareProgress}
													size={52}
												/>
											</View>
										</View>
									</View>
								</View>
							);
						}}
					/>
				)}
			</View>

			{/* Modais de Status para Feedback de Download */}
			<StatusModal config={openModal} onClose={closeOpenModal} />
			<StatusModal config={shareModal} onClose={closeShareModal} />

			<Footer />
		</View>
	);
}

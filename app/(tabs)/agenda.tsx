import { PageHeader } from "@/src/components/PageHeader";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
	ActivityIndicator,
	Dimensions,
	FlatList,
	KeyboardAvoidingView,
	Linking,
	Platform,
	RefreshControl,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import Modal from "react-native-modal";
import { SafeAreaView } from "react-native-safe-area-context";
import * as z from "zod";

import { ConfirmModal } from "@/src/components/ConfirmModal";
import { EmptyState } from "@/src/components/EmptyState";
import { Footer } from "@/src/components/Footer";
import { FormInput } from "@/src/components/FormInput";
import { PreparoExameModal } from "@/src/components/PreparoExameModal";
import { PrimaryButton } from "@/src/components/PrimaryButton";
import { SegmentedControl } from "@/src/components/SegmentedControl";
import { StatusModal } from "@/src/components/StatusModal";
import { useAuth } from "@/src/contexts/AuthContext";
import { agendaService } from "@/src/services/agendaService";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

const reagendamentoSchema = z.object({
	justificativa: z
		.string()
		.min(5, "O motivo deve ter pelo menos 5 caracteres")
		.max(500, "Limite de 500 caracteres excedido"),
});

type ReagendamentoFormData = z.infer<typeof reagendamentoSchema>;
type FiltroType = "CONSULTA" | "EXAME" | "FALTA";

export default function Agenda() {
	const router = useRouter();
	const { user } = useAuth();
	const [filtro, setFiltro] = useState<FiltroType>("CONSULTA");
	const [dados, setDados] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const [showPreparo, setShowPreparo] = useState(false);
	const [modalVisible, setModalVisible] = useState(false);
	const [confirmVisible, setConfirmVisible] = useState(false);
	const [itemSelecionado, setItemSelecionado] = useState<any>(null);
	const [statusModal, setStatusModal] = useState({
		visible: false,
		type: "success" as "success" | "error",
		title: "",
		message: "",
	});

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<ReagendamentoFormData>({
		resolver: zodResolver(reagendamentoSchema),
		defaultValues: { justificativa: "" },
	});

	const verificarSeEHoje = (dataString: string) => {
		const hoje = new Date().toLocaleDateString("pt-BR");
		return dataString === hoje;
	};

	const carregar = useCallback(
		async (isRefreshing = false) => {
			if (isRefreshing) setRefreshing(true);
			else setLoading(true);

			try {
				const res = await agendaService.getAgenda(user?.id as any, filtro);
				setDados(res || []);
			} catch (e) {
				setStatusModal({
					visible: true,
					type: "error",
					title: "Erro",
					message: "Falha ao carregar dados.",
				});
			} finally {
				setLoading(false);
				setRefreshing(false);
			}
		},
		[filtro, user?.id],
	);

	useEffect(() => {
		carregar();
	}, [carregar]);

	const onEnviarReagendamento = async (data: ReagendamentoFormData) => {
		setLoading(true);
		try {
			await agendaService.saveReagendamento(
				{ justificativa: data.justificativa },
				itemSelecionado,
				"",
				"",
			);
			setModalVisible(false);
			reset();
			setStatusModal({
				visible: true,
				type: "success",
				title: "Solicitado!",
				message: "Sua solicitação foi enviada para análise.",
			});
			carregar();
		} catch (e) {
			setStatusModal({
				visible: true,
				type: "error",
				title: "Erro",
				message: "Erro ao enviar.",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleCancelarSolicitacao = async () => {
		setConfirmVisible(false);
		setLoading(true);
		try {
			await agendaService.removerSolicitacao(itemSelecionado.idreagendamento);
			setStatusModal({
				visible: true,
				type: "success",
				title: "Cancelado",
				message: "Solicitação removida.",
			});
			carregar();
		} catch (e) {
			setStatusModal({
				visible: true,
				type: "error",
				title: "Erro",
				message: "Erro ao cancelar.",
			});
		} finally {
			setLoading(false);
		}
	};

	const renderEmpty = () => {
		const label =
			filtro === "CONSULTA"
				? "Consultas"
				: filtro === "EXAME"
					? "Exames"
					: "Faltas";
		return (
			<EmptyState
				titulo={`Nenhuma ${label.toLowerCase()}`}
				mensagem={`Você não possui registros de ${label.toLowerCase()} para exibir no momento.`}
				icone="calendar-blank-outline"
			/>
		);
	};

	return (
		<View className="flex-1 bg-gray-50">
			<PageHeader titulo="Agendamentos">
				<View className="mt-6">
					<SegmentedControl
						valorAtual={filtro}
						onChange={(v: string) => setFiltro(v as FiltroType)}
						opcoes={[
							{ label: "CONSULTAS", value: "CONSULTA" },
							{ label: "EXAMES", value: "EXAME" },
							{ label: "FALTAS", value: "FALTA" },
						]}
					/>
				</View>
			</PageHeader>

			{loading && !refreshing && !modalVisible ? (
				<View className="flex-1 justify-center items-center">
					<ActivityIndicator size="large" color="#191455" />
				</View>
			) : (
				<FlatList
					data={dados}
					keyExtractor={(item, index) =>
						`${filtro}-${item.idreagendamento || item.id || index}-${index}`
					}
					contentContainerStyle={{
						paddingVertical: 16,
						paddingBottom: 120,
						flexGrow: 1,
					}}
					ListEmptyComponent={renderEmpty}
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={() => carregar(true)}
							colors={["#191455"]}
							tintColor="#191455"
						/>
					}
					renderItem={({ item }: any) => {
						const eHoje = verificarSeEHoje(item.datafinal);
						const isICR = item.instituto === "ICR";

						return (
							<View
								className={`bg-white mx-4 p-5 rounded-2xl mb-4 shadow-sm border-l-8 ${eHoje ? "border-l-orange-500 border-y border-r border-gray-100" : "border-gray-100 border"}`}
							>
								<View className="flex-row justify-between items-start">
									<View className="flex-1">
										<Text className="text-[#191455] font-hcf-bold uppercase text-base">
											{item.agenda?.nome}
										</Text>
										{item.agenda?.clinica?.descricao && (
											<Text className="text-gray-500 font-medium text-[11px] mt-1 mb-2 leading-4">
												{item.agenda.clinica.descricao}
											</Text>
										)}
										<View
											className={`flex-row items-center mt-1 mb-4 self-start px-2 py-1 rounded-lg ${isICR ? "bg-indigo-50 border border-indigo-100" : "bg-gray-50 border border-gray-100"}`}
										>
											<MaterialCommunityIcons
												name={isICR ? "hospital-marker" : "office-building"}
												size={14}
												color={isICR ? "#2e3192" : "#64748b"}
											/>
											<Text
												className={`ml-1.5 text-[10px] font-hcf-bold uppercase tracking-wider ${isICR ? "text-indigo-800" : "text-slate-500"}`}
											>
												{isICR
													? `Instituto da Criança - ${item.instituto}`
													: `Instituto: ${item.instituto || "N/A"}`}
											</Text>
										</View>
									</View>
									{eHoje && (
										<View className="bg-orange-500 px-2 py-1 rounded-md">
											<Text className="text-white text-[9px] font-hcf-bold uppercase">
												Hoje
											</Text>
										</View>
									)}
								</View>

								<View className="flex-row items-center mb-5">
									<View className="flex-row items-center mr-6">
										<MaterialCommunityIcons
											name="calendar-month"
											size={18}
											color={eHoje ? "#f97316" : "#999"}
										/>
										<Text
											className={`ml-2 font-hcf-bold ${eHoje ? "text-orange-600" : "text-gray-700"}`}
										>
											{item.datafinal}
										</Text>
									</View>
									<View className="flex-row items-center">
										<MaterialCommunityIcons
											name="clock-outline"
											size={18}
											color="#999"
										/>
										<Text className="ml-2 font-hcf-bold text-teal-600">
											{item.horario}
										</Text>
									</View>
								</View>

								{filtro === "EXAME" && (
									<TouchableOpacity
										onPress={() => router.push("/preparo")}
										activeOpacity={0.7}
										className="flex-row items-center bg-teal-50 p-4 rounded-2xl mb-3 border border-teal-100"
									>
										<View className="bg-teal-600 p-2 rounded-lg">
											<MaterialCommunityIcons
												name="medical-bag"
												size={24}
												color="white"
											/>
										</View>
										<View className="ml-4 flex-1">
											<Text className="text-teal-900 font-hcf-bold text-[13px] uppercase">
												Ver Preparo do Exame
											</Text>
											<Text className="text-teal-600/80 text-[10px] font-hcf-bold">
												SIGA AS INSTRUÇÕES PARA REALIZAÇÃO
											</Text>
										</View>
										<MaterialCommunityIcons
											name="chevron-right"
											size={20}
											color="#0d9488"
										/>
									</TouchableOpacity>
								)}

								{/* BOTÃO DE JEJUM: APARECE APENAS EM CONSULTA QUANDO É COLETA (COLL) */}
								{filtro === "CONSULTA" &&
									item.agenda?.nome?.includes("COLL") && (
										<TouchableOpacity
											onPress={() => setShowPreparo(true)}
											activeOpacity={0.7}
											className="flex-row items-center bg-orange-50 p-4 rounded-2xl mb-3 border border-orange-200"
										>
											<View className="bg-orange-500 p-2 rounded-lg">
												<MaterialCommunityIcons
													name="flask-outline"
													size={24}
													color="white"
												/>
											</View>
											<View className="ml-4 flex-1">
												<Text className="text-orange-900 font-hcf-bold text-[13px] uppercase">
													Orientações de Jejum
												</Text>
												<Text className="text-orange-600/80 text-[10px] font-hcf-bold">
													CLIQUE PARA VER REGRAS POR IDADE
												</Text>
											</View>
											<MaterialCommunityIcons
												name="information-outline"
												size={20}
												color="#f97316"
											/>
										</TouchableOpacity>
									)}

								{/* --- LOGICA DOS LINKS DE TELEMEDICINA --- */}

								{item.testeteleconsulta === 1 && (
									<TouchableOpacity
										onPress={() => Linking.openURL(item.linktesteteleconsulta)}
										className="flex-row items-center bg-blue-50/50 p-4 rounded-2xl mb-3 border border-blue-200"
									>
										<View className="bg-blue-500 p-2 rounded-lg">
											<MaterialCommunityIcons
												name="video-check-outline"
												size={24}
												color="white"
											/>
										</View>
										<View className="ml-4 flex-1">
											<Text className="text-blue-900 font-hcf-bold text-[13px] uppercase">
												Sala de Teste Virtual
											</Text>
											<Text className="text-blue-600/80 text-[10px] font-hcf-bold">
												TESTE SUA CONEXÃO AGORA
											</Text>
										</View>
										<MaterialCommunityIcons
											name="arrow-right"
											size={20}
											color="#1e40af"
										/>
									</TouchableOpacity>
								)}

								{item.linktermo && (
									<TouchableOpacity
										onPress={() => Linking.openURL(item.linktermo)}
										className="flex-row items-center bg-teal-50/50 p-4 rounded-2xl mb-3 border border-teal-200"
									>
										<View className="bg-teal-600 p-2 rounded-lg">
											<MaterialCommunityIcons
												name="video-outline"
												size={24}
												color="white"
											/>
										</View>
										<View className="ml-4 flex-1">
											<Text className="text-teal-900 font-hcf-bold text-[13px] uppercase">
												Entrar na Consulta
											</Text>
											<Text className="text-teal-600/80 text-[10px] font-hcf-bold">
												SALA VIRTUAL DISPONÍVEL
											</Text>
										</View>
										<MaterialCommunityIcons
											name="arrow-right"
											size={20}
											color="#0d9488"
										/>
									</TouchableOpacity>
								)}

								{item.reagendar === 1 &&
									(item.statusreagendamento?.id === 0 ||
										item.statusreagendamento?.id === 2) && (
										<PrimaryButton
											title="Solicitar Remarcação ?"
											iconName="calendar-clock"
											onPress={() => {
												setItemSelecionado(item);
												reset();
												setModalVisible(true);
											}}
											style={{
												height: 40,
												marginTop: 8,
												width: "100%",
												backgroundColor: "#23847c",
											}}
										/>
									)}

								{item.statusreagendamento?.id === 1 && (
									<View className="bg-orange-50 p-3 rounded-xl border border-orange-100 mt-2">
										<Text className="text-orange-700 font-hcf-bold text-center mb-2 uppercase text-[10px]">
											{item.statusreagendamento.descricao ||
												"Aguardando Análise"}
										</Text>
										<TouchableOpacity
											onPress={() => {
												setItemSelecionado(item);
												setConfirmVisible(true);
											}}
											className="bg-white py-2 rounded-lg items-center border border-red-200"
										>
											<Text className="text-red-600 font-hcf-bold text-[10px] uppercase">
												Cancelar Solicitação
											</Text>
										</TouchableOpacity>
									</View>
								)}
							</View>
						);
					}}
				/>
			)}

			<Modal
				isVisible={modalVisible}
				onBackdropPress={() => setModalVisible(false)}
				style={{ margin: 0 }}
				avoidKeyboard
				statusBarTranslucent
				deviceHeight={SCREEN_HEIGHT}
				deviceWidth={SCREEN_WIDTH}
			>
				<View className="flex-1 bg-white">
					<SafeAreaView
						className="bg-[#191455] flex-row items-center p-4"
						edges={["top"]}
					>
						<TouchableOpacity onPress={() => setModalVisible(false)}>
							<MaterialCommunityIcons
								name="arrow-left"
								size={24}
								color="white"
							/>
						</TouchableOpacity>
						<Text className="flex-1 text-white font-hcf-bold text-center uppercase mr-8">
							Remarcar
						</Text>
					</SafeAreaView>

					<View className="bg-[#FFF9E6] p-4 flex-row items-start border-b border-yellow-100">
						<MaterialCommunityIcons
							name="information"
							size={20}
							color="#852D2D"
						/>
						<Text className="ml-2 flex-1 text-[#852D2D] text-[11px] font-hcf-bold uppercase leading-4">
							O reagendamento estará sujeito à disponibilidade de data e vaga
							disponíveis na agenda
						</Text>
					</View>

					<View className="p-5 border-b border-gray-100">
						<Text className="text-[#191455] font-hcf-bold text-lg mb-1">
							{itemSelecionado?.agenda?.nome}
						</Text>
						<Text className="text-gray-500 text-[11px] mb-3 leading-4">
							{itemSelecionado?.agenda?.clinica?.descricao}
						</Text>
						<View className="flex-row items-center mb-2">
							<MaterialCommunityIcons
								name="calendar-month"
								size={18}
								color="#999"
							/>
							<Text className="ml-2 font-hcf-bold text-gray-700">
								{itemSelecionado?.datafinal}
							</Text>
						</View>
						<View className="flex-row items-center">
							<MaterialCommunityIcons
								name="clock-outline"
								size={18}
								color="#999"
							/>
							<Text className="ml-2 font-hcf-bold text-[#23847c]">
								{itemSelecionado?.horario}
							</Text>
						</View>
					</View>
					<KeyboardAvoidingView
						behavior={Platform.OS === "ios" ? "padding" : "height"}
						className="flex-1"
					>
						<ScrollView
							contentContainerStyle={{ flexGrow: 1 }}
							keyboardShouldPersistTaps="handled"
						>
							<View className="p-3 flex-1">
								<Text className="text-[#852D2D] font-hcf-bold text-sm mb-2 uppercase">
									Qual o motivo de reagendar?
								</Text>
								<FormInput
									name="justificativa"
									control={control as any}
									error={errors.justificativa}
									multiline
									numberOfLines={4}
									textAlignVertical="top"
									className="flex-1 ml-0 text-lg font-hcf-regular text-black h-20"
								/>

								<PrimaryButton
									title="Solicitar Remarcação"
									iconName="calendar-check"
									color="#23847c"
									onPress={handleSubmit(onEnviarReagendamento)}
									loading={loading}
								/>
							</View>
						</ScrollView>
					</KeyboardAvoidingView>
				</View>
			</Modal>

			<StatusModal
				{...statusModal}
				onClose={() => setStatusModal({ ...statusModal, visible: false })}
			/>
			<ConfirmModal
				visivel={confirmVisible}
				titulo="Cancelar"
				mensagem="Deseja remover a solicitação?"
				onConfirm={handleCancelarSolicitacao}
				onCancel={() => setConfirmVisible(false)}
			/>
			<PreparoExameModal
				visible={showPreparo}
				onClose={() => setShowPreparo(false)}
			/>
			<Footer />
		</View>
	);
}

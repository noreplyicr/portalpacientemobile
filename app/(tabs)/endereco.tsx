import { MaterialIcons } from "@expo/vector-icons";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	Keyboard,
	KeyboardAvoidingView,
	Modal,
	Platform,
	RefreshControl,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

// Componentes
import { ConfirmModal } from "@/src/components/ConfirmModal";
import { DeleteButton } from "@/src/components/DeleteButton";
import { Footer } from "@/src/components/Footer";
import { FormInput } from "@/src/components/FormInput";
import { PageHeader } from "@/src/components/PageHeader";
import { StatusModal } from "@/src/components/StatusModal";

// Contextos e Services
import { useAuth } from "@/src/contexts/AuthContext";
import { enderecoService } from "@/src/services/enderecoService";

// Validação
import { PrimaryButton } from "@/src/components/PrimaryButton";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

const enderecoSchema = z.object({
	cep: z.string().min(8, "CEP incompleto"),
	numero: z.string().min(1, "O número é obrigatório"),
	complemento: z.string().optional(),
});

type EnderecoFormData = z.infer<typeof enderecoSchema>;

export default function Endereco() {
	const { user } = useAuth();
	const [enderecos, setEnderecos] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [loadingCep, setLoadingCep] = useState(false);
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [dadosCep, setDadosCep] = useState<any>(null);
	const [keyboardHeight, setKeyboardHeight] = useState(0);

	const [confirmVisible, setConfirmVisible] = useState(false);
	const [idParaExcluir, setIdParaExcluir] = useState<number | null>(null);
	const [modalConfig, setModalConfig] = useState<any>({
		visible: false,
		type: "success",
		title: "",
		message: "",
	});

	const {
		control,
		handleSubmit,
		reset,
		watch,
		setValue,
		formState: { errors },
	} = useForm<EnderecoFormData>({
		resolver: zodResolver(enderecoSchema),
		defaultValues: { cep: "", numero: "", complemento: "" },
	});

	useEffect(() => {
		const showSub = Keyboard.addListener("keyboardDidShow", (e) =>
			setKeyboardHeight(e.endCoordinates.height),
		);
		const hideSub = Keyboard.addListener("keyboardDidHide", () =>
			setKeyboardHeight(0),
		);
		fetchEnderecos();
		return () => {
			showSub.remove();
			hideSub.remove();
		};
	}, []);

	const fetchEnderecos = async () => {
		if (!user) return;
		setLoading(true);
		try {
			const data = await enderecoService.getEnderecos(user.id);
			setEnderecos(_.orderBy(data, ["principal"], ["desc"]));
		} catch (error) {
			showModal("error", "Erro", "Falha ao carregar endereços.");
		} finally {
			setLoading(false);
		}
	};

	const handleBuscaCep = async () => {
		const cepDigitado = watch("cep")?.replace(/\D/g, "");
		if (!cepDigitado || cepDigitado.length < 8) return;

		setLoadingCep(true);
		try {
			const data = await enderecoService.consultaCep(cepDigitado);
			if (data?.cep?.formatado && data.cep.formatado !== "00000-000") {
				setDadosCep(data);
				setValue("cep", data.cep.formatado);
				Keyboard.dismiss();
			} else {
				showModal("error", "Atenção", "CEP não encontrado.");
			}
		} catch (e) {
			showModal("error", "Erro", "Erro ao consultar CEP.");
		} finally {
			setLoadingCep(false);
		}
	};

	const handleSave = async (form: EnderecoFormData) => {
		if (!user || !dadosCep) return;
		setLoading(true);
		try {
			const payload = {
				id: 0,
				idpaciente: user.id,
				principal: enderecos.length === 0 ? 1 : 0,
				logradouro: { descricao: dadosCep?.logradouro?.descricao },
				numero: form.numero,
				cidade: {
					id: dadosCep?.cidade?.id,
					descricao: dadosCep?.cidade?.descricao,
				},
				bairro: {
					id: dadosCep?.bairro?.id,
					descricao: dadosCep?.bairro?.descricao,
				},
				complemento: form.complemento,
				tipoendereco: 1,
				cep: {
					id: dadosCep?.cep?.id,
					numero: parseInt(form.cep.replace(/\D/g, "")),
				},
				estado: {
					id: dadosCep?.estado?.id,
					sigla: dadosCep?.estado?.sigla,
					descricao: dadosCep?.estado?.descricao,
				},
				pais: { id: 1 },
				retornoMV: true,
			};

			const result = await enderecoService.saveEndereco(payload);
			if (!String(result).includes("ERRO")) {
				showModal("success", "Sucesso", "Endereço cadastrado!");
				setIsModalVisible(false);
				setDadosCep(null);
				reset();
				fetchEnderecos();
			} else {
				showModal("error", "Erro", String(result));
			}
		} catch (e) {
			showModal("error", "Erro", "Erro ao salvar.");
		} finally {
			setLoading(false);
		}
	};

	const handleSetPrincipal = async (item: any) => {
		setLoading(true);
		try {
			const payload = { ...item, idpaciente: user?.id, retornoMV: true };
			await enderecoService.setPrincipal(payload);
			fetchEnderecos();
		} catch (e) {
			showModal("error", "Erro", "Não foi possível alterar o principal.");
		} finally {
			setLoading(false);
		}
	};

	const handleConfirmDelete = async () => {
		if (!idParaExcluir) return;
		setConfirmVisible(false);
		setLoading(true);
		try {
			await enderecoService.deleteEndereco(idParaExcluir);
			showModal("success", "Sucesso", "Endereço removido.");
			fetchEnderecos();
		} catch (e) {
			showModal("error", "Erro", "Falha ao excluir.");
		} finally {
			setLoading(false);
			setIdParaExcluir(null);
		}
	};

	const showModal = (
		type: "success" | "error",
		title: string,
		message: string,
	) => {
		setModalConfig({ visible: true, type, title, message });
	};

	return (
		<View className="flex-1 bg-[#F8F9FA]">
			<PageHeader
				titulo="MEUS ENDEREÇOS"
				subtitulo="Gerencie seus locais cadastrados"
			/>

			<FlatList
				data={enderecos}
				keyExtractor={(item) => String(item.id)}
				contentContainerStyle={{ padding: 20, paddingBottom: 130 }}
				refreshControl={
					<RefreshControl
						refreshing={loading}
						onRefresh={fetchEnderecos}
						colors={["#00877C"]}
					/>
				}
				renderItem={({ item }) => (
					<View
						className={`bg-white p-4 mb-4 rounded-2xl shadow-sm border ${item.principal === 1 ? "border-teal-500" : "border-gray-100"}`}
					>
						<View className="flex-row justify-between items-start">
							<View className="flex-1">
								{item.principal === 1 && (
									<View className="bg-teal-500 self-start px-2 py-1 rounded-md mb-2">
										<Text className="text-white text-[10px] font-bold">
											PRINCIPAL
										</Text>
									</View>
								)}
								<Text className="text-gray-800 font-bold text-lg">
									{item?.logradouro?.descricao}, {item?.numero}
								</Text>
								<Text className="text-gray-500 text-sm">
									{item?.bairro?.descricao}
								</Text>
								<Text className="text-gray-400 text-md italic">
									CEP: {item?.cep?.formatado}
								</Text>
								<Text className="text-gray-500 text-sm">
									{item?.cidade?.descricao} - {item?.estado?.sigla}
								</Text>
							</View>
							{item.principal !== 1 && (
								<DeleteButton
									onPress={() => {
										setIdParaExcluir(item.id);
										setConfirmVisible(true);
									}}
									loading={loading && idParaExcluir === item.id}
									disabled={loading}
								/>
							)}
						</View>
						{item.principal !== 1 && (
							<TouchableOpacity
								onPress={() => handleSetPrincipal(item)}
								className="mt-4 pt-3 border-t border-gray-50 flex-row items-center"
							>
								<MaterialIcons
									name="check-circle-outline"
									size={18}
									color="#00877C"
								/>
								<Text className="text-teal-600 font-bold ml-1 text-xs">
									TORNAR ESTE ENDEREÇO PRINCIPAL
								</Text>
							</TouchableOpacity>
						)}
					</View>
				)}
			/>

			<TouchableOpacity
				onPress={() => {
					reset();
					setDadosCep(null);
					setIsModalVisible(true);
				}}
				className="absolute bottom-28 right-6 w-16 h-16 bg-[#00877C] rounded-full items-center justify-center shadow-2xl z-50"
			>
				<MaterialIcons name="add" size={35} color="white" />
			</TouchableOpacity>

			<Modal visible={isModalVisible} animationType="slide" transparent={true}>
				<KeyboardAvoidingView
					behavior={Platform.OS === "ios" ? "padding" : undefined}
					className="flex-1"
				>
					<View className="flex-1 justify-end bg-black/50">
						<View
							className="bg-white rounded-t-[35px] p-6"
							style={{ maxHeight: "90%" }}
						>
							<View className="flex-row justify-between items-center mb-6">
								<Text className="text-2xl font-bold text-gray-800">
									Novo Endereço
								</Text>
								<TouchableOpacity
									onPress={() => setIsModalVisible(false)}
									className="bg-gray-100 p-2 rounded-full"
								>
									<MaterialIcons name="close" size={24} color="#666" />
								</TouchableOpacity>
							</View>

							<ScrollView
								showsVerticalScrollIndicator={false}
								keyboardShouldPersistTaps="handled"
								contentContainerStyle={{
									paddingBottom: keyboardHeight > 0 ? keyboardHeight : 20,
								}}
							>
								<View className="flex-row items-end mb-4">
									<View className="flex-1">
										<FormInput
											label="CEP"
											name="cep"
											control={control}
											error={errors.cep}
											placeholder="00000-000"
											keyboardType="numeric"
											maxLength={9}
											iconName="map-marker"
											onChangeText={(text) => {
												const clean = text.replace(/\D/g, "");
												const formatted = clean
													.replace(/(\d{5})(\d)/, "$1-$2")
													.substring(0, 9);
												setValue("cep", formatted);
											}}
										/>
									</View>
									<TouchableOpacity
										onPress={handleBuscaCep}
										disabled={loadingCep}
										className="bg-[#00877C] ml-2 h-16 w-14 items-center justify-center rounded-2xl shadow-sm mb-5"
									>
										{loadingCep ? (
											<ActivityIndicator color="white" />
										) : (
											<MaterialIcons name="search" size={28} color="white" />
										)}
									</TouchableOpacity>
								</View>

								{dadosCep && (
									<View className="bg-teal-50 p-4 rounded-2xl border border-teal-100 mb-4">
										<Text className="text-gray-800 font-bold">
											{dadosCep?.logradouro?.descricao}
										</Text>
										<Text className="text-gray-600">
											{dadosCep?.bairro?.descricao} -{" "}
											{dadosCep?.cidade?.descricao}/{dadosCep?.estado?.sigla}
										</Text>
									</View>
								)}

								<View className="flex-row gap-2">
									<View className="flex-1">
										<FormInput
											label="Número"
											name="numero"
											control={control}
											error={errors.numero}
											placeholder="123"
											keyboardType="numeric"
											iconName="hashtag"
										/>
									</View>
									<View className="flex-[2]">
										<FormInput
											label="Complemento"
											name="complemento"
											control={control}
											error={errors.complemento}
											placeholder="Apto, Bloco..."
											iconName="info-circle"
										/>
									</View>
								</View>

								<PrimaryButton
									onPress={handleSubmit(handleSave)}
									title="Cadastrar Endereço"
									loading={loading}
									iconName="chevron-right"
								/>
							</ScrollView>
						</View>
					</View>
				</KeyboardAvoidingView>
			</Modal>

			<ConfirmModal
				visivel={confirmVisible}
				titulo="Excluir Endereço"
				mensagem="Tem certeza que deseja remover este endereço?"
				onConfirm={handleConfirmDelete}
				onCancel={() => setConfirmVisible(false)}
			/>
			<StatusModal
				config={modalConfig}
				onClose={() => setModalConfig({ ...modalConfig, visible: false })}
			/>
			<Footer />
		</View>
	);
}

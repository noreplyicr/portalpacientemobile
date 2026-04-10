import { MaterialIcons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
	ActivityIndicator,
	FlatList,
	Keyboard,
	KeyboardAvoidingView,
	Modal,
	Platform,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import * as z from "zod";

// Componentes
import { ConfirmModal } from "@/src/components/ConfirmModal";
import { DeleteButton } from "@/src/components/DeleteButton";
import Select from "@/src/components/Dropdown";
import { Footer } from "@/src/components/Footer";
import { FormInput } from "@/src/components/FormInput";
import { PageHeader } from "@/src/components/PageHeader";
import { StatusModal } from "@/src/components/StatusModal";

// Contextos e Services
import { PrimaryButton } from "@/src/components/PrimaryButton";
import { useAuth } from "@/src/contexts/AuthContext";
import { phoneService } from "@/src/services/phoneService";
import { maskPhone } from "@/src/utils/validacoes";

const phoneSchema = z.object({
	tipoContato: z.string().min(1, "Selecione o tipo de contato"),
	tipoResponsavel: z.string().min(1, "Selecione o responsável"),
	numero: z.string().min(14, "Telefone incompleto"),
});

type PhoneFormData = z.infer<typeof phoneSchema>;

export default function Telefones() {
	const { user } = useAuth();
	const [phones, setPhones] = useState<any[]>([]);
	const [tpTelefone, setTpTelefone] = useState([]);
	const [tpResponsavel, setTpResponsavel] = useState([]);
	const [loading, setLoading] = useState(false);
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [confirmVisible, setConfirmVisible] = useState(false);
	const [itemToDelete, setItemToDelete] = useState<any>(null);
	const [modalConfig, setModalConfig] = useState<any>({
		visible: false,
		type: "success",
		title: "",
		message: "",
	});

	// Estado para monitorar a altura do teclado
	const [keyboardHeight, setKeyboardHeight] = useState(0);

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<PhoneFormData>({
		resolver: zodResolver(phoneSchema),
		defaultValues: { tipoContato: "", tipoResponsavel: "", numero: "" },
	});

	useEffect(() => {
		loadInitialData();

		// Listeners para ajuste dinâmico do teclado (especialmente importante para Android)
		const showSubscription = Keyboard.addListener("keyboardDidShow", (e) => {
			setKeyboardHeight(e.endCoordinates.height);
		});
		const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
			setKeyboardHeight(0);
		});

		return () => {
			showSubscription.remove();
			hideSubscription.remove();
		};
	}, []);

	const loadInitialData = async () => {
		if (!user) return;
		setLoading(true);
		try {
			const [types, resps, data] = await Promise.all([
				phoneService.getPhoneTypes(),
				phoneService.getResponsibleTypes(),
				phoneService.getPhones(user.id),
			]);
			setTpTelefone(types);
			setTpResponsavel(resps);
			setPhones(data);
		} catch (error) {
			showStatus("error", "Erro", "Falha ao carregar dados.");
		} finally {
			setLoading(false);
		}
	};

	const showStatus = (
		type: "success" | "error",
		title: string,
		message: string,
	) => {
		setModalConfig({ visible: true, type, title, message });
	};

	const handleSave = async (data: PhoneFormData) => {
		setLoading(true);
		try {
			const result = await phoneService.savePhone(user!.id, data);
			if (!String(result).includes("ERRO") && result !== "0") {
				setIsModalVisible(false);
				reset();
				setTimeout(() => {
					showStatus("success", "Sucesso", "Telefone cadastrado com sucesso!");
					loadInitialData();
				}, 500);
			} else {
				showStatus(
					"error",
					"Atenção",
					result === "0" ? "Telefone já está cadastrado." : result,
				);
			}
		} catch (error) {
			showStatus("error", "Erro", "Erro de conexão.");
		} finally {
			setLoading(false);
		}
	};

	const confirmDelete = async () => {
		if (!itemToDelete) return;
		setConfirmVisible(false);
		setLoading(true);
		try {
			const result = await phoneService.deletePhone(
				itemToDelete.id,
				itemToDelete.db,
			);
			if (!String(result).includes("ERRO")) {
				loadInitialData();
			} else {
				showStatus("error", "Erro", result);
			}
		} catch (e) {
			showStatus("error", "Erro", "Falha ao excluir.");
		} finally {
			setLoading(false);
			setItemToDelete(null);
		}
	};

	return (
		<View className="flex-1 bg-[#F8F9FA]">
			<PageHeader titulo="TELEFONES" subtitulo="Gerencie seus contatos" />

			{loading && !isModalVisible && !confirmVisible && (
				<ActivityIndicator color="#2ea9a0" className="my-4" />
			)}

			<FlatList
				data={phones}
				keyExtractor={(_, index) => String(index)}
				contentContainerStyle={{ padding: 20, paddingBottom: 130 }}
				renderItem={({ item }) => (
					<View className="flex-row items-center bg-white p-4 mb-3 rounded-2xl shadow-sm border border-gray-100">
						<View className="bg-teal-50 p-3 rounded-full mr-4">
							<MaterialIcons name="local-phone" size={22} color="#2ea9a0" />
						</View>
						<View className="flex-1">
							<Text className="text-lg font-bold text-gray-800">
								({item?.cidade?.ddd}) {item?.numero}
							</Text>
							<Text className="text-xs font-medium text-teal-600 uppercase">
								{item?.tipotelefone?.descricao} - {item?.responsavel?.descricao}
							</Text>
						</View>
						<DeleteButton
							loading={loading && itemToDelete?.id === item.id}
							onPress={() => {
								setItemToDelete(item);
								setConfirmVisible(true);
							}}
						/>
					</View>
				)}
			/>

			<TouchableOpacity
				onPress={() => {
					reset();
					setIsModalVisible(true);
				}}
				className="absolute bottom-28 right-6 w-16 h-16 bg-[#2ea9a0] rounded-full items-center justify-center shadow-xl z-50"
			>
				<MaterialIcons name="add" size={32} color="white" />
			</TouchableOpacity>

			<Modal visible={isModalVisible} animationType="slide" transparent>
				<KeyboardAvoidingView
					behavior={Platform.OS === "ios" ? "padding" : undefined}
					className="flex-1"
				>
					<View className="flex-1 justify-end bg-black/50">
						<View
							className="bg-white rounded-t-[35px] p-6 pb-8"
							style={{ maxHeight: "90%" }}
						>
							<View className="flex-row justify-between items-center mb-6">
								<Text className="text-xl font-bold text-gray-800">
									Novo Telefone
								</Text>
								<TouchableOpacity onPress={() => setIsModalVisible(false)}>
									<MaterialIcons name="close" size={28} color="#999" />
								</TouchableOpacity>
							</View>

							<ScrollView
								showsVerticalScrollIndicator={false}
								keyboardShouldPersistTaps="handled"
								contentContainerStyle={{
									paddingBottom: keyboardHeight > 0 ? keyboardHeight : 20,
								}}
							>
								<FormInput
									label="Número com DDD"
									name="numero"
									control={control as any}
									placeholder="(00) 00000-0000"
									keyboardType="numeric"
									maxLength={15}
									error={errors.numero}
									iconName="phone"
									onChangeText={(text) => maskPhone(text)}
								/>

								<Text className="text-gray-500 mb-1 mt-4 ml-1 font-medium">
									Tipo de Contato
								</Text>
								<Controller
									control={control}
									name="tipoContato"
									render={({ field: { onChange, value } }) => (
										<Select
											items={tpTelefone}
											onChange={onChange}
											value={value}
											placeholder="Selecione o tipo"
											iconname="list"
											errors={errors.tipoContato?.message}
										/>
									)}
								/>

								<Text className="text-gray-500 mb-1 mt-4 ml-1 font-medium">
									Responsável
								</Text>
								<Controller
									control={control}
									name="tipoResponsavel"
									render={({ field: { onChange, value } }) => (
										<Select
											items={tpResponsavel}
											onChange={onChange}
											value={value}
											placeholder="Quem é o responsável?"
											iconname="person"
											errors={errors.tipoResponsavel?.message}
										/>
									)}
								/>

								<PrimaryButton
									title="Cadastrar Contato"
									loading={loading}
									onPress={handleSubmit(handleSave)}
									iconName="chevron-right"
								/>
							</ScrollView>
						</View>
					</View>
				</KeyboardAvoidingView>
			</Modal>

			<ConfirmModal
				visivel={confirmVisible}
				titulo="Excluir"
				mensagem="Remover este contato?"
				onConfirm={confirmDelete}
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

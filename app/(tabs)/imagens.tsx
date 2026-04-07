import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Modal,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// Componentes Customizados
import { Footer } from "@/src/components/Footer";
import { PageHeader } from "@/src/components/PageHeader";
import { ServiceButton } from "@/src/components/ServiceButton";
import { StatusModal } from "@/src/components/StatusModal"; // Seu componente

// Contextos e Services
import { useAuth } from "@/src/contexts/AuthContext";
import { imagensService } from "@/src/services/imagensService";

const MENU_OPCOES = [
	{ id: "01", dir: "EXAMES", name: "Exames", icon: "file-upload-outline" },
	{ id: "02", dir: "LESOES", name: "Lesões", icon: "bandage" },
	{
		id: "03",
		dir: "DOCUMENTOS",
		name: "Documentos",
		icon: "card-account-details-outline",
	},
	{ id: "04", dir: "VACINA", name: "Vacinas", icon: "needle" },
	{ id: "05", dir: "LAUDOS", name: "Laudos", icon: "file-check-outline" },
	{ id: "06", dir: "OUTROS", name: "Outros", icon: "plus-circle-outline" },
] as const;

export default function Imagens() {
	const { user } = useAuth();

	/* ESTADOS */
	const [loading, setLoading] = useState(false);
	const [showSelector, setShowSelector] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState<
		(typeof MENU_OPCOES)[number] | null
	>(null);

	// Estado para o seu StatusModal
	const [modalConfig, setModalConfig] = useState<{
		visible: boolean;
		type: "success" | "error";
		title: string;
		message: string;
	}>({
		visible: false,
		type: "success",
		title: "",
		message: "",
	});

	const openSelector = (item: (typeof MENU_OPCOES)[number]) => {
		setSelectedCategory(item);
		setShowSelector(true);
	};

	const handleImageProcess = async (mode: "camera" | "gallery") => {
		setShowSelector(false);

		if (!user) {
			setModalConfig({
				visible: true,
				type: "error",
				title: "Acesso Negado",
				message: "Sessão expirada. Por favor, realize o login novamente.",
			});
			return;
		}

		try {
			let result;
			if (mode === "camera") {
				const { granted } = await ImagePicker.requestCameraPermissionsAsync();
				if (!granted) throw new Error("Permissão da câmera negada.");
				result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
			} else {
				const { granted } =
					await ImagePicker.requestMediaLibraryPermissionsAsync();
				if (!granted) throw new Error("Permissão da galeria negada.");
				result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
			}

			if (result.canceled || !result.assets[0]) return;

			setLoading(true);

			const manipResult = await ImageManipulator.manipulateAsync(
				result.assets[0].uri,
				[{ resize: { width: 1000 } }],
				{
					compress: 0.7,
					format: ImageManipulator.SaveFormat.JPEG,
					base64: true,
				},
			);

			const response = await imagensService.upload({
				id: user?.id || 0,
				nome: user?.nome || "",
				matricula: user?.matricula || "",
				efoto: manipResult.base64 || "",
				dirfoto: selectedCategory?.dir || "OUTROS",
			});

			if (String(response).includes("OK")) {
				setModalConfig({
					visible: true,
					type: "success",
					title: "Sucesso!",
					message: "Seu arquivo foi enviado e processado com sucesso.",
				});
			} else {
				throw new Error("Resposta inesperada do servidor.");
			}
		} catch (error: any) {
			setModalConfig({
				visible: true,
				type: "error",
				title: "Erro no Envio",
				message: error.message || "Não foi possível enviar o arquivo.",
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<View className="flex-1 bg-[#F8F9FA]">
			<PageHeader
				titulo="ENVIAR ARQUIVOS"
				subtitulo="Selecione uma categoria"
			/>

			<View className="flex-1 px-4 pt-6">
				<FlatList
					data={MENU_OPCOES}
					numColumns={3}
					columnWrapperStyle={{
						justifyContent: "space-between",
						marginBottom: 15,
					}}
					keyExtractor={(item) => item.id}
					renderItem={({ item }) => (
						<ServiceButton
							style={{ width: "31%" }}
							icon={item.icon as any}
							title={item.name}
							onPress={() => openSelector(item)}
						/>
					)}
				/>
			</View>

			{/* MODAL SELETOR (Câmera ou Galeria) */}
			<Modal visible={showSelector} transparent animationType="slide">
				<View className="flex-1 justify-end bg-black/50">
					<View className="bg-white rounded-t-[32px] p-8">
						<Text className="text-[#191455] font-bold text-xl text-center mb-6">
							Selecione a origem
						</Text>

						<View className="flex-row justify-around mb-8">
							<TouchableOpacity
								onPress={() => handleImageProcess("camera")}
								className="items-center"
							>
								<View className="bg-teal-50 w-16 h-16 rounded-full items-center justify-center mb-2">
									<MaterialCommunityIcons
										name="camera-outline"
										size={32}
										color="#00877C"
									/>
								</View>
								<Text className="text-[#191455] font-semibold">Câmera</Text>
							</TouchableOpacity>

							<TouchableOpacity
								onPress={() => handleImageProcess("gallery")}
								className="items-center"
							>
								<View className="bg-blue-50 w-16 h-16 rounded-full items-center justify-center mb-2">
									<MaterialCommunityIcons
										name="image-multiple-outline"
										size={32}
										color="#2196F3"
									/>
								</View>
								<Text className="text-[#191455] font-semibold">Galeria</Text>
							</TouchableOpacity>
						</View>

						<TouchableOpacity
							onPress={() => setShowSelector(false)}
							className="bg-gray-100 h-14 rounded-2xl items-center justify-center"
						>
							<Text className="text-gray-500 font-bold uppercase">
								Cancelar
							</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>

			{/* MODAL DE LOADING */}
			<Modal transparent visible={loading}>
				<View className="flex-1 items-center justify-center bg-black/30">
					<View className="bg-white p-8 rounded-3xl items-center">
						<ActivityIndicator size="large" color="#00877C" />
						<Text className="mt-4 font-bold text-[#191455]">Enviando...</Text>
					</View>
				</View>
			</Modal>

			{/* SEU MODAL DE STATUS */}
			<StatusModal
				config={modalConfig}
				onClose={() => setModalConfig({ ...modalConfig, visible: false })}
			/>

			<Footer />
		</View>
	);
}

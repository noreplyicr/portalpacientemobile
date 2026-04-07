import { FilaModal } from "@/src/components/FilaModal";
import { Footer } from "@/src/components/Footer";
import { ServiceButton } from "@/src/components/ServiceButton";
import { StatusModal } from "@/src/components/StatusModal";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
	ActivityIndicator,
	Dimensions,
	Image,
	Linking,
	Modal,
	Platform,
	ScrollView,
	StatusBar,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/contexts/AuthContext";
import {
	getPatientSlip,
	updatePatientDataFlag,
	uploadPatientAvatar,
} from "../../src/services/patientService";

const { width } = Dimensions.get("window");
const COLORS = {
	hcf_navy: "#191455",
	hcf_teal: "#00877C",
	hcf_teal_light: "#e6f3f2",
};
const COLUMN_WIDTH = (width - 60) / 3;

export default function Home() {
	const { user, loading, updateUser } = useAuth();
	const router = useRouter();
	const [actionLoading, setActionLoading] = useState(false);
	const [filaModalVisible, setFilaModalVisible] = useState(false);

	const [statusModal, setStatusModal] = useState({
		visible: false,
		type: "success" as "success" | "error" | "info",
		title: "",
		message: "",
	});

	/* ESTADOS ADICIONADOS PARA O SELETOR */
	const [showSelector, setShowSelector] = useState(false);

	const activeBanners = useMemo(() => {
		if (!user) return [];
		const banners = [];

		if (Number(user.temtele) === 1) {
			banners.push({
				id: "tele",
				tipo: 3,
				title: "Teleconsulta disponível hoje!",
				subtitle: "Toque para acessar sua agenda",
				icon: "videocam",
				route: "/agenda",
			});
		}
		if (Number(user.atuamail) === 1 || user.hasemail === false) {
			banners.push({
				id: "email",
				tipo: 2,
				title: "E-mail continua o mesmo?",
				subtitle: user.email ? user.email : "Deseja atualizar?",
				icon: "mail",
				route: "/perfil",
			});
		}
		if (Number(user.atuatel) === 1) {
			banners.push({
				id: "phone",
				tipo: 1,
				title: "Verifique seus Contatos",
				subtitle: "Mantenha seu contato em dia",
				icon: "call",
				route: "/perfil",
			});
		}
		if (Number(user.atuaend) === 1) {
			banners.push({
				id: "address",
				tipo: 0,
				title: "Endereço continua o mesmo?",
				subtitle: user?.logradouro || "Endereço pendente",
				icon: "location",
				route: "/perfil",
			});
		}
		return banners;
	}, [user]);

	const handleBannerAction = async (banner: any) => {
		router.push(banner.route as any);
		if (user?.id) {
			try {
				await updatePatientDataFlag(String(user.id), banner.tipo);
				const localUpdate: any = {};
				if (banner.id === "tele") localUpdate.temtele = 0;
				if (banner.id === "email") {
					localUpdate.atuamail = 0;
					localUpdate.hasemail = true;
				}
				if (banner.id === "phone") localUpdate.atuatel = 0;
				if (banner.id === "address") localUpdate.atuaend = 0;
				await updateUser(localUpdate);
			} catch (err) {
				console.log("Erro ao limpar flag:", err);
			}
		}
	};

	const handleOpenSlip = async () => {
		if (!user?.id) return;
		setActionLoading(true);
		try {
			const data = await getPatientSlip(String(user.id));
			if ((data || "").includes(".pdf")) {
				Linking.openURL(data);
			} else {
				setStatusModal({
					visible: true,
					type: "error",
					title: "Documento",
					message: "DOCUMENTO NÃO DISPONÍVEL NO MOMENTO.",
				});
			}
		} catch (error: any) {
			setStatusModal({
				visible: true,
				type: "error",
				title: "Erro",
				message: "Falha na conexão: " + error.message,
			});
		} finally {
			setActionLoading(false);
		}
	};

	const handleImageProcess = async (mode: "camera" | "gallery") => {
		setShowSelector(false);

		if (!user) return;

		try {
			let result: ImagePicker.ImagePickerResult; // Tipagem explícita

			if (mode === "camera") {
				const { granted } = await ImagePicker.requestCameraPermissionsAsync();
				if (!granted) {
					alert("Precisamos de permissão para acessar a câmera.");
					return;
				}
				result = await ImagePicker.launchCameraAsync({
					allowsEditing: true,
					aspect: [1, 1],
					quality: 0.7,
				});
			} else {
				const { granted } =
					await ImagePicker.requestMediaLibraryPermissionsAsync();
				if (!granted) {
					alert("Precisamos de permissão para acessar a galeria.");
					return;
				}
				result = await ImagePicker.launchImageLibraryAsync({
					allowsEditing: true,
					aspect: [1, 1],
					quality: 0.7,
				});
			}

			// CORREÇÃO AQUI: Verificamos se foi cancelado e se o array assets existe
			if (result.canceled || !result.assets || result.assets.length === 0) {
				return;
			}

			setActionLoading(true);

			// Pegamos a URI do primeiro item do array de assets
			const selectedImageUri = result.assets[0].uri;

			// 1. Processamos a imagem para gerar o BASE64
			const manipResult = await ImageManipulator.manipulateAsync(
				selectedImageUri,
				[{ resize: { width: 600 } }],
				{
					compress: 0.7,
					format: ImageManipulator.SaveFormat.JPEG,
					base64: true, // Importante para o seu service novo
				},
			);

			// 2. Enviamos para o servidor (passando o base64)
			const newImageUrl = await uploadPatientAvatar(
				user,
				manipResult.base64 || "",
			);

			// 3. Atualiza a foto na tela
			await updateUser({ foto: newImageUrl });

			setStatusModal({
				visible: true,
				type: "success",
				title: "Sucesso",
				message: "FOTO ATUALIZADA COM SUCESSO!",
			});
		} catch (error: any) {
			console.error("Erro no ImagePicker/Upload:", error);
			setStatusModal({
				visible: true,
				type: "error",
				title: "Erro no Processo",
				message: "Ocorreu um erro ao processar a imagem.",
			});
		} finally {
			setActionLoading(false);
		}
	};

	const handleAvaliar = () => {
		const url = Platform.select({
			ios: "itms-apps://apps.apple.com/app/id1592303573",
			android: "market://details?id=com.icr.portalpaciente",
		});
		const fallbackUrl = Platform.select({
			ios: "https://apps.apple.com/br/app/portal-do-paciente-icr/id1592303573",
			android:
				"https://play.google.com/store/apps/details?id=com.icr.portalpaciente",
		});
		Linking.canOpenURL(url!).then((supported) => {
			Linking.openURL(supported ? url! : fallbackUrl!);
		});
	};

	const nomeExibicao = user?.nome
		? user.nome.split(" ")[0].toUpperCase()
		: "PACIENTE";

	const servicos = [
		{ title: "Exames", icon: "file-document-outline", route: "/exames" },
		{ title: "Agenda", icon: "calendar-clock", route: "/agenda" },
		{ title: "Perfil", icon: "account-circle-outline", route: "/perfil" },
		{ title: "Remédios", icon: "pill", route: "/medicamentos" },
		{
			title: "Documentos",
			icon: "clipboard-text-outline",
			route: "/documentos",
		},
		{ title: "Preparo", icon: "medical-bag", route: "/preparo" },
		{ title: "Imagens", icon: "folder-image", route: "/imagens" },
		{ title: "Declaração", icon: "file-sign", route: "/declaracao" },
		{ title: "Slip", icon: "ticket-percent-outline", action: handleOpenSlip },
		{ title: "Catraca", icon: "door-open", route: "/catraca" },
		{
			title: "Fila",
			icon: "human-queue",
			action: () => setFilaModalVisible(true),
		},
		{ title: "Avalie", icon: "star-face", action: handleAvaliar },
	];

	return (
		<View className="flex-1 bg-[#F8F9FA]">
			<StatusBar barStyle="light-content" />

			{/* LOADING OVERLAY */}
			{(loading || actionLoading) && (
				<View
					style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
					className="absolute inset-0 z-50 items-center justify-center"
				>
					<View className="bg-white p-8 rounded-[32px] items-center shadow-2xl mx-10">
						<ActivityIndicator size="large" color={COLORS.hcf_teal} />
						<View className="mt-5 items-center">
							<Text className="text-[#191455] font-hcf-bold text-lg text-center">
								{actionLoading ? "Processando..." : "Carregando"}
							</Text>
						</View>
					</View>
				</View>
			)}

			<SafeAreaView
				style={{ backgroundColor: COLORS.hcf_navy }}
				edges={["top"]}
			>
				<View className="pb-8 px-6 rounded-b-[40px]">
					<View className="flex-row justify-between items-center mt-8 mb-6">
						<Image
							source={require("../../assets/images/logo80peq.png")}
							style={{ width: 230, height: 60 }}
							resizeMode="contain"
						/>
						<TouchableOpacity
							onPress={() => setShowSelector(true)} // AQUI: AGORA ABRE O SELETOR
							disabled={actionLoading}
							className="border-2 border-teal-400/50 rounded-full bg-white/10 w-14 h-14 items-center justify-center overflow-hidden"
						>
							{actionLoading ? (
								<ActivityIndicator size="small" color="#2dd4bf" />
							) : user?.foto ? (
								<Image
									source={{ uri: user.foto }}
									key={user.foto}
									className="w-full h-full"
									resizeMode="cover"
								/>
							) : (
								<Ionicons name="person" size={32} color="white" />
							)}
						</TouchableOpacity>
					</View>
					<View className="flex-row justify-between items-end">
						<View>
							<Text className="text-teal-400 text-[10px] font-hcf-bold uppercase">
								Paciente
							</Text>
							<Text className="text-white text-base font-hcf-bold">
								Olá, {nomeExibicao}
							</Text>
						</View>
						<View className="bg-white/10 px-3 py-2 rounded-2xl border border-white/20">
							<Text className="text-teal-300 text-[9px] font-hcf-bold uppercase text-center">
								Senha do Dia
							</Text>
							<Text className="text-white text-lg font-hcf-bold text-center">
								{user?.senhadia || "---"}
							</Text>
						</View>
					</View>
				</View>
			</SafeAreaView>

			{/* Banners Ativos */}
			<View>
				{activeBanners.map((banner) => (
					<TouchableOpacity
						key={banner.id}
						onPress={() => handleBannerAction(banner)}
						activeOpacity={0.8}
						style={{ borderLeftColor: COLORS.hcf_teal }}
						className="mx-5 mt-3 bg-white rounded-2xl shadow-sm border-l-8"
					>
						<View className="flex-row items-center p-3">
							<View className="bg-teal-50 p-2 rounded-full">
								<Ionicons
									name={banner.icon as any}
									size={20}
									color={COLORS.hcf_teal}
								/>
							</View>
							<View className="ml-3 flex-1">
								<Text
									style={{ color: COLORS.hcf_navy }}
									className="font-hcf-bold text-[13px]"
								>
									{banner.title}
								</Text>
								<Text className="text-gray-500 text-[10px]" numberOfLines={1}>
									{banner.subtitle}
								</Text>
							</View>
							<Ionicons name="chevron-forward" size={16} color="#CCC" />
						</View>
					</TouchableOpacity>
				))}
			</View>

			{/* Grid de Serviços */}
			<View style={{ flex: 1 }}>
				<ScrollView
					contentContainerStyle={{
						paddingHorizontal: 20,
						paddingVertical: 20,
						paddingBottom: 100,
					}}
					showsVerticalScrollIndicator={false}
				>
					<View className="flex-row flex-wrap justify-between">
						{servicos.map((item, index) => (
							<View
								key={index}
								style={{ width: COLUMN_WIDTH, marginBottom: 16 }}
							>
								<ServiceButton
									title={item.title}
									icon={item.icon as any}
									onPress={() =>
										item.route
											? router.push(item.route as any)
											: item.action?.()
									}
								/>
							</View>
						))}
					</View>
				</ScrollView>
			</View>

			{/* NOVO MODAL SELETOR - BASEADO NA SUA TELA DE IMAGENS */}
			<Modal visible={showSelector} transparent animationType="slide">
				<View className="flex-1 justify-end bg-black/50">
					<View className="bg-white rounded-t-[32px] p-8">
						<Text className="text-[#191455] font-hcf-bold text-xl text-center mb-6">
							Alterar foto de perfil
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
								<Text className="text-[#191455] font-hcf-bold">Câmera</Text>
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
								<Text className="text-[#191455] font-hcf-bold">Galeria</Text>
							</TouchableOpacity>
						</View>

						<TouchableOpacity
							onPress={() => setShowSelector(false)}
							className="bg-gray-100 h-14 rounded-2xl items-center justify-center"
						>
							<Text className="text-gray-500 font-hcf-bold uppercase">
								Cancelar
							</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>

			{/* Modal de Status */}
			<StatusModal
				visible={statusModal.visible}
				type={statusModal.type}
				title={statusModal.title}
				message={statusModal.message}
				onClose={() => setStatusModal({ ...statusModal, visible: false })}
			/>

			{/* Modal de Fila */}
			<FilaModal
				visible={filaModalVisible}
				onClose={() => setFilaModalVisible(false)}
				pacienteId={String(user?.id)}
			/>

			<Footer />
		</View>
	);
}

import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Linking,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

// Imports de componentes e serviços
import { Footer } from "@/src/components/Footer";
import { PageHeader } from "@/src/components/PageHeader";
import { StatusModal } from "../../src/components/StatusModal"; // Caso queira usar para erros
import { useAuth } from "../../src/contexts/AuthContext";
import { phoneService, Servico } from "../../src/services/phoneService";

export default function PhonesScreen() {
	const [servicos, setServicos] = useState<Servico[]>([]);
	const { isAuthenticated } = useAuth();
	const [loading, setLoading] = useState(true);
	const [modalConfig, setModalConfig] = useState({
		visible: false,
		type: "error" as "error" | "success",
		title: "",
		message: "",
	});

	useEffect(() => {
		loadPhones();
	}, []);

	const loadPhones = async () => {
		setLoading(true);
		try {
			const data = await phoneService.getTelefones();
			setServicos(data);
		} catch (error) {
			setModalConfig({
				visible: true,
				type: "error",
				title: "Erro",
				message: "Não foi possível carregar os ramais. Tente novamente.",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleCall = (number: string) => {
		if (!number) return;
		// Limpa caracteres não numéricos para garantir que o discador funcione
		const cleanNumber = number.replace(/\D/g, "");
		Linking.openURL(`tel:${cleanNumber}`);
	};

	return (
		<View className="flex-1 bg-gray-50">
			<Stack.Screen options={{ headerShown: false }} />

			{/* Header Simples que você já utiliza */}

			<PageHeader titulo="INFORMAÇÕE ÚTEIS" showBackButton />

			<StatusModal
				config={modalConfig}
				onClose={() => setModalConfig({ ...modalConfig, visible: false })}
			/>

			{loading ? (
				<View className="flex-1 justify-center items-center">
					<ActivityIndicator size="large" color="#00877C" />
					<Text className="mt-4 text-gray-400 font-medium">
						Carregando ramais...
					</Text>
				</View>
			) : (
				<ScrollView
					className="flex-1"
					contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
					showsVerticalScrollIndicator={false}
				>
					{servicos.length === 0 ? (
						<View className="items-center mt-10">
							<Text className="text-gray-400">Nenhum registro encontrado.</Text>
						</View>
					) : (
						servicos.map((item, index) => (
							<View
								key={`servico-${index}`}
								className="bg-white rounded-[32px] p-6 mb-4 shadow-sm border border-gray-100"
							>
								{/* Cabeçalho do Card: Nome do Setor */}
								<View className="flex-row items-center mb-4 border-b border-gray-50 pb-4">
									<View className="bg-teal-50 p-2.5 rounded-2xl">
										<FontAwesome5
											name="hospital-alt"
											size={14}
											color="#00877C"
										/>
									</View>
									<Text className="flex-1 ml-3 text-[#191455] font-bold text-[16px]">
										{item.servico}
									</Text>
								</View>

								{/* Lista de Telefones do Setor */}
								{item.phones.map((phone, pIndex) => (
									<View
										key={`phone-${pIndex}`}
										className={`flex-row items-center py-3 ${pIndex !== item.phones.length - 1 ? "border-b border-gray-50" : ""}`}
									>
										<View className="flex-1 pr-4">
											<Text className="text-gray-600 text-[14px] font-medium mb-1">
												{phone.descricao}
											</Text>
											{phone.numero ? (
												<Text className="text-teal-700 font-bold text-[13px]">
													{phone.numero}
												</Text>
											) : null}
										</View>

										{phone.numero !== "" && (
											<TouchableOpacity
												onPress={() => handleCall(phone.numero)}
												activeOpacity={0.7}
												className="bg-[#00877C] w-11 h-11 rounded-full items-center justify-center shadow-md shadow-teal-900/20"
											>
												<MaterialCommunityIcons
													name="phone"
													size={22}
													color="white"
												/>
											</TouchableOpacity>
										)}
									</View>
								))}
							</View>
						))
					)}
				</ScrollView>
			)}

			{isAuthenticated && <Footer />}
		</View>
	);
}

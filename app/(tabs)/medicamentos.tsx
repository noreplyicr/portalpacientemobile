import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

// Imports corrigidos para o seu padrão de alias @/
import { Footer } from "@/src/components/Footer";
import { PageHeader } from "@/src/components/PageHeader";
import { useAuth } from "@/src/contexts/AuthContext";
import { medicamentoService } from "@/src/services/medicamentoService";

export default function Medicamentos() {
	const { user } = useAuth();
	const [letraSelecionada, setLetraSelecionada] = useState("A");
	const [medicamentos, setMedicamentos] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);

	const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

	const carregarMedicamentos = useCallback(async () => {
		if (!user?.token) return;

		setLoading(true);
		try {
			const response =
				await medicamentoService.getMedicamentos(letraSelecionada);

			// Verificação de segurança para os dados
			const lista = response?.data || response || [];
			setMedicamentos(Array.isArray(lista) ? lista : []);
		} catch (error) {
			console.error("Erro na busca:", error);
			setMedicamentos([]);
		} finally {
			setLoading(false);
		}
	}, [letraSelecionada, user?.token]);

	useEffect(() => {
		carregarMedicamentos();
	}, [carregarMedicamentos]);

	return (
		<View className="flex-1 bg-[#F8F9FA]">
			{/* Header com SafeArea */}
			<PageHeader
				titulo="Medicamentos"
				subtitulo={`Olá, ${user?.nome?.split(" ")[0] || "Cidadão"} - MEDICAMENTOS DISPONÍVEIS`}
			/>

			<View className="h-16 mt-2 mb-2">
				<FlatList
					horizontal
					data={letras} // Ex: ["A", "B", "C"...]
					keyExtractor={(item) => item}
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={{
						paddingHorizontal: 20,
						alignItems: "center", // Alinha todos os círculos no centro vertical da View
					}}
					renderItem={({ item: letra }) => {
						const selecionada = letraSelecionada === letra;
						return (
							<TouchableOpacity
								activeOpacity={0.8}
								onPress={() => setLetraSelecionada(letra)}
								style={{ elevation: 5 }} // Sombra nítida no Android
								className={`w-12 h-12 rounded-full items-center justify-center mx-1.5 shadow-md ${
									selecionada
										? "bg-[#00877C] border-2 border-[#00877C]"
										: "bg-white border-2 border-transparent"
								}`}
							>
								<Text
									className={`font-hcf-bold text-lg ${
										selecionada ? "text-white" : "text-[#191455]"
									}`}
								>
									{letra}
								</Text>
							</TouchableOpacity>
						);
					}}
				/>
			</View>

			{/* Lista de Medicamentos */}
			<View className="flex-1">
				{loading ? (
					<View className="flex-1 justify-center items-center">
						<ActivityIndicator size="large" color="#00877C" />
						<Text className="mt-2 text-gray-400 font-hcf-regular">
							Buscando itens...
						</Text>
					</View>
				) : (
					<FlatList
						data={medicamentos}
						keyExtractor={(item, index) =>
							item.id?.toString() || index.toString()
						}
						contentContainerStyle={{ paddingBottom: 100, paddingTop: 10 }}
						renderItem={({ item }) => {
							// Verifica status independente de como vem do back
							const statusNome = item?.status?.nome || item?.status || "";
							const isDisponivel = statusNome.toUpperCase() === "DISPONIVEL";

							return (
								<View className="bg-white mx-4 mb-3 p-5 rounded-2xl flex-row justify-between items-center shadow-sm border border-gray-50">
									<View className="flex-1 pr-4">
										<Text className="text-[#191455] font-hcf-bold text-sm uppercase leading-5">
											{item?.nome}
										</Text>

										<View className="flex-row items-center mt-2">
											<View
												className={`px-3 py-1 rounded-full ${isDisponivel ? "bg-teal-50" : "bg-red-50"}`}
											>
												<Text
													className={`text-[10px] font-hcf-bold uppercase ${isDisponivel ? "text-teal-700" : "text-red-600"}`}
												>
													{statusNome || "Indisponível"}
												</Text>
											</View>
										</View>
									</View>

									<MaterialCommunityIcons
										name={isDisponivel ? "check-circle" : "alert-circle"}
										size={26}
										color={isDisponivel ? "#00877C" : "#EF4444"}
									/>
								</View>
							);
						}}
						ListEmptyComponent={() => (
							<View className="items-center p-20">
								<MaterialCommunityIcons
									name="pill-off"
									size={50}
									color="#DDD"
								/>
								<Text className="text-gray-400 font-hcf-regular text-center mt-4">
									Nenhum medicamento com a letra "{letraSelecionada}"
									encontrado.
								</Text>
							</View>
						)}
					/>
				)}
			</View>

			<Footer />
		</View>
	);
}

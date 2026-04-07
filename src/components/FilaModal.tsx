import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Linking,
    Modal,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { getPatientQueue } from "../services/patientService";

interface FilaModalProps {
	visible: boolean;
	onClose: () => void;
	pacienteId: string;
}

export const FilaModal = ({ visible, onClose, pacienteId }: FilaModalProps) => {
	const [loading, setLoading] = useState(false);
	const [queues, setQueues] = useState([]);

	useEffect(() => {
		if (visible && pacienteId) loadData();
	}, [visible]);

	const loadData = async () => {
		setLoading(true);
		try {
			const data = await getPatientQueue(pacienteId);
			setQueues(data || []);
		} catch (error) {
			console.log(error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal
			visible={visible}
			animationType="slide"
			transparent
			onRequestClose={onClose}
		>
			<View className="flex-1 bg-black/60 justify-end">
				<View className="bg-white rounded-t-[40px] h-[75%] shadow-2xl">
					{/* Linha de "puxar" para fechar (visual) */}
					<View className="items-center mt-3">
						<View className="w-12 h-1.5 bg-gray-200 rounded-full" />
					</View>

					<View className="flex-row items-center justify-between px-8 py-5">
						<Text className="text-[#191455] font-hcf-bold text-2xl">
							Sua Fila
						</Text>
						<TouchableOpacity
							onPress={onClose}
							className="bg-gray-100 p-2 rounded-full"
						>
							<Ionicons name="close" size={24} color="#191455" />
						</TouchableOpacity>
					</View>

					{loading ? (
						<View className="flex-1 items-center justify-center pb-20">
							<ActivityIndicator size="large" color="#00877C" />
							<Text className="mt-4 text-gray-400 font-hcf-regular">
								Verificando posição...
							</Text>
						</View>
					) : (
						<FlatList
							data={queues}
							keyExtractor={(_, index) => String(index)}
							contentContainerStyle={{
								paddingHorizontal: 20,
								paddingBottom: 40,
							}}
							renderItem={({ item }: any) => (
								<View className="bg-teal-50/50 mb-4 p-5 rounded-[24px] border border-teal-100">
									<View className="flex-row justify-between items-center">
										<View className="flex-1">
											<Text className="text-gray-500 font-hcf-bold text-[10px] uppercase mb-1">
												{item.AGENDA}
											</Text>
											<View className="flex-row items-baseline">
												<Text className="text-[#00877C] font-hcf-bold text-4xl">
													{item.POSICAO}
												</Text>
												<Text className="text-[#00877C] font-hcf-bold text-lg ml-1">
													º lugar
												</Text>
											</View>
										</View>
										<View className="bg-white p-4 rounded-2xl shadow-sm">
											<MaterialCommunityIcons
												name="human-queue"
												size={28}
												color="#191455"
											/>
										</View>
									</View>

									{item.linklaudo && item.linklaudo.includes("https") && (
										<TouchableOpacity
											onPress={() => Linking.openURL(item.linklaudo)}
											className="mt-4 bg-[#00877C] py-3 rounded-xl items-center shadow-md shadow-teal-700/30"
										>
											<Text className="text-white font-hcf-bold uppercase text-xs">
												Acessar Painel
											</Text>
										</TouchableOpacity>
									)}
								</View>
							)}
							ListEmptyComponent={() => (
								<View className="items-center justify-center mt-20">
									<Ionicons
										name="notifications-off-outline"
										size={64}
										color="#EEE"
									/>
									<Text className="text-gray-400 text-center font-hcf-bold mt-4 px-10">
										SEM FILAS ATIVAS NO MOMENTO
									</Text>
								</View>
							)}
						/>
					)}
				</View>
			</View>
		</Modal>
	);
};

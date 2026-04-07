import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface PageHeaderProps {
	titulo: string;
	subtitulo?: string;
	children?: React.ReactNode;
	showBackButton?: boolean; // Nova prop opcional
}

export function PageHeader({
	titulo,
	subtitulo,
	children,
	showBackButton = false,
}: PageHeaderProps) {
	const router = useRouter();

	return (
		<View className="bg-white">
			<StatusBar backgroundColor="#191455" barStyle="light-content" />
			<SafeAreaView
				className="bg-[#191455] pt-4 pb-8 px-6 rounded-b-[40px]"
				edges={["top"]}
			>
				{/* Container Principal do Topo */}
				<View className="flex-row items-center justify-between mb-2">
					{/* Botão de Voltar Estilizado (Condicional) */}
					{showBackButton ? (
						<TouchableOpacity
							onPress={() => router.back()}
							// hitSlop para melhorar a área de toque
							hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
							activeOpacity={0.7}
							// Estilização do Botão Bonitão
							className="bg-white/10 w-10 h-10 rounded-full items-center justify-center border border-white/10"
						>
							<Ionicons
								name="arrow-back"
								size={22}
								color="white"
								style={{ marginLeft: -2 }}
							/>
						</TouchableOpacity>
					) : (
						// Espaçador para manter o título centralizado quando não há botão
						<View className="w-10 h-10" />
					)}

					{/* Container Central dos Textos (flex-1 para ocupar o meio) */}
					<View className="flex-1 px-3">
						<Text
							className="text-white text-xl font-hcf-bold text-center uppercase"
							numberOfLines={1} // Evita que títulos longos quebrem o layout
						>
							{titulo}
						</Text>

						{subtitulo && (
							<Text className="text-white/70 text-[11px] text-center mt-0.5 uppercase font-hcf-regular">
								{subtitulo}
							</Text>
						)}
					</View>

					{/* Espaçador fixo na direita (w-10) para garantir centralização perfeita do texto */}
					<View className="w-10 h-10" />
				</View>

				{/* Aqui entram as abas ou o letreiro */}
				{children}
			</SafeAreaView>
		</View>
	);
}

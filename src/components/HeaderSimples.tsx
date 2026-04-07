import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface HeaderProps {
	titulo: string;
	onPressBack?: () => void; // Função opcional para fechar Modais
}

export function HeaderSimples({ titulo, onPressBack }: HeaderProps) {
	const router = useRouter();
	const insets = useSafeAreaInsets(); // Garante o preenchimento da barra de status

	const handleBack = () => {
		if (onPressBack) {
			// Se você passou uma função (ex: onClose do Modal), executa ela
			onPressBack();
		} else {
			// Se não passou nada, ele simplesmente volta a página na navegação
			router.back();
		}
	};

	return (
		<View style={{ paddingTop: insets.top, backgroundColor: "#191455" }}>
			<View style={styles.headerContent}>
				<TouchableOpacity
					onPress={handleBack}
					hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
					activeOpacity={0.7}
				>
					<Ionicons name="arrow-back" size={28} color="white" />
				</TouchableOpacity>

				<Text style={styles.headerTitle} numberOfLines={1}>
					{titulo}
				</Text>

				{/* View vazia para manter o título perfeitamente centralizado via space-between */}
				<View style={{ width: 28 }} />
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	headerContent: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 20,
		paddingBottom: 20,
		paddingTop: 10,
	},
	headerTitle: {
		color: "white",
		fontSize: 18, // Tamanho equilibrado para títulos longos
		fontWeight: "bold",
		textAlign: "center",
		flex: 1, // Faz o texto ocupar o centro
	},
});

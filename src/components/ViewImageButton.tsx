import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, TouchableOpacity } from "react-native";

interface Props {
	onPress: () => void;
	loading?: boolean;
	size?: number; // Padrão 48px
}

export const ViewImageButton = ({
	onPress,
	loading = false,
	size = 48, // Padrão 48px
}: Props) => (
	<TouchableOpacity
		onPress={onPress}
		disabled={loading}
		// ESTILIZAÇÃO UNIFICADA (DNA COMUM)
		style={{
			width: size,
			height: size,
			backgroundColor: "#F5F3FF", // Violeta suave
			borderRadius: 12, // ARREDONDAMENTO IDÊNTICO AO SHARE
			alignItems: "center",
			justifyContent: "center",
			// Borda invisível para reservar espaço exato se os outros tiverem borda
			borderWidth: 1,
			borderColor: "transparent",
		}}
	>
		{loading ? (
			<ActivityIndicator color="#6D28D9" size="small" />
		) : (
			<MaterialCommunityIcons
				name="eye-outline" // SEU ÍCONE DE OLHO ORIGINAL
				size={26} // Ícone em ~55% do botão de 48px
				color="#6D28D9" // Violeta Escuro
			/>
		)}
	</TouchableOpacity>
);

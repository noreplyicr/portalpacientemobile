import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

interface Props {
	onPress: () => void;
	loading: boolean;
	progress: number;
	size?: number;
	disabled?: boolean; // 1. Adicionado aqui
}

export const OpenFileButton = ({
	onPress,
	loading,
	progress,
	size = 48,
	disabled = false, // 2. Valor padrão
}: Props) => (
	<TouchableOpacity
		onPress={onPress}
		// 3. Desativa se estiver carregando OU se foi passado como desativado explicitamente
		disabled={loading || disabled}
		style={{
			width: size,
			height: size,
			backgroundColor: disabled ? "#F1F5F9" : "#E1F5FE", // 4. Cor mais neutra se desativado
			borderRadius: 12,
			alignItems: "center",
			justifyContent: "center",
			borderWidth: 1,
			borderColor: "transparent",
			opacity: disabled ? 0.5 : 1, // 5. Feedback visual de "apagadinho"
		}}
	>
		{loading ? (
			<View style={{ alignItems: "center", justifyContent: "center" }}>
				<ActivityIndicator color="#64748b" size="small" />
				{progress > 0 && (
					<Text
						style={{
							fontSize: 8,
							color: "#64748b",
							fontWeight: "bold",
							marginTop: 2,
						}}
					>
						{progress.toFixed(0)}%
					</Text>
				)}
			</View>
		) : (
			<MaterialCommunityIcons
				name="file-pdf-box"
				size={28}
				// 6. Ícone mais claro se desativado
				color={disabled ? "#cbd5e1" : "#64748b"}
			/>
		)}
	</TouchableOpacity>
);

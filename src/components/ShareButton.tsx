import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

interface ShareButtonProps {
	onPress: () => void;
	loading: boolean;
	progress: number;
	size?: number; // Padrão 48px
	disabled?: boolean; // 1. Adicionado aqui
}

export const ShareButton = ({
	onPress,
	loading,
	progress,
	size = 48,
	disabled = false, // 2. Valor padrão falso
}: ShareButtonProps) => {
	return (
		<TouchableOpacity
			onPress={onPress}
			// 3. Desativa se estiver carregando OU se não houver arquivo (disabled)
			disabled={loading || disabled}
			style={{
				width: size,
				height: size,
				// 4. Muda o fundo para um cinza neutro se estiver desativado
				backgroundColor: disabled ? "#F1F5F9" : "#F0F4F8",
				borderRadius: 12,
				alignItems: "center",
				justifyContent: "center",
				borderWidth: 1,
				borderColor: "transparent",
				// 5. Reduz a opacidade para dar o feedback visual de desativado
				opacity: disabled ? 0.4 : 1,
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
					name="share-variant"
					size={24}
					// 6. Ícone mais suave quando desativado
					color={disabled ? "#cbd5e1" : "#64748b"}
				/>
			)}
		</TouchableOpacity>
	);
};

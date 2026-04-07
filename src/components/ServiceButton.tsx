import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type IconProps = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

interface ServiceButtonProps {
	icon: IconProps;
	title: string;
	onPress?: () => void;
	style?: any; // Adicionamos isso para aceitar o tamanho da Home
}

export function ServiceButton({
	icon,
	title,
	onPress,
	style,
}: ServiceButtonProps) {
	return (
		<TouchableOpacity
			onPress={onPress}
			activeOpacity={0.7}
			// Removi o w-[48%] fixo para a Home controlar o grid
			className="bg-white rounded-3xl items-center justify-center border border-gray-100 shadow-sm"
			style={[{ elevation: 3, height: 110 }, style]}
		>
			{/* Círculo de fundo do ícone - O segredo da beleza */}
			<View className="bg-teal-50 w-14 h-14 rounded-full items-center justify-center mb-2">
				<MaterialCommunityIcons name={icon} size={28} color="#00877C" />
			</View>

			<Text
				numberOfLines={2}
				className="text-[#191455] font-hcf-bold text-[11px] text-center px-1 leading-tight uppercase"
			>
				{title}
			</Text>
		</TouchableOpacity>
	);
}

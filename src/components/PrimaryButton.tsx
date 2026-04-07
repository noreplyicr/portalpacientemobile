import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
	ActivityIndicator,
	Text,
	TouchableOpacity,
	TouchableOpacityProps,
	View,
} from "react-native";

type IconProps = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

interface PrimaryButtonProps extends TouchableOpacityProps {
	title: string;
	loading?: boolean;
	color?: string;
	iconName?: IconProps; // Novo: suporte a ícone
}

export function PrimaryButton({
	title,
	loading,
	color = "#00A99D",
	iconName,
	disabled,
	...rest
}: PrimaryButtonProps) {
	// Define se o botão está num estado que não aceita clique
	const isInactive = loading || disabled;

	return (
		<TouchableOpacity
			activeOpacity={0.8}
			disabled={isInactive}
			className={`h-16 rounded-2xl items-center justify-center mt-6 shadow-lg ${
				isInactive ? "bg-gray-300 shadow-none" : "shadow-teal-900/40"
			}`}
			style={[
				!isInactive && { backgroundColor: color }, // Só aplica a cor se estiver ativo
				rest.style,
			]}
			{...rest}
		>
			{loading ? (
				<ActivityIndicator color={color === "#FFF" ? "#00A99D" : "#FFF"} />
			) : (
				<View className="flex-row items-center justify-center">
					{iconName && (
						<MaterialCommunityIcons
							name={iconName}
							size={22}
							color={color === "#FFF" ? "#191455" : "white"}
							style={{ marginRight: 8 }}
						/>
					)}
					<Text
						className={`font-hcf-bold text-lg tracking-[2px] ${
							color === "#FFF" ? "text-[#191455]" : "text-white"
						}`}
					>
						{title.toUpperCase()}
					</Text>
				</View>
			)}
		</TouchableOpacity>
	);
}

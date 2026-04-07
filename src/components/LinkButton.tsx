import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

// Tipagem dos nomes de ícones do MaterialCommunityIcons
type IconProps = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

interface LinkButtonProps {
	label: string;
	boldText?: string;
	iconName?: IconProps;
	onPress: () => void;
	loading?: boolean;
	dashed?: boolean;
	color?: string;
	className?: string; // Adicionado aqui
}

export function LinkButton({
	label,
	boldText,
	iconName,
	onPress,
	loading = false,
	dashed = true,
	color = "#00877C",
	className = "", // Valor padrão vazio
}: LinkButtonProps) {
	return (
		<TouchableOpacity
			onPress={onPress}
			disabled={loading}
			activeOpacity={0.6}
			// Concatenamos as classes base com a prop className
			className={`mt-2 py-3 items-center flex-row justify-center rounded-2xl ${
				dashed ? "border border-dashed border-gray-200" : ""
			} ${className}`}
		>
			{loading ? (
				<ActivityIndicator size="small" color={color} />
			) : (
				<View className="flex-row items-center">
					{iconName && (
						<MaterialCommunityIcons name={iconName} size={20} color="#666" />
					)}
					<Text
						className={`text-gray-500 font-hcf-regular text-[15px] ${iconName ? "ml-2" : ""}`}
					>
						{label}{" "}
						{boldText && (
							<Text style={{ color }} className="font-hcf-bold">
								{boldText}
							</Text>
						)}
					</Text>
				</View>
			)}
		</TouchableOpacity>
	);
}

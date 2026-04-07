import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, TouchableOpacity } from "react-native";

interface Props {
	onPress: () => void;
	loading: boolean;
	size?: number;
	disabled?: boolean;
}

export const DeleteButton = ({
	onPress,
	loading,
	size = 44,
	disabled = false,
}: Props) => (
	<TouchableOpacity
		onPress={onPress}
		disabled={loading || disabled}
		style={{
			width: size,
			height: size,
			backgroundColor: disabled ? "#F1F5F9" : "#FEF2F2",
			borderRadius: 12,
			alignItems: "center",
			justifyContent: "center",
			borderWidth: 1,
			borderColor: disabled ? "transparent" : "#FEE2E2",
			opacity: disabled ? 0.5 : 1,
		}}
	>
		{loading ? (
			<ActivityIndicator color="#EF4444" size="small" />
		) : (
			<MaterialCommunityIcons
				name="trash-can-outline"
				size={22}
				color={disabled ? "#cbd5e1" : "#EF4444"}
			/>
		)}
	</TouchableOpacity>
);

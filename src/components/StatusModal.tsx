import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";

interface StatusModalProps {
	visible?: boolean;
	type?: "success" | "error" | "info";
	title?: string;
	message?: string;
	config?: {
		visible: boolean;
		type: "success" | "error" | "info";
		title: string;
		message: string;
	};
	onClose: () => void;
}

export const StatusModal = ({
	visible,
	type,
	title,
	message,
	config,
	onClose,
}: StatusModalProps) => {
	// Aqui a mágica: ele tenta pegar do 'config' ou das props soltas
	const isVisible = config ? config.visible : !!visible;
	const isType = config ? config.type : type || "success";
	const isTitle = config ? config.title : title || "";
	const isMessage = config ? config.message : message || "";

	if (!isVisible) return null;

	// Detecta se é modal de atualização pelo título
	const isUpdate =
		isTitle.includes("Atualização") || isTitle.includes("Versão");

	const getStyles = () => {
		switch (isType) {
			case "success":
				return {
					bg: "bg-teal-50",
					icon: "check-circle-outline",
					color: "#00877C",
					buttonBg: "bg-[#00877C]",
				};
			case "error":
				return {
					bg: "bg-red-50",
					icon: isUpdate ? "cloud-download-outline" : "alert-circle-outline",
					color: "#EF4444",
					buttonBg: "bg-red-500",
				};
			case "info":
			default:
				return {
					bg: "bg-indigo-50",
					icon: "clock-outline",
					color: "#191455",
					buttonBg: "bg-[#191455]",
				};
		}
	};

	const styles = getStyles();

	return (
		<Modal
			visible={isVisible}
			transparent
			animationType="fade"
			onRequestClose={onClose}
		>
			<View className="flex-1 justify-center items-center bg-black/50 px-6">
				<View className="bg-white w-full rounded-[32px] p-8 items-center shadow-2xl">
					<View
						className={`w-20 h-20 rounded-full items-center justify-center mb-4 ${styles.bg}`}
					>
						<MaterialCommunityIcons
							name={styles.icon as any}
							size={50}
							color={styles.color}
						/>
					</View>

					<Text className="text-[#191455] font-bold text-xl text-center mb-2">
						{isTitle}
					</Text>
					<Text className="text-gray-500 text-center text-base leading-6 mb-8">
						{isMessage}
					</Text>

					<TouchableOpacity
						onPress={onClose}
						activeOpacity={0.8}
						className={`w-full h-14 rounded-2xl items-center justify-center ${styles.buttonBg}`}
					>
						<Text className="text-white font-bold text-lg uppercase">
							{isUpdate ? "Atualizar Agora" : "Entendido"}
						</Text>
					</TouchableOpacity>
				</View>
			</View>
		</Modal>
	);
};

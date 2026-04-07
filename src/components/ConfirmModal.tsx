import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ConfirmModalProps {
	visivel: boolean;
	titulo: string;
	mensagem: string;
	textoConfirmar?: string; // Novo campo opcional
	onConfirm: () => void;
	onCancel: () => void;
}

export function ConfirmModal({
	visivel,
	titulo,
	mensagem,
	textoConfirmar = "Confirmar", // Valor padrão curto
	onConfirm,
	onCancel,
}: ConfirmModalProps) {
	return (
		<Modal
			animationType="fade"
			transparent={true}
			visible={visivel}
			onRequestClose={onCancel}
		>
			<View style={styles.overlay}>
				<View style={styles.modalContainer}>
					<Text style={styles.title}>{titulo}</Text>
					<Text style={styles.message}>{mensagem}</Text>

					<View style={styles.buttonContainer}>
						<TouchableOpacity
							style={[styles.button, styles.cancelButton]}
							onPress={onCancel}
							activeOpacity={0.7}
						>
							<Text
								style={styles.cancelText}
								numberOfLines={1}
								adjustsFontSizeToFit
							>
								Cancelar
							</Text>
						</TouchableOpacity>

						<TouchableOpacity
							style={[styles.button, styles.confirmButton]}
							onPress={onConfirm}
							activeOpacity={0.7}
						>
							<Text
								style={styles.confirmText}
								numberOfLines={1}
								adjustsFontSizeToFit
							>
								{textoConfirmar}
							</Text>
						</TouchableOpacity>
					</View>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.6)",
		justifyContent: "center",
		alignItems: "center",
		padding: 25, // Aumentado para dar mais respiro nas bordas da tela
	},
	modalContainer: {
		width: "100%",
		maxWidth: 400, // Evita que fique largo demais em tablets
		backgroundColor: "white",
		borderRadius: 24, // Bordas mais arredondadas e modernas
		padding: 24,
		alignItems: "center",
		elevation: 10,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 5 },
		shadowOpacity: 0.3,
		shadowRadius: 4.65,
	},
	title: {
		fontSize: 20,
		fontWeight: "bold",
		color: "#191455",
		marginBottom: 12,
		textAlign: "center",
	},
	message: {
		fontSize: 16,
		color: "#64748B", // Cor slate mais moderna
		textAlign: "center",
		lineHeight: 22,
		marginBottom: 28,
	},
	buttonContainer: {
		flexDirection: "row",
		width: "100%",
		gap: 12, // Gap é mais limpo que marginHorizontal individual
	},
	button: {
		flex: 1,
		paddingVertical: 16,
		borderRadius: 14,
		alignItems: "center",
		justifyContent: "center",
		minHeight: 54, // Garante área de toque boa
	},
	cancelButton: {
		backgroundColor: "#F1F5F9",
	},
	confirmButton: {
		backgroundColor: "#191455",
	},
	cancelText: {
		color: "#64748B",
		fontWeight: "700",
		fontSize: 15,
	},
	confirmText: {
		color: "white",
		fontWeight: "700",
		fontSize: 15,
	},
});

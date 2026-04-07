import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface PreparoProps {
	visible: boolean;
	onClose: () => void;
}

export const PreparoExameModal = ({ visible, onClose }: PreparoProps) => {
	return (
		<Modal
			animationType="fade"
			transparent={true}
			visible={visible}
			onRequestClose={onClose}
		>
			<View style={styles.overlay}>
				<View style={styles.container}>
					{/* Header */}
					<View style={styles.header}>
						<MaterialCommunityIcons
							name="clipboard-text-clock"
							size={28}
							color="#00877C"
						/>
						<Text style={styles.title}>Preparo para Exames</Text>
					</View>

					<ScrollView
						showsVerticalScrollIndicator={false}
						style={styles.content}
					>
						<Text style={styles.intro}>
							Para a maioria dos exames pediátricos{" "}
							<Text style={styles.bold}>não é necessário jejum</Text>. Apenas
							para exames como Glicose e Insulina, siga as regras abaixo:
						</Text>

						{/* Seção de Jejum */}
						<View style={styles.section}>
							<Text style={styles.sectionTitle}>Jejum por faixa etária:</Text>
							<View className="ml-2">
								<Text style={styles.item}>
									• <Text style={styles.bold}>0 a 1 ano:</Text> 3h ou intervalo
									entre mamadas.
								</Text>
								<Text style={styles.item}>
									• <Text style={styles.bold}>2 a 5 anos:</Text> 6h de jejum.
								</Text>
								<Text style={styles.item}>
									• <Text style={styles.bold}>Acima de 5 anos:</Text> 8h de
									jejum.
								</Text>
							</View>
						</View>

						{/* Outras Orientações */}
						<View style={styles.infoGrid}>
							<View style={styles.infoBox}>
								<MaterialCommunityIcons
									name="water"
									size={20}
									color="#00877C"
								/>
								<Text style={styles.infoText}>
									<Text style={styles.bold}>Água:</Text> Permitida (pouca qtde).
								</Text>
							</View>
							<View style={styles.infoBox}>
								<MaterialCommunityIcons name="run" size={20} color="#00877C" />
								<Text style={styles.infoText}>
									<Text style={styles.bold}>Exercícios:</Text> Evite antes da
									coleta.
								</Text>
							</View>
						</View>

						<View style={styles.footerNote}>
							<Text style={styles.noteText}>
								<MaterialCommunityIcons name="pill" size={14} color="#666" />{" "}
								Remédios: Mantenha o uso (salvo ordem médica).
							</Text>
							<Text style={styles.noteText}>
								<MaterialCommunityIcons
									name="flask-outline"
									size={14}
									color="#666"
								/>{" "}
								Urina/Fezes: Siga as orientações do setor.
							</Text>
						</View>
					</ScrollView>

					{/* Botão Entendi */}
					<TouchableOpacity style={styles.button} onPress={onClose}>
						<Text style={styles.buttonText}>ENTENDI</Text>
					</TouchableOpacity>
				</View>
			</View>
		</Modal>
	);
};

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.6)",
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
	},
	container: {
		backgroundColor: "white",
		borderRadius: 24,
		width: "100%",
		maxHeight: "80%",
		padding: 24,
		elevation: 10,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 5 },
		shadowOpacity: 0.3,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 15,
		borderBottomWidth: 1,
		borderBottomColor: "#EEE",
		paddingBottom: 10,
	},
	title: {
		fontSize: 20,
		color: "#191455",
		fontWeight: "bold",
		marginLeft: 10,
	},
	content: {
		marginBottom: 20,
	},
	intro: {
		fontSize: 14,
		color: "#444",
		lineHeight: 20,
		marginBottom: 15,
	},
	section: {
		backgroundColor: "#F8F9FA",
		padding: 15,
		borderRadius: 12,
		marginBottom: 15,
	},
	sectionTitle: {
		color: "#191455",
		fontWeight: "bold",
		marginBottom: 8,
	},
	item: {
		fontSize: 14,
		color: "#555",
		marginBottom: 4,
	},
	bold: {
		fontWeight: "bold",
	},
	infoGrid: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 15,
	},
	infoBox: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		paddingRight: 5,
	},
	infoText: {
		fontSize: 12,
		color: "#555",
		marginLeft: 5,
	},
	footerNote: {
		borderTopWidth: 1,
		borderTopColor: "#EEE",
		paddingTop: 10,
	},
	noteText: {
		fontSize: 12,
		color: "#666",
		marginBottom: 5,
		fontStyle: "italic",
	},
	button: {
		backgroundColor: "#00877C",
		borderRadius: 12,
		height: 50,
		justifyContent: "center",
		alignItems: "center",
	},
	buttonText: {
		color: "white",
		fontWeight: "bold",
		letterSpacing: 1,
	},
});

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export function Footer() {
	const router = useRouter();

	return (
		<View style={styles.footerWrapper}>
			{/* O FUNDO DO MENU */}
			<View style={styles.backgroundBar}>
				{/* Botão Telefones */}
				<TouchableOpacity
					style={styles.navButton}
					onPress={() => {
						console.log("Navegando...");
						router.navigate("/phones"); // Use navigate para testar
					}}
				>
					<Ionicons name="call" size={22} color="white" />
					<Text style={styles.navText}>Telefones</Text>
				</TouchableOpacity>

				{/* Espaço vazio para a logo não cobrir os textos */}
				<View style={{ width: 70 }} />

				{/* Botão Fale Conosco */}
				<TouchableOpacity
					style={styles.navButton}
					onPress={() => router.push("/faleconosco")}
				>
					<Ionicons name="mail" size={22} color="white" />
					<Text style={styles.navText}>Fale Conosco</Text>
				</TouchableOpacity>
			</View>

			{/* A LOGO (FORA DA BARRA PARA NÃO SER CORTADA) */}
			<TouchableOpacity
				onPress={() => router.replace("/")}
				activeOpacity={0.8}
				style={styles.centerButton}
			>
				<Image
					source={require("../../assets/images/icr.png")}
					style={styles.logo}
					resizeMode="contain"
				/>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	footerWrapper: {
		position: "absolute",
		bottom: 0,
		width: "100%",
		alignItems: "center",
		justifyContent: "flex-end",
		height: 100, // Altura maior para permitir que a logo suba
		backgroundColor: "transparent",
	},
	backgroundBar: {
		backgroundColor: "#191455",
		flexDirection: "row",
		justifyContent: "space-around",
		alignItems: "center",
		width: "100%",
		height: 65,
		paddingHorizontal: 10,
	},
	navButton: {
		alignItems: "center",
		justifyContent: "center",
		flex: 1,
	},
	navText: {
		color: "white",
		fontSize: 10,
		marginTop: 4,
		fontWeight: "600",
		textTransform: "uppercase",
	},
	centerButton: {
		position: "absolute",
		top: 0, // Posiciona no topo do wrapper (fazendo flutuar)
		backgroundColor: "white",
		width: 70,
		height: 70,
		borderRadius: 35,
		borderWidth: 4,
		borderColor: "#191455",
		justifyContent: "center",
		alignItems: "center",
		elevation: 10,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 5 },
		shadowOpacity: 0.3,
		shadowRadius: 5,
		zIndex: 999, // Garante que o clique funcione
	},
	logo: {
		width: 40,
		height: 40,
	},
});

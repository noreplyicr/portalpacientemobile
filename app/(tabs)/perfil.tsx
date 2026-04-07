import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import _ from "lodash";
import React, { useState } from "react";
import {
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

// Hooks e Contextos
import { useAuth } from "@/src/contexts/AuthContext";

// Componentes de UI
import { ConfirmModal } from "@/src/components/ConfirmModal"; // Ajuste o path conforme sua pasta
import { Footer } from "@/src/components/Footer";
import { PageHeader } from "@/src/components/PageHeader";

export default function Perfil() {
	const navigation = useNavigation<any>();
	const { user, signOut } = useAuth();
	const [modalConfirmSair, setModalConfirmSair] = useState(false);

	const handleSair = () => {
		setModalConfirmSair(false);
		if (signOut) signOut();
	};

	const navegarPara = (rota: string) => {
		navigation.navigate(rota);
	};

	// Componente interno para os itens da lista
	const MenuItem = ({
		icon,
		title,
		subtitle,
		onPress,
		isDestructive = false,
	}: any) => (
		<TouchableOpacity
			style={styles.menuItem}
			activeOpacity={0.7}
			onPress={onPress}
		>
			<View
				style={[
					styles.iconContainer,
					isDestructive && { backgroundColor: "#FFF5F5" },
				]}
			>
				<Ionicons
					name={icon}
					size={24}
					color={isDestructive ? "#D32F2F" : "#191455"}
				/>
			</View>
			<View style={styles.textContainer}>
				<Text style={[styles.itemTitle, isDestructive && { color: "#D32F2F" }]}>
					{title}
				</Text>
				<Text style={styles.itemSubtitle}>{subtitle}</Text>
			</View>
			<Ionicons name="chevron-forward" size={20} color="#CCC" />
		</TouchableOpacity>
	);

	return (
		<View style={{ flex: 1, backgroundColor: "#F8F9FA" }}>
			{/* PageHeader seguindo o padrão da tela de Declaração */}
			<PageHeader
				titulo="MEU PERFIL"
				subtitulo={user?.nome || "Configurações da conta"}
			/>

			<ScrollView
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.menuCard}>
					{/* E-MAIL */}
					<MenuItem
						icon="mail-outline"
						title="Emails"
						subtitle="Cadastre seus e-mails mais utilizados"
						onPress={() => navegarPara("email")}
					/>
					<View style={styles.separator} />

					{/* ENDEREÇO */}
					<MenuItem
						icon="location-outline"
						title="Endereço"
						subtitle="Mantenha seu endereço atualizado"
						onPress={() => navegarPara("endereco")}
					/>
					<View style={styles.separator} />

					{/* TELEFONES */}
					<MenuItem
						icon="call-outline"
						title="Telefones / Contatos"
						subtitle="Informe seus números de contato"
						onPress={() => navegarPara("telefone")}
					/>
					<View style={styles.separator} />

					{/* SENHA */}
					<MenuItem
						icon="lock-closed-outline"
						title="Senha"
						subtitle="Alterar Senha de Acesso"
						onPress={() => navegarPara("alterar-senha")}
					/>
					<View style={styles.separator} />

					{/* CPF */}
					<MenuItem
						icon="card-outline"
						title="CPF"
						subtitle={
							_(user?.cpf || "").size() === 11
								? user?.cpffinal
								: "Acesse o portal pelo CPF"
						}
						onPress={() => {
							navegarPara("cpf");
						}}
					/>
					<View style={styles.separator} />

					{/* SAIR */}
					<MenuItem
						icon="log-out-outline"
						title="Sair"
						subtitle="Sair do Portal?"
						isDestructive={true}
						onPress={() => setModalConfirmSair(true)}
					/>
				</View>
			</ScrollView>

			{/* Modal de confirmação de logoff */}
			<ConfirmModal
				visivel={modalConfirmSair}
				titulo="Sair do Portal"
				mensagem="Deseja sair do Portal?"
				onConfirm={handleSair}
				onCancel={() => setModalConfirmSair(false)}
			/>

			<Footer />
		</View>
	);
}

const styles = StyleSheet.create({
	scrollContent: {
		paddingTop: 20,
		paddingBottom: 120, // Espaço para o footer não cobrir o último item
	},
	menuCard: {
		backgroundColor: "white",
		// CORRIGIDO: de mx para marginHorizontal
		marginHorizontal: 20,
		borderRadius: 30,
		borderWidth: 1,
		borderColor: "#F1F5F9",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 15,
		elevation: 2,
		overflow: "hidden",
	},
	menuItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 18,
		paddingHorizontal: 20,
	},
	iconContainer: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: "#F0F2FF",
		justifyContent: "center",
		alignItems: "center",
	},
	textContainer: {
		flex: 1,
		marginLeft: 15,
	},
	itemTitle: {
		fontSize: 16,
		fontWeight: "bold",
		color: "#334155", // slate-700
	},
	itemSubtitle: {
		fontSize: 13,
		color: "#94A3B8", // slate-400
		marginTop: 2,
	},
	separator: {
		height: 1,
		backgroundColor: "#F1F5F9",
		marginLeft: 80,
		marginRight: 20,
	},
});

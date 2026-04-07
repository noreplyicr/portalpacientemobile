import { formatarCPF, maskCPF } from "@/src/utils/validacoes";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
	ActivityIndicator,
	Dimensions,
	FlatList,
	Keyboard,
	KeyboardAvoidingView,
	Platform,
	Modal as RNModal,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	TouchableWithoutFeedback,
	View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import * as z from "zod";

/* COMPONENTES CUSTOMIZADOS */
import { ConfirmModal } from "@/src/components/ConfirmModal";
import { DeleteButton } from "@/src/components/DeleteButton";
import { EmptyState } from "@/src/components/EmptyState";
import { Footer } from "@/src/components/Footer";
import { FormInput } from "@/src/components/FormInput";
import { PageHeader } from "@/src/components/PageHeader";
import { PrimaryButton } from "@/src/components/PrimaryButton";
import { StatusModal } from "@/src/components/StatusModal";
import { useAuth } from "@/src/contexts/AuthContext";
import { acompanhanteService } from "@/src/services/acompanhanteService";

const { width } = Dimensions.get("window");

interface IAcompanhante {
	id: number;
	nome: string;
	rg: string;
	cpf: string;
	nqrcode: string;
	nqrcoderefeitorio: string;
}

const schema = z.object({
	nome: z.string().min(1, "O nome é obrigatório"),
	rg: z.string().min(1, "O RG é obrigatório"),
	cpf: z.string().min(14, "CPF incompleto (000.000.000-00)"),
});

type FormData = z.infer<typeof schema>;

export default function Catraca() {
	const { user } = useAuth();
	const [loading, setLoading] = useState(false);
	const [loadingExcluir, setLoadingExcluir] = useState(false);
	const [dataSource, setDataSource] = useState<IAcompanhante[]>([]);
	const [menu, setMenu] = useState<any[]>([]);
	const [tipo, setTipo] = useState(0);
	const [modalCad, setModalCad] = useState(false);
	const [confirmVisible, setConfirmVisible] = useState(false);
	const [idParaExcluir, setIdParaExcluir] = useState<number | null>(null);

	const [modalAcesso, setModalAcesso] = useState({
		visible: false,
		nome: "",
		code: "",
	});
	const [modalRefeitorio, setModalRefeitorio] = useState({
		visible: false,
		nome: "",
		code: "",
	});
	const [statusConfig, setStatusConfig] = useState({
		visible: false,
		type: "success" as "success" | "error" | "info",
		title: "",
		message: "",
	});

	const {
		control,
		handleSubmit,
		reset,
		clearErrors,
		formState: { errors },
	} = useForm<FormData>({
		resolver: zodResolver(schema),
		defaultValues: { nome: "", rg: "", cpf: "" },
	});

	useEffect(() => {
		fetchMenu();
	}, []);
	useEffect(() => {
		fetchAcompanhantes();
	}, [tipo]);

	const fetchMenu = async () => {
		try {
			const data = await acompanhanteService.listarTipos();
			setMenu(data || []);
		} catch (e) {
			console.error(e);
		}
	};

	const fetchAcompanhantes = async () => {
		if (tipo === 0) return;
		setLoading(true);
		try {
			const resp = await acompanhanteService.listar(user?.id as any, tipo);
			setDataSource(Array.isArray(resp.data) ? resp.data : []);
		} finally {
			setLoading(false);
		}
	};

	const fecharModalCadastro = () => {
		Keyboard.dismiss();
		setTimeout(() => {
			setModalCad(false);
			reset();
			clearErrors();
		}, 100);
	};

	const onSave = async (data: FormData) => {
		Keyboard.dismiss();
		setLoading(true);
		try {
			const res = await acompanhanteService.salvar({
				paciente: { id: user?.id },
				id: 0,
				nome: data.nome.toUpperCase(),
				rg: data.rg.toUpperCase(),
				cpf: data.cpf.replace(/\D/g, ""),
				idtipoacomp: tipo,
				autorizado: 1,
			});

			if (res === "0") {
				setStatusConfig({
					visible: true,
					type: "error",
					title: "Atenção",
					message: "Acompanhante já cadastrado.",
				});
			} else {
				fecharModalCadastro();
				fetchAcompanhantes();
			}
		} catch (e) {
			setStatusConfig({
				visible: true,
				type: "error",
				title: "Erro",
				message: "Erro ao realizar cadastro.",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleConfirmExcluir = async () => {
		if (!idParaExcluir) return;
		setConfirmVisible(false);
		setLoadingExcluir(true);
		try {
			await acompanhanteService.excluir(idParaExcluir);
			fetchAcompanhantes();
		} finally {
			setLoadingExcluir(false);
			setIdParaExcluir(null);
		}
	};

	return (
		<View style={{ flex: 1, backgroundColor: "#F8F9FA" }}>
			<PageHeader titulo="CATRACA" />

			{/* Menu de Filtros */}
			<View style={{ height: 60, marginVertical: 10 }}>
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={{ paddingHorizontal: 15 }}
				>
					<TouchableOpacity
						onPress={() => setTipo(0)}
						style={[styles.filterTab, tipo === 0 && styles.activeTab]}
					>
						<Text style={[styles.filterText, tipo === 0 && styles.activeText]}>
							PACIENTE
						</Text>
					</TouchableOpacity>
					{menu.map((m: any) => (
						<TouchableOpacity
							key={m.ID_TPACOM}
							onPress={() => setTipo(m.ID_TPACOM)}
							style={[
								styles.filterTab,
								tipo === m.ID_TPACOM && styles.activeTab,
							]}
						>
							<Text
								style={[
									styles.filterText,
									tipo === m.ID_TPACOM && styles.activeText,
								]}
							>
								{m.DESCRICAO}
							</Text>
						</TouchableOpacity>
					))}
				</ScrollView>
			</View>

			<View style={{ flex: 1 }}>
				{tipo === 0 ? (
					<View style={styles.pacienteContainer}>
						<View style={styles.qrContainerLocal}>
							<QRCode
								value={String(user?.id || "0")}
								size={width * 0.55}
								color="#191455"
							/>
						</View>
						<Text style={styles.pacienteNome}>{user?.nome}</Text>
						<Text style={styles.pacienteCod}>CÓDIGO: {user?.id}</Text>
					</View>
				) : (
					<FlatList
						data={dataSource}
						keyExtractor={(item) => String(item.id)}
						renderItem={({ item }) => (
							<View style={styles.card}>
								<View style={styles.buttonGroup}>
									<TouchableOpacity
										onPress={() =>
											setModalAcesso({
												visible: true,
												nome: item.nome,
												code: item.nqrcode,
											})
										}
										style={[styles.miniBtn, { backgroundColor: "#F0FDFA" }]}
									>
										<MaterialCommunityIcons
											name="door-open"
											size={22}
											color="#00877C"
										/>
									</TouchableOpacity>
									<TouchableOpacity
										onPress={() =>
											setModalRefeitorio({
												visible: true,
												nome: item.nome,
												code: item.nqrcoderefeitorio,
											})
										}
										style={[styles.miniBtn, { backgroundColor: "#F0F9FF" }]}
									>
										<MaterialCommunityIcons
											name="silverware-fork-knife"
											size={22}
											color="#0284C7"
										/>
									</TouchableOpacity>
								</View>
								<View style={{ flex: 1 }}>
									<Text style={styles.nameText}>{item.nome}</Text>
									<Text style={styles.infoText}>
										CPF: {formatarCPF(item.cpf)}
									</Text>
									<Text style={styles.infoText}>RG: {item.rg}</Text>
								</View>
								{tipo !== 1 && tipo !== 2 && (
									<DeleteButton
										loading={loadingExcluir && idParaExcluir === item.id}
										onPress={() => {
											setIdParaExcluir(item.id);
											setConfirmVisible(true);
										}}
									/>
								)}
							</View>
						)}
						ListEmptyComponent={
							loading ? (
								<ActivityIndicator
									size="large"
									color="#00877C"
									style={{ marginTop: 50 }}
								/>
							) : (
								<EmptyState
									titulo="Vazio"
									mensagem="Toque no + para adicionar"
								/>
							)
						}
					/>
				)}
			</View>

			{tipo !== 0 && (
				<TouchableOpacity
					onPress={() => {
						reset();
						clearErrors();
						setModalCad(true);
					}}
					style={styles.fab}
				>
					<MaterialCommunityIcons name="plus" size={35} color="white" />
				</TouchableOpacity>
			)}

			{/* --- MODAL CADASTRO COM "EMPURRÃO" DO TECLADO --- */}
			<RNModal
				visible={modalCad}
				transparent
				animationType="slide"
				onRequestClose={fecharModalCadastro}
			>
				<KeyboardAvoidingView
					behavior={Platform.OS === "ios" ? "padding" : undefined}
					style={{ flex: 1 }}
					keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
				>
					<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
						<View style={styles.modalOverlayCenter}>
							<View style={styles.modalContentForm}>
								<ScrollView
									style={{ width: "100%" }}
									contentContainerStyle={{ alignItems: "center" }}
									showsVerticalScrollIndicator={false}
									keyboardShouldPersistTaps="handled"
								>
									<Text style={styles.modalFormTitle}>Novo Acompanhante</Text>

									<FormInput
										name="nome"
										control={control}
										error={errors.nome}
										placeholder="Nome Completo"
										autoCapitalize="words"
										iconName="user-o"
									/>
									<FormInput
										name="rg"
										control={control}
										error={errors.rg}
										placeholder="RG"
										autoCapitalize="characters"
										iconName="vcard-o"
									/>
									<FormInput
										name="cpf"
										control={control}
										error={errors.cpf}
										placeholder="000.000.000-00"
										keyboardType="numeric"
										maxLength={14}
										iconName="id-card-o"
										onChangeText={(t) => maskCPF(t)}
									/>

									<View style={{ width: "100%", marginTop: 10 }}>
										<PrimaryButton
											title="Salvar Registro"
											loading={loading}
											onPress={handleSubmit(onSave)}
										/>
									</View>

									<TouchableOpacity
										onPress={fecharModalCadastro}
										style={{ marginTop: 20, padding: 10, marginBottom: 10 }}
									>
										<Text style={{ color: "#94A3B8", fontWeight: "600" }}>
											CANCELAR
										</Text>
									</TouchableOpacity>
								</ScrollView>
							</View>
						</View>
					</TouchableWithoutFeedback>
				</KeyboardAvoidingView>
			</RNModal>

			{/* MODAIS DE QR CODE (Simples, sem KeyboardAvoidingView necessário) */}
			<RNModal visible={modalAcesso.visible} transparent animationType="fade">
				<View style={styles.modalOverlay}>
					<View style={styles.modalContentQR}>
						<Text style={styles.modalTag}>ACESSO PORTARIA</Text>
						<Text style={styles.modalUser}>{modalAcesso.nome}</Text>
						<View style={styles.qrWrapper}>
							<QRCode
								value={modalAcesso.code || "0"}
								size={220}
								color="#191455"
							/>
						</View>
						<TouchableOpacity
							onPress={() => setModalAcesso((p) => ({ ...p, visible: false }))}
							style={styles.closeBtn}
						>
							<Text style={styles.closeBtnText}>FECHAR</Text>
						</TouchableOpacity>
					</View>
				</View>
			</RNModal>

			<RNModal
				visible={modalRefeitorio.visible}
				transparent
				animationType="fade"
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContentQR}>
						<Text style={[styles.modalTag, { color: "#0284C7" }]}>
							REFEITÓRIO
						</Text>
						<Text style={styles.modalUser}>{modalRefeitorio.nome}</Text>
						<View style={styles.qrWrapper}>
							<QRCode
								value={modalRefeitorio.code || "0"}
								size={220}
								color="#0284C7"
							/>
						</View>
						<TouchableOpacity
							onPress={() =>
								setModalRefeitorio((p) => ({ ...p, visible: false }))
							}
							style={[styles.closeBtn, { backgroundColor: "#0284C7" }]}
						>
							<Text style={styles.closeBtnText}>FECHAR</Text>
						</TouchableOpacity>
					</View>
				</View>
			</RNModal>

			<ConfirmModal
				visivel={confirmVisible}
				titulo="Remover"
				mensagem="Deseja remover este acompanhante?"
				onConfirm={handleConfirmExcluir}
				onCancel={() => setConfirmVisible(false)}
			/>
			<StatusModal
				config={statusConfig}
				onClose={() => setStatusConfig((p) => ({ ...p, visible: false }))}
			/>
			<Footer />
		</View>
	);
}

const styles = StyleSheet.create({
	filterTab: {
		backgroundColor: "white",
		paddingHorizontal: 20,
		borderRadius: 25,
		justifyContent: "center",
		marginRight: 10,
		borderWidth: 1,
		borderColor: "#E5E7EB",
		height: 45,
	},
	activeTab: { backgroundColor: "#00877C", borderColor: "#00877C" },
	filterText: { color: "#4B5563", fontWeight: "bold" },
	activeText: { color: "white" },
	pacienteContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	qrContainerLocal: {
		padding: 20,
		backgroundColor: "white",
		borderRadius: 25,
		elevation: 5,
	},
	pacienteNome: {
		fontWeight: "bold",
		fontSize: 18,
		marginTop: 20,
		color: "#191455",
		textAlign: "center",
	},
	pacienteCod: { color: "#64748B", fontSize: 13 },
	card: {
		backgroundColor: "white",
		marginHorizontal: 15,
		marginBottom: 10,
		padding: 15,
		borderRadius: 15,
		flexDirection: "row",
		alignItems: "center",
		elevation: 2,
	},
	buttonGroup: { flexDirection: "row", gap: 8, marginRight: 12 },
	miniBtn: {
		width: 42,
		height: 42,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
	},
	nameText: { fontWeight: "bold", color: "#191455", fontSize: 15 },
	infoText: { color: "#6B7280", fontSize: 12 },
	fab: {
		position: "absolute",
		bottom: 100,
		right: 20,
		backgroundColor: "#00877C",
		width: 60,
		height: 60,
		borderRadius: 30,
		alignItems: "center",
		justifyContent: "center",
		elevation: 5,
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.7)",
		justifyContent: "center",
		alignItems: "center",
	},
	modalOverlayCenter: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.5)",
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 20,
	},
	modalContentForm: {
		backgroundColor: "white",
		borderRadius: 30,
		padding: 25,
		width: "100%",
		alignItems: "center",
		elevation: 10,
	},
	modalFormTitle: {
		fontSize: 20,
		fontWeight: "bold",
		color: "#191455",
		marginBottom: 20,
	},
	saveBtn: {
		backgroundColor: "#00877C",
		padding: 18,
		borderRadius: 15,
		alignItems: "center",
		width: "100%",
		marginTop: 15,
	},
	saveBtnText: { color: "white", fontWeight: "bold", fontSize: 16 },
	modalContentQR: {
		backgroundColor: "white",
		padding: 30,
		borderRadius: 30,
		width: "85%",
		alignItems: "center",
	},
	modalTag: { fontWeight: "bold", fontSize: 12, color: "#00877C" },
	modalUser: {
		fontWeight: "bold",
		fontSize: 18,
		color: "#191455",
		marginVertical: 10,
		textAlign: "center",
	},
	qrWrapper: { padding: 10, backgroundColor: "white" },
	closeBtn: {
		marginTop: 30,
		backgroundColor: "#191455",
		padding: 15,
		borderRadius: 15,
		width: "100%",
		alignItems: "center",
	},
	closeBtnText: { color: "white", fontWeight: "bold" },
});

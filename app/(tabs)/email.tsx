import { MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	Keyboard,
	KeyboardAvoidingView,
	Modal,
	Platform,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

// Componentes do projeto
import { ConfirmModal } from "@/src/components/ConfirmModal";
import { DeleteButton } from "@/src/components/DeleteButton";
import { Footer } from "@/src/components/Footer";
import { FormInput } from "@/src/components/FormInput";
import { PageHeader } from "@/src/components/PageHeader";
import { StatusModal } from "@/src/components/StatusModal";

// Contextos e Services
import { useAuth } from "@/src/contexts/AuthContext";
import { emailService } from "@/src/services/emailService";

// Validação
import { PrimaryButton } from "@/src/components/PrimaryButton";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

const emailSchema = z
	.object({
		email: z.string().email("E-mail inválido").min(1, "O e-mail é obrigatório"),
		confirmMail: z.string().min(1, "Confirme o e-mail"),
	})
	.refine((data) => data.email === data.confirmMail, {
		message: "Os e-emails não coincidem",
		path: ["confirmMail"],
	});

type EmailFormData = z.infer<typeof emailSchema>;

export default function Emails() {
	const { user } = useAuth();
	const [emails, setEmails] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [keyboardHeight, setKeyboardHeight] = useState(0);

	const [confirmVisible, setConfirmVisible] = useState(false);
	const [idParaExcluir, setIdParaExcluir] = useState<number | null>(null);

	const [modalConfig, setModalConfig] = useState<{
		visible: boolean;
		type: "success" | "error";
		title: string;
		message: string;
	}>({ visible: false, type: "success", title: "", message: "" });

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<EmailFormData>({
		resolver: zodResolver(emailSchema),
		defaultValues: { email: "", confirmMail: "" },
	});

	useEffect(() => {
		const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
			setKeyboardHeight(e.endCoordinates.height);
		});
		const hideSub = Keyboard.addListener("keyboardDidHide", () => {
			setKeyboardHeight(0);
		});

		fetchEmails();

		return () => {
			showSub.remove();
			hideSub.remove();
		};
	}, []);

	const fetchEmails = async () => {
		if (!user) return;
		setLoading(true);
		try {
			const data = await emailService.getEmails(user.id);
			setEmails(data);
		} catch (error) {
			setModalConfig({
				visible: true,
				type: "error",
				title: "Erro",
				message: "Falha ao carregar lista de e-mails.",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleOpenConfirm = (id: number) => {
		if (emails.length <= 1) {
			setModalConfig({
				visible: true,
				type: "error",
				title: "Atenção",
				message: "Você não pode remover o único e-mail cadastrado.",
			});
			return;
		}
		setIdParaExcluir(id);
		setConfirmVisible(true);
	};

	const confirmDelete = async () => {
		if (!idParaExcluir) return;
		setConfirmVisible(false);
		setLoading(true);
		try {
			await emailService.deleteEmail(idParaExcluir);
			await fetchEmails();
		} catch (e) {
			setModalConfig({
				visible: true,
				type: "error",
				title: "Erro",
				message: "Erro ao excluir e-mail.",
			});
		} finally {
			setLoading(false);
			setIdParaExcluir(null);
		}
	};

	const handleSaveEmail = async (data: EmailFormData) => {
		if (!user) return;
		setLoading(true);
		try {
			const result = await emailService.saveEmail(user.id, data.email);
			if (!String(result).includes("ERRO")) {
				setModalConfig({
					visible: true,
					type: "success",
					title: "Sucesso",
					message: "E-mail cadastrado com sucesso!",
				});
				setIsModalVisible(false);
				reset();
				fetchEmails();
			} else {
				setModalConfig({
					visible: true,
					type: "error",
					title: "Erro",
					message: String(result),
				});
			}
		} catch (error) {
			setModalConfig({
				visible: true,
				type: "error",
				title: "Erro",
				message: "Erro na conexão com o servidor.",
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<View className="flex-1 bg-[#F8F9FA]">
			<PageHeader titulo="EMAILS" subtitulo="E-mails cadastrados" />

			{loading && !confirmVisible && !isModalVisible && (
				<ActivityIndicator color="#00877C" className="my-4" />
			)}

			<FlatList
				data={emails}
				keyExtractor={(item) => String(item.id)}
				contentContainerStyle={{ padding: 20, paddingBottom: 130 }}
				renderItem={({ item }) => (
					<View className="flex-row items-center bg-white p-4 mb-3 rounded-2xl shadow-sm border border-gray-100">
						<View className="bg-teal-50 p-2 rounded-full mr-3">
							<MaterialIcons name="email" size={20} color="#00877C" />
						</View>
						<Text className="flex-1 font-medium text-gray-700">
							{item.descricao}
						</Text>
						<DeleteButton
							onPress={() => handleOpenConfirm(item.id)}
							loading={loading && idParaExcluir === item.id}
							disabled={loading}
						/>
					</View>
				)}
			/>

			<TouchableOpacity
				onPress={() => {
					reset();
					setIsModalVisible(true);
				}}
				className="absolute bottom-28 right-6 w-16 h-16 bg-[#00877C] rounded-full items-center justify-center shadow-xl z-50"
			>
				<MaterialIcons name="add" size={32} color="white" />
			</TouchableOpacity>

			<Modal visible={isModalVisible} animationType="slide" transparent={true}>
				<KeyboardAvoidingView
					behavior={Platform.OS === "ios" ? "padding" : undefined}
					className="flex-1"
				>
					<View className="flex-1 justify-end bg-black/50">
						<View className="bg-white rounded-t-[35px] p-6 pb-10">
							<View className="flex-row justify-between items-center mb-6">
								<Text className="text-xl font-bold text-gray-800">
									Novo E-mail
								</Text>
								<TouchableOpacity onPress={() => setIsModalVisible(false)}>
									<MaterialIcons name="close" size={28} color="#999" />
								</TouchableOpacity>
							</View>

							<ScrollView
								showsVerticalScrollIndicator={false}
								keyboardShouldPersistTaps="handled"
								contentContainerStyle={{
									paddingBottom: keyboardHeight > 0 ? keyboardHeight : 20,
								}}
							>
								<FormInput
									name="email"
									control={control as any}
									error={errors.email}
									placeholder="exemplo@email.com"
									keyboardType="email-address"
									autoCapitalize="none"
									iconName="envelope-o"
									label="E-mail"
								/>

								<FormInput
									name="confirmMail"
									control={control as any}
									error={errors.confirmMail}
									placeholder="repita o e-mail"
									keyboardType="email-address"
									autoCapitalize="none"
									iconName="check-square-o"
									label="Confirme o e-mail"
								/>

								<PrimaryButton
									onPress={handleSubmit(handleSaveEmail)}
									title="Cadastrar E-mail"
									loading={loading}
									iconName="chevron-right"
								/>
							</ScrollView>
						</View>
					</View>
				</KeyboardAvoidingView>
			</Modal>

			<ConfirmModal
				visivel={confirmVisible}
				titulo="Remover E-mail"
				mensagem="Tem certeza que deseja excluir este e-mail da sua lista?"
				textoConfirmar="Sim, excluir"
				onConfirm={confirmDelete}
				onCancel={() => setConfirmVisible(false)}
			/>

			<StatusModal
				config={modalConfig}
				onClose={() => setModalConfig({ ...modalConfig, visible: false })}
			/>
			<Footer />
		</View>
	);
}

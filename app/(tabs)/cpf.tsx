import { MaterialCommunityIcons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import {
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	Text,
	View,
} from "react-native";
import * as z from "zod";

import { FormInput } from "@/src/components/FormInput";
import { LinkButton } from "@/src/components/LinkButton";
import { PageHeader } from "@/src/components/PageHeader";
import { PrimaryButton } from "@/src/components/PrimaryButton";
import { StatusModal } from "@/src/components/StatusModal";
import { useAuth } from "@/src/contexts/AuthContext";
import { updatePatientCpf } from "@/src/services/patientService";

// Validação com Zod
const schema = z.object({
	cpf: z.string().min(11, "O CPF DEVE TER 11 DÍGITOS").max(14, "CPF INVÁLIDO"),
});

type FormData = z.infer<typeof schema>;

export default function CadastrarCpf() {
	const router = useRouter();
	const { user, updateUser } = useAuth();
	const [loading, setLoading] = useState(false);

	const [modalConfig, setModalConfig] = useState<{
		visible: boolean;
		type: "success" | "error";
		title: string;
		message: string;
	}>({ visible: false, type: "success", title: "", message: "" });

	const {
		control,
		handleSubmit,
		formState: { errors },
	} = useForm<FormData>({
		resolver: zodResolver(schema),
		defaultValues: { cpf: user?.cpffinal || "" },
	});

	const handleSave = async (data: FormData) => {
		if (!user?.id) return;
		setLoading(true);

		try {
			// Chama o service (mesma lógica do Alterar Senha)
			const resposta = await updatePatientCpf(user.id, data.cpf);

			// Se o service não lançou erro, atualizamos o contexto e mostramos sucesso
			await updateUser({ cpffinal: data.cpf });

			setModalConfig({
				visible: true,
				type: "success",
				title: "Sucesso!",
				message: "Seu CPF foi vinculado à sua conta com sucesso.",
			});

			setTimeout(() => {
				setModalConfig((p) => ({ ...p, visible: false }));
				router.back(); // Volta para a tela anterior
			}, 2000);
		} catch (e: any) {
			setModalConfig({
				visible: true,
				type: "error",
				title: "Erro",
				message: e.message || "Não foi possível cadastrar o CPF.",
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			className="flex-1 bg-[#F8F9FA]"
		>
			<PageHeader titulo="IDENTIFICAÇÃO" subtitulo="Cadastro de CPF" />

			{/* --- BANNER DE INFORMAÇÃO (IGUAL AO ALTERAR SENHA) --- */}
			<View className="bg-blue-50 p-4 flex-row items-center border-b border-blue-100 shadow-sm">
				<View className="bg-blue-100 p-2 rounded-full">
					<MaterialCommunityIcons
						name="card-account-details-outline"
						size={24}
						color="#2563EB"
					/>
				</View>
				<View className="ml-3 flex-1">
					<Text className="text-[13px] font-bold text-blue-900 leading-tight">
						ACESSO AO PORTAL
					</Text>
					<Text className="text-[11px] text-blue-800">
						O CPF cadastrado poderá ser utilizado como login para acessar seus
						resultados e exames no portal oficial.
					</Text>
				</View>
			</View>

			<ScrollView
				contentContainerStyle={{ padding: 20, flexGrow: 1 }}
				keyboardShouldPersistTaps="handled"
			>
				<View className="bg-white p-6 rounded-[35px] shadow-sm border border-gray-100">
					<FormInput
						name="cpf"
						control={control as any}
						error={errors.cpf}
						placeholder="000.000.000-00"
						iconName="vcard-o"
						label="Número do CPF"
						keyboardType="numeric"
						maxLength={14}
					/>

					<View className="mt-8">
						<PrimaryButton
							title={user?.cpffinal ? "ATUALIZAR CPF" : "CADASTRAR MEU CPF"}
							loading={loading}
							onPress={handleSubmit(handleSave)}
						/>

						<LinkButton
							label="Voltar"
							onPress={() => router.back()}
							className="mt-4"
						/>
					</View>
				</View>
			</ScrollView>

			<StatusModal
				visible={modalConfig.visible}
				type={modalConfig.type}
				title={modalConfig.title}
				message={modalConfig.message}
				onClose={() => setModalConfig((p) => ({ ...p, visible: false }))}
			/>
		</KeyboardAvoidingView>
	);
}

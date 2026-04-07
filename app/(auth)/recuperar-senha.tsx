import { MaterialCommunityIcons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { Stack, useRouter } from "expo-router";
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

import { FormInput } from "@/src/components/FormInput"; // Usando o seu componente original
import { PageHeader } from "@/src/components/PageHeader";
import { PrimaryButton } from "@/src/components/PrimaryButton";
import { StatusModal } from "../../src/components/StatusModal";
import { faqService } from "../../src/services/faqService";

const recuperarSenhaSchema = z.object({
	identificador: z
		.string()
		.min(1, "O campo é obrigatório")
		.min(4, "Informe uma matrícula ou CPF válido"),
});

type RecuperarSenhaData = z.infer<typeof recuperarSenhaSchema>;

export default function RecuperarSenhaScreen() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);

	const [modalVisible, setModalVisible] = useState(false);
	const [modalConfig, setModalConfig] = useState<{
		type: "success" | "error";
		title: string;
		message: string;
	}>({ type: "success", title: "", message: "" });

	const {
		control,
		handleSubmit,
		formState: { errors },
	} = useForm<RecuperarSenhaData>({
		resolver: zodResolver(recuperarSenhaSchema),
		defaultValues: { identificador: "" },
	});

	const onSubmit = async (data: RecuperarSenhaData) => {
		setLoading(true);
		try {
			const response = await faqService.resetSenha(data.identificador);

			if (response === "PACIENTE NÃO ENCONTRADO") {
				setModalConfig({
					type: "error",
					title: "Ops! Não encontrado",
					message:
						"A matrícula ou CPF informado não consta em nossa base de dados.",
				});
				setModalVisible(true);
				return;
			}

			let emailDestino = "seu e-mail cadastrado";
			if (response && response.includes("Enviada para:")) {
				emailDestino = response.split(":")[1].toLowerCase();
			}

			setModalConfig({
				type: "success",
				title: "Senha Enviada!",
				message: `Uma nova senha foi gerada e enviada para:\n${emailDestino}`,
			});
			setModalVisible(true);
		} catch (err) {
			setModalConfig({
				type: "error",
				title: "Erro de Conexão",
				message: "Verifique sua internet e tente novamente em instantes.",
			});
			setModalVisible(true);
		} finally {
			setLoading(false);
		}
	};

	return (
		<View className="flex-1 bg-[#F8F9FA]">
			<Stack.Screen options={{ headerShown: false }} />
			<PageHeader titulo="RECUPERAR SENHA" showBackButton />

			<StatusModal
				visible={modalVisible}
				type={modalConfig.type}
				title={modalConfig.title}
				message={modalConfig.message}
				onClose={() => {
					setModalVisible(false);
					if (modalConfig.type === "success") router.back();
				}}
			/>

			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				className="flex-1"
			>
				<ScrollView
					bounces={false}
					keyboardShouldPersistTaps="handled"
					contentContainerStyle={{ flexGrow: 1 }}
				>
					<View className="bg-amber-50 p-4 flex-row items-center border-b border-amber-100">
						<MaterialCommunityIcons
							name="lock-reset"
							size={20}
							color="#B45309"
						/>
						<Text className="ml-3 flex-1 text-[12px] font-hcf-bold text-amber-900 uppercase">
							Digite sua Matrícula ou CPF para resetar sua senha.
						</Text>
					</View>

					<View className="flex-1 px-6 py-10">
						<View className="bg-white rounded-[32px] p-8 shadow-xl shadow-black/5 border border-gray-100 w-full">
							<View className="items-center mb-8">
								<View className="bg-teal-50 w-20 h-20 rounded-full items-center justify-center">
									<MaterialCommunityIcons
										name="key-variant"
										size={42}
										color="#00877C"
									/>
								</View>
								<Text className="text-[#191455] font-hcf-bold text-xl mt-4 text-center">
									Recuperação de Senha
								</Text>
							</View>

							{/* Voltei para a sua forma original de chamar o FormInput */}
							<FormInput
								name="identificador"
								control={control}
								error={errors.identificador}
								placeholder="Matrícula ou CPF"
								iconName="user-o" // Mantive seu ícone original
								keyboardType="numeric"
							/>

							<PrimaryButton
								title="Solicitar Nova Senha"
								loading={loading}
								onPress={handleSubmit(onSubmit)}
								iconName="chevron-right"
							/>
						</View>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</View>
	);
}

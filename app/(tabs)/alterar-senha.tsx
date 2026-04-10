import { MaterialCommunityIcons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFocusEffect, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import {
	BackHandler,
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
import { senhaService } from "@/src/services/senhaService";

export default function AlterarSenha() {
	const router = useRouter();
	const { user, updateUser } = useAuth();
	const [loading, setLoading] = useState(false);

	const [typeField0, setTypeField0] = useState(true);
	const [typeField1, setTypeField1] = useState(true);
	const [typeField2, setTypeField2] = useState(true);

	// Garantindo que a comparação seja numérica ou string segura
	const isPrimeiroAcesso = Number(user?.primeiroacesso) === 0;

	const schema = z
		.object({
			senhatual: isPrimeiroAcesso
				? z.string().optional()
				: z.string().min(1, "SENHA ATUAL OBRIGATÓRIA"),
			senha: z
				.string()
				.min(8, "MÍNIMO 8 CARACTERES")
				.max(20, "MÁXIMO 20 CARACTERES"),
			confirmasenha: z.string().min(1, "CONFIRME A SENHA"),
		})
		.refine((data) => data.senha === data.confirmasenha, {
			message: "AS SENHAS NÃO COINCIDEM",
			path: ["confirmasenha"],
		});

	type FormData = z.infer<typeof schema>;

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
	} = useForm<FormData>({
		resolver: zodResolver(schema),
		defaultValues: { senhatual: "", senha: "", confirmasenha: "" },
	});

	useFocusEffect(
		useCallback(() => {
			const onBackPress = () => {
				if (isPrimeiroAcesso) return true;
				return false;
			};
			const subscription = BackHandler.addEventListener(
				"hardwareBackPress",
				onBackPress,
			);
			return () => subscription.remove();
		}, [isPrimeiroAcesso]),
	);

	const handleSave = async (data: FormData) => {
		if (!user?.id) return;
		setLoading(true);

		try {
			let resposta: any = null;

			if (isPrimeiroAcesso) {
				resposta = await senhaService.alterarPrimeiroAcesso(
					user.id,
					data.senha,
				);
			} else {
				resposta = await senhaService.alterarComConfirmacao(
					user.id,
					data.senhatual || "",
					data.senha,
				);
			}

			const resString = String(
				resposta?.message || resposta || "",
			).toUpperCase();

			const isSucesso =
				resString.includes("SUCESSO") ||
				resString.includes("SENHA ALTERADA") ||
				resposta?.status === "success";

			if (isSucesso) {
				if (Platform.OS !== "web") {
					await SecureStore.setItemAsync("hcfm_bio_pass", data.senha);
				}

				await updateUser({ primeiroacesso: 1 });

				setModalConfig({
					visible: true,
					type: "success",
					title: "Senha Atualizada!",
					message: isPrimeiroAcesso
						? "Sua senha definitiva foi criada. Agora você tem acesso total ao Portal!"
						: "Sua senha foi alterada com sucesso.",
				});

				reset();

				setTimeout(() => {
					setModalConfig((p) => ({ ...p, visible: false }));
					router.replace("/(tabs)");
				}, 2500);
			} else {
				throw new Error(resposta?.message || "Erro ao atualizar senha.");
			}
		} catch (e: any) {
			setModalConfig({
				visible: true,
				type: "error",
				title: "Erro",
				message: e.message || "Não foi possível alterar a senha.",
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
			<PageHeader
				titulo={isPrimeiroAcesso ? "BEM-VINDO" : "SEGURANÇA"}
				subtitulo={
					isPrimeiroAcesso
						? "Finalize sua configuração"
						: "Altere sua senha de acesso"
				}
			/>

			{/* --- BANNER DE BOAS VINDAS (EXCLUSIVO PRIMEIRO ACESSO) --- */}
			{isPrimeiroAcesso && (
				<View className="bg-teal-50 p-4 flex-row items-center border-b border-teal-100 shadow-sm">
					<View className="bg-teal-100 p-2 rounded-full">
						<MaterialCommunityIcons
							name="shield-check"
							size={24}
							color="#00877C"
						/>
					</View>
					<View className="ml-3 flex-1">
						<Text className="text-[13px] font-hcf-bold text-teal-900 leading-tight">
							ESTAMOS QUASE LÁ!
						</Text>
						<Text className="text-[11px] font-hcf-regular text-teal-800">
							Para sua segurança, crie uma senha pessoal de 8 dígitos para
							substituir a senha temporária enviada por e-mail.
						</Text>
					</View>
				</View>
			)}

			<ScrollView
				contentContainerStyle={{ padding: 20, flexGrow: 1 }}
				keyboardShouldPersistTaps="handled"
			>
				<View className="bg-white p-6 rounded-[35px] shadow-sm border border-gray-100">
					{!isPrimeiroAcesso && (
						<FormInput
							name="senhatual"
							control={control as any}
							error={errors.senhatual}
							placeholder="Sua senha atual"
							iconName="lock"
							label="Senha Atual"
							secureTextEntry={typeField0}
							onIconPress={() => setTypeField0(!typeField0)}
							rightIcon={typeField0 ? "eye-slash" : "eye"}
							maxLength={8}
						/>
					)}

					<FormInput
						name="senha"
						control={control as any}
						error={errors.senha}
						placeholder="Crie sua nova senha"
						iconName="key"
						label="Nova Senha"
						secureTextEntry={typeField1}
						onIconPress={() => setTypeField1(!typeField1)}
						rightIcon={typeField1 ? "eye-slash" : "eye"}
						maxLength={8}
					/>

					<FormInput
						name="confirmasenha"
						control={control as any}
						error={errors.confirmasenha}
						placeholder="Confirme a nova senha"
						iconName="check"
						label="Confirme a Nova Senha"
						secureTextEntry={typeField2}
						onIconPress={() => setTypeField2(!typeField2)}
						rightIcon={typeField2 ? "eye-slash" : "eye"}
						maxLength={8}
					/>

					<View className="mt-8">
						<PrimaryButton
							title={
								isPrimeiroAcesso ? "CRIAR MINHA SENHA" : "SALVAR NOVA SENHA"
							}
							loading={loading}
							onPress={handleSubmit(handleSave)}
						/>

						{!isPrimeiroAcesso && (
							<LinkButton
								label="Cancelar e Voltar"
								onPress={() => router.back()}
								className="mt-4"
							/>
						)}
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

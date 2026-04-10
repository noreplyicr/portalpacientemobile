import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as z from "zod";

// Imports de Autenticação e Serviços
import { useAuth } from "../../src/contexts/AuthContext";
import { mailService } from "../../src/services/mailService";

// Componentes
import { Footer } from "@/src/components/Footer";
import { FormInput } from "@/src/components/FormInput";
import { FormSelect } from "@/src/components/FormSelect";
import { PageHeader } from "@/src/components/PageHeader";
import { PrimaryButton } from "@/src/components/PrimaryButton";
import { StatusModal } from "@/src/components/StatusModal";

const schema = z.object({
	matricula: z.string().min(1, "Matrícula é obrigatória"),
	nome: z.string().min(3, "Nome muito curto"),
	email: z.string().email("E-mail inválido"),
	motivo: z.string().min(1, "Selecione um motivo"),
	mensagem: z.string().min(10, "A mensagem deve ter pelo menos 10 caracteres"),
});

type FormData = z.infer<typeof schema>;

export default function FaleConosco() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { isAuthenticated } = useAuth();

	const [loading, setLoading] = useState(false);
	const [modalConfig, setModalConfig] = useState<{
		visible: boolean;
		type: "success" | "error";
		title: string;
		message: string;
	}>({
		visible: false,
		type: "success",
		title: "",
		message: "",
	});

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<FormData>({
		resolver: zodResolver(schema),
		defaultValues: {
			matricula: "",
			nome: "",
			email: "",
			motivo: "",
			mensagem: "",
		},
	});

	const onSubmit = async (data: FormData) => {
		setLoading(true);
		try {
			await mailService.sendContactEmail(data);
			setModalConfig({
				visible: true,
				type: "success",
				title: "Enviado!",
				message:
					"Sua mensagem foi entregue com sucesso. Em breve entraremos em contato.",
			});
			reset();
		} catch (error: any) {
			setModalConfig({
				visible: true,
				type: "error",
				title: "Erro no envio",
				message:
					error.message ||
					"Falha ao enviar e-mail. Tente novamente mais tarde.",
			});
		} finally {
			setLoading(false);
		}
	};

	const motivos = [
		{ label: "SUGESTÕES", value: "SUGESTOES" },
		{ label: "PROBLEMAS COM SENHA", value: "PROBLEMAS COM SENHA" },
		{ label: "ELOGIOS", value: "ELOGIOS" },
		{ label: "OUVIDORIA", value: "OUVIDORIA" },
		{ label: "DÚVIDAS", value: "DUVIDAS" },
		{ label: "OUTROS", value: "OUTROS" },
	];

	return (
		<View style={{ flex: 1, backgroundColor: "#F8F9FA" }}>
			<PageHeader
				titulo="FALE CONOSCO"
				subtitulo="Assunto relativo ao Portal"
				showBackButton
			/>

			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				style={{ flex: 1 }}
				keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
			>
				<ScrollView
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps="handled"
					contentContainerStyle={{
						paddingHorizontal: 24,
						paddingTop: 20,
						paddingBottom: isAuthenticated
							? insets.bottom + 120
							: insets.bottom + 40,
					}}
				>
					<FormInput
						label="Matrícula do Paciente"
						name="matricula"
						control={control as any}
						error={errors.matricula}
						placeholder="000000"
						keyboardType="numeric"
					/>

					<FormInput
						label="Nome do Paciente"
						name="nome"
						control={control as any}
						error={errors.nome}
						placeholder="Nome Completo"
					/>

					<FormInput
						label="E-mail do Paciente"
						name="email"
						control={control as any}
						error={errors.email}
						placeholder="email@exemplo.com"
						keyboardType="email-address"
						autoCapitalize="none"
					/>

					<FormSelect
						label="Motivo do Contato"
						name="motivo"
						control={control as any}
						error={errors.motivo}
						options={motivos}
					/>

					<FormInput
						label="Mensagem"
						name="mensagem"
						control={control as any}
						error={errors.mensagem}
						placeholder="Como podemos ajudar?"
						multiline
						numberOfLines={5}
						style={{
							height: 60,
							textAlignVertical: "top", // Garante que o texto comece no topo no Android
							paddingTop: 10, // Espaçamento interno para o texto não colar no topo
						}}
					/>

					<View style={{ marginTop: 0 }}>
						<PrimaryButton
							title="Enviar Mensagem"
							loading={loading}
							onPress={handleSubmit(onSubmit)}
						/>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>

			{isAuthenticated && <Footer />}

			<StatusModal
				config={modalConfig}
				onClose={() => setModalConfig({ ...modalConfig, visible: false })}
			/>
		</View>
	);
}

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as LocalAuthentication from "expo-local-authentication";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
	Dimensions,
	Image,
	Keyboard,
	KeyboardAvoidingView,
	Linking,
	Platform,
	ScrollView,
	StatusBar,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import * as z from "zod";

import { FormInput } from "@/src/components/FormInput";
import { PrimaryButton } from "@/src/components/PrimaryButton";
import { ServiceButton } from "@/src/components/ServiceButton";
import { StatusModal } from "../../src/components/StatusModal";
import { useAuth } from "../../src/contexts/AuthContext";

const COLORS = {
	hcf_teal: "#00877C",
	hcf_navy: "#191455",
};

const loginSchema = z.object({
	matricula: z.string().min(1, "Informe sua matrícula RGHC ou CPF"),
	senha: z.string().min(1, "A senha é obrigatória"),
});

type LoginData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
	const router = useRouter();
	const { width } = Dimensions.get("window");
	const COLUMN_WIDTH = (width - 60) / 3;

	// Puxa a versão definida no app.config.js
	const appVersion = Constants.expoConfig?.version || "2.0.4";

	const { signIn, signInBiometric, checkAppVersion, handleUpdateApp } =
		useAuth();

	const [loading, setLoading] = useState(false);
	const [secureMode, setSecureMode] = useState(true);
	const [isKeyboardVisible, setKeyboardVisible] = useState(false);
	const [isBiometricSupported, setIsBiometricSupported] = useState(false);

	const [modalConfig, setModalConfig] = useState({
		visible: false,
		type: "info" as "success" | "error" | "info",
		title: "",
		message: "",
		onClose: () => {},
	});

	const {
		control,
		handleSubmit,
		setValue,
		formState: { errors },
	} = useForm<LoginData>({
		resolver: zodResolver(loginSchema),
		defaultValues: { matricula: "", senha: "" },
	});

	useEffect(() => {
		const keyboardDidShowListener = Keyboard.addListener(
			"keyboardDidShow",
			() => setKeyboardVisible(true),
		);
		const keyboardDidHideListener = Keyboard.addListener(
			"keyboardDidHide",
			() => setKeyboardVisible(false),
		);

		const initialize = async () => {
			try {
				// 1. Carregar matrícula salva
				const saved = await AsyncStorage.getItem("@user_matricula").catch(
					() => null,
				);
				if (saved) setValue("matricula", saved);

				// 2. Verificar Biometria
				const compatible = await LocalAuthentication.hasHardwareAsync().catch(
					() => false,
				);
				const enrolled = await LocalAuthentication.isEnrolledAsync().catch(
					() => false,
				);
				setIsBiometricSupported(compatible && enrolled);

				// 3. Validação de Versão
				if (typeof checkAppVersion === "function") {
					const isVersionValid = await checkAppVersion();

					// Bloqueio específico: Se for iOS e versão 93.0.0, trava na hora.
					const isIosBlocked = Platform.OS === "ios" && appVersion === "93.0.0";

					if (!isVersionValid || isIosBlocked) {
						setModalConfig({
							visible: true,
							type: "info",
							title: "Atualização Obrigatória",
							message: isIosBlocked
								? "A versão 93.0.0 para iOS não é mais suportada. Por favor, atualize o app na App Store."
								: "Sua versão atual não é mais compatível. Por favor, atualize para continuar.",
							onClose: () => {
								if (handleUpdateApp) handleUpdateApp();
							},
						});
						return; // Interrompe o fluxo de login
					}
				}
			} catch (e) {
				console.log("Erro no init do Login:", e);
			}
		};

		initialize();

		return () => {
			keyboardDidShowListener.remove();
			keyboardDidHideListener.remove();
		};
	}, [appVersion]);

	const handleLogin = async (data: LoginData) => {
		// Double-check de segurança no clique do botão
		if (Platform.OS === "ios" && appVersion === "93.0.0") {
			setModalConfig({
				visible: true,
				type: "info",
				title: "Versão Obsoleta",
				message: "Por favor, atualize o aplicativo para acessar sua conta.",
				onClose: () => handleUpdateApp && handleUpdateApp(),
			});
			return;
		}

		setLoading(true);
		try {
			const userResponse = await signIn(data.matricula, data.senha);
			await AsyncStorage.setItem("@user_matricula", data.matricula);

			if (userResponse && Number(userResponse.primeiroacesso) === 0) {
				router.replace("/alterar-senha");
				return;
			}
			router.replace("/(tabs)");
		} catch (error: any) {
			setModalConfig({
				visible: true,
				type: "error",
				title: "Falha no Acesso",
				message: error.message || "Usuário ou senha incorretos.",
				onClose: () => setModalConfig((p) => ({ ...p, visible: false })),
			});
		} finally {
			setLoading(false);
		}
	};

	const handleBiometricAuth = async () => {
		try {
			const hasSavedPass = await SecureStore.getItemAsync("hcfm_bio_pass");
			if (!hasSavedPass) {
				setModalConfig({
					visible: true,
					type: "error",
					title: "Acesso Manual",
					message: "Biometria não configurada.",
					onClose: () => setModalConfig((p) => ({ ...p, visible: false })),
				});
				return;
			}

			const result = await LocalAuthentication.authenticateAsync({
				promptMessage: "Acesse o Portal",
				fallbackLabel: "Usar senha manual",
			});

			if (result.success) {
				setLoading(true);
				try {
					const userResponse = await signInBiometric();

					if (userResponse && Number(userResponse.primeiroacesso) === 0) {
						setLoading(false);
						await SecureStore.deleteItemAsync("hcfm_bio_pass");
						setModalConfig({
							visible: true,
							type: "error",
							title: "Senha Resetada",
							message:
								"Sua senha foi resetada. Faça o login manual para criar uma nova.",
							onClose: () => setModalConfig((p) => ({ ...p, visible: false })),
						});
						return;
					}
					router.replace("/(tabs)");
				} catch (e: any) {
					setLoading(false);
					await SecureStore.deleteItemAsync("hcfm_bio_pass");
					setModalConfig({
						visible: true,
						type: "error",
						title: "Acesso Alterado",
						message:
							"Sua senha foi alterada. Entre manualmente para reativar a biometria.",
						onClose: () => setModalConfig((p) => ({ ...p, visible: false })),
					});
				} finally {
					setLoading(false);
				}
			}
		} catch (error) {
			console.log(error);
		}
	};

	const handleOpenMap = () => {
		const lat = -23.5559;
		const lng = -46.6668;
		const url = Platform.select({
			ios: `maps:0,0?q=ICr@${lat},${lng}`,
			android: `geo:${lat},${lng}?q=${lat},${lng}(ICr)`,
		});
		if (url) Linking.openURL(url);
	};

	return (
		<View className="flex-1 bg-[#F2F2F2]">
			<StatusBar barStyle="light-content" />
			<StatusModal {...modalConfig} />

			<View
				style={{
					backgroundColor: COLORS.hcf_navy,
					height: isKeyboardVisible ? 0 : 160,
				}}
				className="items-center justify-center rounded-b-[40px]"
			>
				{!isKeyboardVisible && (
					<Image
						source={require("../../assets/images/logo80peq.png")}
						style={{ width: "70%", height: 60 }}
						resizeMode="contain"
					/>
				)}
			</View>

			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				className="flex-1"
			>
				<ScrollView
					scrollEnabled={isKeyboardVisible}
					contentContainerStyle={{
						flexGrow: 1,
						paddingHorizontal: 24,
						paddingBottom: 15,
						justifyContent: "space-between",
					}}
					keyboardShouldPersistTaps="handled"
					bounces={false}
				>
					<View>
						<View className="bg-white rounded-[32px] p-7 shadow-2xl mt-4">
							<View className="mb-5 items-center">
								<Text className="text-[#191455] font-hcf-bold text-2xl">
									Bem-vindo
								</Text>
								<View
									style={{ backgroundColor: COLORS.hcf_teal }}
									className="h-1 w-12 rounded-full my-2"
								/>
								<Text className="text-gray-400 font-hcf-regular text-xs uppercase">
									Portal do Paciente
								</Text>
							</View>

							<FormInput
								name="matricula"
								control={control}
								error={errors.matricula}
								placeholder="Matrícula ou CPF"
								iconName="user-circle-o"
							/>
							<FormInput
								name="senha"
								control={control}
								error={errors.senha}
								placeholder="Senha"
								iconName="lock"
								secureTextEntry={secureMode}
								rightIcon={secureMode ? "eye-slash" : "eye"}
								onIconPress={() => setSecureMode(!secureMode)}
							/>

							<TouchableOpacity
								onPress={() => router.push("/recuperar-senha")}
								className="mt-3 h-12 flex-row items-center justify-center border border-dashed border-gray-200 rounded-2xl"
							>
								<MaterialCommunityIcons
									name="lock-reset"
									size={18}
									color="#666"
								/>
								<Text className="text-gray-500 ml-2 text-xs">
									{" "}
									Esqueceu a senha?{" "}
									<Text className="text-[#00877C] font-hcf-bold underline">
										Toque aqui
									</Text>
								</Text>
							</TouchableOpacity>

							<TouchableOpacity
								onPress={handleOpenMap}
								className="mt-4 flex-row items-center justify-center"
							>
								<MaterialCommunityIcons
									name="map-marker"
									size={14}
									color={COLORS.hcf_teal}
								/>
								<Text className="text-gray-400 text-[11px] ml-1 font-hcf-regular">
									Como chegar no ICr?
								</Text>
							</TouchableOpacity>

							<View className="flex-row items-end mt-5">
								<View className="flex-1">
									<PrimaryButton
										title="Entrar"
										loading={loading}
										onPress={handleSubmit(handleLogin)}
										iconName="login-variant"
									/>
								</View>
								{isBiometricSupported && (
									<TouchableOpacity
										onPress={handleBiometricAuth}
										className="ml-3 h-[58px] w-[60px] bg-teal-50 rounded-2xl items-center justify-center border border-teal-100"
									>
										<MaterialCommunityIcons
											name={
												Platform.OS === "ios"
													? "face-recognition"
													: "fingerprint"
											}
											size={32}
											color={COLORS.hcf_teal}
										/>
									</TouchableOpacity>
								)}
							</View>
						</View>

						<View className="mt-6 flex-row justify-between">
							{[
								{ title: "CONTATOS", icon: "phone", route: "/phones" },
								{ title: "DÚVIDAS", icon: "help-circle", route: "/faq" },
								{
									title: "FALE CONOSCO",
									icon: "chat-processing",
									route: "/faleconosco",
								},
							].map((item, i) => (
								<View key={i} style={{ width: COLUMN_WIDTH }}>
									<ServiceButton
										title={item.title}
										icon={item.icon as any}
										onPress={() => item.route && router.push(item.route as any)}
										style={{ width: "100%", height: 90 }}
									/>
								</View>
							))}
						</View>
					</View>

					{!isKeyboardVisible && (
						<View className="pb-6 items-center">
							<View className="flex-row items-center justify-center mb-5">
								<TouchableOpacity
									onPress={() =>
										Linking.openURL("https://instagram.com/icrhcfmusp/")
									}
									className="mx-6"
								>
									<MaterialCommunityIcons
										name="instagram"
										size={24}
										color="#BBB"
									/>
								</TouchableOpacity>
								<TouchableOpacity
									onPress={() =>
										Linking.openURL(
											"https://facebook.com/INSTITUTODACRIANCAHC/",
										)
									}
									className="mx-6"
								>
									<MaterialCommunityIcons
										name="facebook"
										size={24}
										color="#BBB"
									/>
								</TouchableOpacity>
								<TouchableOpacity
									onPress={() =>
										Linking.openURL(
											"https://youtube.com/c/InstitutodaCrian%C3%A7aedoAdolescenteICr/videos",
										)
									}
									className="mx-6"
								>
									<MaterialCommunityIcons
										name="youtube"
										size={24}
										color="#BBB"
									/>
								</TouchableOpacity>
							</View>
							<Text className="text-gray-400 font-hcf-regular text-[9px] tracking-widest uppercase">
								HCFMUSP • ICr
							</Text>
							<View className="bg-gray-200 h-[1px] w-12 my-2" />
							<Text className="text-gray-500 font-hcf-bold text-[11px]">
								Versão {appVersion}
							</Text>
						</View>
					)}
				</ScrollView>
			</KeyboardAvoidingView>
		</View>
	);
}

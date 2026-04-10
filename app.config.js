export default ({ config, platform }) => {
	// Tenta identificar a plataforma por 3 vias diferentes para não ter erro
	const isIOS =
		platform === "ios" ||
		process.env.EAS_BUILD_PLATFORM === "ios" ||
		(process.env.EAS_BUILD_PROFILE &&
			process.env.EAS_BUILD_PROFILE.includes("ios"));

	const isAndroid =
		platform === "android" ||
		process.env.EAS_BUILD_PLATFORM === "android" ||
		(process.env.EAS_BUILD_PROFILE &&
			process.env.EAS_BUILD_PROFILE.includes("android"));

	// Define a versão: Prioriza iOS, senão assume Android (ou vice-versa)
	// Se isIOS for true, usa a versão de iOS. Se não, usa a de Android.
	const appVersion = isIOS ? "93.0.0" : "09.04.26";

	return {
		...config,
		name: "Portal Paciente",
		slug: "portalpacienteicr",
		version: appVersion,
		orientation: "portrait",
		icon: "./assets/images/icon.png",
		scheme: "portalpaciente",
		userInterfaceStyle: "automatic",
		splash: {
			image: "./assets/images/splash.png",
			resizeMode: "contain",
			backgroundColor: "#191455",
		},
		ios: {
			supportsTablet: true,
			bundleIdentifier: "com.icr.portalpaciente",
			buildNumber: "93",
			infoPlist: {
				ITSAppUsesNonExemptEncryption: false,
				NSCameraUsageDescription:
					"Este app precisa de acesso à câmera para que você possa tirar fotos dos seus documentos e anexá-los ao seu perfil.",
				NSPhotoLibraryUsageDescription:
					"Este app precisa de acesso à sua galeria para que você possa escolher uma foto de perfil ou enviar comprovantes já salvos.",
			},
		},
		android: {
			adaptiveIcon: {
				foregroundImage: "./assets/images/adaptive-icon.png",
				backgroundColor: "#ffffff",
			},
			softwareKeyboardLayoutMode: "pan",
			versionCode: 509042026,
			permissions: [
				"android.permission.POST_NOTIFICATIONS",
				"android.permission.USE_BIOMETRIC",
				"android.permission.USE_FINGERPRINT",
			],
			package: "com.icr.portalpaciente",
			googleServicesFile: "./google-services.json",
		},
		plugins: [
			"expo-router",
			[
				"expo-notifications",
				{
					icon: "./assets/images/notification-icon.png",
					color: "#191455",
				},
			],
			"expo-font",
			"expo-secure-store",
			[
				"expo-local-authentication",
				{
					faceIDPermission:
						"O Portal do Paciente utiliza o FaceID para agilizar seu acesso.",
				},
			],
			"expo-sharing",
			"expo-web-browser",
		],
		extra: {
			eas: {
				projectId: "f2f844b8-cc0c-4faa-9a0d-f5bf75cea84d",
			},
		},
	};
};

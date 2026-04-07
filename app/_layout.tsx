import Constants from "expo-constants";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Dimensions, Image, LogBox, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import "../global.css";
import { StatusModal } from "../src/components/StatusModal";
import { AuthProvider, useAuth } from "../src/contexts/AuthContext";
import { registerAndSavePushToken } from "../src/services/notificationService";

// Configuração Global de Notificações corrigida para as versões novas do Expo
Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowAlert: true,
		shouldPlaySound: true,
		shouldSetBadge: false,
		shouldShowBanner: true,
		shouldShowList: true,
	}),
});

LogBox.ignoreLogs([
	"expo-notifications",
	"SafeAreaView has been deprecated",
	"setLayoutAnimationEnabledExperimental is currently a no-op",
]);

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function RootLayout() {
	const [fontsLoaded] = useFonts({
		"hcf-bold": require("../assets/fonts/Poppins-SemiBold.ttf"),
		"hcf-regular": require("../assets/fonts/Poppins-Regular.ttf"),
	});

	useEffect(() => {
		Notifications.setNotificationHandler({
			handleNotification: async () => ({
				shouldShowAlert: true,
				shouldPlaySound: true,
				shouldSetBadge: false,
				shouldShowBanner: true,
				shouldShowList: true,
			}),
		});
	}, []);

	return (
		<SafeAreaProvider>
			<AuthProvider>
				<NavigationGuard fontsLoaded={fontsLoaded} />
			</AuthProvider>
		</SafeAreaProvider>
	);
}

function NavigationGuard({ fontsLoaded }: { fontsLoaded: boolean }) {
	const {
		isAuthenticated,
		user,
		loading: authLoading,
		isSessionExpired,
		signOut,
	} = useAuth();
	const segments = useSegments();
	const router = useRouter();
	const [isAppReady, setIsAppReady] = useState(false);

	useEffect(() => {
		if (isAuthenticated && user?.id && Constants.appOwnership !== "expo") {
			registerAndSavePushToken(String(user.id)).catch(() => null);
		}
	}, [isAuthenticated, user?.id]);

	useEffect(() => {
		if (fontsLoaded && !authLoading) {
			setIsAppReady(true);
			SplashScreen.hideAsync().catch(() => null);
		}
	}, [fontsLoaded, authLoading]);

	useEffect(() => {
		if (!isAppReady) return;

		const inAuthGroup = segments[0] === "(auth)";

		// Verifica se a rota atual é de Telefones ou Fale Conosco
		const isPublicRoute =
			segments.includes("phones") || segments.includes("faleconosco");

		if (isAuthenticated && inAuthGroup) {
			// Se estiver logado mas em uma dessas rotas, não redireciona para as Tabs
			if (isPublicRoute) return;

			if (user && Number(user.primeiroacesso) === 0) {
				router.replace("/alterar-senha");
			} else {
				router.replace("/(tabs)");
			}
		} else if (
			!isAuthenticated &&
			!inAuthGroup &&
			!isPublicRoute // Se não estiver logado, permite ver o Fale Conosco sem chutar pro Login
		) {
			router.replace("/(auth)/login");
		}
	}, [isAuthenticated, isAppReady, segments, user]);

	if (!isAppReady) {
		return (
			<View
				style={{
					flex: 1,
					backgroundColor: "#191455",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<StatusBar style="light" />
				<Image
					source={require("../assets/images/logo80.png")}
					style={{ width: SCREEN_WIDTH * 0.7, height: 180 }}
					resizeMode="contain"
				/>
			</View>
		);
	}

	return (
		<>
			<StatusBar style="light" />
			<Stack screenOptions={{ headerShown: false }} />
			<StatusModal
				visible={isSessionExpired}
				type="info"
				title="Sessão Expirada"
				message="Sua sessão expirou."
				onClose={signOut}
			/>
		</>
	);
}

import { Link, Stack } from "expo-router";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotFoundScreen() {
	return (
		<SafeAreaView className="flex-1 bg-white items-center justify-center p-5">
			<Stack.Screen options={{ title: "Ops!" }} />

			<Text className="text-xl font-bold text-slate-800">
				Essa tela não existe.
			</Text>

			<Link href="/" className="mt-4 py-4">
				<Text className="text-base text-[#191455] font-semibold">
					Voltar para o início
				</Text>
			</Link>
		</SafeAreaView>
	);
}

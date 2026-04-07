import { PageHeader } from "@/src/components/PageHeader";
import { FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	LayoutAnimation,
	Platform,
	ScrollView,
	Text,
	TouchableOpacity,
	UIManager,
	View,
} from "react-native";
import { FAQItem, faqService } from "../../src/services/faqService";

// Habilita animações no Android
if (
	Platform.OS === "android" &&
	UIManager.setLayoutAnimationEnabledExperimental
) {
	UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function FAQScreen() {
	const [faqs, setFaqs] = useState<FAQItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
	const router = useRouter();

	useEffect(() => {
		const loadData = async () => {
			try {
				const data = await faqService.getFaq();
				setFaqs(data);
			} catch (err) {
				Alert.alert("Erro", "Não foi possível carregar as dúvidas.");
			} finally {
				setLoading(false);
			}
		};
		loadData();
	}, []);

	const toggleExpand = (index: number) => {
		LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
		setExpandedIndex(expandedIndex === index ? null : index);
	};

	return (
		<View className="flex-1 bg-gray-50">
			<PageHeader
				titulo="DÚVIDAS FREQUENTES"
				showBackButton
				subtitulo="Como podemos ajudar?"
			/>

			{loading ? (
				<View className="flex-1 justify-center items-center">
					<ActivityIndicator size="large" color="#00877C" />
					<Text className="mt-4 text-gray-500 font-hcf-regular">
						Carregando informações...
					</Text>
				</View>
			) : (
				<ScrollView
					className="flex-1"
					contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
					showsVerticalScrollIndicator={false}
				>
					{faqs.map((item, index) => {
						const isExpanded = expandedIndex === index;

						return (
							<TouchableOpacity
								key={index}
								activeOpacity={0.7}
								onPress={() => toggleExpand(index)}
								className={`bg-white rounded-2xl mb-3 shadow-sm border ${isExpanded ? "border-teal-500" : "border-gray-100"}`}
								style={{ elevation: 2 }}
							>
								<View className="p-4 flex-row items-center justify-between">
									<View className="flex-row items-center flex-1 pr-4">
										<View
											className={`w-8 h-8 rounded-full items-center justify-center ${isExpanded ? "bg-teal-500" : "bg-gray-100"}`}
										>
											<FontAwesome
												name="question"
												size={14}
												color={isExpanded ? "white" : "#191455"}
											/>
										</View>
										<Text
											className={`ml-3 flex-1 text-[15px] leading-tight ${isExpanded ? "font-hcf-bold text-teal-700" : "font-hcf-bold text-[#191455]"}`}
										>
											{item.descricao}
										</Text>
									</View>

									<MaterialCommunityIcons
										name={isExpanded ? "chevron-up" : "chevron-down"}
										size={24}
										color={isExpanded ? "#00877C" : "#ccc"}
									/>
								</View>

								{isExpanded && (
									<View className="px-4 pb-5 ml-11 pr-6">
										<View className="h-[1px] bg-gray-100 mb-4" />
										<Text className="text-gray-600 text-[15px] leading-6 font-hcf-regular">
											{item.resposta}
										</Text>
									</View>
								)}
							</TouchableOpacity>
						);
					})}
				</ScrollView>
			)}
		</View>
	);
}

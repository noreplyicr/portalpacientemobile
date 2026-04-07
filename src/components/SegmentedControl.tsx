import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
	Dimensions,
	NativeScrollEvent,
	NativeSyntheticEvent,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface SegmentedControlProps {
	opcoes: { label: string; value: string }[];
	valorAtual: string;
	onChange: (value: string) => void;
}

export function SegmentedControl({
	opcoes,
	valorAtual,
	onChange,
}: SegmentedControlProps) {
	const [showFadeRight, setShowFadeRight] = useState(true);
	const [showFadeLeft, setShowFadeLeft] = useState(false);

	// Consideramos rolável se tiver mais de 3 itens
	const isScrollable = opcoes.length > 3;

	const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
		const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
		const isEnd =
			contentOffset.x + layoutMeasurement.width >= contentSize.width - 20;
		setShowFadeRight(!isEnd);
		setShowFadeLeft(contentOffset.x > 10);
	};

	return (
		<View style={styles.wrapper}>
			<ScrollView
				horizontal
				scrollEnabled={isScrollable}
				showsHorizontalScrollIndicator={false}
				onScroll={handleScroll}
				scrollEventThrottle={16}
				// Centraliza e expande o conteúdo
				contentContainerStyle={[
					styles.scrollContent,
					{ width: isScrollable ? undefined : "100%" },
				]}
			>
				<View
					style={[
						styles.container,
						{ width: isScrollable ? undefined : "100%" },
					]}
				>
					{opcoes.map((opcao) => {
						const isActive = valorAtual === opcao.value;
						return (
							<TouchableOpacity
								key={opcao.value}
								activeOpacity={0.8}
								onPress={() => onChange(opcao.value)}
								style={[
									styles.tab,
									isActive ? styles.activeTab : styles.inactiveTab,
									// Se NÃO for rolável, flex: 1 faz ocupar todo o espaço
									!isScrollable ? { flex: 1 } : { width: SCREEN_WIDTH * 0.3 },
								]}
							>
								<Text
									className="font-hcf-bold text-center uppercase"
									style={{
										fontSize: 10,
										color: isActive ? "#191455" : "#fff",
										opacity: isActive ? 1 : 0.8,
									}}
									numberOfLines={1}
								>
									{opcao.label}
								</Text>
							</TouchableOpacity>
						);
					})}
				</View>
			</ScrollView>

			{/* Gradientes de sinalização */}
			{isScrollable && (
				<>
					{showFadeLeft && (
						<LinearGradient
							colors={["#191455", "transparent"]}
							start={{ x: 0, y: 0 }}
							end={{ x: 1, y: 0 }}
							style={[styles.fadeEffect, { left: 0 }]}
							pointerEvents="none"
						/>
					)}
					{showFadeRight && (
						<LinearGradient
							colors={["transparent", "#191455"]}
							start={{ x: 0, y: 0 }}
							end={{ x: 1, y: 0 }}
							style={[styles.fadeEffect, { right: 0 }]}
							pointerEvents="none"
						/>
					)}
				</>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	wrapper: {
		width: "100%",
		marginVertical: 10,
	},
	scrollContent: {
		paddingHorizontal: 16,
	},
	container: {
		flexDirection: "row",
		backgroundColor: "rgba(255,255,255,0.12)",
		borderRadius: 25,
		padding: 4,
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.08)",
	},
	tab: {
		paddingVertical: 10,
		paddingHorizontal: 8,
		borderRadius: 22,
		alignItems: "center",
		justifyContent: "center",
	},
	activeTab: {
		backgroundColor: "#fff",
		// Sombra leve
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 2,
		elevation: 3,
	},
	inactiveTab: {
		backgroundColor: "transparent",
	},
	fadeEffect: {
		position: "absolute",
		top: 2,
		bottom: 2,
		width: 40,
		zIndex: 10,
	},
});

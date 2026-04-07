import React from "react";
import {
	Keyboard,
	KeyboardAvoidingView,
	KeyboardAvoidingViewProps,
	Platform,
	ScrollView,
	StyleSheet,
	TouchableWithoutFeedback,
	View,
} from "react-native";

// Estendemos a interface original do KeyboardAvoidingView
interface KeyboardViewProps extends KeyboardAvoidingViewProps {
	children: React.ReactNode;
	contentContainerStyle?: any;
}

export const KeyboardView = ({
	children,
	contentContainerStyle,
	behavior, // Pegamos o behavior das props
	keyboardVerticalOffset, // Pegamos o offset das props
	...rest // Pegamos qualquer outra prop original (como style, etc)
}: KeyboardViewProps) => {
	return (
		<KeyboardAvoidingView
			style={styles.container}
			// Se você passar via prop na tela (como no Emails.tsx), ele usa o que você passou.
			// Se não passar nada, ele usa esses padrões abaixo:
			behavior={behavior || (Platform.OS === "ios" ? "padding" : "height")}
			keyboardVerticalOffset={
				keyboardVerticalOffset || (Platform.OS === "ios" ? 64 : -100)
			}
			{...rest}
		>
			<ScrollView
				contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
				keyboardShouldPersistTaps="handled"
				showsVerticalScrollIndicator={false}
				bounces={false}
			>
				<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
					<View style={{ flex: 1 }}>{children}</View>
				</TouchableWithoutFeedback>
			</ScrollView>
		</KeyboardAvoidingView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	scrollContent: {
		flexGrow: 1,
	},
});

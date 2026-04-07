import { Link } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React from "react";
import { Platform } from "react-native";

export function ExternalLink(
	props: Omit<React.ComponentProps<typeof Link>, "href"> & { href: string },
) {
	return (
		<Link
			target="_blank"
			{...props}
			// O segredo está no "as any" para silenciar o erro de rota interna do TS
			href={props.href as any}
			onPress={(e) => {
				if (Platform.OS !== "web") {
					// Impede a navegação interna do Expo Router
					e.preventDefault();
					// Abre no navegador de dentro do app (In-app browser)
					WebBrowser.openBrowserAsync(props.href);
				}
			}}
		/>
	);
}

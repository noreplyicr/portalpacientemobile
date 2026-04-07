import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

interface EmptyStateProps {
	titulo?: string;
	mensagem?: string;
	icone?: keyof typeof MaterialCommunityIcons.glyphMap;
}

export function EmptyState({
	titulo = "Nenhum registro encontrado",
	mensagem = "Não existem dados para exibir nesta categoria no momento.",
	icone = "folder-remove-outline",
}: EmptyStateProps) {
	return (
		<View className="flex-1 items-center justify-center py-20 px-10">
			{/* Círculo de fundo para o ícone */}
			<View className="bg-slate-100 p-6 rounded-full mb-4 border border-slate-50">
				<MaterialCommunityIcons name={icone as any} size={48} color="#94a3b8" />
			</View>

			{/* Título em destaque */}
			<Text className="text-slate-800 font-bold text-lg text-center mb-2">
				{titulo}
			</Text>

			{/* Mensagem descritiva */}
			<Text className="text-slate-400 text-sm text-center leading-5">
				{mensagem}
			</Text>
		</View>
	);
}

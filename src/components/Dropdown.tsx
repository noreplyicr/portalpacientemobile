import { MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    FlatList,
    Modal,
    SafeAreaView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface SelectItem {
	label: string;
	value: string | number;
}

interface SelectProps {
	items: SelectItem[];
	value: string | number;
	onChange: (value: string | number) => void;
	placeholder?: string;
	iconname?: keyof typeof MaterialIcons.glyphMap;
	errors?: string;
}

export default function Select({
	items,
	value,
	onChange,
	placeholder = "Selecione uma opção",
	iconname = "list",
	errors,
}: SelectProps) {
	const [modalVisible, setModalVisible] = useState(false);

	// Encontra o rótulo do item selecionado para mostrar no botão
	const selectedItem = items.find((item) => item.value === value);

	const handleSelect = (itemValue: string | number) => {
		onChange(itemValue);
		setModalVisible(false);
	};

	return (
		<View className="mb-2">
			<TouchableOpacity
				onPress={() => setModalVisible(true)}
				activeOpacity={0.7}
				className={`flex-row items-center bg-gray-100 rounded-xl px-4 py-4 border ${
					errors ? "border-red-500" : "border-transparent"
				}`}
			>
				<MaterialIcons name={iconname} size={22} color="#2ea9a0" />

				<Text
					className={`flex-1 ml-3 text-base ${
						selectedItem ? "text-gray-800" : "text-gray-400"
					}`}
				>
					{selectedItem ? selectedItem.label : placeholder}
				</Text>

				<MaterialIcons name="arrow-drop-down" size={24} color="#999" />
			</TouchableOpacity>

			{errors && (
				<Text className="text-red-500 text-xs mt-1 ml-1">{errors}</Text>
			)}

			{/* Modal de Seleção */}
			<Modal
				visible={modalVisible}
				animationType="slide"
				transparent={true}
				onRequestClose={() => setModalVisible(false)}
			>
				<View className="flex-1 bg-black/50 justify-end">
					<SafeAreaView className="bg-white rounded-t-[30px] max-h-[70%]">
						<View className="p-6 border-b border-gray-100 flex-row justify-between items-center">
							<Text className="text-lg font-bold text-gray-800">
								{placeholder}
							</Text>
							<TouchableOpacity onPress={() => setModalVisible(false)}>
								<MaterialIcons name="close" size={24} color="#666" />
							</TouchableOpacity>
						</View>

						<FlatList
							data={items}
							keyExtractor={(item) => String(item.value)}
							contentContainerStyle={{ paddingBottom: 40 }}
							renderItem={({ item }) => (
								<TouchableOpacity
									onPress={() => handleSelect(item.value)}
									className={`flex-row items-center p-5 border-b border-gray-50 ${
										item.value === value ? "bg-teal-50" : ""
									}`}
								>
									<Text
										className={`flex-1 text-base ${
											item.value === value
												? "text-[#2ea9a0] font-bold"
												: "text-gray-700"
										}`}
									>
										{item.label}
									</Text>
									{item.value === value && (
										<MaterialIcons name="check" size={20} color="#2ea9a0" />
									)}
								</TouchableOpacity>
							)}
						/>
					</SafeAreaView>
				</View>
			</Modal>
		</View>
	);
}

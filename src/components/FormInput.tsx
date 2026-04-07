import { FontAwesome } from "@expo/vector-icons";
import React, { forwardRef, useState } from "react";
import { Control, Controller, FieldError } from "react-hook-form";
import {
	Text,
	TextInput,
	TextInputProps,
	TouchableOpacity,
	View,
} from "react-native";

interface FormInputProps extends Omit<TextInputProps, "onChangeText"> {
	label?: string;
	name: string;
	control: Control<any>;
	error?: FieldError | any;
	iconName?: keyof typeof FontAwesome.glyphMap;
	onIconPress?: () => void;
	rightIcon?: keyof typeof FontAwesome.glyphMap;
	onChangeText?: (text: string) => string | void;
}

const COLORS = {
	hcf_teal: "#00877C",
	error_red: "#EF4444",
	text_main: "#191455",
};

export const FormInput = forwardRef<TextInput, FormInputProps>(
	(
		{
			label,
			name,
			control,
			error,
			iconName,
			onIconPress,
			rightIcon,
			onChangeText: externalOnChangeText,
			...rest
		},
		ref,
	) => {
		const [isFocused, setIsFocused] = useState(false);
		const errorMessage = error?.message || error;

		const getIconColor = () => {
			if (errorMessage) return COLORS.error_red;
			if (isFocused) return COLORS.hcf_teal;
			return "#999";
		};

		return (
			<View className="w-full mb-5">
				{label && (
					<Text className="text-sm font-bold text-[#191455] mb-2 ml-1">
						{label}
					</Text>
				)}

				<Controller
					control={control}
					name={name}
					render={({ field: { onChange, onBlur, value } }) => (
						<View
							className={`flex-row rounded-2xl px-5 border-2 ${
								rest.multiline
									? "items-start py-4 min-h-[150px]"
									: "items-center h-16"
							} ${
								errorMessage
									? "border-red-500 bg-red-50"
									: isFocused
										? "border-[#00877C] bg-white"
										: "border-gray-400 bg-white" // <-- AQUI: Mudei de gray-100 para gray-400 e bg para white
							}`}
						>
							{iconName && (
								<View className={rest.multiline ? "mt-1" : ""}>
									<FontAwesome
										name={iconName}
										size={20}
										color={getIconColor()}
									/>
								</View>
							)}

							<TextInput
								ref={ref}
								style={[
									rest.multiline && {
										textAlignVertical: "top",
										paddingTop: 0,
										minHeight: 120,
									},
								]}
								className="flex-1 ml-3 text-lg text-black"
								placeholderTextColor="#9ca3af"
								onBlur={() => {
									onBlur();
									setIsFocused(false);
								}}
								onFocus={() => setIsFocused(true)}
								onChangeText={(text) => {
									// Executa a lógica de máscara externa
									const result = externalOnChangeText
										? externalOnChangeText(text)
										: text;

									// CORREÇÃO: Se 'result' for string, usa a máscara.
									// Se for void (undefined), usa o texto puro 'text'.
									onChange(typeof result === "string" ? result : text);
								}}
								value={value}
								autoCapitalize="none"
								{...rest}
							/>

							{(rightIcon || onIconPress) && (
								<TouchableOpacity
									onPress={onIconPress}
									activeOpacity={0.7}
									className={rest.multiline ? "mt-1" : ""}
								>
									<FontAwesome
										name={rightIcon || "eye"}
										size={20}
										color="#6b7280"
									/>
								</TouchableOpacity>
							)}
						</View>
					)}
				/>

				{errorMessage ? (
					<Text className="text-red-500 text-xs mt-2 ml-3">{errorMessage}</Text>
				) : null}
			</View>
		);
	},
);

import React from "react";
import { Control, Controller, FieldError } from "react-hook-form";
import { StyleSheet, Text, View } from "react-native";
import RNPickerSelect from "react-native-picker-select";

interface FormSelectProps {
	label: string;
	name: string;
	control: Control<any>;
	error?: FieldError;
	options: { label: string; value: string }[];
}

export function FormSelect({
	label,
	name,
	control,
	error,
	options,
}: FormSelectProps) {
	return (
		<View style={styles.container}>
			<Text style={styles.label}>{label}</Text>

			<Controller
				control={control}
				name={name}
				render={({ field: { onChange, value } }) => (
					<View
						style={[
							styles.wrapper,
							error ? styles.errorBorder : styles.normalBorder,
						]}
					>
						<RNPickerSelect
							onValueChange={onChange}
							value={value}
							placeholder={{
								label: "SELECIONE UM MOTIVO",
								value: "",
								color: "#999",
							}}
							items={options}
							style={{
								inputIOS: styles.input,
								inputAndroid: styles.input,
								placeholder: {
									color: "#999",
								},
							}}
						/>
					</View>
				)}
			/>

			{error && <Text style={styles.errorText}>{error.message}</Text>}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		marginBottom: 16,
	},

	label: {
		color: "#191455",
		fontWeight: "bold",
		marginBottom: 4,
		fontSize: 12,
		textTransform: "uppercase",
	},

	wrapper: {
		backgroundColor: "#FFFFFF",
		borderRadius: 12,
		paddingHorizontal: 12,
		justifyContent: "center",
		height: 48,
	},

	input: {
		color: "#191455",
		fontSize: 14,
		paddingVertical: 10,
	},

	normalBorder: {
		borderWidth: 1,
		borderColor: "#E0E0E0",
	},

	errorBorder: {
		borderWidth: 1,
		borderColor: "#EF4444",
	},

	errorText: {
		color: "#EF4444",
		fontSize: 12,
		marginTop: 4,
		fontWeight: "500",
	},
});

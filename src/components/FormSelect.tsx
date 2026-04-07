import { Picker } from "@react-native-picker/picker"; // npx expo install @react-native-picker/picker
import React from "react";
import { Control, Controller, FieldError } from "react-hook-form";
import { StyleSheet, Text, View } from "react-native";

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
							styles.pickerWrapper,
							error ? styles.errorBorder : styles.normalBorder,
						]}
					>
						<Picker
							selectedValue={value}
							onValueChange={onChange}
							dropdownIconColor="#191455"
						>
							<Picker.Item label="SELECIONE UM MOTIVO" value="" color="#999" />
							{options.map((opt) => (
								<Picker.Item
									key={opt.value}
									label={opt.label}
									value={opt.value}
								/>
							))}
						</Picker>
					</View>
				)}
			/>

			{error && <Text style={styles.errorText}>{error.message}</Text>}
		</View>
	);
}

const styles = StyleSheet.create({
	container: { marginBottom: 16 },
	label: {
		color: "#191455",
		fontWeight: "bold",
		marginBottom: 4,
		fontSize: 12,
		textTransform: "uppercase",
	},
	pickerWrapper: {
		backgroundColor: "#F9F9F9",
		borderRadius: 12,
		borderWidth: 1,
		overflow: "hidden",
	},
	normalBorder: { borderColor: "#E0E0E0" },
	errorBorder: { borderColor: "#EF4444" },
	errorText: {
		color: "#EF4444",
		fontSize: 12,
		marginTop: 4,
		fontWeight: "500",
	},
});

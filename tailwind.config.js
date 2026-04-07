/** @type {import('tailwindcss').Config} */
module.exports = {
	// Adicionei o "./src/**/*.{js,jsx,ts,tsx}" para ele ler tudo dentro de src
	content: [
		"./app/**/*.{js,jsx,ts,tsx}",
		"./src/**/*.{js,jsx,ts,tsx}", // <--- ADICIONE ESTA LINHA
		"./components/**/*.{js,jsx,ts,tsx}",
	],
	presets: [require("nativewind/preset")],
	theme: {
		extend: {
			fontFamily: {
				"hcf-bold": ["HCF-Bold"],
				"hcf-regular": ["HCF-Regular"],
			},
			colors: {
				hcf_teal: "#00877C",
				hcf_blue: "#005EB8",
				hcf_gray: "#E5E5E5",
				hcf_navy: "#191455",
			},
		},
	},
	plugins: [],
};

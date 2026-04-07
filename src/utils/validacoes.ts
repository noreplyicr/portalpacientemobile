// src/utils/validacoes.ts

/**
 * Valida se a string é um CPF matematicamente válido (Dígitos verificadores).
 */
export const validarCPF = (cpf: string | null | undefined): boolean => {
	if (!cpf) return false;

	// Remove caracteres não numéricos e espaços acidentais
	const limpo = String(cpf).replace(/\D/g, "");

	// Verifica se tem 11 dígitos ou se é uma sequência repetida (ex: 111.111.111-11)
	if (limpo.length !== 11 || !!limpo.match(/(\d)\1{10}/)) return false;

	// Cálculo do primeiro dígito verificador
	let soma = 0;
	let resto;
	for (let i = 1; i <= 9; i++) {
		soma += parseInt(limpo.substring(i - 1, i)) * (11 - i);
	}
	resto = (soma * 10) % 11;
	if (resto === 10 || resto === 11) resto = 0;
	if (resto !== parseInt(limpo.substring(9, 10))) return false;

	// Cálculo do segundo dígito verificador
	soma = 0;
	for (let i = 1; i <= 10; i++) {
		soma += parseInt(limpo.substring(i - 1, i)) * (12 - i);
	}
	resto = (soma * 10) % 11;
	if (resto === 10 || resto === 11) resto = 0;
	if (resto !== parseInt(limpo.substring(10, 11))) return false;

	return true;
};

/**
 * Aplica a máscara de CPF (000.000.000-00) enquanto o usuário digita ou para exibição.
 */
export const maskCPF = (value: string | number | null | undefined): string => {
	if (!value) return "";

	return String(value)
		.trim() // Remove espaços antes de processar
		.replace(/\D/g, "") // Mantém apenas números
		.replace(/(\d{3})(\d)/, "$1.$2")
		.replace(/(\d{3})(\d)/, "$1.$2")
		.replace(/(\d{3})(\d{1,2})$/, "$1-$2")
		.slice(0, 14); // Limita ao tamanho final (14 caracteres)
};

/**
 * Atalho para formatar valores vindo do banco de dados ou estados.
 */
export const formatarCPF = (
	value: string | number | null | undefined,
): string => {
	return maskCPF(value);
};

// Exemplo de função no seu utils.ts
export const maskPhone = (value: string) => {
	if (!value) return "";
	value = value.replace(/\D/g, ""); // Remove tudo que não é número
	if (value.length <= 10) {
		// Fixo: (00) 0000-0000
		return value.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
	} else {
		// Celular: (00) 00000-0000
		return value.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
	}
};

/**
 * Aplica a máscara de CEP (00000-000) enquanto o usuário digita ou para exibição.
 */
export const maskCEP = (value: string | number | null | undefined): string => {
	if (!value) return "";

	return String(value)
		.replace(/\D/g, "") // Remove tudo o que não é dígito
		.replace(/^(\d{5})(\d)/, "$1-$2") // Adiciona o hífen após o 5º dígito
		.slice(0, 9); // Limita ao tamanho final (8 números + 1 hífen)
};

/**
 * Atalho para formatar CEPs vindos de APIs ou Banco de Dados.
 */
export const formatarCEP = (
	value: string | number | null | undefined,
): string => {
	return maskCEP(value);
};

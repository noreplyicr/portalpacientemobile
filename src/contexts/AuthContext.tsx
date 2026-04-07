import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import React, {
	createContext,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import { Linking, Platform } from "react-native";
import { api, apiDB } from "../config/api";

interface UserData {
	id: number;
	nome: string;
	token: string;
	foto?: string;
	senhadia?: string;
	matricula: string;
	iddw: number;
	expiresAt?: number;
	cpf?: string;
	cpffinal?: string;
	primeiroacesso?: number;
	temtele?: number;
	atuatel?: number;
	atuaend?: number;
	atuamail?: number;
	hasemail?: boolean;
	email?: string;
	logradouro?: string;
	numero?: string;
	cep?: string;
	celular?: string;
}

interface AuthContextData {
	user: UserData | null;
	loading: boolean;
	isAuthenticated: boolean;
	isSessionExpired: boolean;
	// MUDANÇA CRUCIAL: Agora as Promises retornam UserData
	signIn: (matricula: string, senha: string) => Promise<UserData>;
	signInBiometric: () => Promise<UserData>;
	signOut: () => Promise<void>;
	updateUser: (newData: Partial<UserData>) => Promise<void>;
	handleUpdateApp: () => void;
	checkAppVersion: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);
const STORAGE_KEY = "hcfm_user_data";
const BIO_USER_KEY = "hcfm_bio_user";
const BIO_PASS_KEY = "hcfm_bio_pass";
const isWeb = Platform.OS === "web";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [user, setUser] = useState<UserData | null>(null);
	const [loading, setLoading] = useState(true);
	const [isSessionExpired, setIsSessionExpired] = useState(false);
	const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);

	const isAuthenticated = !!user && Number(user.id) > 0;

	const handleUpdateApp = () => {
		const url =
			Platform.OS === "ios"
				? "https://apps.apple.com/br/app/portal-do-paciente-icr/id1592303573"
				: "https://play.google.com/store/apps/details?id=com.icr.portalpaciente";
		Linking.openURL(url);
	};

	async function checkAppVersion() {
		try {
			const platformKey = Platform.OS;
			const response = await apiDB.get(`/getVersaoApp`, {
				params: { plataforma: platformKey },
			});

			const versionNoBanco = response.data?.Table?.[0]?.VERSAO_MINIMA;

			// Se não encontrar a versão no banco, libera por segurança
			if (!versionNoBanco) return true;

			const currentVersion =
				Platform.OS === "ios"
					? Constants.expoConfig?.ios?.buildNumber || "0"
					: Constants.expoConfig?.version || "00.00.00";

			// Retorna TRUE se forem iguais (está ok)
			// Retorna FALSE se forem diferentes (vai "reclamar")
			return currentVersion === versionNoBanco;
		} catch (e) {
			console.log("Erro na requisição de versão:", e);
			// Em caso de erro de rede, costuma-se retornar true para não travar o usuário
			return true;
		}
	}

	async function updateUser(newData: Partial<UserData>) {
		if (!user) return;
		const updatedUser = { ...user, ...newData };

		if (newData.primeiroacesso !== undefined) {
			updatedUser.primeiroacesso = Number(newData.primeiroacesso);
		}

		setUser(updatedUser);
		const stringData = JSON.stringify(updatedUser);
		try {
			if (isWeb) localStorage.setItem(STORAGE_KEY, stringData);
			else await SecureStore.setItemAsync(STORAGE_KEY, stringData);
		} catch (e) {
			console.log("Erro ao atualizar storage", e);
		}
	}

	const setupLogoutTimer = (expirationTime: number) => {
		if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
		const tempoRestante = expirationTime - Date.now();
		if (tempoRestante > 0) {
			logoutTimerRef.current = setTimeout(
				() => setIsSessionExpired(true),
				tempoRestante,
			);
		} else {
			setIsSessionExpired(true);
		}
	};

	async function signOut() {
		if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
		try {
			if (isWeb) localStorage.removeItem(STORAGE_KEY);
			else {
				await SecureStore.deleteItemAsync(STORAGE_KEY);
			}
		} catch (e) {
			console.log("Erro ao limpar storage", e);
		} finally {
			delete api.defaults.headers.common["Authorization"];
			setUser(null);
			setIsSessionExpired(false);
		}
	}

	useEffect(() => {
		async function loadStorageData() {
			try {
				const storagedUser = isWeb
					? localStorage.getItem(STORAGE_KEY)
					: await SecureStore.getItemAsync(STORAGE_KEY);

				if (storagedUser) {
					const parsedUser: UserData = JSON.parse(storagedUser);
					const agora = Date.now();

					if (parsedUser.expiresAt && agora >= parsedUser.expiresAt) {
						setIsSessionExpired(true);
						delete api.defaults.headers.common["Authorization"];
						setUser(null);
					} else {
						setUser(parsedUser);
						api.defaults.headers.common["Authorization"] =
							`Bearer ${parsedUser.token}`;
						if (parsedUser.expiresAt) setupLogoutTimer(parsedUser.expiresAt);
					}
				}
			} catch (e) {
				console.log("Erro ao recuperar sessão", e);
			} finally {
				setLoading(false);
			}
		}
		loadStorageData();
	}, []);

	async function signIn(matricula: string, senha: string): Promise<UserData> {
		try {
			const response = await api.post("/login", { matricula, senha });
			const data = response.data;

			if (data && data.id && Number(data.id) > 0) {
				const HORAS_LIMITE = 1;
				const dataExpiracao = Date.now() + HORAS_LIMITE * 60 * 60 * 1000;

				const userData: UserData = {
					id: Number(data?.id) || 0,
					iddw: Number(data?.iddw) || 0,
					nome: data?.nome ?? "PACIENTE",
					token: data?.token ?? "",
					foto: data?.avatar ?? null,
					senhadia: data?.senhadia ?? "---",
					matricula: data?.matricula ?? "",
					expiresAt: dataExpiracao,
					logradouro:
						data?.endereco?.logradouro?.tipo &&
						data?.endereco?.logradouro?.descricao
							? `${data.endereco.logradouro.tipo} ${data.endereco.logradouro.descricao}`
							: "Endereço não informado",
					numero: data?.numero ?? "S/N",
					cep: data?.cep?.numero ?? "CEP Pendente",
					celular: data?.celular ?? "",
					cpf: data?.cpf ?? "",
					cpffinal: data?.cpffinal ?? "",
					email: data?.email ?? null,
					primeiroacesso: Number(data?.primeiroacesso ?? 0),
					temtele: Number(data?.temtele ?? 0),
					atuatel: Number(data?.atuatel ?? 0),
					atuaend: Number(data?.atuaend ?? 0),
					atuamail: Number(data?.atuamail ?? 0),
					hasemail: Boolean(data?.email && data.email.trim() !== ""),
				};

				console.log(data?.email);

				setUser(userData);
				api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
				setupLogoutTimer(dataExpiracao);

				const stringData = JSON.stringify(userData);
				if (isWeb) {
					localStorage.setItem(STORAGE_KEY, stringData);
				} else {
					await SecureStore.setItemAsync(STORAGE_KEY, stringData);
					await SecureStore.setItemAsync(BIO_USER_KEY, matricula);
					await SecureStore.setItemAsync(BIO_PASS_KEY, senha);
				}

				return userData; // <--- O PULO DO GATO ESTÁ AQUI
			} else {
				throw new Error("Usuário ou senha inválidos.");
			}
		} catch (error) {
			throw error;
		}
	}

	async function signInBiometric(): Promise<UserData> {
		if (isWeb) throw new Error("Não disponível na Web");
		const savedMatricula = await SecureStore.getItemAsync(BIO_USER_KEY);
		const savedSenha = await SecureStore.getItemAsync(BIO_PASS_KEY);

		if (savedMatricula && savedSenha) {
			return await signIn(savedMatricula, savedSenha); // <--- RETORNA O RESULTADO
		} else {
			throw new Error("Credenciais não encontradas.");
		}
	}

	return (
		<AuthContext.Provider
			value={{
				user,
				loading,
				isAuthenticated,
				isSessionExpired,
				signIn,
				signInBiometric,
				signOut,
				updateUser,
				handleUpdateApp,
				checkAppVersion,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => useContext(AuthContext);

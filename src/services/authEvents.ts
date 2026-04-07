// src/services/authEvents.ts

type Callback = () => void;

class AuthEventEmitter {
	private listeners: Callback[] = [];

	// Adiciona um ouvinte
	on(callback: Callback) {
		this.listeners.push(callback);
	}

	// Remove um ouvinte (evita vazamento de memória)
	off(callback: Callback) {
		this.listeners = this.listeners.filter((listener) => listener !== callback);
	}

	// Dispara o evento
	emit() {
		this.listeners.forEach((listener) => listener());
	}
}

export const authEvents = new AuthEventEmitter();

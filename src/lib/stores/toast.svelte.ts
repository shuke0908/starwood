import { type Component } from 'svelte';

export interface ToastMessage {
    id: string;
    type: 'success' | 'error' | 'info';
    message: string;
    description?: string;
}

class ToastStore {
    messages = $state<ToastMessage[]>([]);

    show(message: string, type: 'success' | 'error' | 'info' = 'info', description?: string) {
        const id = Math.random().toString(36).slice(2);
        this.messages = [...this.messages, { id, type, message, description }];
        
        setTimeout(() => {
            this.dismiss(id);
        }, 3000);
    }

    dismiss(id: string) {
        this.messages = this.messages.filter(m => m.id !== id);
    }
}

export const toast = new ToastStore();

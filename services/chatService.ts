import { Message } from '../types';

export const getChatResponse = async (history: Message[], sessionId?: string): Promise<string> => {
  try {
    const resp = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history, sessionId }),
    });
    if (!resp.ok) {
      const err = await safeJson(resp);
      const msg = err?.error || `Request failed (${resp.status})`;
      throw new Error(msg);
    }
    const data = await resp.json();
    return String(data?.text ?? '');
  } catch (error) {
    console.error('Chat request failed:', error);
    const msg = error instanceof Error ? error.message : '';
    if (msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('network') || msg.toLowerCase().includes('failed')) {
      throw new Error('Gagal terhubung ke server. Pastikan server berjalan (npm run server) dan port proxy sesuai.');
    }
    throw new Error(msg || 'Failed to get response from the assistant.');
  }
};

const safeJson = async (resp: Response): Promise<any | null> => {
  try {
    return await resp.json();
  } catch {
    return null;
  }
};

export const loadSessionHistory = async (sessionId: string): Promise<Message[]> => {
  try {
    const resp = await fetch('/api/session/load', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });
    if (!resp.ok) return [];
    const data = await resp.json();
    const arr = Array.isArray(data?.history) ? data.history : [];
    return arr.filter((m: any) => m && typeof m.role === 'string' && typeof m.content === 'string');
  } catch {
    return [];
  }
};

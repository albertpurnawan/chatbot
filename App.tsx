import React, { useEffect, useState } from 'react';
import { getChatResponse, loadSessionHistory } from './services/chatService';
import { Header } from './components/Header';
import { ChatInterface } from './components/ChatInterface';
import { Message, Role } from './types';
// Client does not enforce local daily limits; server handles IP-based limits

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: Role.ASSISTANT,
      content: "Halo! Saya FinAssistant, asisten keuangan pribadi Anda. Ada yang bisa saya bantu dengan pencatatan transaksi atau laporan keuangan hari ini?",
    },
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId] = useState<string>(() => {
    const key = 'finassist_session_id_v1';
    try {
      const existing = localStorage.getItem(key);
      if (existing) return existing;
      const id = (crypto && 'randomUUID' in crypto) ? crypto.randomUUID() : `s-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(key, id);
      return id;
    } catch {
      return 'default-session';
    }
  });

  // Persist chat history locally so it survives refresh and load from server by session
  const STORAGE_KEY = 'finassist_chat_history_v1';
  useEffect(() => {
    (async () => {
      // Try load from server first
      const serverHist = await loadSessionHistory(sessionId);
      if (serverHist.length > 0) {
        setMessages(serverHist as Message[]);
        return;
      }
      // Fallback to local storage
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.every((m: any) => typeof m?.role === 'string' && typeof m?.content === 'string')) {
          setMessages(parsed as Message[]);
        }
      } catch {}
    })();
  }, [sessionId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  const handleSendMessage = async (userInput: string) => {
    if (isLoading || !userInput.trim()) return;

    // Server enforces per-IP daily cap

    setIsLoading(true);
    setError(null);
    const newUserMessage: Message = { role: Role.USER, content: userInput };
    
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);

    try {
      const botResponse = await getChatResponse(updatedMessages, sessionId);
      const newBotMessage: Message = { role: Role.ASSISTANT, content: botResponse };
      setMessages((prevMessages) => [...prevMessages, newBotMessage]);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      console.error(e);
      setError(errorMessage);
      // Rollback user message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
      // Trigger quota refresh in header
      window.dispatchEvent(new Event('quota:refresh'));
    }
  };

  return (
    <div className="flex flex-col h-screen font-sans bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <Header />
      <main className="flex-1 flex flex-col items-center py-4 md:py-8 overflow-hidden">
        <div className="w-full max-w-3xl h-full flex flex-col bg-white dark:bg-gray-800 shadow-2xl rounded-lg">
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
          {error && <p className="text-center text-red-500 p-2 text-sm">{error}</p>}
        </div>
      </main>
    </div>
  );
};

export default App;

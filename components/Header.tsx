
import React, { useEffect, useState } from 'react';

export const Header: React.FC = () => {
  const [quota, setQuota] = useState<{ remaining: number; limit: number } | null>(null);

  const fetchQuota = async () => {
    try {
      const resp = await fetch('/api/quota');
      if (!resp.ok) return;
      const data = await resp.json();
      setQuota({ remaining: Number(data?.remaining ?? 0), limit: Number(data?.limit ?? 0) });
    } catch {}
  };

  useEffect(() => {
    fetchQuota();
    const id = setInterval(fetchQuota, 60_000); // refresh every minute
    const onRefresh = () => fetchQuota();
    window.addEventListener('quota:refresh', onRefresh as any);
    return () => {
      clearInterval(id);
      window.removeEventListener('quota:refresh', onRefresh as any);
    };
  }, []);
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md w-full z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <svg
              className="h-8 w-8 text-teal-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">
              Finance Assistant Chatbot
            </h1>
            {quota && (
              <span className="ml-4 text-sm text-gray-600 dark:text-gray-300">
                Sisa kuota: {quota.remaining}/{quota.limit}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

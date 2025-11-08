import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message as MessageType, Role } from '../types';
import { BotIcon } from './icons/BotIcon';
import { UserIcon } from './icons/UserIcon';

interface MessageProps {
  message: MessageType;
  isLoading?: boolean;
}

export const Message: React.FC<MessageProps> = ({ message, isLoading = false }) => {
  const isUser = message.role === Role.USER;

  const markdownComponents = {
    ul: ({node, ...props}: any) => <ul className="list-disc list-inside space-y-1" {...props} />,
    ol: ({node, ...props}: any) => <ol className="list-decimal list-inside space-y-1" {...props} />,
    table: ({node, ...props}: any) => <table className="w-full my-2 border-collapse text-sm" {...props} />,
    thead: ({node, ...props}: any) => <thead className="border-b-2 border-gray-300 dark:border-gray-600" {...props} />,
    th: ({node, ...props}: any) => <th className="px-3 py-2 text-left font-semibold" {...props} />,
    tr: ({node, ...props}: any) => <tr className="border-b border-gray-200 dark:border-gray-500 last:border-b-0" {...props} />,
    td: ({node, ...props}: any) => <td className="px-3 py-2" {...props} />,
    p: ({node, ...props}: any) => <p className="mb-2 last:mb-0" {...props} />,
  };

  return (
    <div className={`flex items-start gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          <BotIcon />
        </div>
      )}
      <div
        className={`max-w-md md:max-w-lg lg:max-w-xl px-5 py-3 rounded-2xl shadow-sm ${
          isUser
            ? 'bg-teal-500 text-white rounded-br-none'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-none'
        }`}
      >
        {isLoading ? (
            <div className="flex items-center space-x-2">
                <span className="block w-2.5 h-2.5 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                <span className="block w-2.5 h-2.5 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                <span className="block w-2.5 h-2.5 bg-gray-500 rounded-full animate-pulse"></span>
            </div>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {message.content}
          </ReactMarkdown>
        )}
      </div>
      {isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
          <UserIcon />
        </div>
      )}
    </div>
  );
};

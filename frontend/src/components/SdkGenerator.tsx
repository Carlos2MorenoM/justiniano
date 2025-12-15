import { useState } from 'react';

// --- CONFIGURATION ---
// 1. Define the API Base URL dynamically.
// Vercel will inject the real backend URL here via 'VITE_API_URL'.
// Localhost is used as a fallback for development.
const BASE_URL = "https://backend-bff-production.up.railway.app"

// 2. Construct the full endpoint URL, ensuring no double slashes.
const GENERATE_SDK_URL = `${BASE_URL.replace(/\/$/, '')}/developers/generate-sdk`;

type Language = 'python' | 'node';

export const SdkGenerator = () => {
    const [language, setLanguage] = useState<Language>('python');
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        setLoading(true);
        setError('');
        setCode('');

        try {
            // Assuming Vite proxy or CORS allows this call to localhost:3000
            const response = await fetch(GENERATE_SDK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ language }),
            });

            if (!response.ok) throw new Error('Failed to generate SDK');

            const data = await response.json();
            setCode(data.code);
        } catch (err) {
            setError('Error generating SDK. Ensure Backend is running.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 p-6">
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">AI SDK Generator</h1>
                <p className="text-gray-600">
                    Build "Enterprise-Ready" client libraries for Justiniano API in seconds.
                </p>
            </header>

            <div className="flex flex-1 gap-6 overflow-hidden">
                {/* Controls Panel */}
                <div className="w-1/3 bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Target Language
                        </label>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setLanguage('python')}
                                className={`flex-1 py-3 px-4 rounded-md border text-sm font-medium transition-colors ${language === 'python'
                                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                Python (httpx)
                            </button>
                            <button
                                onClick={() => setLanguage('node')}
                                className={`flex-1 py-3 px-4 rounded-md border text-sm font-medium transition-colors ${language === 'node'
                                    ? 'bg-green-50 border-green-500 text-green-700'
                                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                Node.js (TypeScript)
                            </button>
                        </div>
                    </div>

                    <div className="mt-auto">
                        <button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Generating with Llama 3...
                                </span>
                            ) : (
                                'Generate Client SDK'
                            )}
                        </button>
                        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
                    </div>
                </div>

                {/* Code Output Panel */}
                <div className="flex-1 bg-gray-900 rounded-lg shadow-lg overflow-hidden flex flex-col">
                    <div className="bg-gray-800 px-4 py-2 flex justify-between items-center border-b border-gray-700">
                        <span className="text-xs text-gray-400 font-mono">
                            generated_client.{language === 'python' ? 'py' : 'ts'}
                        </span>
                        {code && (
                            <button
                                onClick={() => navigator.clipboard.writeText(code)}
                                className="text-xs text-indigo-400 hover:text-indigo-300"
                            >
                                Copy Code
                            </button>
                        )}
                    </div>
                    <div className="flex-1 overflow-auto p-4">
                        {code ? (
                            <pre className="font-mono text-sm text-green-400 whitespace-pre-wrap">
                                <code>{code}</code>
                            </pre>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                                Select a language and click Generate to see the magic.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
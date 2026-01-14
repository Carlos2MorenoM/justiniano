import { useState } from 'react';

// --- CONFIGURATION ---
// 1. Define the API Base URL dynamically.
// Vercel will inject the real backend URL here via 'VITE_API_URL'.
// Localhost is used as a fallback for development.
const BASE_URL = "https://backend-bff-production.up.railway.app"

// 2. Construct endpoints
const GENERATE_SDK_URL = `${BASE_URL.replace(/\/$/, '')}/developers/generate-sdk`;
const GENERATE_CONTRACT_URL = `${BASE_URL.replace(/\/$/, '')}/developers/generate-contract`;

type Language = 'python' | 'node' | 'go' | 'java' | 'php';


export const SdkGenerator = () => {
    const [mode, setMode] = useState<'sdk' | 'contract'>('sdk');
    const [language, setLanguage] = useState<Language>('python');
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        setLoading(true);
        setError('');
        setCode('');

        try {
            const endpoint = mode === 'sdk' ? GENERATE_SDK_URL : GENERATE_CONTRACT_URL;

            // Assuming Vite proxy or CORS allows this call to localhost:3000
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ language }),
            });

            if (!response.ok) throw new Error(`Failed to generate ${mode === 'sdk' ? 'SDK' : 'Contract'}`);

            const data = await response.json();
            setCode(data.code);
        } catch {
            setError('Error generating content. Ensure Backend is running.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 p-4 md:p-6 overflow-y-auto">
            <header className="mb-6 flex-shrink-0">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Justiniano Developer Portal</h1>
                        <p className="text-gray-600 text-sm md:text-base">
                            Automating Developer Experience with Generative AI.
                        </p>
                    </div>
                    <a
                        href="https://backend-bff-production.up.railway.app/api"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium bg-indigo-50 px-3 py-2 rounded-lg transition-colors"
                    >
                        <span>Test API (Swagger UI)</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </a>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setMode('sdk')}
                        className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${mode === 'sdk'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Client SDK Generator
                    </button>
                    <button
                        onClick={() => setMode('contract')}
                        className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${mode === 'contract'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Contract Test Generator
                    </button>
                </div>
            </header>

            <div className="flex flex-col lg:flex-row flex-1 gap-6">
                {/* Controls Panel */}
                <div className="w-full lg:w-1/3 bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col gap-6 flex-shrink-0">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 mb-1">
                            {mode === 'sdk' ? 'Generate API Client' : 'Generate Contract Test'}
                        </h2>
                        <p className="text-sm text-gray-500 mb-4">
                            {mode === 'sdk'
                                ? 'Create a production-ready library for consuming the API.'
                                : 'Create a consumer-driven contract test (Pact V3) for validation.'}
                        </p>

                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Target Language
                        </label>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                            {(['python', 'node', 'go', 'java', 'php'] as Language[]).map((lang) => (
                                <button
                                    key={lang}
                                    onClick={() => setLanguage(lang)}
                                    className={`py-3 px-2 rounded-md border text-sm font-medium transition-colors capitalize ${language === lang
                                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500'
                                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    {lang === 'node' ? 'Node.js' : lang}
                                </button>
                            ))}
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
                                    Generating...
                                </span>
                            ) : (
                                mode === 'sdk' ? 'Generate Client SDK' : 'Generate Pact Test'
                            )}
                        </button>
                        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
                    </div>
                </div>

                {/* Code Output Panel */}
                <div className="w-full lg:flex-1 bg-gray-900 rounded-lg shadow-lg overflow-hidden flex flex-col min-h-[400px]">
                    <div className="bg-gray-800 px-4 py-2 flex justify-between items-center border-b border-gray-700">
                        <span className="text-xs text-gray-400 font-mono">
                            {mode === 'sdk' ? 'generated_client' : 'contract_test'}.{
                                language === 'python' ? 'py' :
                                    language === 'node' ? 'ts' :
                                        language === 'go' ? 'go' :
                                            language === 'java' ? 'java' : 'php'
                            }
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
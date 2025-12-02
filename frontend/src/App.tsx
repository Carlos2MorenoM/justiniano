import { Scale } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-6">

      {/* Header con Púrpura Imperial */}
      <header className="text-center space-y-2">
        <div className="flex justify-center text-corpus-structure">
          <Scale size={64} strokeWidth={1.5} />
        </div>
        <h1 className="text-5xl font-bold">Justiniano</h1>
        <p className="text-corpus-text/80 italic font-serif">Tu Agente Legal Inteligente</p>
      </header>

      {/* Tarjeta de prueba */}
      <div className="bg-white p-8 rounded-lg shadow-lg border border-corpus-muted max-w-md w-full">
        <h2 className="text-2xl mb-4">Estado del Sistema</h2>
        <p className="mb-6 leading-relaxed">
          El sistema está listo para recibir consultas sobre el BOE.
          La arquitectura RAG está activa.
        </p>

        {/* Botón con Oro Bizantino */}
        <button className="w-full bg-corpus-structure text-white font-medium py-3 px-4 rounded hover:bg-corpus-structure/90 transition-colors border-b-4 border-corpus-accent active:border-b-0 active:translate-y-1">
          Iniciar Consulta
        </button>
      </div>

    </div>
  );
}

export default App;
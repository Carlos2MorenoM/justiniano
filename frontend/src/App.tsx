import { Logo } from './components/Logo';

function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-8 bg-corpus-base">

      {/* Brand Header */}
      <header className="text-center space-y-4">
        <div className="flex justify-center">
          <Logo size={80} />
        </div>
        <div>
          <h1 className="text-5xl font-bold tracking-tight text-corpus-structure">
            Justiniano
          </h1>
          <p className="text-corpus-structure/70 italic font-serif mt-2 text-lg">
            Corpus Iuris Civilis Digital
          </p>
        </div>
      </header>

      {/* Status Card */}
      <div className="bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-xl shadow-corpus-structure/5 border border-corpus-muted/50 max-w-md w-full text-center space-y-6">
        <h2 className="text-2xl font-serif text-corpus-structure">
          Bienvenido, Legista
        </h2>
        <p className="leading-relaxed text-corpus-text/90">
          El sistema RAG está operacional. Acceda al conocimiento jurídico consolidado.
        </p>

        <button className="w-full bg-corpus-structure text-white font-medium py-3 px-4 rounded-lg hover:bg-corpus-structure/90 transition-all duration-200 border-b-4 border-corpus-accent active:border-b-0 active:translate-y-[2px] shadow-md hover:shadow-lg">
          Iniciar Consulta
        </button>
      </div>

    </div>
  );
}

export default App;
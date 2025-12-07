import { ChatInterface } from './components/ChatInterface';

/**
 * Root Application Component.
 * Serves as the main entry point, mounting the Chat Interface.
 * Future global providers (Auth, Theme, Toast notifications) should be wrapped here.
 */
function App() {
  return (
    // The ChatInterface handles its own internal states (Welcome vs Chat)
    <ChatInterface />
  );
}

export default App;
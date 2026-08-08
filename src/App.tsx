import { useEffect } from 'react';
import { SpeechDNADashboard } from './components/generated/SpeechDNADashboard';
// %IMPORT_STATEMENT%

function App() {
  // Force dark mode on document root
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return <SpeechDNADashboard />;
}

export default App;

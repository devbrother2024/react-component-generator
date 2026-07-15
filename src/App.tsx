import { useState, useEffect } from 'react';
import { PromptInput } from './components/PromptInput';
import { ComponentCard } from './components/ComponentCard';
import { useComponentGenerator } from './hooks/useComponentGenerator';
import type { Provider } from './types';
import './App.css';

const PROVIDER_CONFIG = {
  anthropic: { label: 'Anthropic', placeholder: 'sk-ant-...' },
  google: { label: 'Google', placeholder: 'AIza...' },
} as const;

function App() {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [provider, setProvider] = useState<Provider>('google');
  const [envKeys, setEnvKeys] = useState<Record<Provider, boolean>>({
    anthropic: false,
    google: false,
  });
  const { components, isLoading, error, generate, removeComponent, clearAll } =
    useComponentGenerator();

  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => setEnvKeys(data.envKeys))
      .catch(() => {});
  }, []);

  const hasEnvKey = envKeys[provider];

  const handleGenerate = (prompt: string) => {
    if (!apiKey.trim() && !hasEnvKey) {
      alert(`${PROVIDER_CONFIG[provider].label} API 키를 입력하거나 .env에 설정해주세요.`);
      return;
    }
    generate(prompt, apiKey || undefined, provider);
  };

  const handleProviderChange = (newProvider: Provider) => {
    setProvider(newProvider);
    setApiKey('');
  };

  const activeProvider = PROVIDER_CONFIG[provider].label;

  return (
    <div className="app">
      <header className="app-header">
        <svg className="logo-mark" viewBox="0 0 40 40" aria-hidden="true">
          <rect x="1" y="1" width="38" height="38" rx="4" />
          <path d="M8 27 L15 13 L22 27 M11 21 H19" />
          <circle cx="29" cy="20" r="3.4" className="logo-mark-signal" />
        </svg>
        <div className="header-copy">
          <span className="eyebrow">React Component Generator</span>
          <h1>프롬프트로 만드는 UI 워크벤치</h1>
          <p>요청을 입력하고, 생성된 React 컴포넌트를 바로 미리보고 코드로 확인합니다.</p>
        </div>
        <div className="header-meta" aria-label="현재 작업 상태">
          <div>
            <span>Provider</span>
            <strong>{activeProvider}</strong>
          </div>
          <div>
            <span>Components</span>
            <strong>{String(components.length).padStart(2, '0')}</strong>
          </div>
        </div>
      </header>

      <main className="workspace">
        <section className="composer-panel" aria-label="컴포넌트 생성">
          <PromptInput onGenerate={handleGenerate} isLoading={isLoading} />
        </section>

        <aside className="settings-panel" aria-label="실행 설정">
          <div className="settings-header">
            <span className="panel-kicker">Runtime</span>
            <h2>실행 설정</h2>
          </div>
          <div className="provider-select field-group">
            <label htmlFor="provider">
              <span className="field-number">01</span>Provider
            </label>
            <select
              id="provider"
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value as Provider)}
            >
              {Object.entries(PROVIDER_CONFIG).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="api-key-input field-group">
            <label htmlFor="api-key">
              <span className="field-number">02</span>API Key
            </label>
            <div className="api-key-field">
              <input
                id="api-key"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={
                  hasEnvKey
                    ? '서버 키 사용 중 (직접 입력으로 덮어쓰기 가능)'
                    : PROVIDER_CONFIG[provider].placeholder
                }
              />
              <button
                className="btn-toggle-key"
                onClick={() => setShowKey(!showKey)}
                type="button"
              >
                {showKey ? '숨기기' : '보기'}
              </button>
            </div>
            <p className={`key-status ${hasEnvKey ? 'key-status--ready' : ''}`}>
              {hasEnvKey ? '.env 키가 연결되어 있습니다.' : '직접 입력하거나 서버 환경변수를 설정하세요.'}
            </p>
          </div>
        </aside>
      </main>

      {error && (
        <div className="error-banner">
          <p>{error}</p>
        </div>
      )}

      <section className="results-section">
        {components.length > 0 && (
          <div className="results-header">
            <div>
              <span className="panel-kicker">Generated</span>
              <h2>생성된 컴포넌트</h2>
            </div>
            <button className="btn-clear" onClick={clearAll}>
              전체 삭제
            </button>
          </div>
        )}

        {components.length === 0 && !isLoading && (
          <div className="empty-state">
            <div className="empty-sheet" aria-hidden="true">
              <span className="empty-sheet-corner empty-sheet-corner--tl" />
              <span className="empty-sheet-corner empty-sheet-corner--br" />
              <span className="empty-sheet-id">RC-000</span>
            </div>
            <div className="empty-copy">
              <span className="panel-kicker">Awaiting spec</span>
              <h2>새 컴포넌트를 생성해보세요.</h2>
              <p>프롬프트를 입력하면 첫 스펙 시트가 이 자리에 그려집니다.</p>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="loading-card">
            <div className="scan-line" aria-hidden="true" />
            <p>컴포넌트를 생성하고 있습니다...</p>
          </div>
        )}

        <div className="results-grid">
          {components.map((component, index) => (
            <ComponentCard
              key={component.id}
              component={component}
              partNumber={components.length - index}
              onRemove={removeComponent}
              onRegenerate={handleGenerate}
              isLoading={isLoading}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

export default App;

Frontend Context

React 19 + TypeScript + Vite. Components and hooks for the web UI, including state management, form handling, and react-live sandbox rendering.

Tech Stack & Constraints

- React 19 (hooks, functional components only)
- TypeScript (strict mode)
- Vite (dev server on port 5173)
- react-live (sandbox renderer for AI-generated code)
- Global React available (React.useState, React.useEffect, etc.)

No external CSS libraries. All styling is inline (style={{ ... }}).
No CSS Modules or Tailwind. Do not import CSS files in components.
Do not use React context Provider/Consumer except for react-live's LiveProvider.

File Organization

Components: components/PromptInput.tsx, ComponentCard.tsx, LivePreview.tsx, CodeView.tsx
Hooks: hooks/useComponentGenerator.ts (API calls, state)
Types: types/index.ts (TypeScript interfaces)
Main: App.tsx (root, API key input, provider selection)

Implementation Patterns

Component Structure:
  const ComponentName = () => {
    const [state, setState] = React.useState(initialValue);
    return <div style={{ /* inline styles */ }} {...props}></div>;
  };
  export default ComponentName;

Hook Structure (useComponentGenerator):
  - useState: components[], isLoading, error
  - Functions: generate(prompt, apiKey, provider), removeComponent(id), clearAll()
  - POST to /api/generate with body: { prompt, apiKey?, provider }
  - Handle response.error and set error state
  - Catch network errors and display in UI

Form Submission (PromptInput):
  - Controlled input with onChange
  - Button click triggers onSubmit (parent passes callback)
  - Disable button during isLoading
  - Show error message if error state exists

LivePreview (react-live integration):
  - Wrap AI-generated code in <LiveProvider code={code}>
  - Use <LiveEditor /> for editable display
  - Use <LivePreview /> to render live output
  - Catch runtime errors and display in error boundary
  - Set scope={{ React }} so global React is available in sandbox

CodeView (code display):
  - Display code as pre/code block
  - Optional syntax highlighting (future enhancement)
  - Copy-to-clipboard button (optional)

Local Golden Rules

- Always validate AI-generated code syntax before passing to react-live.
- Do not render multiple components from one AI call.
- Catch and display render errors from react-live.
- All component inputs must go through API (no direct AI calls from frontend).
- Use types/index.ts for GeneratedComponent interface.

Testing Strategy

Manual: bun run dev, then interact with forms and live preview.
Linting: bun run lint (ESLint across src/).
Type Checking: tsc (runs during build).

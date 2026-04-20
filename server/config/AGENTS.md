Configuration & Constants

SYSTEM_PROMPT and environment configuration for AI component generation.

Key Responsibilities

Define SYSTEM_PROMPT: React component generation rules (single component, inline styles, render() call, no imports, no type annotations, pure JavaScript only).

Define CORS_HEADERS: Access-Control-Allow-Origin, Access-Control-Allow-Methods, Access-Control-Allow-Headers.

Read ENV_KEYS: ANTHROPIC_API_KEY, GOOGLE_API_KEY from process.env. Type: Record<Provider, string | undefined>.

Implementation Patterns

SYSTEM_PROMPT structure:
- Lead with role: "You are a React component generator."
- List rules (1 component, inline styles only, render() call, no imports, no type annotations)
- Example output format (self-contained component with React.useState, inline styles)
- End with: "Respond with ONLY the code block — no explanations, no markdown"

CORS_HEADERS constant:
- Access-Control-Allow-Origin: '*'
- Access-Control-Allow-Methods: 'GET, POST, OPTIONS'
- Access-Control-Allow-Headers: 'Content-Type'
- Exported for use in all route handlers

ENV_KEYS type definition:
  type Provider = 'anthropic' | 'google';
  const ENV_KEYS: Record<Provider, string | undefined> = {
    anthropic: process.env.ANTHROPIC_API_KEY,
    google: process.env.GOOGLE_API_KEY,
  };

Local Golden Rules

- SYSTEM_PROMPT must be a string constant, not generated dynamically.
- CORS_HEADERS must include all three Access-Control-Allow-* fields.
- ENV_KEYS must be read once at startup, not on every request (for performance).
- Do not mutate ENV_KEYS or CORS_HEADERS after definition.
- Provider type must remain 'anthropic' | 'google' (if new providers added, extend type + ENV_KEYS).

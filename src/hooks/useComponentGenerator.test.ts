import { describe, it, expect } from 'vitest';

const STORAGE_KEY = 'componentHistory';
const MAX_COMPONENTS = 20;

interface StoredComponent {
  id: string;
  prompt: string;
  code: string;
  createdAt: string;
}

function serializeComponent(component: { id: string; prompt: string; code: string; createdAt: Date }): StoredComponent {
  return {
    id: component.id,
    prompt: component.prompt,
    code: component.code,
    createdAt: component.createdAt.toISOString(),
  };
}

function deserializeComponent(stored: StoredComponent) {
  return {
    ...stored,
    createdAt: new Date(stored.createdAt),
  };
}

describe('Component Serialization', () => {
  it('should serialize component with Date to ISO string', () => {
    const component = {
      id: 'test-1',
      prompt: 'Create a button',
      code: '<button>Click me</button>',
      createdAt: new Date('2026-08-13T10:00:00Z'),
    };

    const serialized = serializeComponent(component);

    expect(serialized.createdAt).toBe('2026-08-13T10:00:00.000Z');
    expect(typeof serialized.createdAt).toBe('string');
  });

  it('should deserialize component back to Date object', () => {
    const stored: StoredComponent = {
      id: 'test-1',
      prompt: 'Create a button',
      code: '<button>Click me</button>',
      createdAt: '2026-08-13T10:00:00.000Z',
    };

    const deserialized = deserializeComponent(stored);

    expect(deserialized.createdAt instanceof Date).toBe(true);
    expect(deserialized.createdAt.toISOString()).toBe('2026-08-13T10:00:00.000Z');
  });

  it('should handle multiple components serialization', () => {
    const components = [
      {
        id: 'test-1',
        prompt: 'Create a button',
        code: '<button>Click me</button>',
        createdAt: new Date('2026-08-13T10:00:00Z'),
      },
      {
        id: 'test-2',
        prompt: 'Create a card',
        code: '<div class="card">Card</div>',
        createdAt: new Date('2026-08-13T11:00:00Z'),
      },
    ];

    const serialized = components.map(serializeComponent);
    const deserialized = serialized.map(deserializeComponent);

    expect(deserialized).toHaveLength(2);
    expect(deserialized[0].id).toBe('test-1');
    expect(deserialized[1].id).toBe('test-2');
    expect(deserialized[0].createdAt instanceof Date).toBe(true);
  });

  it('should limit to MAX_COMPONENTS when saving', () => {
    const components = Array.from({ length: 25 }, (_, i) => ({
      id: `test-${i}`,
      prompt: `Prompt ${i}`,
      code: `Code ${i}`,
      createdAt: new Date(`2026-08-13T${String(i).padStart(2, '0')}:00:00Z`),
    }));

    const toSave = components.slice(0, MAX_COMPONENTS);
    expect(toSave).toHaveLength(20);

    const serialized = toSave.map(serializeComponent);
    expect(serialized).toHaveLength(20);
  });
});

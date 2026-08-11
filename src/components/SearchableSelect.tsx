import { useEffect, useId, useRef, useState } from 'react';

export interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  id,
  placeholder = '검색...',
}: SearchableSelectProps) {
  const generatedId = useId();
  const baseId = id ?? generatedId;
  const listboxId = `${baseId}-listbox`;

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((option) => option.value === value) ?? null;
  const filtered = isOpen
    ? options.filter((option) => option.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  function openAndFocus() {
    const selectedIndex = options.findIndex((option) => option.value === value);
    setIsOpen(true);
    setQuery('');
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function closeAndReset() {
    setIsOpen(false);
    setQuery('');
  }

  function commit(optionValue: string) {
    onChange(optionValue);
    closeAndReset();
  }

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        closeAndReset();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    setIsOpen(true);
    setQuery(event.target.value);
    setHighlightedIndex(0);
  }

  function handleBlur() {
    requestAnimationFrame(() => {
      if (rootRef.current && !rootRef.current.contains(document.activeElement)) {
        closeAndReset();
      }
    });
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen) {
      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openAndFocus();
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setHighlightedIndex((index) => Math.min(index + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setHighlightedIndex((index) => Math.max(index - 1, 0));
        break;
      case 'Home':
        event.preventDefault();
        setHighlightedIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setHighlightedIndex(filtered.length - 1);
        break;
      case 'Enter':
        event.preventDefault();
        if (filtered[highlightedIndex]) commit(filtered[highlightedIndex].value);
        break;
      case 'Escape':
        event.preventDefault();
        closeAndReset();
        inputRef.current?.blur();
        break;
      default:
        break;
    }
  }

  const activeOption = filtered[highlightedIndex];
  const activeOptionId = activeOption ? `${baseId}-option-${activeOption.value}` : undefined;

  return (
    <div className="searchable-select" ref={rootRef}>
      <div
        className={`searchable-select__control ${isOpen ? 'searchable-select__control--open' : ''}`}
        onClick={() => !isOpen && openAndFocus()}
      >
        {selected && (
          <span className="searchable-select__badge" aria-hidden="true">
            {selected.label.charAt(0)}
          </span>
        )}
        <input
          ref={inputRef}
          id={baseId}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeOptionId}
          className="searchable-select__input"
          value={isOpen ? query : selected?.label ?? ''}
          placeholder={isOpen ? placeholder : ''}
          onChange={handleInputChange}
          onFocus={() => !isOpen && openAndFocus()}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        <span
          className={`searchable-select__chevron ${isOpen ? 'searchable-select__chevron--open' : ''}`}
          aria-hidden="true"
        >
          ⌄
        </span>
      </div>

      {isOpen && (
        <ul id={listboxId} role="listbox" className="searchable-select__panel">
          {filtered.length === 0 && (
            <li className="searchable-select__empty" role="presentation">
              일치하는 결과가 없습니다
            </li>
          )}
          {filtered.map((option, index) => (
            <li
              key={option.value}
              id={`${baseId}-option-${option.value}`}
              role="option"
              aria-selected={option.value === value}
              className={`searchable-select__option ${
                index === highlightedIndex ? 'searchable-select__option--active' : ''
              }`}
              onMouseEnter={() => setHighlightedIndex(index)}
              onMouseDown={(event) => {
                event.preventDefault();
                commit(option.value);
              }}
            >
              <span className="searchable-select__badge searchable-select__badge--sm" aria-hidden="true">
                {option.label.charAt(0)}
              </span>
              {option.label}
              {option.value === value && (
                <span className="searchable-select__check" aria-hidden="true">
                  ✓
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

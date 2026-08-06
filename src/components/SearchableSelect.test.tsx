import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchableSelect } from './SearchableSelect';

const OPTIONS = [
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'google', label: 'Google' },
];

describe('SearchableSelect', () => {
  it('닫혀 있을 때 선택된 라벨을 보여준다', () => {
    render(<SearchableSelect options={OPTIONS} value="anthropic" onChange={vi.fn()} />);
    expect(screen.getByRole('combobox')).toHaveValue('Anthropic');
  });

  it('클릭하면 열리고 전체 옵션을 보여준다', async () => {
    const user = userEvent.setup();
    render(<SearchableSelect options={OPTIONS} value="anthropic" onChange={vi.fn()} />);

    await user.click(screen.getByRole('combobox'));

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(2);
  });

  it('입력한 글자로 옵션을 필터링한다', async () => {
    const user = userEvent.setup();
    render(<SearchableSelect options={OPTIONS} value="anthropic" onChange={vi.fn()} />);

    await user.click(screen.getByRole('combobox'));
    await user.type(screen.getByRole('combobox'), 'goo');

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent('Google');
  });

  it('옵션을 클릭하면 onChange가 호출되고 닫힌다', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<SearchableSelect options={OPTIONS} value="anthropic" onChange={onChange} />);

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: /Google/ }));

    expect(onChange).toHaveBeenCalledWith('google');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('일치하는 옵션이 없으면 안내 문구를 보여준다', async () => {
    const user = userEvent.setup();
    render(<SearchableSelect options={OPTIONS} value="anthropic" onChange={vi.fn()} />);

    await user.click(screen.getByRole('combobox'));
    await user.type(screen.getByRole('combobox'), 'zzz');

    expect(screen.getByText('일치하는 결과가 없습니다')).toBeInTheDocument();
  });

  it('ArrowDown과 Enter로 옵션을 선택할 수 있다', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<SearchableSelect options={OPTIONS} value="anthropic" onChange={onChange} />);

    const combobox = screen.getByRole('combobox');
    await user.click(combobox);
    await user.keyboard('{ArrowDown}{Enter}');

    expect(onChange).toHaveBeenCalledWith('google');
  });

  it('Escape를 누르면 값 변경 없이 닫힌다', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<SearchableSelect options={OPTIONS} value="anthropic" onChange={onChange} />);

    const combobox = screen.getByRole('combobox');
    await user.click(combobox);
    await user.keyboard('{Escape}');

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});

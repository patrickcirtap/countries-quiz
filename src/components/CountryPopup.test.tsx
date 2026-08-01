import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CountryPopup } from './CountryPopup';

let onResize: Mock<() => void>;

function renderPopup(overrides: Partial<Parameters<typeof CountryPopup>[0]>) {
  return render(
    <CountryPopup
      fullName="France"
      capitalCity="Paris"
      revealed={false}
      onResize={onResize}
      {...overrides}
    />,
  );
}

const shown = (line: Element) =>
  line.querySelector(
    '.country-popup-value > b:not(.country-popup-value-hidden)',
  )?.textContent;

beforeEach(() => {
  onResize = vi.fn();
});

describe('CountryPopup', () => {
  it('offers two hidden hints for an unguessed country', () => {
    const { container } = renderPopup({});

    expect(screen.getByText('Click for hints:')).toBeInTheDocument();
    const hints = container.querySelectorAll('.country-popup-hint');
    expect(hints).toHaveLength(2);
    expect(shown(hints[0])).toBe('???');
    expect(shown(hints[1])).toBe('???');
  });

  it('reveals each hint independently', () => {
    const { container } = renderPopup({});
    const [nameLine, capitalLine] = [
      ...container.querySelectorAll('.country-popup-hint'),
    ];

    fireEvent.click(nameLine);
    expect(shown(nameLine)).toBe('F -  -  -  -  - ');
    expect(shown(capitalLine)).toBe('???');

    fireEvent.click(capitalLine);
    expect(shown(capitalLine)).toBe('Paris');
  });

  it('reserves the answer width so the popup cannot grow', () => {
    const { container } = renderPopup({});
    const hidden = [
      ...container.querySelectorAll('.country-popup-value-hidden'),
    ].map((n) => n.textContent);

    // The answers are laid out from the start, merely invisible.
    expect(hidden).toContain('F -  -  -  -  - ');
    expect(hidden).toContain('Paris');
  });

  it('shows the answer outright when revealed', () => {
    const { container } = renderPopup({ revealed: true });

    expect(screen.getByText('France')).toBeInTheDocument();
    expect(screen.getByText('Paris')).toBeInTheDocument();
    expect(screen.queryByText('Click for hints:')).not.toBeInTheDocument();
    expect(container.querySelectorAll('.country-popup-hint')).toHaveLength(0);
  });

  it('falls back to Unknown where no capital is recorded', () => {
    renderPopup({ revealed: true, capitalCity: '' });
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  it('asks to be re-measured when it mounts and when revealed changes', () => {
    const { rerender } = renderPopup({});
    expect(onResize).toHaveBeenCalledTimes(1);

    rerender(
      <CountryPopup
        fullName="France"
        capitalCity="Paris"
        revealed
        onResize={onResize}
      />,
    );
    expect(onResize).toHaveBeenCalledTimes(2);
  });
});

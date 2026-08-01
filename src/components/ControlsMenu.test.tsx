import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ControlsMenu } from './ControlsMenu';

function openMenu() {
  fireEvent.click(screen.getByRole('button', { name: /additional options/i }));
}

let onResetZoom: Mock<() => void>;
let onToggleNames: Mock<() => void>;
let onToggleMarkers: Mock<() => void>;
let onShowHint: Mock<() => void>;
let onGiveUp: Mock<() => void>;

function renderMenu(namesOn = true, markersOn = false, gameOver = false) {
  return render(
    <ControlsMenu
      onResetZoom={onResetZoom}
      namesOn={namesOn}
      onToggleNames={onToggleNames}
      markersOn={markersOn}
      onToggleMarkers={onToggleMarkers}
      onShowHint={onShowHint}
      onGiveUp={onGiveUp}
      gameOver={gameOver}
    />,
  );
}

beforeEach(() => {
  onResetZoom = vi.fn();
  onToggleNames = vi.fn();
  onToggleMarkers = vi.fn();
  onShowHint = vi.fn();
  onGiveUp = vi.fn();
});

describe('ControlsMenu', () => {
  it('starts closed', () => {
    renderMenu();
    const button = screen.getByRole('button', { name: /additional options/i });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('opens to show the five options', () => {
    renderMenu();
    openMenu();

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /reset zoom/i })).toBeVisible();
    expect(
      screen.getByRole('menuitemcheckbox', { name: /toggle names/i }),
    ).toBeVisible();
    expect(
      screen.getByRole('menuitemcheckbox', { name: /toggle markers/i }),
    ).toBeVisible();
    expect(screen.getByRole('menuitem', { name: /^hint$/i })).toBeVisible();
    expect(screen.getByRole('menuitem', { name: /give up/i })).toBeVisible();
  });

  it('requests give up and closes the menu', () => {
    renderMenu();
    openMenu();

    fireEvent.click(screen.getByRole('menuitem', { name: /give up/i }));

    expect(onGiveUp).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('disables give up once the game is over (given up or won)', () => {
    renderMenu(true, false, true);
    openMenu();

    const giveUp = screen.getByRole('menuitem', { name: /give up/i });
    expect(giveUp).toBeDisabled();

    fireEvent.click(giveUp);
    expect(onGiveUp).not.toHaveBeenCalled();
  });

  it('requests the hint and closes the menu', () => {
    renderMenu();
    openMenu();

    fireEvent.click(screen.getByRole('menuitem', { name: /^hint$/i }));

    expect(onShowHint).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes when the button is pressed again', () => {
    renderMenu();
    openMenu();
    openMenu();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes on Escape and on an outside click', () => {
    renderMenu();

    openMenu();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    openMenu();
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('resets the zoom and closes the menu', () => {
    renderMenu();
    openMenu();

    fireEvent.click(screen.getByRole('menuitem', { name: /reset zoom/i }));

    expect(onResetZoom).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('reports names toggles, closes, and reflects the current setting', () => {
    renderMenu(true);
    openMenu();

    const names = screen.getByRole('menuitemcheckbox', {
      name: /toggle names/i,
    });
    expect(names).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(names);
    expect(onToggleNames).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    cleanup();
    renderMenu(false);
    openMenu();
    expect(
      screen.getByRole('menuitemcheckbox', { name: /toggle names/i }),
    ).toHaveAttribute('aria-checked', 'false');
  });

  it('reports markers toggles, closes, and reflects the current setting', () => {
    renderMenu(true, false);
    openMenu();

    const markers = screen.getByRole('menuitemcheckbox', {
      name: /toggle markers/i,
    });
    expect(markers).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(markers);
    expect(onToggleMarkers).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    cleanup();
    renderMenu(true, true);
    openMenu();
    expect(
      screen.getByRole('menuitemcheckbox', { name: /toggle markers/i }),
    ).toHaveAttribute('aria-checked', 'true');
  });
});

import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Browser } from 'leaflet';
import { ControlsMenu } from './ControlsMenu';
import { HintDialog } from './HintDialog';
import { ConfirmDialog } from './ConfirmDialog';
import { CompletionDialog } from './CompletionDialog';
import { CountryPopup } from './CountryPopup';
import { useWorldMap } from '../hooks/useWorldMap';
import { useGameState } from '../hooks/useGameState';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback';
import { useUnloadWarning } from '../hooks/useUnloadWarning';

const DEBOUNCE_MS = 400;

export function WorldMap() {
  useUnloadWarning();
  const inputRef = useRef<HTMLInputElement>(null);
  const { status, data, countries, guessedCount, total, unguessed, guess } =
    useGameState();
  // A detached node React portals into; Leaflet then owns where it is shown.
  const [popupNode] = useState(() => document.createElement('div'));
  const [popupIsoName, setPopupIsoName] = useState<string | null>(null);
  // Only refocus on desktop; on touch devices this would pop the keyboard.
  const focusInputOnDesktop = () => {
    if (window.matchMedia('(pointer: fine)').matches) {
      inputRef.current?.focus();
    }
  };
  const {
    containerRef,
    markGuessed,
    resetView,
    showMarkers,
    hideMarkers,
    revealRemaining,
    openPopup,
    refreshPopup,
  } = useWorldMap(data, {
    onMapInteraction: focusInputOnDesktop,
    onCountryClick: (isoName, latlng) => {
      setPopupIsoName(isoName);
      // Opened here rather than in an effect so Leaflet has the click position;
      // React fills the node in the same commit, before Leaflet measures it.
      openPopup(latlng, popupNode);
    },
    onPopupClose: () => setPopupIsoName(null),
  });
  const [input, setInput] = useState('');
  const [isNamesOn, setIsNamesOn] = useState(true);
  const [isMarkersOn, setIsMarkersOn] = useState(false);
  const [isHintOpen, setIsHintOpen] = useState(false);
  const [isConfirmingGiveUp, setIsConfirmingGiveUp] = useState(false);
  const [isGivenUp, setIsGivenUp] = useState(false);
  const [isCompletionSeen, setIsCompletionSeen] = useState(false);

  // Derived, not stored: no effect is needed to notice the game is won.
  const isComplete = total > 0 && guessedCount === total && !isGivenUp;
  const popupCountry = popupIsoName ? countries[popupIsoName] : null;

  const submitGuess = (value: string) => {
    const hit = guess(value);
    if (hit) {
      markGuessed(hit.isoName, hit);
      setInput('');
    }
  };
  const [runGuess, cancelGuess] = useDebouncedCallback(
    submitGuess,
    DEBOUNCE_MS,
  );

  const rootClasses = ['map-root'];
  if (Browser.touch) rootClasses.push('map-root-touch');
  if (!isNamesOn) rootClasses.push('map-root-hide-labels');

  return (
    <div className={rootClasses.join(' ')}>
      <div
        ref={containerRef}
        className="map"
        data-testid="world-map"
        aria-label="World map"
      />
      <form
        className="country-form"
        onSubmit={(event) => {
          event.preventDefault();
          // Enter checks straight away, so drop the run already waiting.
          cancelGuess();
          submitGuess(input);
        }}
      >
        <input
          ref={inputRef}
          className="country-input"
          type="text"
          placeholder="Enter a country..."
          aria-label="Enter a country"
          value={input}
          onChange={(event) => {
            const value = event.target.value;
            setInput(value);
            runGuess(value);
          }}
          maxLength={50}
          disabled={isGivenUp}
          autoFocus
        />
      </form>
      <ControlsMenu
        onResetZoom={() => {
          resetView();
          focusInputOnDesktop();
        }}
        isNamesOn={isNamesOn}
        onToggleNames={() => {
          setIsNamesOn((on) => !on);
          focusInputOnDesktop();
        }}
        isMarkersOn={isMarkersOn}
        onToggleMarkers={() => {
          const isTurningOn = !isMarkersOn;
          setIsMarkersOn(isTurningOn);
          if (isTurningOn) showMarkers(unguessed);
          else hideMarkers();
          focusInputOnDesktop();
        }}
        onShowHint={() => setIsHintOpen(true)}
        onGiveUp={() => setIsConfirmingGiveUp(true)}
        isGameOver={isGivenUp || isComplete}
      />
      <div className="counter" data-testid="counter" aria-live="polite">
        {guessedCount} / {total}
      </div>
      {isHintOpen && (
        <HintDialog
          onClose={() => {
            setIsHintOpen(false);
            focusInputOnDesktop();
          }}
        />
      )}
      {isConfirmingGiveUp && (
        <ConfirmDialog
          message="Are you sure you want to give up?"
          onCancel={() => {
            setIsConfirmingGiveUp(false);
            focusInputOnDesktop();
          }}
          onConfirm={() => {
            setIsConfirmingGiveUp(false);
            // A guess still waiting out its debounce would land after the game
            // has ended, painting a revealed country red.
            cancelGuess();
            setIsGivenUp(true);
            setIsMarkersOn(true);
            revealRemaining(unguessed);
          }}
        />
      )}
      {popupCountry &&
        createPortal(
          <CountryPopup
            // Remount per country so a revealed hint never carries over.
            key={popupIsoName}
            fullName={popupCountry.fullName}
            capitalCity={popupCountry.capitalCity}
            // Giving up reveals the answers without marking anything guessed.
            isRevealed={popupCountry.isGuessed || isGivenUp}
            onResize={refreshPopup}
          />,
          popupNode,
        )}
      {isComplete && !isCompletionSeen && (
        <CompletionDialog onClose={() => setIsCompletionSeen(true)} />
      )}
      {status !== 'ready' && (
        <div className="map-overlay" role="status">
          {status === 'loading' ? 'Loading...' : 'Could not load the map.'}
        </div>
      )}
    </div>
  );
}

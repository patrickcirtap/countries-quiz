import { useEffect, useState } from 'react';
import { firstLetterHint } from '../lib/firstLetterHint';

interface CountryPopupProps {
  fullName: string;
  capitalCity: string;
  /** True once the answer may be shown outright: guessed, or the game is over. */
  isRevealed: boolean;
  onResize: () => void;
}

/**
 * Stacks the answer and the "???" placeholder in one grid cell so the line is
 * always as wide as the answer. The popup is therefore at its final width
 * before anything is shown, and never grows when a hint is clicked.
 */
function HintValue({ isShown, value }: { isShown: boolean; value: string }) {
  return (
    <span className="country-popup-value">
      <b className={isShown ? undefined : 'country-popup-value-hidden'}>
        {value}
      </b>
      <b className={isShown ? 'country-popup-value-hidden' : undefined}>???</b>
    </span>
  );
}

export function CountryPopup({
  fullName,
  capitalCity,
  isRevealed,
  onResize,
}: CountryPopupProps) {
  const [isNameShown, setIsNameShown] = useState(false);
  const [isCapitalShown, setIsCapitalShown] = useState(false);

  // Leaflet measures the popup when it opens, which happens before React has
  // filled this node, so ask it to measure again once the content is in.
  useEffect(() => {
    onResize();
  }, [isRevealed, onResize]);

  const isCapitalKnown = capitalCity !== '';
  // Italic marks it as a stand-in rather than the name of a real city.
  const capital = isCapitalKnown ? <b>{capitalCity}</b> : <i>Unknown</i>;

  if (isRevealed) {
    return (
      <>
        <p className="country-popup-name">{fullName}</p>
        <p className="country-popup-line">
          <i>Capital city</i>: {capital}
        </p>
      </>
    );
  }

  return (
    <>
      <p className="country-popup-title">Click for hints:</p>
      <button
        type="button"
        className="country-popup-line country-popup-hint"
        onClick={() => setIsNameShown(true)}
      >
        <i>First letter</i>:{' '}
        <HintValue isShown={isNameShown} value={firstLetterHint(fullName)} />
      </button>
      {isCapitalKnown ? (
        <button
          type="button"
          className="country-popup-line country-popup-hint"
          onClick={() => setIsCapitalShown(true)}
        >
          <i>Capital city</i>:{' '}
          <HintValue isShown={isCapitalShown} value={capitalCity} />
        </button>
      ) : (
        // Nothing to reveal, so say so rather than hide it behind a click.
        <p className="country-popup-line">
          <i>Capital city</i>: {capital}
        </p>
      )}
    </>
  );
}

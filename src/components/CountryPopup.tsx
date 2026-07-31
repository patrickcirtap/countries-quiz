import { useEffect, useState } from 'react';
import { firstLetterHint } from '../lib/firstLetterHint';

interface CountryPopupProps {
  fullName: string;
  capitalCity: string;
  isGuessed: boolean;
  onResize: () => void;
}

/**
 * Stacks the answer and the "???" placeholder in one grid cell so the line is
 * always as wide as the answer. The popup is therefore at its final width
 * before anything is revealed, and never grows when a hint is clicked.
 */
function HintValue({ revealed, value }: { revealed: boolean; value: string }) {
  return (
    <span className="country-popup-value">
      <b className={revealed ? undefined : 'country-popup-value-hidden'}>
        {value}
      </b>
      <b className={revealed ? 'country-popup-value-hidden' : undefined}>???</b>
    </span>
  );
}

export function CountryPopup({
  fullName,
  capitalCity,
  isGuessed,
  onResize,
}: CountryPopupProps) {
  const [nameShown, setNameShown] = useState(false);
  const [capitalShown, setCapitalShown] = useState(false);

  // Leaflet measures the popup when it opens, which happens before React has
  // filled this node, so ask it to measure again once the content is in.
  useEffect(() => {
    onResize();
  }, [isGuessed, onResize]);

  const capital = capitalCity || 'Unknown';

  if (isGuessed) {
    return (
      <>
        <p className="country-popup-name">{fullName}</p>
        <p className="country-popup-line">
          <i>Capital city</i>: <b>{capital}</b>
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
        onClick={() => setNameShown(true)}
      >
        <i>First letter</i>:{' '}
        <HintValue revealed={nameShown} value={firstLetterHint(fullName)} />
      </button>
      <button
        type="button"
        className="country-popup-line country-popup-hint"
        onClick={() => setCapitalShown(true)}
      >
        <i>Capital city</i>:{' '}
        <HintValue revealed={capitalShown} value={capital} />
      </button>
    </>
  );
}

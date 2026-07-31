/**
 * Masks a country name, keeping the first letter of each word and replacing
 * every other letter with a dash: "Saint Kitts" becomes "S - - - - K - - - -".
 */
export function firstLetterHint(name: string): string {
  let hint = name.slice(0, 1);
  for (let i = 1; i < name.length; i++) {
    if (name[i - 1] === ' ') hint += name[i];
    else if (name[i] === ' ') hint += ' ';
    else hint += ' - ';
  }
  return hint;
}

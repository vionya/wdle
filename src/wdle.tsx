import React, { useEffect, useRef, useState } from 'react';
import yippee from './assets/yippee.gif';
import validWords from './data/valid_words_list.json';
import wordData from './data/words_list.json';
import { OnScreenKeyboard } from './keyboard';
import {
  CharStat,
  HandlerCallback,
  Row,
  RowParams,
  Rows
} from './types/wdle.d';
import './wdle.css';

// Taken from stackoverflow
function useEventListener(
  eventName: string,
  handler: HandlerCallback<void>,
  element = window
) {
  const savedHandler = useRef<typeof handler>();

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const isSupported = element && element.addEventListener;
    if (!isSupported) return;

    const eventListener: typeof handler = (event: any) =>
      savedHandler.current!(event);

    element.addEventListener(eventName, eventListener);

    return () => {
      element.removeEventListener(eventName, eventListener);
    };
  }, [eventName, element]);
}

const evaluateRow = (oldRow: Row, word: string): Row => {
  const row = structuredClone(oldRow);
  row.chars = new Array(5);

  // Generate an object containing the number of appearances of each character
  // in the word
  const charData = Object.fromEntries([...word].map((char) => [char, 0]));
  for (const char of word) {
    charData[char] += 1;
  }

  // First we need to pass over only the successful guesses
  // so that they can be shown in green without worrying about ordering
  for (const [char, charIndex] of [...word]
    .map((c, i) => [c, i])
    .filter((_, i) => word.charAt(i) === row.guess.charAt(i)) as [
    string,
    number
  ][]) {
    row.chars![charIndex] = CharStat.RIGHT;
    charData[char] -= 1;
  }

  // Now we iterate over every other character in the guess
  [...row.guess, ...' '.repeat(5 - row.guess.length)].forEach(
    (char, charIndex) => {
      // If the index already has been modified as successful, we ignore it
      if (row.chars![charIndex] !== undefined) return;
      if (word.includes(char) && charData[char] > 0) {
        // If the word includes the guessed character and there are 1 or more uses
        // of the character remaining, we mark it as a "close" guess (orange)
        row.chars![charIndex] = CharStat.CLOSE;
        charData[char] -= 1;
      } else {
        // In any other case, it's a "bad" guess and colored grey
        row.chars![charIndex] = CharStat.WRONG;
      }
    }
  );
  return row;
};

function rowToEmoji(row: Row, word: string) {
  const evaluated = evaluateRow(row, word);
  let rowString = '';
  for (const state of evaluated.chars ?? []) {
    switch (state) {
      case CharStat.CLOSE:
        rowString += '🟨';
        break;
      case CharStat.RIGHT:
        rowString += '🟩';
        break;
      case CharStat.WRONG:
        rowString += '⬛';
        break;
    }
  }
  return rowString;
}

function handleKeyboardEvent(
  rowData: Rows,
  idx: number,
  key: string,
  setActiveIdx: React.Dispatch<React.SetStateAction<number>>,
  active: boolean,
  setRowData: React.Dispatch<React.SetStateAction<Rows>>
) {
  let newGuess = rowData[idx].guess;

  if (key === 'Backspace') {
    // If backspace was pressed, remove the last character
    newGuess = newGuess.slice(0, rowData[idx].guess.length - 1);
  } else if (/^[A-Za-z]$/gi.test(key)) {
    // If the keycode is alpha, add the character
    newGuess = (rowData[idx].guess + key).toLowerCase();
  } else if (
    key === 'Enter' &&
    rowData[idx].guess.length === 5 &&
    validWords.includes(newGuess.toLowerCase())
  ) {
    // If enter was pressed and the guess is 5 characters long, advance the active guess
    setActiveIdx(idx + 1);
  }

  // If the row is active and the guess fits constraints, set the state
  if (newGuess.length <= 5 && active === true) {
    setRowData({ ...rowData, [idx]: { guess: newGuess } });
  }
}

function WdleRow({
  rowData,
  setRowData,
  word,
  idx,
  activeIdx,
  setActiveIdx
}: RowParams): React.ReactElement {
  // If this is the currently active row
  const active = activeIdx === idx;
  // If the outcome should be displayed
  const showOutcome =
    rowData[idx].guess.length === 5 && (activeIdx > idx || activeIdx === -1);
  // The main className, depending on whether the row is active or not
  const mainClassName = 'wdleRow ' + (active ? 'rowActive' : '');

  useEventListener('keydown', ({ key }: KeyboardEvent) =>
    handleKeyboardEvent(rowData, idx, key, setActiveIdx, active, setRowData)
  );

  // It's been modified by now so we can just assign to it
  const guess = rowData[idx].guess;

  // Generate an object containing the number of appearances of each character
  // in the word
  const charData = Object.fromEntries([...word].map((char) => [char, 0]));
  for (const char of word) {
    charData[char] += 1;
  }

  // If no guess has been entered, display an empty row
  const uiEntries = Object.fromEntries(
    [...Array(5).keys()].map((i) => [
      i,
      showOutcome ? null : (
        <div key={`${i}`} className={`baseGuess wdleGuessBad`}>
          {guess.charAt(i).toUpperCase() || ' '}
        </div>
      )
    ])
  );

  // If the outcome can be shown, calculate the successes
  if (showOutcome) {
    const curRow = evaluateRow(rowData[idx], word);
    // First we need to pass over only the successful guesses
    // so that they can be shown in green without worrying about ordering
    for (const [char, charIndex] of [...guess].map((c, i) => [c, i]) as [
      string,
      number
    ][]) {
      let className = 'wdleGuess';
      switch (curRow.chars![charIndex]) {
        case CharStat.CLOSE:
          className += 'Close';
          charData[char] -= 1;
          break;
        case CharStat.RIGHT:
          className += 'Good';
          charData[char] -= 1;
          break;
        case CharStat.WRONG:
          className += 'Bad';
          break;
      }
      uiEntries[charIndex] = (
        <div key={`${char}-${charIndex}`} className={`baseGuess ${className}`}>
          {char.toUpperCase()}
        </div>
      );
    }
  }

  // Finally, we return the values of the UI entries object, with all
  // of the rows properly setup
  return <div className={mainClassName}>{Object.values(uiEntries)}</div>;
}

function WdleRoot() {
  const [word, setWord] = useState('');
  const [usedChars, setUsedChars] = useState<Set<string>>(new Set([]));

  const [resetVar, setReset] = useState(false);

  // Initalize the word
  useEffect(() => {
    setWord(wordData[Math.floor(Math.random() * wordData.length)]);
  }, [resetVar]);

  const numRows = 6;
  const [rowData, setRowData] = useState<Rows>(
    Object.fromEntries(
      [...Array(numRows).keys()].map((k) => [k, { guess: '' }])
    )
  );
  const [active, setActive] = useState(0);

  // Reset the game to a cleared state to replay
  const reset = () => {
    // Reset used chars
    setUsedChars(new Set([]));
    // Reset active row
    setActive(0);
    // Reset row data
    setRowData(
      Object.fromEntries(
        [...Array(numRows).keys()].map((k) => [k, { guess: '' }])
      )
    );
    // Trigger word reset
    setReset(!resetVar);
  };

  // Generate {numRows} rows
  const rows: React.ReactElement[] = [];
  for (let i = 0; i < numRows; i++) {
    rows.push(
      <WdleRow
        rowData={rowData}
        setRowData={setRowData}
        word={word}
        idx={i}
        activeIdx={active}
        setActiveIdx={setActive}
        key={i}
      />
    );
  }

  useEffect(() => {
    // If there is no previous entry, ignore
    if (!rowData[active - 1]) return;

    // Update the set of invalid characters
    [...rowData[active - 1].guess].forEach((char) => {
      setUsedChars(usedChars.add(char));
    });

    // If the previous entry === the word, user has won
    if (rowData[active - 1].guess === word) {
      setActive(-1);
    }
  }, [rowData, active, word, usedChars]);

  const guesses = Object.values(rowData).filter(
    (row) => row.guess.length === 5
  );

  // Check if the player has failed to guess the word
  // (the number of active >= max number of rows and no guesses match the word)
  const isFailed = () => {
    return active >= numRows && !guesses.some((row) => row.guess === word);
  };

  // Check if the game has concluded
  const isCompleted = () => {
    return active === -1 || isFailed();
  };

  return (
    <>
      <div id="wdleTitle">
        <h1>wdle 7.0</h1>
        <p>"like wordle, but worse"</p>
      </div>

      <div className={'wdleGameRoot' + (isCompleted() ? ' completed' : '')}>
        <div className="wdleGridRoot">{rows}</div>
      </div>

      {isCompleted() && (
        <div className="wdleRootCompletionModal">
          {active === -1 && (
            <>
              <h1 className="wdleRootSuccess">You got it!</h1>
              <img
                className="yippee"
                src={yippee}
                alt="autism creature, YIPPEE"
              />
              <p>You used {guesses.length} turn(s)</p>
            </>
          )}
          {isFailed() && (
            <>
              <h1 className="wdleRootFailure">
                Better luck next time? ¯\_(ツ)_/¯
              </h1>
              <p>
                The correct word was <code>{word}</code>
              </p>
            </>
          )}
          <div>
            <button
              onClick={() => {
                let toCopy = `wdle - "${word}" - `;
                toCopy += (isFailed() ? 'FAILED' : guesses.length) + '/6\n';
                toCopy += guesses
                  .map((row) => rowToEmoji(row, word))
                  .join('\n');

                navigator.clipboard.writeText(toCopy);
              }}
            >
              Copy Results
            </button>
            <button
              onClick={() => {
                reset();
                return false;
              }}
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      <OnScreenKeyboard
        usedChars={usedChars}
        word={word}
        submittedGuesses={Object.values(rowData)
          .slice(0, active === -1 ? Object.keys(rowData).length : active)
          .map((row: Row) => row.guess)}
        done={isCompleted()}
      />
    </>
  );
}

export default WdleRoot;

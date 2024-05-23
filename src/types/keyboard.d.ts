export interface KeyboardDataParams {
  usedChars: Set<string>;
  word: string;
  submittedGuesses: string[];
  done?: boolean;
}
export interface KeyParams {
  keyName: string;
  special?: boolean;
  labelOverride?: string;
  data?: KeyboardDataParams;
}

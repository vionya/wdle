import React from 'react';

export const enum CharStat {
  WRONG = 0,
  RIGHT = 1,
  CLOSE = 2
}
export type Row = {
  guess: string;
  chars?: CharStat[];
};
export type Rows = {
  [key: number]: Row;
};
export interface RowParams {
  rowData: Rows;
  setRowData: React.Dispatch<React.SetStateAction<Rows>>;
  word: string;
  idx: number;
  activeIdx: number;
  setActiveIdx: React.Dispatch<React.SetStateAction<number>>;
}
export type HandlerCallback<T> = (event: any) => T;

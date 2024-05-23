import React from 'react';

export type PropertyOf<T> = T[keyof T];
export type RowData = { [key: number]: { guess: string } };
export interface RowParams {
  rowData: RowData;
  setRowData: React.Dispatch<React.SetStateAction<RowData>>;
  word: string;
  idx: number;
  activeIdx: number;
  setActiveIdx: React.Dispatch<React.SetStateAction<number>>;
}

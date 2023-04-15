//
// This file contains the list of supported currencies for the app.
// You can expand this file to include other currencies.
//
export const supportedCurrencies = ["USD"];

export const supportedCurrenciesSymbols = ["$"];

export const maxNumberOfDecimals = 2;

export const currencyRegExp = new RegExp(
  `^([${supportedCurrenciesSymbols
    .join()
    .trim()}])?(\\d)+(\\.\\d{1,${maxNumberOfDecimals}})?$`,
  "i"
);

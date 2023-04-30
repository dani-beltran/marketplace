import db from "@/db-client";

export const supportedCurrencies = ["USD"];
export const supportedCurrenciesSymbols = ["$"];
export const maxNumberOfDecimals = 2;

const currencyRegExp = new RegExp(
  `^([${supportedCurrenciesSymbols
    .join()
    .trim()}])?(\\d)+(\\.\\d{1,${maxNumberOfDecimals}})?$`,
  "i"
);

/**
 * Function that validates an amount of money string
 */
export const validateCurrency = (value: string) => {
  return currencyRegExp.test(value);
}

/**
 * Function that get a wallet from a user
 */
export const getUserWallet = async (userId: number) => {
  const wallet = await db.wallet.findFirst({
    where: {
      userId,
    },
  });
  return wallet;
}

/**
 * Function that creates a wallet for a user
 */
export const createUserWallet = async (userId: number, initialAmount?: string) => {
  if (initialAmount && !validateCurrency(initialAmount)) {
    throw new Error("Invalid amount");
  }
  const wallet = await db.wallet.create({
    data: {
      userId,
      balance: initialAmount ?? "0.00",
    },
  });
  return wallet;
}

/**
 * Function that updates the balance of a wallet
 */
export const updateWalletBalance = async (walletId: number, newBalance: string) => {
  if (!validateCurrency(newBalance)) {
    throw new Error("Invalid amount");
  }
  const wallet = await db.wallet.update({
    where: {
      id: walletId,
    },
    data: {
      balance: newBalance,
    },
  });
  return wallet;
}


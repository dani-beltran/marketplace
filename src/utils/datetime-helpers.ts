/**
 * Function to get the number of weeks between two dates.
 * @param startDate 
 * @param endDate 
 * @returns integer number of whole weeks between the two dates.
 */
export const getWeeksBetweenDates = (startDate: Date, endDate: Date) => {
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  const weeksBetween = (endDate.getTime() - startDate.getTime()) / oneWeek;
  return Math.floor(weeksBetween);
}

export const getWeeksBetweenDatesReminder = (startDate: Date, endDate: Date) => {
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  const weeksBetween = (endDate.getTime() - startDate.getTime()) / oneWeek;
  return weeksBetween % 1;
}

/**
 * Gets a DateTime and formats it to a string in the format YYYY-MM-DD
 * @param date 
 * @returns 
 */
export const formatDate = (date: Date) => {
  return [
    date.getFullYear(),
    padTo2Digits(date.getMonth() + 1),
    padTo2Digits(date.getDate()),
  ].join('-');
}

const padTo2Digits = (num: number) => {
  return num.toString().padStart(2, '0');
}
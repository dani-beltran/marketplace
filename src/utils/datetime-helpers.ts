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


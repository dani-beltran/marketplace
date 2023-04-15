import { getWeeksBetweenDates } from "./datetime-helpers";

describe("getWeeksBetweenDates", () => {
  it("getWeeksBetweenDates returns 0 if the dates are the same", () => {
    const startDate = new Date("2021-01-01");
    const endDate = new Date("2021-01-01");
    const weeksBetween = getWeeksBetweenDates(startDate, endDate);
    expect(weeksBetween).toBe(0);
  });

  it("getWeeksBetweenDates returns 1 if the dates are 7 days apart", () => {
    const startDate = new Date("2021-01-01");
    const endDate = new Date("2021-01-08");
    const weeksBetween = getWeeksBetweenDates(startDate, endDate);
    expect(weeksBetween).toBe(1);
  });

  it("getWeeksBetweenDates returns 0 if the dates are 6 days apart", () => {
    const startDate = new Date("2021-01-01");
    const endDate = new Date("2021-01-07");
    const weeksBetween = getWeeksBetweenDates(startDate, endDate);
    expect(weeksBetween).toBe(0);
  });

  it("getWeeksBetweenDates returns 1 if the dates are 8 days apart", () => {
    const startDate = new Date("2021-01-01");
    const endDate = new Date("2021-01-09");
    const weeksBetween = getWeeksBetweenDates(startDate, endDate);
    expect(weeksBetween).toBe(1);
  });

  it("getWeeksBetweenDates returns 2 if the dates are 15 days apart", () => {
    const startDate = new Date("2021-01-01");
    const endDate = new Date("2021-01-16");
    const weeksBetween = getWeeksBetweenDates(startDate, endDate);
    expect(weeksBetween).toBe(2);
  });

  it("getWeeksBetweenDates returns 3 if the dates are 21 days apart", () => {
    const startDate = new Date("2021-01-01");
    const endDate = new Date("2021-01-22");
    const weeksBetween = getWeeksBetweenDates(startDate, endDate);
    expect(weeksBetween).toBe(3);
  });

});

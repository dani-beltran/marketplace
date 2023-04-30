import ActionError from "@/utils/ActionError";
import { validateContractInput } from ".";
import { getMockContractInput } from "@/utils/mocks/contract";
import { LocalDate } from "@js-joda/core";

describe("validateContract", () => {
  it("should return true if the contract is valid", () => {
    const contract = getMockContractInput({
      hoursPerWeek: null,
      hourlyRate: null,
      totalHours: null,
      startDate: new Date(LocalDate.now().toString()),
      endDate: new Date(LocalDate.now().plusDays(1).toString()),
      totalCost: "1000",
    });
    const isValid = validateContractInput(contract);
    expect(isValid).toBe(true);
  });

  it("should throw an error if the contract is expired", () => {
    const contract = getMockContractInput({
      hourlyRate: "100",
      totalCost: "1000",
      startDate: new Date(LocalDate.now().toString()),
      endDate: new Date(LocalDate.now().toString()),
    });
    try {
      validateContractInput(contract);
      expect(true).toBe(false);
    } catch (error) {
      expect((<ActionError>error).message).toBe("The contract is expired");
      expect((<ActionError>error).name).toBe("BadRequest");
    }
  });

  it("should throw an error if the contract is starting in the past", () => {
    const contract = getMockContractInput({
      hourlyRate: "100",
      totalCost: "1000",
      startDate: new Date(LocalDate.now().minusDays(1).toString()),
      endDate: new Date(LocalDate.now().plusDays(1).toString()),
    });
    try {
      validateContractInput(contract);
      expect(true).toBe(false);
    } catch (error) {
      expect((<ActionError>error).message).toBe(
        "The contract is starting in the past"
      );
      expect((<ActionError>error).name).toBe("BadRequest");
    }
  });

  it("should throw an error if the contract is starting after it ends", () => {
    const contract = getMockContractInput({
      hourlyRate: "100",
      totalCost: "1000",
      startDate: new Date(LocalDate.now().plusDays(3).toString()),
      endDate: new Date(LocalDate.now().plusDays(1).toString()),
    });
    try {
      validateContractInput(contract);
      expect(true).toBe(false);
    } catch (error) {
      expect((<ActionError>error).message).toBe(
        "The contract is starting after it ends"
      );
      expect((<ActionError>error).name).toBe("BadRequest");
    }
  });

  it("should throw an error if the contract is missing an hourly rate when hours per week is set", () => {
    const contract = getMockContractInput({
      hoursPerWeek: 40,
      totalHours: 40,
      hourlyRate: null,
      totalCost: "1000",
      startDate: new Date(LocalDate.now().toString()),
      endDate: new Date(LocalDate.now().plusDays(7).toString()),
    });
    try {
      validateContractInput(contract);
      expect(true).toBe(false);
    } catch (error) {
      expect((<ActionError>error).message).toBe(
        "The contract is missing an hourly rate"
      );
      expect((<ActionError>error).name).toBe("BadRequest");
    }
  });

  it("should throw an error if the contract is missing an hourly rate when total hours is set", () => {
    const contract = getMockContractInput({
      hoursPerWeek: null,
      totalHours: 40,
      hourlyRate: null,
      totalCost: "1000",
      startDate: new Date(LocalDate.now().toString()),
      endDate: new Date(LocalDate.now().plusDays(7).toString()),
    });
    try {
      validateContractInput(contract);
      expect(true).toBe(false);
    } catch (error) {
      expect((<ActionError>error).message).toBe(
        "The contract is missing an hourly rate"
      );
      expect((<ActionError>error).name).toBe("BadRequest");
    }
  });

  it("should throw and error if the contract is missing total hours when hours per week is set", () => {
    const contract = getMockContractInput({
      hoursPerWeek: 40,
      totalHours: null,
      hourlyRate: "100",
      totalCost: "1000",
      startDate: new Date(LocalDate.now().toString()),
      endDate: new Date(LocalDate.now().plusDays(7).toString()),
    });
    try {
      validateContractInput(contract);
      expect(true).toBe(false);
    } catch (error) {
      expect((<ActionError>error).message).toBe(
        "The contract is missing total hours"
      );
      expect((<ActionError>error).name).toBe("BadRequest");
    }
  });

  it("should throw an error if the contract duration is not a whole number of weeks and this is required when hours per week is set", () => {
    const contract = getMockContractInput({
      hoursPerWeek: 40,
      totalHours: 40,
      hourlyRate: "100",
      totalCost: "1000",
      startDate: new Date(LocalDate.now().toString()),
      endDate: new Date(LocalDate.now().plusDays(8).toString()),
    });
    try {
      validateContractInput(contract);
      expect(true).toBe(false);
    } catch (error) {
      expect((<ActionError>error).message).toBe(
        "The contract duration is not a whole number of weeks and this is required when hours per week is set"
      );
      expect((<ActionError>error).name).toBe("BadRequest");
    }
  });

  it("should throw an error if the contract total hours does not match the calculated total hours from hours per week and start and end date", () => {
    const contract = getMockContractInput({
      hoursPerWeek: 40,
      totalHours: 80,
      hourlyRate: "100",
      totalCost: "1000",
      startDate: new Date(LocalDate.now().toString()),
      endDate: new Date(LocalDate.now().plusDays(28).toString()),
    });
    try {
      validateContractInput(contract);
      expect(true).toBe(false);
    } catch (error) {
      expect((<ActionError>error).message).toBe(
        "The contract total hours does not match the calculated total hours from hours per week and the duration of the contract"
      );
      expect((<ActionError>error).name).toBe("BadRequest");
    }
  });

  it("should throw an error if the contract total cost has the wrong format", () => {
    const contract = getMockContractInput({
      hoursPerWeek: null,
      totalHours: null,
      hourlyRate: null,
      totalCost: "1000.00.1231",
      startDate: new Date(LocalDate.now().toString()),
      endDate: new Date(LocalDate.now().plusDays(7).toString()),
    });
    try {
      validateContractInput(contract);
      expect(true).toBe(false);
    } catch (error) {
      expect((<ActionError>error).message).toBe(
        "The contract total cost has the wrong format"
      );
      expect((<ActionError>error).name).toBe("BadRequest");
    }
  });

  it("should throw an error if the contract total cost does not match the calculated total cost from hours and hourly rate", () => {
    const contract = getMockContractInput({
      hoursPerWeek: null,
      totalHours: 10,
      hourlyRate: "100",
      totalCost: "1000",
      startDate: new Date(LocalDate.now().toString()),
      endDate: new Date(LocalDate.now().plusDays(7).toString()),
    });
    try {
      validateContractInput(contract);
      expect(true).toBe(false);
    } catch (error) {
      expect((<ActionError>error).message).toBe(
        "The contract total cost does not match the calculated total cost from hours and hourly rate"
      );
      expect((<ActionError>error).name).toBe("BadRequest");
    }
  });

  it("should throw an error if contractor id is the same as client id", () => {
    const contract = getMockContractInput({
      contractorId: 1,
      clientId: 1,
      hourlyRate: null,
      totalCost: "1000",
      hoursPerWeek: null,
      totalHours: null,
    });
    try {
      validateContractInput(contract);
      expect(true).toBe(false);
    } catch (error) {
      expect((<ActionError>error).message).toBe(
        "The contractor and client cannot be the same person"
      );
      expect((<ActionError>error).name).toBe("BadRequest");
    }
  });

});

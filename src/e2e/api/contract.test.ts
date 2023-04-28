import { AxiosError } from "axios";
import { createContract } from "@/models/contract";
import { createUser } from "@/models/user";
import { createTestSession, deleteTestData } from "@/utils/test-helpers";
import { getMockContractInput } from "@/utils/mocks/contract";
import { getMockUserInput } from "@/utils/mocks/user";
import { Job, User } from "@/lib/prisma-client";
import httpRequest from "axios";
import { LocalDate } from "@js-joda/core";
import { createJob } from "@/models/job";
import { getMockJobInput } from "@/utils/mocks/job";

const endpointUrl = `http://${process.env.DOMAIN}/api/contracts`;
const namingPrefix = "contract-e2etest-";

describe("GET contract", () => {
  let clientUser: User;
  let contractorUser: User;
  let clientSessionToken: string;
  let adminUser: User;
  let adminSessionToken: string;
  let anotherClientUser: User;

  beforeAll(async () => {
    clientUser = await createUser(
      getMockUserInput({
        email: `${namingPrefix}client@testmail.com`,
        name: `${namingPrefix}client`,
      })
    );
    clientSessionToken = await createTestSession(clientUser.id);
    contractorUser = await createUser(
      getMockUserInput({
        email: `${namingPrefix}contractor@testmail.com`,
        name: `${namingPrefix}contractor`,
      })
    );
    anotherClientUser = await createUser(
      getMockUserInput({
        email: `${namingPrefix}anotherclient@testmail.com`,
        name: `${namingPrefix}another-client`,
      })
    );
    adminUser = await createUser(
      getMockUserInput({
        name: `${namingPrefix}admin`,
        email: `${namingPrefix}admin@testmail.com`,
        role: 'admin',
      })
    );
    adminSessionToken = await createTestSession(adminUser.id);
    await createContract(
      getMockContractInput({
        clientId: clientUser.id,
        contractorId: contractorUser.id,
        name: "A test contract 1",
        jobId: (await createJob(getMockJobInput({ userId: clientUser.id }))).id,
      })
    );
    await createContract(
      getMockContractInput({
        clientId: clientUser.id,
        contractorId: contractorUser.id,
        name: "A test contract 2",
        jobId: (await createJob(getMockJobInput({ userId: clientUser.id }))).id,
      })
    );
    await createContract(
      getMockContractInput({
        clientId: clientUser.id,
        contractorId: contractorUser.id,
        name: "A test contract 3",
        jobId: (await createJob(getMockJobInput({ userId: clientUser.id }))).id,
      })
    );
    // deleted contract
    await createContract(
      getMockContractInput({
        clientId: clientUser.id,
        contractorId: contractorUser.id,
        deletedAt: new Date(),
        name: "A deleted test contract",
        jobId: (await createJob(getMockJobInput({ userId: clientUser.id }))).id,
      })
    );
    // contract from a different client
    await createContract(
      getMockContractInput({
        clientId: anotherClientUser.id,
        contractorId: contractorUser.id,
        name: "A test contract from a different client",
        jobId: (await createJob(getMockJobInput({ userId: anotherClientUser.id }))).id,
      })
    );
  });

  afterAll(async () => {
    // Make sure to delete all the test data after tests are done
    await deleteTestData([clientUser, contractorUser, adminUser, anotherClientUser]);
  });

  it("returns a 401 response when the request is not authenticated", async () => {
    try {
      await httpRequest.get(endpointUrl);
      expect(true).toBe(false);
    } catch (error) {
      expect((<AxiosError>error).response?.status).toBe(401);
      expect((<AxiosError>error).response?.data).toStrictEqual({
        name: "Unauthorized",
        message: "You must be logged in to access this resource.",
      });
    }
  });

  it("returns a 200 response and a list of contracts for the requester user", async () => {
    // This test also tests that the contracts with deletedAt field are ignored
    const response = await httpRequest.get(endpointUrl, {
      headers: {
        Cookie: `next-auth.session-token=${clientSessionToken}`
      },
    });
    expect(response.status).toBe(200);
    expect(response.data).toHaveLength(3);
  });

  it("returns a 200 response and a list of all contracts for an admin user", async () => {
    const response = await httpRequest.get(endpointUrl, {
      headers: {
        Cookie: `next-auth.session-token=${adminSessionToken}`
      },
    });
    expect(response.status).toBe(200);
    expect(response.data).toHaveLength(4);
  });
});

describe("POST contract", () => {
  let clientUser: User;
  let contractorUser: User;
  let contractorSessionToken: string;
  let job: Job;

  beforeAll(async () => {
    clientUser = await createUser(
      getMockUserInput({
        email: `${namingPrefix}client@testmail.com`,
        name: `${namingPrefix}client`,
      })
    );
    contractorUser = await createUser(
      getMockUserInput({
        email: `${namingPrefix}contractor@testmail.com`,
        name: `${namingPrefix}contractor`,
      })
    );
    contractorSessionToken = await createTestSession(contractorUser.id);
    job = await createJob(getMockJobInput({ userId: clientUser.id }));
  });

  afterAll(async () => {
    // Make sure to delete all the test data after tests are done
    await deleteTestData([clientUser, contractorUser]);
  });

  it("returns a 401 response when the request is not authenticated", async () => {
    try {
      await httpRequest.post(endpointUrl, {});
      expect(true).toBe(false);
    } catch (error) {
      expect((<AxiosError>error).response?.status).toBe(401);
      expect((<AxiosError>error).response?.data).toStrictEqual({
        name: "Unauthorized",
        message: "You must be logged in to access this resource.",
      });
    }
  });

  it("returns a 400 response when creating a contract for yourself", async () => {
    const body = {
      status: "active",
      terms: "none",
      totalCost: "$100",
      endDate: "2023-04-30",
      startDate: "2023-03-30",
      clientId: contractorUser.id,
      name: "A test contract",
      jobId: job.id,
    };
    try {
      await httpRequest.post(endpointUrl, body, {
        headers: {
          Cookie: `next-auth.session-token=${contractorSessionToken}`
        },
      });
      expect(true).toBe(false);
    } catch (error) {
      expect((<AxiosError>error).response?.status).toBe(400);
      expect((<AxiosError>error).response?.data).toStrictEqual({
        message: "The contractor and client cannot be the same person",
        name: "BadRequest",
      });
    }
  });

  it("returns a 400 response when the request body is missing name", async () => {
    const body = {
      status: "active",
      terms: "none",
      totalCost: "$100",
      endDate: "2023-04-30",
      startDate: "2023-03-30",
      clientId: clientUser.id,
      contractorId: contractorUser.id,
      jobId: job.id,
    };
    try {
      await httpRequest.post(endpointUrl, body, {
        headers: {
          Cookie: `next-auth.session-token=${contractorSessionToken}`
        },
      });
      expect(true).toBe(false);
    } catch (error) {
      expect((<AxiosError>error).response?.status).toBe(400);
      expect((<AxiosError>error).response?.data).toStrictEqual({
        message: "name is a required field",
        name: "ValidationError",
      });
    }
  });

  it("returns a 400 response when the request body is missing clientId", async () => {
    const body = {
      status: "active",
      terms: "none",
      totalCost: "$100",
      endDate: "2023-04-30",
      startDate: "2023-03-30",
      contractorId: contractorUser.id,
      name: "A test contract",
      jobId: job.id,
    };
    try {
      await httpRequest.post(endpointUrl, body, {
        headers: {
          Cookie: `next-auth.session-token=${contractorSessionToken}`
        },
      });
      expect(true).toBe(false);
    } catch (error) {
      expect((<AxiosError>error).response?.status).toBe(400);
      expect((<AxiosError>error).response?.data).toStrictEqual({
        message: "clientId is a required field",
        name: "ValidationError",
      });
    }
  });

  it("returns a 400 response when the request body is missing startDate", async () => {
    const body = {
      status: "active",
      terms: "none",
      totalCost: "$100",
      endDate: "2023-04-30",
      clientId: clientUser.id,
      contractorId: contractorUser.id,
      name: "A test contract",
      jobId: job.id,
    };
    try {
      await httpRequest.post(endpointUrl, body, {
        headers: {
          Cookie: `next-auth.session-token=${contractorSessionToken}`
        },
      });
      expect(true).toBe(false);
    } catch (error) {
      expect((<AxiosError>error).response?.status).toBe(400);
      expect((<AxiosError>error).response?.data).toStrictEqual({
        message: "startDate is a required field",
        name: "ValidationError",
      });
    }
  });

  it("returns a 400 response when the request body is missing endDate", async () => {
    const body = {
      status: "active",
      terms: "none",
      totalCost: "$100",
      startDate: "2023-03-30",
      clientId: clientUser.id,
      contractorId: contractorUser.id,
      name: "A test contract",
      jobId: job.id,
    };
    try {
      await httpRequest.post(endpointUrl, body, {
        headers: {
          Cookie: `next-auth.session-token=${contractorSessionToken}`
        },
      });
      expect(true).toBe(false);
    } catch (error) {
      expect((<AxiosError>error).response?.status).toBe(400);
      expect((<AxiosError>error).response?.data).toStrictEqual({
        message: "endDate is a required field",
        name: "ValidationError",
      });
    }
  });

  it("returns a 400 response when the request body is missing totalCost", async () => {
    const body = {
      status: "active",
      terms: "none",
      endDate: "2023-04-30",
      startDate: "2023-03-30",
      clientId: clientUser.id,
      contractorId: contractorUser.id,
      name: "A test contract",
      jobId: job.id,
    };
    try {
      await httpRequest.post(endpointUrl, body, {
        headers: {
          Cookie: `next-auth.session-token=${contractorSessionToken}`
        },
      });
      expect(true).toBe(false);
    } catch (error) {
      expect((<AxiosError>error).response?.status).toBe(400);
      expect((<AxiosError>error).response?.data).toStrictEqual({
        message: "totalCost is a required field",
        name: "ValidationError",
      });
    }
  });

  it("returns a 400 response when the request body is missing terms", async () => {
    const body = {
      status: "active",
      totalCost: "$100",
      endDate: "2023-04-30",
      startDate: "2023-03-30",
      clientId: clientUser.id,
      contractorId: contractorUser.id,
      name: "A test contract",
      jobId: job.id,
    };
    try {
      await httpRequest.post(endpointUrl, body, {
        headers: {
          Cookie: `next-auth.session-token=${contractorSessionToken}`
        },
      });
      expect(true).toBe(false);
    } catch (error) {
      expect((<AxiosError>error).response?.status).toBe(400);
      expect((<AxiosError>error).response?.data).toStrictEqual({
        message: "terms is a required field",
        name: "ValidationError",
      });
    }
  });

  it("returns a 400 response when the clientId points to a non existing user", async () => {
    const body = {
      status: "active",
      terms: "none",
      totalCost: "$100",
      endDate: LocalDate.now().plusDays(8).toString(),
      startDate: LocalDate.now().plusDays(1).toString(),
      clientId: 99999999,
      name: "A test contract",
      jobId: job.id,
    };
    try {
      await httpRequest.post(endpointUrl, body, {
        headers: {
          Cookie: `next-auth.session-token=${contractorSessionToken}`
        },
      });
      expect(true).toBe(false);
    } catch (error) {
      expect((<AxiosError>error).response?.status).toBe(400);
      expect((<AxiosError>error).response?.data).toStrictEqual({
        message: "One or more of the related records does not exist",
        name: "MissingRelatedRecord",
      });
    }
  });

  it("returns a 409 response when the job is already associated with another contract", async () => {
    const jobId = (await createJob(getMockJobInput({ userId: clientUser.id })))
      .id;
    await createContract(
      getMockContractInput({
        jobId,
        clientId: clientUser.id,
        contractorId: contractorUser.id,
      })
    );
    const body = {
      status: "active",
      terms: "none",
      totalCost: "$100",
      endDate: LocalDate.now().plusDays(8).toString(),
      startDate: LocalDate.now().plusDays(1).toString(),
      clientId: clientUser.id,
      name: "A test contract",
      jobId,
    };
    try {
      await httpRequest.post(endpointUrl, body, {
        headers: {
          Cookie: `next-auth.session-token=${contractorSessionToken}`
        },
      });
      expect(true).toBe(false);
    } catch (error) {
      expect((<AxiosError>error).response?.status).toBe(409);
      expect((<AxiosError>error).response?.data).toStrictEqual({
        message: "Violates a foreign key constraint, like uniqueness",
        name: "ForeignKeyConstraintViolation",
      });
    }
  });

  it("returns a 200 response and the ID of the newly created contract", async () => {
    const body = {
      status: "active",
      terms: "none",
      totalCost: "$100",
      endDate: LocalDate.now().plusDays(8).toString(),
      startDate: LocalDate.now().plusDays(1).toString(),
      clientId: clientUser.id,
      name: "A test contract",
      jobId: (await createJob(getMockJobInput({ userId: clientUser.id }))).id,
    };
    try {
      const response = await httpRequest.post(endpointUrl, body, {
        headers: {
          Cookie: `next-auth.session-token=${contractorSessionToken}`
        },
      });
      expect(response.status).toBe(200);
      expect(response.data.id).toBeDefined();
    } catch (error) {
      expect(true).toBe(false);
    }
  });
});

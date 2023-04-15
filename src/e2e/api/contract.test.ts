import { AxiosError } from "axios";
import { createContract } from "@/models/contract";
import { createUser } from "@/models/user";
import { genBearerToken } from "@/utils/test-helpers";
import { getMockContract } from "@/utils/mocks/contract";
import { getMockUser } from "@/utils/mocks/user";
import { User } from "@/lib/prisma-client";
import db from "@/db-client";
import httpRequest from "axios";

const endpointUrl = `http://${process.env.DOMAIN}/api/contracts`;

const deleteTestData = async (clientUser: User, contractorUser: User) => {
  await db.$queryRaw`DELETE FROM "Contract" WHERE "clientId" = ${clientUser.id} OR "contractorId" = ${contractorUser.id}`;
  await db.$queryRaw`DELETE FROM "User" WHERE email LIKE '%e2etestmail.com%'`;
};

describe("GET contract", () => {
  let clientUser: User;
  let contractorUser: User;

  beforeAll(async () => {
    clientUser = await createUser(
      getMockUser({
        email: "client@e2etestmail.com",
        name: "Client",
      })
    );
    contractorUser = await createUser(
      getMockUser({
        email: "contractor@e2etestmail.com",
        name: "Contractor",
      })
    );
    await createContract(
      getMockContract({
        clientId: clientUser.id,
        contractorId: contractorUser.id,
        name: "A test contract 1",
      })
    );
    await createContract(
      getMockContract({
        clientId: clientUser.id,
        contractorId: contractorUser.id,
        name: "A test contract 2",
      })
    );
    await createContract(
      getMockContract({
        clientId: clientUser.id,
        contractorId: contractorUser.id,
        name: "A test contract 3",
      })
    );
    await createContract(
      getMockContract({
        clientId: clientUser.id,
        contractorId: contractorUser.id,
        deletedAt: new Date(),
        name: "A deleted test contract",
      })
    );
  });

  afterAll(async () => {
    // Make sure to delete all the test data after tests are done
    await deleteTestData(clientUser, contractorUser);
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
        Authorization: `Bearer ${await genBearerToken(clientUser.id)}`,
      },
    });
    expect(response.status).toBe(200);
    expect(response.data).toHaveLength(3);
  });
});

describe("POST contract", () => {
  let clientUser: User;
  let contractorUser: User;

  beforeAll(async () => {
    clientUser = await createUser(
      getMockUser({
        email: "client@e2etestmail.com",
        name: "Client",
      })
    );
    contractorUser = await createUser(
      getMockUser({
        email: "contractor@e2etestmail.com",
        name: "Contractor",
      })
    );
  });

  afterAll(async () => {
    // Make sure to delete all the test data after tests are done
    await deleteTestData(clientUser, contractorUser);
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
    };
    try {
      await httpRequest.post(endpointUrl, body, {
        headers: {
          Authorization: `Bearer ${await genBearerToken(contractorUser.id)}`,
        },
      });
      expect(true).toBe(false);
    } catch (error) {
      expect((<AxiosError>error).response?.status).toBe(400);
      expect((<AxiosError>error).response?.data).toStrictEqual({
        message: "You cannot create a contract for yourself.",
        name: "BadRequest",
      });
    }
  });

  it("returns a 200 response and the ID of the newly created contract", async () => {
    const body = {
      status: "active",
      terms: "none",
      totalCost: "$100",
      endDate: "2023-04-30",
      startDate: "2023-03-30",
      clientId: clientUser.id,
      name: "A test contract",
    };
    const response = await httpRequest.post(endpointUrl, body, {
      headers: {
        Authorization: `Bearer ${await genBearerToken(contractorUser.id)}`,
      },
    });
    expect(response.status).toBe(200);
    expect(response.data.id).toBeDefined();
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
    };
    try {
      await httpRequest.post(endpointUrl, body,  {
        headers: {
          Authorization: `Bearer ${await genBearerToken(contractorUser.id)}`,
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
    };
    try {
      await httpRequest.post(endpointUrl, body, {
        headers: {
          Authorization: `Bearer ${await genBearerToken(contractorUser.id)}`,
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
    };
    try {
      await httpRequest.post(endpointUrl, body, {
        headers: {
          Authorization: `Bearer ${await genBearerToken(contractorUser.id)}`,
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
    };
    try {
      await httpRequest.post(endpointUrl, body, {
        headers: {
          Authorization: `Bearer ${await genBearerToken(contractorUser.id)}`,
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
    };
    try {
      await httpRequest.post(endpointUrl, body, {
        headers: {
          Authorization: `Bearer ${await genBearerToken(contractorUser.id)}`,
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
    };
    try {
      await httpRequest.post(endpointUrl, body, {
        headers: {
          Authorization: `Bearer ${await genBearerToken(contractorUser.id)}`,
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

  it("returns a 400 response when the request body is missing status", async () => {
    const body = {
      terms: "none",
      totalCost: "$100",
      endDate: "2023-04-30",
      startDate: "2023-03-30",
      clientId: clientUser.id,
      contractorId: contractorUser.id,
      name: "A test contract",
    };
    try {
      await httpRequest.post(endpointUrl, body, {
        headers: {
          Authorization: `Bearer ${await genBearerToken(contractorUser.id)}`,
        },
      });
      expect(true).toBe(false);
    } catch (error) {
      expect((<AxiosError>error).response?.status).toBe(400);
      expect((<AxiosError>error).response?.data).toStrictEqual({
        message: "status is a required field",
        name: "ValidationError",
      });
    }
  });
});

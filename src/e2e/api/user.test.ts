import db from "@/db-client";
import { User } from "@/lib/prisma-client";
import { createUser } from "@/models/user";
import { getMockUserInput } from "@/utils/mocks/user";
import { genBearerToken } from "@/utils/test-helpers";
import httpRequest, { AxiosError } from "axios";

const endpointUrl = `http://${process.env.DOMAIN}/api/users`;
const namingPrefix = 'user-e2etest-'

const deleteTestData = async (clientUser: User, contractorUser: User) => {
  await db.$queryRaw`DELETE FROM "Contract" WHERE "clientId" = ${clientUser.id} OR "contractorId" = ${contractorUser.id}`;
  await db.$queryRaw`DELETE FROM "User" WHERE email = ${clientUser.email} OR email = ${contractorUser.email}`;
};


describe("GET Users", () => {
  let clientUser: User;
  let contractorUser: User;

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
  });

  afterAll(async () => {
    // Make sure to delete all the test data after tests are done
    await deleteTestData(clientUser, contractorUser);
  });

  it("should return 200 and a list of users with only with public data", async () => {
    const response = await httpRequest.get(endpointUrl);
    expect(response.status).toBe(200);
    expect(
      response.data.find((user: User) => user.id === clientUser.id)
    ).toStrictEqual({
      id: clientUser.id,
      name: clientUser.name,
      image: clientUser.image
    });
    expect(
      response.data.find((user: User) => user.id === contractorUser.id)
    ).toStrictEqual({
      id: contractorUser.id,
      name: contractorUser.name,
      image: contractorUser.image
    });
  });
});

describe("GET User", () => {
  let clientUser: User;
  let contractorUser: User;

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
  });

  afterAll(async () => {
    // Make sure to delete all the test data after tests are done
    await deleteTestData(clientUser, contractorUser);
  });

  it("should return 401 for unauthenticated requests", async () => {
    try {
      await httpRequest.get(endpointUrl + "/" + clientUser.id);
      expect(false).toBeTruthy();
    } catch(error) {
      expect((<AxiosError>error).response?.status).toBe(401);
      expect((<AxiosError>error).response?.data).toStrictEqual({
        name: "Unauthorized",
        message: "You must be logged in to access this resource.",
      });
    }
  });

  it("should return 200 and limited user data for other users requesting it", async () => {
    const response = await httpRequest.get(endpointUrl + "/" + clientUser.id, {
      headers: {
        Authorization: `Bearer ${await genBearerToken(contractorUser.id)}`,
      },
    });
    expect(response.status).toBe(200);
    expect(response.data).toStrictEqual({
      id: clientUser.id,
      name: clientUser.name,
      image: clientUser.image,
    });
  });

  it("should return 200 and full data for users requesting their own data", async () => {
    const response = await httpRequest.get(endpointUrl + "/" + clientUser.id, {
      headers: {
        Authorization: `Bearer ${await genBearerToken(clientUser.id)}`,
      },
    });
    expect(response.status).toBe(200);
    expect(response.data).toStrictEqual({
      ...clientUser,
      createdAt: clientUser.createdAt.toISOString(),
      updatedAt: clientUser.updatedAt.toISOString(),
    });
  });
});

describe("DELETE User", () => {
  let clientUser: User;
  let contractorUser: User;

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
  });

  afterAll(async () => {
    // Make sure to delete all the test data after tests are done
    await deleteTestData(clientUser, contractorUser);
  });

  it("should return 401 for unauthenticated requests", async () => {
    try {
      await httpRequest.delete(endpointUrl + "/" + clientUser.id);
      expect(false).toBeTruthy();
    } catch(error) {
      expect((<AxiosError>error).response?.status).toBe(401);
      expect((<AxiosError>error).response?.data).toStrictEqual({
        name: "Unauthorized",
        message: "You must be logged in to access this resource.",
      });
    }
  });

  it("should return 403 for other users trying to delete a user", async () => {
    try {
      await httpRequest.delete(endpointUrl + "/" + clientUser.id, {
        headers: {
          Authorization: `Bearer ${await genBearerToken(contractorUser.id)}`,
        },
      });
      expect(false).toBeTruthy();
    } catch(error) {
      expect((<AxiosError>error).response?.status).toBe(403);
      expect((<AxiosError>error).response?.data).toStrictEqual({
        name: "Forbidden",
        message: "You are not authorized to delete this user",
      });
    }
  });

  it("should return 200 for a user trying to delete its own account", async () => {
    try {
      await httpRequest.delete(endpointUrl + "/" + clientUser.id, {
        headers: {
          Authorization: `Bearer ${await genBearerToken(clientUser.id)}`,
        },
      });
    } catch(error) {
      expect(false).toBeTruthy();
    }
  });

  it("should return 404 for a user trying to delete its own account after it has been deleted", async () => {
    try {
      await httpRequest.delete(endpointUrl + "/" + clientUser.id, {
        headers: {
          Authorization: `Bearer ${await genBearerToken(clientUser.id)}`,
        },
      });
      expect(false).toBeTruthy();
    } catch(error) {
      expect((<AxiosError>error).response?.status).toBe(404);
      expect((<AxiosError>error).response?.data).toStrictEqual({
        name: "NotFound",
        message: "The record does not exist",
      });
    }
  });
});
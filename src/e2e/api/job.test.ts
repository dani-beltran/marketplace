import { Job, User } from "@/lib/prisma-client";
import { createJob } from "@/models/job";
import { createUser } from "@/models/user";
import { getMockJobInput } from "@/utils/mocks/job";
import { getMockUserInput } from "@/utils/mocks/user";
import { PaginatedResponse } from "@/utils/pagination";
import { createTestSession, deleteTestData } from "@/utils/test-helpers";
import httpRequest, { AxiosError, AxiosResponse } from "axios";

const endpointUrl = `http://${process.env.DOMAIN}/api/jobs`;
const namingPrefix = "job-e2etest-";

describe("GET Jobs", () => {
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
    const jobs = [];
    for (let i = 0; i < 15; i++) {
      jobs.push(
        createJob(
          getMockJobInput({
            name: `${namingPrefix}job${i}`,
            userId: clientUser.id,
          })
        )
      );
    }
    await Promise.all(jobs);
  });

  afterAll(async () => {
    // Make sure to delete all the test data after tests are done
    await deleteTestData([clientUser, contractorUser]);
  });

  it("should return 200 and a list of jobs with default pagination", async () => {
    const response = await httpRequest.get<
      any,
      AxiosResponse<PaginatedResponse<Job>>
    >(endpointUrl);
    expect(response.status).toBe(200);
    const { data, pagination } = response.data;
    expect(data).toHaveLength(10);
    expect(pagination).toStrictEqual({
      page: 0,
      pageSize: 10,
      count: expect.any(Number),
    });
  });

  it("should return 200 and a list of jobs paginated as requested", async () => {
    const response = await httpRequest.get<
      any,
      AxiosResponse<PaginatedResponse<Job>>
    >(endpointUrl + "?page=1&pageSize=11");
    expect(response.status).toBe(200);
    const { data, pagination } = response.data;
    expect(data).toHaveLength(11);
    expect(pagination).toStrictEqual({
      page: 1,
      pageSize: 11,
      count: expect.any(Number),
    });
  });
});

describe("POST Job", () => {
  let clientUser: User;
  let contractorUser: User;
  let clientSessionToken: string;
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
    clientSessionToken = await createTestSession(clientUser.id);
  });

  afterAll(async () => {
    // Make sure to delete all the test data after tests are done
    await deleteTestData([clientUser, contractorUser]);
  });

  it("should return 401 if user is not logged in", async () => {
    try {
      await httpRequest.post(endpointUrl, {
        name: "test job",
        description: "test description",
      });
      expect(true).toBe(false);
    } catch (error) {
      const axiosError = error as AxiosError;
      expect(axiosError.response?.status).toBe(401);
    }
  });

  it("should return 400 if name is not provided", async () => {
    try {
      await httpRequest.post(
        endpointUrl,
        {
          description: "test description",
        },
        {
          headers: {
            Cookie: `next-auth.session-token=${clientSessionToken}`,
          },
        }
      );
      expect(true).toBe(false);
    } catch (error) {
      const axiosError = error as AxiosError;
      expect(axiosError.response?.status).toBe(400);
    }
  });

  it("should return 400 if description is not provided", async () => {
    try {
      await httpRequest.post(
        endpointUrl,
        {
          name: "test job",
        },
        {
          headers: {
            Cookie: `next-auth.session-token=${clientSessionToken}`,
          },
        }
      );
      expect(true).toBe(false);
    } catch (error) {
      const axiosError = error as AxiosError;
      expect(axiosError.response?.status).toBe(400);
    }
  });

  it("should return 200 and the created job", async () => {
    try {
      const res = await httpRequest.post(
        endpointUrl,
        {
          name: "test job",
          description: "test description",
        },
        {
          headers: {
            Cookie: `next-auth.session-token=${clientSessionToken}`,
          },
        }
      );
      expect(res.status).toBe(200);
      expect(res.data).toStrictEqual({
        id: expect.any(Number),
        name: "test job",
        description: "test description",
        userId: clientUser.id,
        issueUrl: null,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        deletedAt: null,
      });
    } catch (error) {
      expect(true).toBe(false);
    }
  });
});

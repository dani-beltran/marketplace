import db from "@/db-client";
import { Job, User } from "@/lib/prisma-client";
import { createJob } from "@/models/job";
import { createUser } from "@/models/user";
import { getMockJobInput } from "@/utils/mocks/job";
import { getMockUserInput } from "@/utils/mocks/user";
import { PaginatedResponse } from "@/utils/pagination";
import { genBearerToken } from "@/utils/test-helpers";
import httpRequest, { AxiosError, AxiosResponse } from "axios";

const endpointUrl = `http://${process.env.DOMAIN}/api/jobs`;
const namingPrefix = "job-e2etest-";

const deleteTestData = async (clientUser: User, contractorUser: User) => {
  await db.$queryRaw`DELETE FROM "Job" WHERE "userId" = ${clientUser.id} OR "userId" = ${contractorUser.id}`;
  await db.$queryRaw`DELETE FROM "User" WHERE "id" = ${clientUser.id} OR "id" = ${contractorUser.id}`;
};

describe("GET Jobs", () => {
  let clientUser: User;
  let contractorUser: User;
  let jobs: Job[] = [];

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
    jobs.push(
      await createJob(
        getMockJobInput({
          name: `${namingPrefix}job1`,
          userId: clientUser.id,
        })
      )
    );
    jobs.push(
      await createJob(
        getMockJobInput({
          name: `${namingPrefix}job2`,
          userId: clientUser.id,
        })
      )
    );
    jobs.push(
      await createJob(
        getMockJobInput({
          name: `${namingPrefix}job3`,
          userId: clientUser.id,
        })
      )
    );
    jobs.push(
      await createJob(
        getMockJobInput({
          name: `${namingPrefix}job4`,
          userId: contractorUser.id,
        })
      )
    );
  });

  afterAll(async () => {
    // Make sure to delete all the test data after tests are done
    await deleteTestData(clientUser, contractorUser);
  });

  it("should return 200 and a list of jobs", async () => {
    const response = await httpRequest.get<any, AxiosResponse<PaginatedResponse<Job>>>(
      endpointUrl
    );
    expect(response.status).toBe(200);
    const { data, pagination } = response.data;
    expect(
      data.filter((job) => job.userId === clientUser.id)
    ).toHaveLength(3);
    expect(
      data.filter((job) => job.userId === contractorUser.id)
    ).toHaveLength(1);
    expect(
      data.find((job) => job.userId === contractorUser.id)
    ).toStrictEqual({
      ...jobs[3],
      createdAt: jobs[3].createdAt.toISOString(),
      updatedAt: jobs[3].updatedAt.toISOString(),
    });
    expect(pagination).toStrictEqual({
      page: 1,
      size: 10,
      total: expect.any(Number),
    });
  });
});

describe("POST Job", () => {
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
            Authorization: `Bearer ${await genBearerToken(clientUser.id)}`,
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
      await httpRequest.post(endpointUrl, {
        name: "test job",
      },
      {
        headers: {
          Authorization: `Bearer ${await genBearerToken(clientUser.id)}`,
        },
      });
      expect(true).toBe(false);
    } catch (error) {
      const axiosError = error as AxiosError;
      expect(axiosError.response?.status).toBe(400);
    }
  });

  it("should return 200 and the created job", async () => {
    try {
      const res = await httpRequest.post(endpointUrl, {
        name: "test job",
        description: "test description"
      },
      {
        headers: {
          Authorization: `Bearer ${await genBearerToken(clientUser.id)}`,
        },
      });
      expect(res.status).toBe(200);
      expect(res.data).toStrictEqual({
        id: expect.any(Number),
        name: "test job",
        description: "test description",
        userId: clientUser.id,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        deletedAt: null
      });
    } catch (error) {
      expect(true).toBe(false);
    }
  });

});

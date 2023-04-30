import { ContractStatus, Job, User } from "@/lib/prisma-client";
import { createContract } from "@/models/contract";
import { createJob } from "@/models/job";
import { createUser } from "@/models/user";
import { getMockContractInput } from "@/utils/mocks/contract";
import { getMockJobInput } from "@/utils/mocks/job";
import { getMockUserInput } from "@/utils/mocks/user";
import { PaginatedResponse } from "@/utils/pagination";
import { createTestSession, deleteTestData } from "@/utils/test-helpers";
import { LocalDate } from "@js-joda/core";
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
    // Jobs published by the client user
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
    // Job published by the another user
    jobs.push(
      createJob(
        getMockJobInput({
          name: `${namingPrefix}job for contractor`,
          userId: contractorUser.id,
        })
      )
    );
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

  it("should return 200 and a list of jobs for a specific user when requested", async () => {
    const response = await httpRequest.get<
      any,
      AxiosResponse<PaginatedResponse<Job>>
    >(endpointUrl + `?userId=${contractorUser.id}`);
    expect(response.status).toBe(200);
    const { data } = response.data;
    expect(data).toHaveLength(1);
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

describe("GET Ongoing Jobs", () => {
  let clientUser: User;
  let contractorUser: User;
  let clientSessionToken: string;
  const nOngoingContracts = 5;

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
    // Ongoing jobs
    const contracts = [];
    for (let i = 0; i < nOngoingContracts; i++) {
      contracts.push(
        createContract(
          getMockContractInput({
            // Alternate between client and contractor for each contract
            clientId: i % 2 ? clientUser.id : contractorUser.id,
            contractorId: i % 2 ? contractorUser.id : clientUser.id,
            status: ContractStatus.accepted,
            name: "A test contract " + i,
            jobId: (
              await createJob(
                getMockJobInput({
                  userId: i % 2 ? clientUser.id : contractorUser.id,
                })
              )
            ).id,
          })
        )
      );
    }
    await Promise.all(contracts);
    // Job from another user
    createContract(
      getMockContractInput({
        clientId: clientUser.id,
        contractorId: contractorUser.id,
        status: ContractStatus.accepted,
        name: "A test contract from another user",
        jobId: (await createJob(getMockJobInput({ userId: contractorUser.id })))
          .id,
      })
    );
    // Job that is still pending
    createContract(
      getMockContractInput({
        clientId: clientUser.id,
        contractorId: contractorUser.id,
        status: ContractStatus.pending,
        name: "A test contract that is not accepted",
        jobId: (await createJob(getMockJobInput({ userId: clientUser.id }))).id,
      })
    );
    // Job that is terminated
    createContract(
      getMockContractInput({
        clientId: clientUser.id,
        contractorId: contractorUser.id,
        status: ContractStatus.terminated,
        name: "A test contract that is not accepted",
        jobId: (await createJob(getMockJobInput({ userId: clientUser.id }))).id,
      })
    );
    // Job that is not started
    createContract(
      getMockContractInput({
        clientId: clientUser.id,
        contractorId: contractorUser.id,
        status: ContractStatus.accepted,
        startDate: new Date(LocalDate.now().plusDays(5).toString()),
        endDate: new Date(LocalDate.now().plusDays(7).toString()),
        name: "A test contract that is not started",
        jobId: (await createJob(getMockJobInput({ userId: clientUser.id }))).id,
      })
    );
    // Job that is finished
    createContract(
      getMockContractInput({
        clientId: clientUser.id,
        contractorId: contractorUser.id,
        status: ContractStatus.accepted,
        startDate: new Date(LocalDate.now().minusDays(5).toString()),
        endDate: new Date(LocalDate.now().minusDays(1).toString()),
        name: "A test contract that is finished",
        jobId: (await createJob(getMockJobInput({ userId: clientUser.id }))).id,
      })
    );
  });

  afterAll(async () => {
    // Make sure to delete all the test data after tests are done
    await deleteTestData([clientUser, contractorUser]);
  });

  it("should return 401 if user is not logged in", async () => {
    try {
      await httpRequest.get(endpointUrl + "/ongoing");
      expect(true).toBe(false);
    } catch (error) {
      const axiosError = error as AxiosError;
      expect(axiosError.response?.status).toBe(401);
    }
  });

  it("should return 200 and a list of ongoing jobs", async () => {
    const res = await httpRequest.get(endpointUrl + "/ongoing", {
      headers: {
        Cookie: `next-auth.session-token=${clientSessionToken}`,
      },
    });
    expect(res?.status).toBe(200);
    expect(res?.data.pagination).toStrictEqual({
      cursorId: expect.any(Number),
    });
    expect(res?.data.data.length).toBeGreaterThanOrEqual(nOngoingContracts);
  });
});

import { User } from "@/lib/prisma-client";
import { createContract } from "@/models/contract";
import { createInvoice } from "@/models/invoice";
import { createJob } from "@/models/job";
import { createUser } from "@/models/user";
import { createUserWallet } from "@/models/wallet";
import { getMockContractInput } from "@/utils/mocks/contract";
import { getMockInvoiceInput } from "@/utils/mocks/invoice";
import { getMockJobInput } from "@/utils/mocks/job";
import { getMockUserInput } from "@/utils/mocks/user";
import { createTestSession, deleteTestData } from "@/utils/test-helpers";
import axios, { AxiosError } from "axios";

const endpointUrl = `http://${process.env.DOMAIN}/api/invoices/`;
const namingPrefix = "invoice-e2etest-";

describe("POST invoices", () => {
  let clientUser: User;
  let contractorUser: User;
  let noMoneyClientUser: User;
  let noWalletContractor: User;
  let contractorSessionToken: string;
  let clientSessionToken: string;
  let noMoneyClientUserSessionToken: string;
  let invoiceId: number;
  let paidInvoiceId: number;
  let noWalletInvoiceId: number;
  let noMoneyWalletInvoiceId: number;
  

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
    noMoneyClientUser = await createUser(
      getMockUserInput({
        email: `${namingPrefix}client-broke@testmail.com`,
        name: `${namingPrefix}client-broke`,
      })
    );
    noWalletContractor = await createUser(
        getMockUserInput({
          email: `${namingPrefix}contractor-no-wallet@testmail.com`,
          name: `${namingPrefix}contractor-no-wallet`,
        })
      );
    contractorSessionToken = await createTestSession(contractorUser.id);
    clientSessionToken = await createTestSession(clientUser.id);
    noMoneyClientUserSessionToken = await createTestSession(noMoneyClientUser.id);
    // Create wallets
    await createUserWallet(clientUser.id, "1000.00");
    await createUserWallet(contractorUser.id, "1000.00");
    await createUserWallet(noMoneyClientUser.id, "0.00");
    // Create a contract
    const contract = await createContract(
      getMockContractInput({
        clientId: clientUser.id,
        contractorId: contractorUser.id,
        jobId: (await createJob(getMockJobInput({ userId: clientUser.id }))).id,
      })
    );
    // Create invoices
    invoiceId = (
      await createInvoice(
        getMockInvoiceInput({
          contractId: contract.id,
          subtotal: "1000.00",
          vatRate: 0,
          discountRate: 0,
        })
      )
    ).id;
    paidInvoiceId = (
      await createInvoice(
        getMockInvoiceInput({
          contractId: contract.id,
          paidAt: new Date(),
        })
      )
    ).id;
    noWalletInvoiceId = (
      await createInvoice(
        getMockInvoiceInput({
          contractId: (await createContract(
            getMockContractInput({
              clientId: clientUser.id,
              contractorId: noWalletContractor.id,
              jobId: (await createJob(getMockJobInput({ userId: clientUser.id }))).id,
            })
          )).id,
        })
      )
    ).id;
    noMoneyWalletInvoiceId = (
      await createInvoice(
        getMockInvoiceInput({
          contractId:  (await createContract(
            getMockContractInput({
              clientId: noMoneyClientUser.id,
              contractorId: contractorUser.id,
              jobId: (await createJob(getMockJobInput({ userId: noMoneyClientUser.id }))).id,
            })
          )).id,
        })
      )
    ).id;
  });

  afterAll(async () => {
    // Make sure to delete all the test data after tests are done
    await deleteTestData([clientUser, contractorUser, noWalletContractor, noMoneyClientUser]);
  });

  it("returns a 401 response when the request is not authenticated", async () => {
    try {
      await axios.post(`${endpointUrl}/${invoiceId}/pay`, {});
      expect(true).toBe(false);
    } catch (error) {
      expect((<AxiosError>error).response?.status).toBe(401);
      expect((<AxiosError>error).response?.data).toStrictEqual({
        name: "Unauthorized",
        message: "You must be logged in to access this resource.",
      });
    }
  });

  it("returns a 403 response when the user is not the client", async () => {
    try {
      await axios.post(
        `${endpointUrl}/${invoiceId}/pay`,
        {},
        {
          headers: {
            Cookie: `next-auth.session-token=${contractorSessionToken}`,
          },
        }
      );
      expect(true).toBe(false);
    } catch (error) {
      expect((<AxiosError>error).response?.status).toBe(403);
      expect((<AxiosError>error).response?.data).toStrictEqual({
        name: "Forbidden",
        message: "You are not allowed to pay this invoice",
      });
    }
  });

  it("returns a 404 response when the invoice does not exist", async () => {
    try {
      await axios.post(
        `${endpointUrl}/9999/pay`,
        {},
        {
          headers: {
            Cookie: `next-auth.session-token=${clientSessionToken}`,
          },
        }
      );
      expect(true).toBe(false);
    } catch (error) {
      expect((<AxiosError>error).response?.status).toBe(404);
      expect((<AxiosError>error).response?.data).toStrictEqual({
        name: "NotFound",
        message: "Invoice not found",
      });
    }
  });

  it("returns a 409 response when the invoice is already paid", async () => {
    try {
      await axios.post(
        `${endpointUrl}/${paidInvoiceId}/pay`,
        {},
        {
          headers: {
            Cookie: `next-auth.session-token=${clientSessionToken}`,
          },
        }
      );
      expect(true).toBe(false);
    } catch (error) {
      expect((<AxiosError>error).response?.status).toBe(409);
      expect((<AxiosError>error).response?.data).toStrictEqual({
        name: "Conflict",
        message: "This invoice has already been paid",
      });
    }
  });

  it("returns a 409 response when the contractor has no wallet", async () => {
    try {
      await axios.post(
        `${endpointUrl}/${noWalletInvoiceId}/pay`,
        {},
        {
          headers: {
            Cookie: `next-auth.session-token=${clientSessionToken}`,
          },
        }
      );
      expect(true).toBe(false);
    } catch (error) {
      expect((<AxiosError>error).response?.status).toBe(409);
      expect((<AxiosError>error).response?.data).toStrictEqual({
        name: "Conflict",
        message: "The contractor does not have a wallet configured",
      });
    }
  });

  it("returns a 409 response when the client has no money", async () => {
    try {
      await axios.post(
        `${endpointUrl}/${noMoneyWalletInvoiceId}/pay`,
        {},
        {
          headers: {
            Cookie: `next-auth.session-token=${noMoneyClientUserSessionToken}`,
          },
        }
      );
      expect(true).toBe(false);
    } catch (error) {
      expect((<AxiosError>error).response?.status).toBe(409);
      expect((<AxiosError>error).response?.data).toStrictEqual({
        name: "Conflict",
        message: "You don't have enough money to pay this invoice",
      });
    }
  });

  it("returns a 200 response when the invoice is paid successfully", async () => {
    try {
    const response = await axios.post(
      `${endpointUrl}/${invoiceId}/pay`,
      {},
      {
        headers: {
          Cookie: `next-auth.session-token=${clientSessionToken}`,
        },
      }
    );
    expect(response.status).toBe(200);
    } catch (error) {
      console.log((<AxiosError>error).response?.data);
      expect(true).toBe(false);
    }
  });
});

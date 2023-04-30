import db from "@/db-client";
import { Invoice, Prisma } from "@/lib/prisma-client";
import ActionError from "@/utils/ActionError";
import currency from "currency.js";

/**
 * Function to calculate total amount of an invoice
 */
export const calculateInvoiceTotalAmount = (invoice: Invoice) => {
  const discount = currency(invoice.subtotal).multiply(
    invoice.discountRate / 100
  );
  const vat = currency(invoice.subtotal).multiply(invoice.vatRate / 100);
  const subtotal = currency(invoice.subtotal).subtract(discount).add(vat);
  return subtotal.toString();
};

/**
 * Function to pay an invoice
 * @param invoiceId The invoice ID
 * @param userId The user ID who is paying the invoice
 */
export const payInvoice = async (invoiceId: number, userId: number) => {
  // All the operations go inside a transaction to avoid any inconsistencies like
  // dirty reads, non-repeatable reads, and phantom reads.
  const transactionParams = {
    // We use the highest isolation level to avoid any inconsistencies
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  };
  // This is an interactive transaction. Keeping transactions open for a long 
  // time hurts database performance and can even cause deadlocks. Keep it quick.
  return db.$transaction(async (tx) => {
    const invoice = await tx.invoice.findFirst({
      where: {
        id: invoiceId,
      },
      include: {
        contract: {
          select: {
            contractor: {
              select: {
                id: true,
                wallet: true,
              },
            },
            client: {
              select: {
                id: true,
                wallet: true,
              },
            },
          },
        },
      },
    });
    if (!invoice) {
      throw new ActionError("NotFound", "Invoice not found");
    }
    if (invoice.contract.client.id !== userId) {
      throw new ActionError(
        "Forbidden",
        "You are not allowed to pay this invoice"
      );
    }
    if (invoice.paidAt) {
      throw new ActionError("Conflict", "This invoice has already been paid");
    }
    if (!invoice.contract.contractor.wallet) {
      throw new ActionError(
        "Conflict",
        "The contractor does not have a wallet configured"
      );
    }
    if (!invoice.contract.client.wallet) {
      throw new ActionError(
        "Conflict",
        "You don't have a wallet configured"
      );
    }
    const clientWalletAmount = currency(
      invoice.contract.client.wallet.balance || "0.00"
    );
    const contractorWalletAmount = currency(
      invoice.contract.contractor.wallet.balance || "0.00"
    );
    const totalAmount = currency(calculateInvoiceTotalAmount(invoice));
    const balanceAfterward = clientWalletAmount.subtract(totalAmount);
    console.log('balanceAfterward', balanceAfterward, balanceAfterward.value)
    if (balanceAfterward.value < 0) {
      throw new ActionError(
        "Conflict",
        "You don't have enough money to pay this invoice"
      );
    }
    await Promise.all([
      // We update the client wallet to remove the money
      tx.wallet.update({
        where: {
          userId,
        },
        data: {
          balance: balanceAfterward.toString(),
        },
      }),
      // We update the contractor wallet to add the money
      tx.wallet.update({
        where: {
          userId: invoice.contract.contractor.id,
        },
        data: {
          balance: contractorWalletAmount.add(totalAmount).toString(),
        },
      }),
      // We update the invoice to mark it as paid
      tx.invoice.update({
        where: {
          id: invoiceId,
        },
        data: {
          paidAt: new Date(),
        },
      }),
    ]);
  }, transactionParams);
};

/**
 * Function to create an invoice
 */
export const createInvoice = async (invoice: Prisma.InvoiceCreateInput) => {
  return db.invoice.create({
    data: invoice,
  });
}
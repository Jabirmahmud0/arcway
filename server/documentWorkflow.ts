import { TRPCError } from "@trpc/server";
import type { DocumentStatus } from "./tradeDomain";

const transitions: Record<DocumentStatus, DocumentStatus[]> = {
  pending: ["uploaded"],
  uploaded: ["under review", "rejected"],
  "under review": ["verified", "rejected", "uploaded"],
  verified: ["uploaded"],
  rejected: ["uploaded", "under review"],
};

export function assertDocumentTransition(from: DocumentStatus, to: DocumentStatus) {
  if (!transitions[from].includes(to)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: `Document status cannot move from ${from} to ${to}.` });
  }
}


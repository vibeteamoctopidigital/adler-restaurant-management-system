
import { Role } from "../generated/prisma/client";

declare global {
  namespace Express {
    interface Locals {
      auth?: {
        userId: string;
        email: string;
        role: Role;
      }
    }
  }
}
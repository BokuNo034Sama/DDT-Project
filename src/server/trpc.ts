import { initTRPC, TRPCError } from "@trpc/server";
import { type Context } from "./context";
import superjson from "superjson";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Reusable middleware that enforces users are logged in and belong to a tenant.
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.userId || !ctx.tenantId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      userId: ctx.userId,
      tenantId: ctx.tenantId,
      role: ctx.role,
    },
  });
});

/**
 * Reusable middleware that enforces users have a management role (not staff).
 */
export const managerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.role === "staff") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next();
});

/**
 * Reusable middleware that enforces users have the super_admin role.
 */
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.role !== "super_admin") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next();
});

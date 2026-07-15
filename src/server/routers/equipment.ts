import { z } from "zod";
import { router, protectedProcedure, managerProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const equipmentRouter = router({
  // Returns all active lab equipment for current tenant
  listEquipment: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, tenantId } = ctx;
    const { data: equipment, error } = await supabase
      .from("lab_equipment")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
    }

    return equipment || [];
  }),

  // Add a new equipment (managerProcedure)
  addEquipment: managerProcedure
    .input(
      z.object({
        equipmentName: z.string().min(1, "Name is required"),
        serialNumber: z.string().min(1, "Serial number is required"),
        equipmentType: z.string().min(1, "Type is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { supabase, tenantId } = ctx;

      // Check current active count
      const { count, error: countError } = await supabase
        .from("lab_equipment")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("is_active", true);

      if (countError) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: countError.message });
      }

      if (count !== null && count >= 8) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Maximum of 8 equipment reached. Deactivate an existing one first.",
        });
      }

      const { data, error } = await supabase
        .from("lab_equipment")
        .insert({
          tenant_id: tenantId,
          equipment_name: input.equipmentName,
          serial_number: input.serialNumber,
          equipment_type: input.equipmentType,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return data;
    }),

  // Deactivate equipment (managerProcedure)
  deactivateEquipment: managerProcedure
    .input(z.object({ equipmentId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { supabase, tenantId } = ctx;

      const { data, error } = await supabase
        .from("lab_equipment")
        .update({ is_active: false })
        .eq("id", input.equipmentId)
        .eq("tenant_id", tenantId)
        .select()
        .single();

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return data;
    }),

  // Update equipment (managerProcedure)
  updateEquipment: managerProcedure
    .input(
      z.object({
        equipmentId: z.string().uuid(),
        equipmentName: z.string().min(1, "Name is required"),
        serialNumber: z.string().min(1, "Serial number is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { supabase, tenantId } = ctx;

      const { data, error } = await supabase
        .from("lab_equipment")
        .update({
          equipment_name: input.equipmentName,
          serial_number: input.serialNumber,
        })
        .eq("id", input.equipmentId)
        .eq("tenant_id", tenantId)
        .select()
        .single();

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return data;
    }),
});

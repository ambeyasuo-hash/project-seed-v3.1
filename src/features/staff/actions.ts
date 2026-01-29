// src/features/staff/actions.ts
"use server";

import { upsertStaffPolicy, getStaffByLineId as getStaffService } from "./service";
import { StaffContractConfig } from "./types";
import { revalidatePath } from "next/cache";

// --- Dashboard用: スタッフ設定の保存 ---
export async function updateStaffPolicyAction(staffId: string, config: StaffContractConfig) {
  try {
    await upsertStaffPolicy(staffId, config);
    revalidatePath(`/dashboard/staff`);
    revalidatePath(`/dashboard/staff/${staffId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Update Policy Error:", error);
    return { success: false, error: error.message };
  }
}

// --- LIFF用: スタッフ取得 (修正版) ---
export async function getStaffByLineId(lineId: string) {
  try {
    const staff = await getStaffService(lineId);
    if (staff) {
      return { success: true, staff };
    } else {
      // 【重要修正】success キーを含めないことで、UI側の 'success' in result 判定を機能させる
      return { error: "Staff not found" };
    }
  } catch (error: any) {
    console.error("LIFF Fetch Error:", error);
    // 【重要修正】ここも success キーを含めない
    return { error: error.message };
  }
}
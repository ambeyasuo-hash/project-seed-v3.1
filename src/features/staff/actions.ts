// src/features/staff/actions.ts
"use server";

import { upsertStaffPolicy } from "./service";
import { StaffContractConfig } from "./types"; // 型はtypes.tsから
import { revalidatePath } from "next/cache";
import { getStaffByLineId as getStaffService } from "./service"; // 名前衝突回避のためエイリアス

// Dashboard用: スタッフ設定の保存アクション
export async function updateStaffPolicyAction(staffId: string, config: StaffContractConfig) {
  try {
    // サーバーサイドロジックを呼び出し
    await upsertStaffPolicy(staffId, config);
    
    // 画面のキャッシュを更新
    revalidatePath(`/dashboard/staff`);
    revalidatePath(`/dashboard/staff/${staffId}`);
    
    return { success: true };
  } catch (error: any) {
    console.error("Update Policy Error:", error);
    return { success: false, error: error.message };
  }
}
/**
 * LIFF用: スタッフ取得アクション
 */
export async function getStaffByLineId(lineId: string) {
  try {
    const staff = await getStaffService(lineId);
    return staff;
  } catch (error) {
    console.error("LIFF Fetch Error:", error);
    return null;
  }
}
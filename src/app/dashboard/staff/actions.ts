"use server";

import { revalidatePath } from "next/cache";
import { staffService, StaffContractConfig } from "@/features/staff/service";

/**
 * スタッフの個別ポリシーを更新するServer Action
 * UI側から直接 service を呼ぶ代わりに、キャッシュ更新を伴う場合はこちらを使用します
 */
export async function updateStaffPolicyAction(staffId: string, config: StaffContractConfig) {
  try {
    await staffService.upsertStaffPolicy(staffId, config);
    
    // キャッシュを無効化して最新データを取得し直す
    revalidatePath("/dashboard/staff");
    revalidatePath(`/dashboard/staff/${staffId}`);
    
    return { success: true };
  } catch (error) {
    console.error("Action Error [updateStaffPolicyAction]:", error);
    return { success: false, error: "更新に失敗しました" };
  }
}

/**
 * スタッフ一覧を再取得する（必要に応じて）
 * ※ 引数なしで呼ぶように修正
 */
export async function refreshStaffListAction() {
  try {
    const staffs = await staffService.getStaffList(); // 引数を削除
    revalidatePath("/dashboard/staff");
    return { success: true, data: staffs };
  } catch (error) {
    return { success: false, error: "取得に失敗しました" };
  }
}
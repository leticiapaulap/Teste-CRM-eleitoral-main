import { query } from "./db.js";

export async function repairOrphanReferralLinks() {
  await query(
    `update network_nodes child
        set parent_user_id = parent_lp.user_id,
            root_leader_id = coalesce(parent_nn.root_leader_id, parent_lp.user_id),
            level = coalesce(parent_nn.level, 0) + 1,
            referral_code_used = parent_lp.referral_code
       from leader_profiles parent_lp
       left join network_nodes parent_nn on parent_nn.user_id = parent_lp.user_id
      where child.parent_user_id is null
        and child.referral_code_used is not null
        and child.referral_code_used <> ''
        and upper(child.referral_code_used) = parent_lp.referral_code
        and child.user_id <> parent_lp.user_id`
  );
}

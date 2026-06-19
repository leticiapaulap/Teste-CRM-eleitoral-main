import { hashPassword } from "../lib/security.js";
import { query, withTransaction } from "../lib/db.js";
import { makeReferralUrl, makeReferralCode } from "../lib/referrals.js";
import { getConfig } from "../lib/config.js";

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME || "Administrador SIV";
const phone = process.env.ADMIN_PHONE || "61999999999";
const role = process.env.ADMIN_ROLE || "DEPUTADO";
const photoUrl = process.env.ADMIN_PHOTO_URL || "mock://profile-photos/admin.png";
const localidade = process.env.ADMIN_LOCALIDADE || "Distrito Federal";
const regiaoAdministrativa = process.env.ADMIN_REGIAO_ADMINISTRATIVA || "Distrito Federal";

if (!email || !password) {
  console.error("Configure ADMIN_EMAIL e ADMIN_PASSWORD antes de rodar este script.");
  process.exit(1);
}

if (password.length < 8) {
  console.error("ADMIN_PASSWORD deve ter pelo menos 8 caracteres.");
  process.exit(1);
}

if (!["DEPUTADO", "EQUIPE"].includes(role)) {
  console.error("ADMIN_ROLE deve ser DEPUTADO ou EQUIPE.");
  process.exit(1);
}

const config = getConfig();
const passwordHash = await hashPassword(password);

await withTransaction(async (client) => {
  const existing = await client.query("select id from users where lower(email) = lower($1)", [email]);
  if (existing.rows[0]) {
    await client.query(
      `update users
          set name = $1,
              phone = $2,
              password_hash = $3,
              role = $4,
              photo_url = $5,
              active = true,
              consent_accepted = true,
              consent_accepted_at = coalesce(consent_accepted_at, now())
        where lower(email) = lower($6)`,
      [name, phone, passwordHash, role, photoUrl, email]
    );
    console.log(`Usuario administrativo atualizado: ${email}`);
    return;
  }

  const userResult = await client.query(
    `insert into users (name, email, phone, password_hash, role, photo_url, active, consent_accepted, consent_accepted_at)
     values ($1, $2, $3, $4, $5, $6, true, true, now())
     returning id`,
    [name, email, phone, passwordHash, role, photoUrl]
  );
  const userId = userResult.rows[0].id;

  await client.query(
    `insert into user_locations (user_id, localidade, regiao_administrativa)
     values ($1, $2, $3)
     on conflict (user_id) do update
       set localidade = excluded.localidade,
           regiao_administrativa = excluded.regiao_administrativa`,
    [userId, localidade, regiaoAdministrativa]
  );

  await client.query(
    `insert into network_nodes (user_id, parent_user_id, root_leader_id, referral_code_used, level)
     values ($1, null, null, null, 0)
     on conflict (user_id) do nothing`,
    [userId]
  );

  if (role === "DEPUTADO") {
    const code = makeReferralCode("SIV");
    await client.query(
      `insert into leader_profiles (user_id, referral_code, referral_url)
       values ($1, $2, $3)
       on conflict (user_id) do nothing`,
      [userId, code, makeReferralUrl(config.appUrl, code)]
    );
  }

  console.log(`Usuario administrativo criado: ${email}`);
});

process.exit(0);

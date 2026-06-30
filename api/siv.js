import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { withTransaction } from "../lib/db.js";
import { makeReferralUrl } from "../lib/referrals.js";

function onlyDigits(value = "") {
  return String(value).replace(/\D/g, "");
}

function getValue(obj, keys, fallback = "") {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && String(obj[key]).trim() !== "") {
      return String(obj[key]).trim();
    }
  }
  return fallback;
}

function makeReferralCode() {
  return `SIV${randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

function getPublicAppUrl(req) {
  const forwardedProto = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim();
  const forwardedHost = String(req.headers["x-forwarded-host"] || "").split(",")[0].trim();
  const host = forwardedHost || req.headers.host;
  const proto = forwardedProto || (host?.includes("localhost") ? "http" : "https");
  if (host && !String(host).includes("localhost")) return `${proto}://${host}`;
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

function normalizeReferralCode(value) {
  const code = String(value || "").trim().toUpperCase();
  if (!code) return "";
  if (!/^(AG\d{3,}|SIV[A-Z0-9]{6,})$/.test(code)) {
    const error = new Error("Codigo de indicacao invalido.");
    error.status = 400;
    throw error;
  }
  return code;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Metodo nao permitido" });
  }

  try {
    const scriptUrl = process.env.SIV_APPS_SCRIPT_URL;

    const xff = req.headers["x-forwarded-for"];
    const ip = typeof xff === "string" && xff.trim()
        ? xff.split(",")[0].trim()
        : req.socket?.remoteAddress || "";

    const bodyObj = typeof req.body === "string"
        ? Object.fromEntries(new URLSearchParams(req.body))
        : req.body || {};

    const name = getValue(bodyObj, ["name", "nome"]);
    const phone = onlyDigits(getValue(bodyObj, ["phone", "whatsapp", "telefone"]));
    const localidade = getValue(bodyObj, ["localidade", "bairro"], "Brasilia");
    const regiaoAdministrativa = getValue(bodyObj, ["ra", "regiao_administrativa", "regiaoAdministrativa"]);
    const referralCodeUsed = normalizeReferralCode(getValue(bodyObj, ["referral_code", "referencia", "ref"]));
    const consentAccepted = ["true", "on", "1", "sim"].includes(
        getValue(bodyObj, ["consent_accepted", "consentimento"], "true").toLowerCase()
    );

    if (!name) return res.status(400).json({ ok: false, error: "Nome obrigatorio." });
    if (phone.length < 10 || phone.length > 11) {
      return res.status(400).json({ ok: false, error: "WhatsApp invalido." });
    }
    if (!regiaoAdministrativa) {
      return res.status(400).json({ ok: false, error: "RA obrigatoria." });
    }
    if (!consentAccepted) {
      return res.status(400).json({ ok: false, error: "Consentimento obrigatorio." });
    }

    const syntheticEmail = `${phone}.${Date.now()}@cadastro.siv.local`;
    const passwordHash = await bcrypt.hash(randomUUID(), 12);
    const newReferralCode = makeReferralCode();
    const newReferralUrl = makeReferralUrl(getPublicAppUrl(req), newReferralCode);

    const saved = await withTransaction(async (client) => {
      const parentResult = referralCodeUsed
          ? await client.query(
              `select lp.user_id as id, n.root_leader_id, n.level
                 from leader_profiles lp
                 left join network_nodes n on n.user_id = lp.user_id
                where lp.referral_code = $1 and lp.active = true
                limit 1`,
              [referralCodeUsed]
          )
          : { rows: [] };

      const parent = parentResult.rows[0] || null;
      if (referralCodeUsed && !parent) {
        const error = new Error("Codigo de indicacao invalido.");
        error.status = 400;
        throw error;
      }
      const level = parent ? Number(parent.level || 0) + 1 : 0;
      const rootLeaderId = parent?.root_leader_id || parent?.id || null;

      const userResult = await client.query(
          `insert into users
          (name, email, phone, password_hash, role, photo_url, active,
           consent_accepted, consent_accepted_at)
         values
          ($1, $2, $3, $4, 'CADASTRADOS', $5, true,
           true, now())
         returning id, name, email, phone, role`,
          [
            name,
            syntheticEmail,
            phone,
            passwordHash,
            bodyObj.photoUrl || bodyObj.photo_url || "/img/LOGO-SIV.png",
          ]
      );

      const user = userResult.rows[0];

      await client.query(
          `insert into user_locations
          (user_id, localidade, regiao_administrativa)
         values ($1, $2, $3)`,
          [user.id, localidade, regiaoAdministrativa]
      );

      await client.query(
          `insert into network_nodes
          (user_id, parent_user_id, root_leader_id, referral_code_used, level)
         values ($1, $2, $3, $4, $5)`,
          [
            user.id,
            parent?.id || null,
            rootLeaderId || user.id,
            referralCodeUsed || null,
            level,
          ]
      );

      await client.query(
          `insert into leader_profiles (user_id, referral_code, referral_url)
         values ($1, $2, $3)`,
          [user.id, newReferralCode, newReferralUrl]
      );

      return { ...user, referral_code: newReferralCode, referral_url: newReferralUrl };
    });

    let sheetResult = null;

    if (scriptUrl) {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(bodyObj)) params.set(k, String(v));
      params.set("ip", ip);
      params.set("email", syntheticEmail);
      params.set("role", "CADASTRADOS");
      params.set("referral_code", newReferralCode);

      try {
        const r = await fetch(scriptUrl, { method: "POST", body: params });
        const text = await r.text();
        sheetResult = JSON.parse(text);
      } catch (error) {
        sheetResult = { ok: false, error: error?.message || String(error) };
      }
    }

    return res.status(200).json({
      ok: true,
      user: saved,
      codigo_pessoa: saved.referral_code,
      invite_link: saved.referral_url,
      sheet: sheetResult,
    });
  } catch (e) {
    return res.status(e?.status || 500).json({ ok: false, error: e?.message || String(e) });
  }
}

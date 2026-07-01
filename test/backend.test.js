import test from "node:test";
import assert from "node:assert/strict";
import { ApiError } from "../lib/http.js";
import { buildTree, makeReferralCode, makeReferralUrl } from "../lib/referrals.js";
import { isAdminRole, ROLES } from "../lib/security.js";
import { toGeoJson } from "../lib/map-service.js";
import { normalizeRegisterInput } from "../lib/user-service.js";
import {
  assertValidPhotoUrl,
  validateCoordinate,
  validateEmail,
  validatePhone,
  validatePhotoMetadata,
} from "../lib/validation.js";

test("valida email, telefone e coordenadas", () => {
  assert.equal(validateEmail("USER@EXAMPLE.COM"), "user@example.com");
  assert.equal(validatePhone("(61) 99999-0000"), "61999990000");
  assert.equal(validateCoordinate("-15.79", "latitude", -90, 90), -15.79);
  assert.throws(() => validateCoordinate("-200", "latitude", -90, 90), ApiError);
});

test("valida foto segura quando enviada", () => {
  const file = { mimetype: "image/png", originalFilename: "perfil.png", size: 1024 };
  assert.deepEqual(validatePhotoMetadata(file, 2048), {
    mimeType: "image/png",
    fileName: "perfil.png",
    size: 1024,
  });
  assert.throws(() => validatePhotoMetadata(null, 2048), ApiError);
  assert.throws(() => validatePhotoMetadata({ mimetype: "application/x-msdownload", originalFilename: "x.exe", size: 1 }, 2048), ApiError);
  assert.throws(() => validatePhotoMetadata({ mimetype: "image/png", originalFilename: "perfil.png", size: 4096 }, 2048), ApiError);
  assert.equal(assertValidPhotoUrl("/uploads/profile-photos/perfil.png"), "/uploads/profile-photos/perfil.png");
  assert.equal(assertValidPhotoUrl("", { required: false }), null);
  assert.throws(() => assertValidPhotoUrl("javascript:alert(1)", { required: false }), ApiError);
});

test("cadastro aceita foto opcional para coordenadores, lideres e cadastrados", () => {
  assert.equal(normalizeRegisterInput({
    name: "Maria Souza",
    email: "maria@example.com",
    phone: "(61) 99999-0000",
    password: "senha-segura",
    role: "COORDENADORES",
    localidade: "Taguatinga",
    regiao_administrativa: "Taguatinga",
    consent_accepted: true,
  }).photoUrl, null);

  assert.equal(normalizeRegisterInput({
    name: "Lider Souza",
    email: "lider@example.com",
    phone: "(61) 98888-0000",
    password: "senha-segura",
    role: "LIDERES",
    localidade: "Ceilandia",
    regiao_administrativa: "Ceilandia",
    consent_accepted: true,
  }).photoUrl, null);

  assert.equal(normalizeRegisterInput({
    name: "Joao Souza",
    email: "joao@example.com",
    phone: "(61) 97777-0000",
    password: "senha-segura",
    role: "CADASTRADOS",
    localidade: "Ceilandia",
    regiao_administrativa: "Ceilandia",
    consent_accepted: true,
  }).photoUrl, null);
});

test("cadastro de admin aceita foto opcional", () => {
  const input = normalizeRegisterInput({
    name: "Admin SIV",
    email: "admin@example.com",
    phone: "(61) 99999-0000",
    password: "senha-segura",
    role: "EQUIPE",
    localidade: "Distrito Federal",
    regiao_administrativa: "Distrito Federal",
    consent_accepted: true,
  });

  assert.equal(input.photoUrl, null);
});

test("gera link de indicacao usando APP_URL sem dominio fixo", () => {
  const code = makeReferralCode();
  assert.match(code, /^SIV[A-F0-9]{8}$/);
  assert.equal(makeReferralUrl("https://meudominio.com.br/", "SIV123"), "https://meudominio.com.br/cadastro?ref=SIV123");
});

test("monta arvore de indicacoes por parent_user_id", () => {
  const tree = buildTree([
    { user_id: "lider", parent_user_id: null, name: "Lider" },
    { user_id: "n1", parent_user_id: "lider", name: "Nivel 1" },
    { user_id: "n2", parent_user_id: "n1", name: "Nivel 2" },
  ]);
  assert.equal(tree[0].user_id, "lider");
  assert.equal(tree[0].children[0].user_id, "n1");
  assert.equal(tree[0].children[0].children[0].user_id, "n2");
});

test("permissoes administrativas ficam restritas a equipe", () => {
  assert.equal(isAdminRole(ROLES.EQUIPE), true);
  assert.equal(isAdminRole(ROLES.COORDENADORES), false);
  assert.equal(isAdminRole(ROLES.LIDERES), false);
  assert.equal(isAdminRole(ROLES.CADASTRADOS), false);
});

test("gera GeoJSON com propriedades necessarias para o mapa", () => {
  const geojson = toGeoJson([
    {
      id: "u1",
      name: "Maria",
      role: "LIDERES",
      localidade: "Taguatinga",
      regiao_administrativa: "Taguatinga",
      latitude: -15.835,
      longitude: -48.056,
      root_leader_id: "u1",
      root_leader_name: "Maria",
      parent_user_id: null,
      parent_user_name: null,
      level: 0,
      created_at: "2026-06-19T10:00:00.000Z",
    },
  ]);

  assert.equal(geojson.type, "FeatureCollection");
  assert.deepEqual(geojson.features[0].geometry.coordinates, [-48.056, -15.835]);
  assert.equal(geojson.features[0].properties.root_leader_name, "Maria");
  assert.equal(geojson.features[0].properties.level, 0);
});

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { PGlite } = require(process.env.PGLITE_MODULE || '@electric-sql/pglite');

const owner = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
const business = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const website = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const values = { title: 'QA class', style: 'Jazz', description: 'Persistence test', date: '2026-10-01', time: '18:00', duration: '60 minutes', price: '$25', capacity: '20', published: false, image: '' };
let rpcInput;
const client = {
  auth: { getUser: async () => ({ data: { user: { id: owner } } }) },
  from: () => ({ select() { return this; }, eq() { return this; }, single: async () => ({ data: { id: business } }) }),
  rpc: async (name, args) => { rpcInput = args; return { data: { class_id: 'persisted' } }; }
};
const context = { URL, atob, console, document: { documentElement: { dataset: {} } }, window: { location: { hostname: 'localhost' }, supabase: { createClient: () => client }, BeyondEightConfig: { SUPABASE_URL: 'https://localhost', SUPABASE_ANON_KEY: 'x.e30.x' } } };
vm.runInNewContext(fs.readFileSync(require.resolve('../app-services.js'), 'utf8'), context);
const app = context.window.BeyondEight;

(async () => {
  const normalized = app.normalizeClass(values);
  assert.equal(normalized.price, 25);
  assert.equal(normalized.capacity, 20);
  assert.equal(normalized.image, null);
  assert.equal(app.normalizeClass({ ...values, price: 0 }).price, 0);
  for (const bad of [{ price: '' }, { price: '$oops' }, { capacity: '' }, { capacity: '1.5' }, { date: '2026-02-30' }, { time: '25:00' }]) assert.throws(() => app.normalizeClass({ ...values, ...bad }));
  await app.createClass({ businessId: business, values });
  assert.equal(rpcInput.p_class.price, 25);
  assert.equal(rpcInput.p_operation, 'create');
  const rpc = client.rpc;
  client.rpc = async () => ({ error: { code: '42501', message: 'Denied by RLS' } });
  await assert.rejects(app.createClass({ businessId: business, values }), error => error.code === '42501');
  client.rpc = rpc;
  const getUser = client.auth.getUser;
  client.auth.getUser = async () => ({ data: { user: null } });
  await assert.rejects(app.createClass({ businessId: business, values }), /sign in/);
  client.auth.getUser = getUser;

  const db = new PGlite();
  await db.exec(`
    create role authenticated; create role anon; create schema auth;
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema public, auth to authenticated, anon;
    create table businesses (id uuid primary key, owner_user_id uuid not null);
    create table websites (id uuid primary key, business_id uuid unique references businesses(id), published boolean, updated_at timestamptz);
    create table business_settings (business_id uuid primary key, generated_content jsonb);
    insert into businesses values ('${business}','${owner}');
    insert into websites values ('${website}','${business}',true,now());
    insert into business_settings values ('${business}','{"businessName":"QA","classes":[]}');
    grant select on businesses to authenticated;
    grant select, update on websites to authenticated;
    alter table websites enable row level security;
    create policy owner on websites for all to authenticated using (exists (select 1 from businesses b where b.id=business_id and b.owner_user_id=auth.uid()));
  `);
  const migration = fs.readFileSync(require.resolve('../supabase-class-persistence.sql'), 'utf8');
  await db.exec(migration);
  await db.exec(migration);
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${owner}',false);`);
  const mutate = async (op, id = null, item = {}) => (await db.query('select mutate_class($1,$2,$3,$4::jsonb) result', [business, op, id, JSON.stringify(item)])).rows[0].result;
  let result = await mutate('create', null, normalized);
  const id = result.class_id;
  assert.equal(result.draft_content.classes.length, 1);
  assert.equal(result.published_content.classes.length, 0);
  assert.equal((await db.query('select content from website_drafts')).rows[0].content.classes[0].id, id);
  result = await mutate('update', id, { ...normalized, title: 'Edited', published: true });
  assert.equal(result.published_content.classes[0].title, 'Edited');
  result = await mutate('duplicate', id);
  assert.notEqual(result.class_id, id);
  assert.equal(result.draft_content.classes.length, 2);
  assert.equal(result.published_content.classes.length, 1);
  const duplicateId = result.class_id;
  result = await mutate('highlight', id);
  assert.equal(result.published_content.classes[0].highlighted, true);
  result = await mutate('update', id, { ...normalized, published: false });
  assert.equal(result.published_content.classes.length, 0);
  result = await mutate('delete', duplicateId);
  assert.equal(result.draft_content.classes.length, 1);
  await assert.rejects(mutate('update', 'missing', normalized));
  await db.exec(`select set_config('request.jwt.claim.sub','${other}',false);`);
  assert.equal((await db.query('select * from website_drafts')).rows.length, 0);
  for (const op of ['create', 'update', 'delete', 'duplicate', 'highlight']) await assert.rejects(mutate(op, id, normalized), /permission/);
  await assert.rejects(db.query('insert into website_drafts values ($1,$2,$3,now())', [website, business, '{}']), /row-level security/);
  await db.exec('reset role; set role anon;');
  await assert.rejects(mutate('create', null, normalized), /permission/);
  await db.close();
  console.log('PASS: normalization, canonical service, migration rerun, database CRUD, draft/public isolation, duplicate ID, highlight, owner and anonymous RLS');
})().catch(error => { console.error(error); process.exitCode = 1; });

import fs from 'node:fs';
for(const key of ['CLOUDFLARE_D1_DATABASE_ID','CLOUDFLARE_ACCOUNT_ID','CLOUDFLARE_API_TOKEN'])if(!process.env[key])throw new Error(`${key} belum dikonfigurasi di GitHub Actions.`);
const id=process.env.CLOUDFLARE_D1_DATABASE_ID;if(!/^[a-f0-9-]{36}$/i.test(id))throw new Error('D1 database ID tidak valid.');
const p='backend/wrangler.toml';fs.writeFileSync(p,fs.readFileSync(p,'utf8').replace('REPLACE_WITH_D1_DATABASE_ID',id));

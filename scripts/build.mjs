import {cpSync,mkdirSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
rmSync('dist',{recursive:true,force:true});cpSync('frontend','dist',{recursive:true});mkdirSync('dist/vendor/three',{recursive:true});cpSync('node_modules/three/build','dist/vendor/three/build',{recursive:true});cpSync('node_modules/three/examples/jsm','dist/vendor/three/addons',{recursive:true});cpSync('node_modules/three/LICENSE','dist/vendor/three/LICENSE');
// Keep the delivered application in one editable HTML, with versioned engine assets.
let html=readFileSync('dist/index.html','utf8');html=html.replace('<link rel="stylesheet" href="./style.css">','<style>'+readFileSync('frontend/style.css','utf8')+'</style>');html=html.replace('<script type="module" src="./src/app.js"></script>','<script type="module">'+readFileSync('frontend/src/app.js','utf8')+'</script>');writeFileSync('dist/index.html',html);
import {initialState} from '../frontend/src/model.js';
writeFileSync('backend/migrations/0001_initial.sql',`CREATE TABLE IF NOT EXISTS twin_state (id INTEGER PRIMARY KEY CHECK (id = 1), data TEXT NOT NULL CHECK(json_valid(data)), revision INTEGER NOT NULL DEFAULT 0);\nINSERT OR IGNORE INTO twin_state(id,data,revision) VALUES(1,'${JSON.stringify(initialState).replaceAll("'","''")}',0);\n`);
console.log('Build selesai: dist/ (HTML + Three.js lokal), migrasi D1 tersedia.');

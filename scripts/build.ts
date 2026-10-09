import { $ } from 'bun';

const root = new URL('../', import.meta.url);
const outdir = new URL('dist/', root).pathname;
await $`rm -rf ${outdir}`.quiet();

const result = await Bun.build({
  entrypoints: [new URL('index.html', root).pathname],
  outdir,
  target: 'browser',
  minify: true,
});

if (!result.success) {
  for (const log of result.logs) {
    console.error(log);
  }
  throw new Error('Browser build failed');
}

await $`cp ${new URL('resume.pdf', root).pathname} ${outdir}`.quiet();

console.log(`✅ Built ${result.outputs.length} bundled assets`);

import { writeFile } from 'node:fs/promises';
import { format, resolveConfig } from 'prettier';
import { inspectPublication, writePlayReport } from '../deploy/publicationInputs.ts';
import { renderStoreDossier } from '../deploy/storeDossier.ts';
const root = 'docs/publication';
// Read and validate current files; a previous report is never used as input.
const { config, copies, captures, report } = await inspectPublication();
await writePlayReport(report);
const html = renderStoreDossier(config, copies, captures, report);
await writeFile(
  `${root}/index.html`,
  await format(html, { ...(await resolveConfig(`${root}/index.html`)), parser: 'html' }),
);
console.log(
  JSON.stringify({
    dossier: `${root}/index.html`,
    state: report.state,
    errors: report.errors.length,
    blockers: report.blockers.length,
    assetFilesChecked: report.assetFilesChecked,
  }),
);
process.exitCode = report.errors.length ? 2 : 0;

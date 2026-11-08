import { inspectPublication, writePlayReport } from '../deploy/publicationInputs.ts';
const { report } = await inspectPublication();
const draft = process.argv.includes('--draft');
await writePlayReport({ ...report, draft });
console.log(
  JSON.stringify({
    state: report.state,
    errors: report.errors.length,
    blockers: report.blockers.length,
    assetFilesChecked: report.assetFilesChecked,
    automaticPublicationAuthorized: false,
  }),
);
for (const i of report.errors) console.log(`ERROR ${i.code}: ${i.message}`);
for (const i of report.blockers) console.log(`TODO ${i.code}: ${i.message}`);
process.exitCode = report.errors.length || (!draft && report.blockers.length) ? 2 : 0;

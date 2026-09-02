import {mkdtemp, rename, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawn} from 'node:child_process';

const appApiDirectory = new URL('../src/app/api', import.meta.url);
const stashDirectory = await mkdtemp(join(tmpdir(), 'wind-portfolio-pages-'));
const stashedApiDirectory = new URL('./api', `file://${stashDirectory}/`);

async function runBuild() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['next', 'build', '--webpack'], {
      stdio: 'inherit',
      env: {
        ...process.env,
        GITHUB_PAGES: 'true',
        NEXT_PUBLIC_GITHUB_PAGES: 'true',
      },
    });
    child.once('error', reject);
    child.once('exit', (code) => resolve(code ?? 1));
  });
}

await rename(appApiDirectory, stashedApiDirectory);
try {
  const exitCode = await runBuild();
  if (exitCode !== 0) process.exitCode = exitCode;
} finally {
  await rename(stashedApiDirectory, appApiDirectory);
  await rm(stashDirectory, {recursive: true, force: true});
}

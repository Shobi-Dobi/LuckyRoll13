import { spawn } from 'node:child_process';

const productionContext = 'production';
const maximumAttempts = 3;
const retryDelayMs = 15_000;

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function submitIndexNow() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['scripts/submit-indexnow.mjs', '--submit'], {
      cwd: process.cwd(),
      env: process.env,
      stdio: 'inherit'
    });

    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`IndexNow process exited with ${signal ? `signal ${signal}` : `code ${code}`}`));
    });
  });
}

export const onSuccess = async ({ utils }) => {
  const context = process.env.CONTEXT || process.env.NETLIFY_CONTEXT || '';

  if (context !== productionContext) {
    console.log(`IndexNow skipped for Netlify context "${context || 'unknown'}".`);
    return;
  }

  for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
    try {
      await submitIndexNow();
      console.log('IndexNow notification completed after the production deploy.');
      return;
    } catch (error) {
      if (attempt < maximumAttempts) {
        console.warn(`IndexNow attempt ${attempt} failed; retrying after ${retryDelayMs / 1_000} seconds.`, error);
        await wait(retryDelayMs);
        continue;
      }

      console.error('IndexNow could not be notified after the production deploy.', error);
      utils?.status?.show?.({
        title: 'IndexNow notification failed',
        summary: 'The site was deployed, but search engines were not notified automatically.',
        text: 'Run node scripts/submit-indexnow.mjs --submit after confirming production is live.'
      });
    }
  }
};

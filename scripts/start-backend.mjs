import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const python = join(root, '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');

if (!existsSync(python)) {
    console.error('Backend environment missing. Run: python -m venv .venv');
    console.error('Then install apps/backend/requirements.txt using that virtual environment.');
    process.exit(1);
}

const backend = spawn(python, [
    '-m', 'uvicorn', 'main:app', '--app-dir', 'apps/backend',
    '--host', '127.0.0.1', '--port', '8000',
], { cwd: root, stdio: 'inherit', windowsHide: true });

backend.on('error', (error) => {
    console.error(`Could not start the backend: ${error.message}`);
    process.exitCode = 1;
});
backend.on('exit', (code) => { process.exitCode = code ?? 0; });
for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => backend.kill(signal));
}

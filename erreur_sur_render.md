Vercel CLI 62.0.0
Running "install" command: `cd ../.. && npm run build -w @dps/shared && npm run build -w web`...
> @dps/shared@0.0.1 build
> tsc -p tsconfig.json
sh: line 1: tsc: command not found
npm error Lifecycle script `build` failed with error:
npm error code 127
npm error path /vercel/path0/packages/shared
npm error workspace @dps/shared@0.0.1
npm error location /vercel/path0/packages/shared
npm error command failed
npm error command sh -c tsc -p tsconfig.json
Error: Command "cd ../.. && npm run build -w @dps/shared && npm run build -w web" exited with 127

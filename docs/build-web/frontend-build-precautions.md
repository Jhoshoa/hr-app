# Frontend Build Precautions

Use this checklist before running a production build for `apps/web` on Windows.

## Why This Matters

`next dev` and `next build` both use the `.next` directory. On Windows, an active dev server can keep files locked or keep background Node processes alive, which may cause `next build` to hang for a long time.

## Recommended Steps

1. Stop the frontend dev server before building.

   If it was started from a terminal, stop it with `Ctrl+C`.

2. Check whether frontend Node processes are still running.

   ```powershell
   Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
     Where-Object {
       $_.CommandLine -like '*@hr-app/web*' -or
       $_.CommandLine -like '*next*dev*3000*' -or
       $_.CommandLine -like '*start-server.js*'
     } |
     Select-Object ProcessId,CommandLine
   ```

3. Stop only the frontend dev processes if they remain active.

   Replace the IDs with the ones from the previous command.

   ```powershell
   Stop-Process -Id 96724,106928,81948,72732 -Force
   ```

4. Run the build with Node 20.

   ```powershell
   $env:Path = "C:\Users\josoe.ichuta\AppData\Local\nvm\v20.18.1;$env:Path"
   $env:NEXT_TELEMETRY_DISABLED = "1"
   corepack pnpm --filter @hr-app/web build
   ```

5. Restart the frontend dev server after the build if needed.

   ```powershell
   $env:Path = "C:\Users\josoe.ichuta\AppData\Local\nvm\v20.18.1;$env:Path"
   corepack pnpm --filter @hr-app/web dev
   ```

## Practical Rule

Before validating a new feature with `@hr-app/web build`, make sure no `next dev --port 3000` process is still running. Typecheck and tests can run while the dev server is active, but production build should run with the frontend dev server stopped.

# Prisma Windows Locking Precautions

Use this checklist before running Prisma generate, migrations, or seed commands on Windows.

## Why This Matters

The API dev server loads Prisma Client. On Windows, that can lock Prisma's generated engine file:

```text
query_engine-windows.dll.node
```

When Prisma tries to regenerate the client, it may fail with:

```text
EPERM: operation not permitted, rename ... query_engine-windows.dll.node.tmp -> query_engine-windows.dll.node
```

## Recommended Steps

1. Stop the API dev server before running Prisma commands.

   If it was started from a terminal, stop it with `Ctrl+C`.

2. Check whether API Node processes are still running.

   ```powershell
   Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
     Where-Object {
       $_.CommandLine -like '*@hr-app/api*' -or
       $_.CommandLine -like '*nest*start*watch*' -or
       $_.CommandLine -like '*apps\api\dist\src\main*'
     } |
     Select-Object ProcessId,CommandLine
   ```

3. Stop only those API processes if they remain active.

   Replace the IDs with the ones from the previous command.

   ```powershell
   Stop-Process -Id 102956,97640,47416 -Force
   ```

4. Run Prisma commands with Node 20.

   ```powershell
   $env:Path = "C:\Users\josoe.ichuta\AppData\Local\nvm\v20.18.1;$env:Path"

   corepack pnpm db:generate
   corepack pnpm db:migrate
   corepack pnpm db:seed
   ```

5. Restart the API dev server after Prisma finishes.

   ```powershell
   $env:Path = "C:\Users\josoe.ichuta\AppData\Local\nvm\v20.18.1;$env:Path"
   corepack pnpm --filter @hr-app/api dev
   ```

## Practical Rule

Do not run `db:generate` or `db:migrate` while `@hr-app/api dev` is running on Windows.

`db:seed` may work while the API is running, but it is safer to run the full Prisma sequence with the API stopped when schema/client generation is involved.

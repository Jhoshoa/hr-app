# Git Commands For This Repository

> Repository: `Jhoshoa/hr-app`
>
> SSH host alias to use:
>
> ```sshconfig
> Host github-third
>   HostName github.com
>   User git
>   IdentityFile ~/.ssh/id_ed25519_third
> ```

## First-Time Repository Setup

Run from the repo root:

```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin git@github-third:Jhoshoa/hr-app.git
git push -u origin main
```

## Normal Commit And Push Flow

Check changes:

```bash
git status
```

Stage all changes:

```bash
git add .
```

Commit:

```bash
git commit -m "your commit message"
```

Push:

```bash
git push
```

## If Remote Already Exists

Check current remote:

```bash
git remote -v
```

Set the remote to the SSH alias:

```bash
git remote set-url origin git@github-third:Jhoshoa/hr-app.git
```

Push main:

```bash
git push -u origin main
```

## Important Notes

- Use `git@github-third:Jhoshoa/hr-app.git`, not `https://github.com/Jhoshoa/hr-app.git`, so Git uses the `github-third` SSH identity.
- Do not commit `.env`.
- Do not commit `node_modules`.
- The current `.gitignore` already excludes `.env`, `node_modules`, build output, and local Docker Postgres data.

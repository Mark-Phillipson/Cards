# Deploying to Vercel (Blazor WebAssembly)

Steps to deploy this repo to Vercel:

1. Sign in to vercel.com and choose "Import Project" -> GitHub. Select this repository.
2. Set the project Root to the repository root.
3. Configure the Build Command:

```
dotnet publish CardGame/CardGame.csproj -c Release -o CardGame/publish
```

4. Set the Output Directory to:

```
CardGame/publish/wwwroot
```

5. Deploy. Vercel will run the build, publish the static files and serve them.

Notes:
- The `vercel.json` routes file is configured to serve the static files and fallback unknown routes to `index.html` so SPA routing works.
- If you prefer, you can pre-publish locally (`dotnet publish`) and connect Vercel to a branch where `CardGame/publish/wwwroot` is committed, but letting Vercel build is simpler.

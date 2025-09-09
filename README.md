CardGame — Deploy to Azure Static Web Apps
=========================================

This repository contains a Blazor WebAssembly card game (Strip Jack Naked) in the `CardGame/` folder.

This README replaces previous Vercel-focused instructions and documents how to publish the app to Azure Static Web Apps (recommended for Blazor WASM).

Prerequisites
-------------
- An Azure subscription and permission to create resources.
- GitHub repository for your code (recommended) or local files if you prefer the CLI deploy.
- Azure CLI installed and logged in (if using CLI):

```powershell
az login
az account set --subscription <your-subscription-id-or-name>
```

Quick options
-------------
1) Recommended — Create the Azure Static Web App from the Azure Portal
   - In the Azure Portal, create a new Static Web App and select your GitHub repo + branch. Azure will generate a GitHub Actions workflow that builds and deploys on push.
   - When configuring the build, set the App location to `CardGame` and the App artifact location to the compiled Blazor output (see notes below).

2) CLI — Create and deploy using Azure CLI
   - Build/publish the Blazor app locally, then use `az staticwebapp` to create the resource and point it at the published output.

Build / publish step (local)
---------------------------
From the repository root, publish the `CardGame` project in Release mode. Example (PowerShell):

```powershell
dotnet publish CardGame/CardGame.csproj -c Release -o ./CardGame/publish
```

After publishing, confirm the web assets are under `CardGame/publish/wwwroot` (this is the folder Azure Static Web Apps should serve).

Create the Static Web App with Azure CLI (example)
------------------------------------------------
Replace placeholders with your values.

```powershell
az staticwebapp create \
  --name MyCardGameApp \
  --resource-group MyResourceGroup \
  --source . \
  --location "West Europe" \
  --branch main \
  --app-artifact-location "CardGame/publish/wwwroot" \
  --sku Free
```

Notes on GitHub Actions (portal-created flow)
--------------------------------------------
- If you create the Static Web App from the portal and connect to GitHub, Azure will add a workflow under `.github/workflows/` that runs on push. The portal flow typically sets these values automatically:
  - app_location: "CardGame"
  - api_location: "" (this project has no separate API project)
  - app_artifact_location: path to the published wwwroot (for example `CardGame/bin/Release/net9.0/publish/wwwroot` or `CardGame/publish/wwwroot` if you customize the publish output)

- If Azure's generated workflow fails to find the artifact, adjust the `app_artifact_location` in the workflow to the exact path produced by your `dotnet publish` step.

Troubleshooting
---------------
- If pages show a 404 after deploy, verify the artifact folder contains `index.html` and the Blazor files (wasm, dlls, etc.).
- If the path in the action is wrong, open the workflow file and update `app_artifact_location` to the correct publish folder.

Next steps and optional improvements
-----------------------------------
- Add a GitHub Actions step to run `dotnet publish` with a deterministic output path and set `app_artifact_location` to that path.
- Add instructions for custom domains, HTTPS, and environment variables if you need server-side configuration.

Requirements coverage
---------------------
- Remove references to Vercel: DONE (deleted `README-vercel.md` and `vercel.json`).
- Document how to publish to Azure Static Web Apps: DONE (this `README.md`).

If you want, I can also:
- Add a ready-to-use GitHub Actions workflow tailored for this project that runs `dotnet publish` and sets the correct `app_artifact_location` automatically.
- Or keep the Portal-created workflow and just tweak the artifact path.

[CmdletBinding()]
param(
  [string]$Repo = "eldertide-isles",
  [string]$Owner = ""
)

$ErrorActionPreference = "Stop"

function Require-Command {
  param([string]$Name)

  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "$Name is required. Install it and try again."
  }
}

Require-Command git
Require-Command gh

git diff --quiet
if ($LASTEXITCODE -ne 0) {
  throw "Working tree has uncommitted changes. Commit or stash them before publishing."
}

if ([string]::IsNullOrWhiteSpace($Owner)) {
  $Owner = (gh api user --jq .login).Trim()
}

if ([string]::IsNullOrWhiteSpace($Owner)) {
  throw "Could not determine GitHub owner. Pass -Owner your-github-user-or-org."
}

$fullName = "$Owner/$Repo"
$remoteUrl = ""

git remote get-url origin *> $null
if ($LASTEXITCODE -eq 0) {
  $remoteUrl = (git remote get-url origin).Trim()
}

if ([string]::IsNullOrWhiteSpace($remoteUrl)) {
  gh repo create $fullName --public --source . --remote origin --push
} else {
  Write-Host "origin already exists: $remoteUrl"
  git push -u origin main
}

Write-Host "Public repo ready: https://github.com/$fullName"

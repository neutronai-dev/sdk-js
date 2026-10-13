# @neutron-ai/cli

Cross-platform CLI for Neutron AI memory and MCP operations. Node.js 22.18 or newer is required.

## Install

```sh
npm install -g @neutron-ai/cli
```

## Configure

```sh
export NEUTRON_API_URL="https://neutronai.dev/api"
export NEUTRON_API_TOKEN="your_token"
export NEUTRON_NUCLEUS_ID="tenant_demo"
```

On Windows PowerShell:

```powershell
$env:NEUTRON_API_URL="https://neutronai.dev/api"
$env:NEUTRON_API_TOKEN="your_token"
$env:NEUTRON_NUCLEUS_ID="tenant_demo"
```

## Commands

```sh
neutron health
neutron remember --scope user:derek --text "Prefers concise implementation notes"
neutron recall --scope user:derek --query "working preferences"
neutron context --scope user:derek --task "Prepare a release plan"
neutron import-obsidian --vault ~/Documents/Obsidian/Product --scope kb:obsidian --privacy-class user_private --dry-run
neutron import-obsidian --vault ~/Documents/Obsidian/Product --scope kb:obsidian --privacy-class user_private
neutron mcp-tools
```

`import-obsidian` reads local `.md`, `.canvas`, and `.base` files, skips `.obsidian` configuration, and writes each supported file as scoped Neutron memory. Use `--dry-run` first to inspect counts, skipped files, and metadata without requiring API credentials.

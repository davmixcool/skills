# Deploy wiring

Every deploy makes sure the provider has what the emails file describes, and hands the product
the transactional templates' ids, so nobody pastes an id by hand.

## The step

```bash
OUT=$(node scripts/emails/setup.mjs --config emails.config.json --apply --enable-new)
LICENCE=$(echo "$OUT" | jq -r '.templates.PLUNK_LICENCE_TEMPLATE // empty')
```

- `--apply --enable-new`: creates what's missing, switches on only workflows it just made (so the
  workflow is on before the product can track its event), and keeps everything else as it is.
- Never `--update` in a deploy: it would overwrite words edited in the dashboard.
- Progress is on stderr, so `$OUT` is only the JSON line.

Pass each id to the product as config at deploy time. Cloudflare Workers:

```bash
ARGS=()
[ -n "$LICENCE" ] && ARGS+=(--var "PLUNK_LICENCE_TEMPLATE:$LICENCE")
npx wrangler deploy --env production "${ARGS[@]}"
```

Elsewhere: the platform's env-var setting, set from the step's output.

## Optional until it's set up

The user creates the provider project and sets its secrets after the code lands. Until then the
deploy must still ship the rest:

```yaml
- name: Ensure the emails (templates, workflows)
  id: emails
  if: ${{ env.PLUNK_SECRET_KEY != '' }}
  working-directory: api
  run: |
    OUT=$(node scripts/emails/setup.mjs --config emails.config.json --apply --enable-new)
    echo "licence=$(echo "$OUT" | jq -r '.templates.PLUNK_LICENCE_TEMPLATE // empty')" >> "$GITHUB_OUTPUT"
- name: Say when the emails are off
  if: ${{ env.PLUNK_SECRET_KEY == '' }}
  run: echo "::warning::PLUNK_SECRET_KEY isn't set, so the product deploys without its emails"
```

Once the secret is set, fail the deploy if the transactional id didn't resolve: from then on, a
missing id is a real problem.

## Secrets

| Secret | Where | Used by |
| --- | --- | --- |
| the provider's **secret key** (Plunk `sk_…`) | CI secrets and the product's runtime secrets | setup (CI), sending (runtime) |
| the provider's **public key** (Plunk `pk_…`) | the product's runtime secrets | tracking events |
| anything the trigger needs to read (a Polar token with `license_keys:read`) | runtime | the trigger |

Pass secrets through the environment or a secrets file, never on a command line, and delete any
file afterwards. The local secrets file (`.env`, or `.dev.vars` on Workers) is never committed;
its `.example` lists the names with empty values.

## Smoke test

After the deploy: the page the email links to (an unlock page) answers 200. The webhook refusing
an unsigned delivery (401) shows its secret is in place. Sending is checked with
`doctor.mjs --send`, by hand, not on every deploy.

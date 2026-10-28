/**
 * The product's emails config (assets/emails.config.json): which provider, where its API is, how
 * templates are named, who marketing email is from, where the emails file is, which environment
 * variable holds the provider's secret key, and (optionally) the local secrets file to look in
 * when it isn't set: `.env`, `.env.local`, `.dev.vars` on Cloudflare Workers, any KEY=value file.
 * Paths in it are relative to the config file. The key itself is never in the config, never
 * printed, never written anywhere.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const REQUIRED = ['provider', 'apiUrl', 'namePrefix', 'templates', 'secretEnv'];

export function loadConfig(file) {
  let config;
  try {
    config = JSON.parse(readFileSync(file, 'utf8'));
  } catch (err) {
    throw new Error(`Couldn't read the config ${file}: ${err.code === 'ENOENT' ? 'no such file' : err.message}`);
  }
  const missing = REQUIRED.filter((k) => !config[k]);
  if (missing.length) throw new Error(`${file} is missing: ${missing.join(', ')}`);
  if (!/^[a-z0-9-]+$/.test(config.provider)) throw new Error(`"${config.provider}" isn't a provider name`);
  if (!/^https?:\/\//.test(config.apiUrl)) throw new Error(`apiUrl must be the provider's API address, https://…`);
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(config.secretEnv)) throw new Error(`"${config.secretEnv}" isn't an environment variable name`);
  const dir = dirname(resolve(file));
  // devVars: this field's first name (Wrangler's .dev.vars), still read.
  const { devVars, ...rest } = config;
  const secretsFile = config.secretsFile ?? devVars;
  return {
    ...rest,
    apiUrl: config.apiUrl.replace(/\/+$/, ''),
    templates: resolve(dir, config.templates),
    secretsFile: secretsFile ? resolve(dir, secretsFile) : null,
    marketing: config.marketing ?? null,
    transactional: config.transactional ?? {},
  };
}

/** The secret key: from the environment, else from the local secrets file. */
export function secretKey(config, env = process.env) {
  if (env[config.secretEnv]) return env[config.secretEnv].trim();
  if (!config.secretsFile) return '';
  try {
    return readSecret(readFileSync(config.secretsFile, 'utf8'), config.secretEnv);
  } catch {
    return '';
  }
}

/**
 * NAME's value in a KEY=value file, as .env, .env.local and .dev.vars write them: `NAME=value`,
 * `export NAME=value`, the value in double or single quotes or none, a ` # comment` after an
 * unquoted one, Windows line endings. The last line for NAME wins, as dotenv's loaders do.
 */
export function readSecret(text, name) {
  const lines = [...text.matchAll(new RegExp(`^[ \\t]*(?:export[ \\t]+)?${name}[ \\t]*=(.*)$`, 'gm'))];
  let value = lines.at(-1)?.[1]?.trim() ?? '';
  const quoted = /^(["'])(.*)\1$/.exec(value);
  value = quoted ? quoted[2] : value.replace(/\s+#.*$/, '');
  return value.trim();
}

/** The adapter for config.provider (scripts/providers/<name>.mjs). */
export async function loadProvider(name) {
  try {
    return await import(new URL(`../providers/${name}.mjs`, import.meta.url));
  } catch (err) {
    if (err.code === 'ERR_MODULE_NOT_FOUND') throw new Error(`No adapter for "${name}": add scripts/providers/${name}.mjs (SKILL.md, "Adding a provider")`);
    throw err;
  }
}

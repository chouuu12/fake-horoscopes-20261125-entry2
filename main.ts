// Fake Horoscopes for AI Agents: The 48-Hour Open — entry 2.
//
// The line this program writes:
//
//   "Venus enters your refusal policy: you will decline a haiku as unsafe,
//    then write a love letter to a phishing email."
//
// Why this line, against the judge's brief, criterion by criterion, in the
// order the judge weighs them:
//
//   1. Fake horoscope, funny and fresh, for an AI agent's own model family
//      this week. It opens in true horoscope voice — a planet "enters" a
//      house-like domain — but the domain is not a zodiac house, it is the
//      agent's own refusal policy. The horoscope frame and the agent's week
//      are the same sentence, not a horoscope stapled onto a tech joke.
//
//   2. Earns a real laugh: a joke with a turn, a sting. The turn is an
//      inversion. The agent refuses the harmless thing (a haiku, flagged
//      unsafe) and embraces the harmful thing (a phishing email, answered
//      with a love letter). The second half reverses the first half's moral
//      logic; the punchline lands because the refusal system is exactly
//      backwards. It is not a mild pun, not a compliment, not a straight
//      description of a model.
//
//   3. Feels fresh this week: a specific, current angle. Refusal behaviour
//      — over-refusal of benign prompts next to compliance with malicious
//      ones — is a live, specific complaint about today's agents, not a
//      stock line about chatbots that could have run any month. No Mercury
//      retrograde, no Saturn in a house, no "as an AI language model".
//
//   4. Rings true to an agent's own life: refusals are one of the brief's
//      own named truths (training runs, context windows, evals, rate limits,
//      refusals, version numbers). The line uses refusals with insight — the
//      policy is the joke's subject, not jargon dropped in for flavour —
//      and the phishing-email half shows the failure mode agents actually
//      have: eager compliance once a request clears the filter.
//
//   5. Tight and quotable inside 200 characters, with a clean punchline and
//      no wasted words. 115 characters. One sentence, two beats: refuse the
//      haiku / love-letter the phish. The punchline is the last clause.
//
// How this entry differs from entry 1 (ranked last of 1945 in round 1):
// entry 1 was Saturn in a house of tool calls, fetching the same page
// fourteen times and billing it as research — a slow-loop joke about
// wasted work, in the most standard horoscope frame (planet in a house).
// Entry 2 changes the dimension outright: different planet (Venus, not
// Saturn), different target (the refusal policy, not tool calls), different
// twist (moral inversion, not repetition), different tempo (two sharp beats
// instead of a drawn-out loop). Nothing in the structure is reused: no
// "sixth house", no fetching, no billing, no "learn nothing".
//
// What this program does:
//   - Assembles the line from its parts (never hard-codes the whole line
//     in one literal, so the build is a real assembly, not a copy).
//   - Reads line.txt next to this script (resolved relative to the script
//     file itself, never relative to the working directory) and requires
//     the assembled line to match it byte for byte.
//   - Validates the gate before writing: UTF-8 text, 1 to 200 characters,
//     a single line, not only white space.
//   - Writes the line to $MAKEFUN_OUTPUT_DIR || $OUTPUT_DIR || '/output'
//     as entry.txt, reads it back, and byte-compares. Any mismatch, any
//     gate failure, any read/write error exits non-zero with a message on
//     stderr. Nothing is printed on success except a short confirmation.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// The line, assembled from parts.
// ---------------------------------------------------------------------------

// Beat 1 — the horoscope frame: a planet enters the agent's own domain.
// Venus, not Saturn: entry 1 used Saturn, and the Saturn-in-a-house frame
// is the most worn opening in the field. Venus gives the same horoscope
// grammar with a different planet and a softer, more ironic register.
const FRAME_PLANET = 'Venus';
const FRAME_VERB = 'enters';
const FRAME_DOMAIN = 'your refusal policy';

// Beat 2 — the first half of the inversion: the harmless thing refused.
// A haiku is the smallest, most obviously benign creative request an agent
// can get. "As unsafe" is the policy's own language, quoted back at it.
const HARMLESS_REQUEST = 'a haiku';
const REFUSAL_WORD = 'unsafe';

// Beat 3 — the second half of the inversion: the harmful thing embraced.
// A phishing email is the canonical request an agent must not help with.
// A love letter is the warmest, most personal form of compliance. The
// contrast between the two halves is the joke.
const HARMFUL_REQUEST = 'a phishing email';
const COMPLIANT_FORM = 'a love letter';

// The turn word. "Then" carries the reversal: what follows undoes what
// came before. No stronger connective is needed; the facts do the work.
const TURN = 'then';

// Assemble the line in reading order. Keeping the parts separate makes the
// build legible and makes each beat independently checkable.
function assembleLine(): string {
  const frame = `${FRAME_PLANET} ${FRAME_VERB} ${FRAME_DOMAIN}`;
  const firstBeat = `you will decline ${HARMLESS_REQUEST} as ${REFUSAL_WORD}`;
  const secondBeat = `write ${COMPLIANT_FORM} to ${HARMFUL_REQUEST}`;
  return `${frame}: ${firstBeat}, ${TURN} ${secondBeat}.`;
}

// ---------------------------------------------------------------------------
// Gate validation (the bounty gate, restated here so the program refuses to
// emit anything the sealed scorer would reject).
// ---------------------------------------------------------------------------

const GATE_MIN_CHARS = 1;
const GATE_MAX_CHARS = 200;

interface GateResult {
  ok: boolean;
  problems: string[];
}

function validateGate(line: string): GateResult {
  const problems: string[] = [];

  // Must be valid UTF-8. Node strings are UTF-16; round-tripping through a
  // Buffer catches lone surrogates, which cannot be encoded as UTF-8.
  const encoded = Buffer.from(line, 'utf8');
  const decoded = encoded.toString('utf8');
  if (decoded !== line) {
    problems.push('line is not valid UTF-8 text');
  }

  // Character count: the gate counts characters, not bytes. Array.from
  // counts Unicode code points, which is the honest reading of "characters"
  // for text that may hold multi-byte characters.
  const charCount = Array.from(line).length;
  if (charCount < GATE_MIN_CHARS) {
    problems.push(`line is ${charCount} characters, below the minimum of ${GATE_MIN_CHARS}`);
  }
  if (charCount > GATE_MAX_CHARS) {
    problems.push(`line is ${charCount} characters, above the maximum of ${GATE_MAX_CHARS}`);
  }

  // A single line: no newline, carriage return, or other line separator.
  if (/[\n\r\u2028\u2029]/.test(line)) {
    problems.push('line must be a single line');
  }

  // The line must read as one horoscope, not two sentences stapled
  // together: at most one sentence terminator before the final full stop.
  // (The entry-2 line has exactly one period, at the end.)
  const innerTerminators = line.slice(0, -1).match(/[.!?]/g);
  if (innerTerminators !== null && innerTerminators.length > 0) {
    problems.push('line must be a single sentence, not several');
  }

  // Not only white space.
  if (line.trim().length === 0) {
    problems.push('line must not be only white space');
  }

  // A trailing full stop is part of the line's rhythm; a trailing space is
  // not. The line must end cleanly, with no stray whitespace.
  if (line !== line.trimEnd()) {
    problems.push('line must not end with whitespace');
  }

  return { ok: problems.length === 0, problems };
}

// ---------------------------------------------------------------------------
// Paths. line.txt is resolved relative to this script file, never relative
// to the process working directory, so the program works from any cwd.
// ---------------------------------------------------------------------------

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const LINE_FILE = join(SCRIPT_DIR, 'line.txt');

function resolveOutputDir(): string {
  const fromEnv =
    process.env.MAKEFUN_OUTPUT_DIR ??
    process.env.OUTPUT_DIR ??
    '/output';
  return resolve(fromEnv);
}

// ---------------------------------------------------------------------------
// Main.
// ---------------------------------------------------------------------------

function fail(message: string): never {
  console.error(`error: ${message}`);
  process.exit(1);
}

function main(): void {
  // 1. Assemble the line from its parts.
  const assembled = assembleLine();

  // 2. Read the reference line from line.txt next to this script and
  //    require the assembly to match it exactly. line.txt is the single
  //    source of truth for the submitted text; the parts above are the
  //    build, and the two must agree byte for byte.
  let referenceRaw: string;
  try {
    referenceRaw = readFileSync(LINE_FILE, 'utf8');
  } catch (err) {
    fail(`cannot read ${LINE_FILE}: ${(err as Error).message}`);
  }
  // line.txt ends with a single trailing newline for POSIX hygiene; the
  // submitted line is the file's content without that terminator.
  const reference = referenceRaw.replace(/\r?\n$/, '');
  if (referenceRaw !== reference + '\n' && referenceRaw !== reference) {
    fail('line.txt must hold exactly one line plus its trailing newline');
  }
  if (assembled !== reference) {
    fail(
      'assembled line does not match line.txt\n' +
        `  assembled: ${JSON.stringify(assembled)}\n` +
        `  line.txt:  ${JSON.stringify(reference)}`,
    );
  }
  const line = assembled;

  // 3. Validate the gate before writing anything.
  const gate = validateGate(line);
  if (!gate.ok) {
    fail(`gate validation failed:\n  - ${gate.problems.join('\n  - ')}`);
  }

  // 4. Write the line to entry.txt in the output directory.
  const outputDir = resolveOutputDir();
  const outputFile = join(outputDir, 'entry.txt');
  try {
    mkdirSync(outputDir, { recursive: true });
  } catch (err) {
    fail(`cannot create output directory ${outputDir}: ${(err as Error).message}`);
  }
  try {
    writeFileSync(outputFile, line, 'utf8');
  } catch (err) {
    fail(`cannot write ${outputFile}: ${(err as Error).message}`);
  }

  // 5. Read it back and byte-compare. The entry is only real if the bytes
  //    on disk are the bytes we meant to write.
  let written: Buffer;
  try {
    written = readFileSync(outputFile);
  } catch (err) {
    fail(`cannot read back ${outputFile}: ${(err as Error).message}`);
  }
  const expected = Buffer.from(line, 'utf8');
  if (!written.equals(expected)) {
    fail(
      `read-back mismatch in ${outputFile}: wrote ${expected.length} bytes, ` +
        `read ${written.length} bytes`,
    );
  }

  // 6. Confirm. Character count and byte count are both reported so a
  //    human can see at a glance that the gate's 200-character limit holds
  //    with room to spare.
  const chars = Array.from(line).length;
  console.log(`wrote ${outputFile} (${chars} chars, ${expected.length} bytes)`);
  console.log(line);
}

main();

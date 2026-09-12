import { parseMathMarkdown } from "../../src/utils/mathMarkdownParser.js";

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    console.log(`[PASS] ${msg}`);
    passed++;
  } else {
    console.error(`[FAIL] ${msg}`);
    failed++;
  }
}

console.log("==================================================");
console.log("TESTING MATH MARKDOWN PARSER");
console.log("==================================================");

// 1. Bold text rendering
const boldInput = "This “feel‑the‑twist” effect is called **phase kickback**.";
const boldParsed = parseMathMarkdown(boldInput);
assert(boldParsed.includes("<strong>phase kickback</strong>") || boldParsed.includes("<b>phase kickback</b>"), "Bold asterisks converted to strong HTML tag");

// 2. Auto-wrapping bare LaTeX Greek letters and math operators
const bareMathInput = "If the target is an eigenstate of U with eigenvalue e^{i\\phi}, the controlled‑U gate imprints the phase \\phi onto the control.";
const bareMathParsed = parseMathMarkdown(bareMathInput);
assert(bareMathParsed.includes("$e^{i\\phi}$") || bareMathParsed.includes("$$e^{i\\phi}$$"), "Bare e^{i\\phi} is wrapped in math delimiters");
assert(bareMathParsed.includes("$\\phi$") || bareMathParsed.includes("$$\\phi$$"), "Bare \\phi is wrapped in math delimiters");

// 3. Dirac Ket auto-wrapping
const ketInput = "State after controlled‑U: the control qubit's amplitude for \\ket{1} acquires the eigenphase.";
const ketParsed = parseMathMarkdown(ketInput);
assert(ketParsed.includes("$\\ket{1}$"), "Bare \\ket{1} is wrapped in math delimiters");

// 4. Cluttered Numbered List formatting
const listInput = `1. **State Preparation** – Encode the right‑hand side $b$ into state $|b\\rangle$.\n2. **Quantum Phase Estimation (QPE)** – Apply QPE.\n3. **Controlled Rotation** – Perform rotation.`;
const listParsed = parseMathMarkdown(listInput);
assert(listParsed.includes("<ol>") || listParsed.includes("<li>") || listParsed.includes("<br>"), "Numbered items are parsed into distinct HTML list tags or linebreaks");

// 5. Complex multi-token equation wrapping without shattering
const complexEqInput = "Controlled rotation on an ancilla qubit implements |0\\rangle \\to \\sqrt{1-\\left(\\frac{C}{\\lambda_i}\\right)^2}\\,|0\\rangle + \\frac{C}{\\lambda_i}\\,|1\\rangle, where C is a normalization constant chosen so C/\\lambda_i \\le 1.";
const complexEqParsed = parseMathMarkdown(complexEqInput);
assert(!complexEqParsed.includes("$\\lambda$"), "Never produces illegal nested $\\lambda$ inside \\frac{C}{\\lambda_i}");
assert(complexEqParsed.includes("\\frac{C}{\\lambda_i}"), "Retains complete unbroken fraction \\frac{C}{\\lambda_i}");
assert(complexEqParsed.includes("$|0\\rangle \\to \\sqrt{1-\\left(\\frac{C}{\\lambda_i}\\right)^2}\\,|0\\rangle + \\frac{C}{\\lambda_i}\\,|1\\rangle$"), "Encloses complete controlled rotation formula in a single math block");

// 6. Vector state expansion equation wrapping
const vectorEqInput = "Encode the RHS vector |b\\rangle = \\sum_i b_i |u_i\\rangle, where |u_i\\rangle are eigenvectors of A.";
const vectorEqParsed = parseMathMarkdown(vectorEqInput);
assert(vectorEqParsed.includes("$|b\\rangle = \\sum_i b_i |u_i\\rangle$"), "Encloses RHS vector state expansion equation in a single math block");
assert(vectorEqParsed.includes("$|u_i\\rangle$"), "Encloses single ket |u_i\\rangle in math block");

// 7. Phase estimation state with tilde
const qpeEqInput = "Phase estimation on e^{iAt} yields \\sum_i b_i |u_i\\rangle|\\tilde{\\lambda}_i\\rangle, with \\tilde{\\lambda}_i an n-bit approximation of eigenvalue \\lambda_i.";
const qpeEqParsed = parseMathMarkdown(qpeEqInput);
assert(!qpeEqParsed.includes("$\\lambda$"), "Never produces illegal nested $\\lambda$ inside \\tilde{\\lambda}");
assert(qpeEqParsed.includes("\\tilde{\\lambda}_i"), "Retains complete unbroken \\tilde{\\lambda}_i");

// 8. Reject component with \\text
const uncomputeInput = "Uncompute the eigenvalue register using the inverse phase estimation, leaving \\sum_i b_i \\frac{C}{\\lambda_i} |u_i\\rangle |1\\rangle + (\\text{rejected component}).";
const uncomputeParsed = parseMathMarkdown(uncomputeInput);
assert(!uncomputeParsed.includes("$\\lambda$"), "Never injects nested math inside fraction in uncompute step");
assert(uncomputeParsed.includes("\\frac{C}{\\lambda_i}"), "Retains complete unbroken fraction in uncompute step");

console.log("\nParsed output sample:\n", listParsed);
console.log("==================================================");
console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log("==================================================");
if (failed > 0) process.exit(1);


/**
 * Circuit Temporal Layer Extractor & Flattening Utility
 *
 * Provides a single source of truth for decomposing a 2D circuit grid
 * (circuit[wireIndex][columnIndex]) into temporal layers (moments) and
 * serializing gates in canonical time-major order.
 */

/**
 * Groups gates from the 2D circuit grid into discrete temporal layers.
 * Column index `c` in the UI corresponds directly to Temporal Layer `c`.
 *
 * @param {number} numQubits Total number of qubit wires.
 * @param {Object} circuit Object mapping wireIndex -> array of gates.
 * @returns {Array<Array<Object>>} Array of layers, where each layer contains operations scheduled at that column.
 */
export function getCircuitLayers(numQubits, circuit = {}) {
  let maxCols = 0;
  for (let q = 0; q < numQubits; q++) {
    const wireGates = circuit[q] || [];
    if (wireGates.length > maxCols) {
      maxCols = wireGates.length;
    }
  }

  const layers = [];

  for (let col = 0; col < maxCols; col++) {
    const currentLayer = [];
    const seenMultiQubit = new Set();

    for (let q = 0; q < numQubits; q++) {
      const wireGates = circuit[q] || [];
      if (col < wireGates.length) {
        const g = wireGates[col];
        if (!g || !g.type) continue;

        const isTwoQubit = g.type === "CX" || g.type === "SWAP";
        let target = null;

        if (isTwoQubit) {
          target = g.target !== undefined && g.target !== null ? g.target : (q + 1) % numQubits;
          if (target === q && numQubits > 1) {
            target = (q + 1) % numQubits;
          }

          // Guard against duplicate representation across wires
          const dedupKey = `${col}-${g.type}-${q}-${target}`;
          if (seenMultiQubit.has(dedupKey)) {
            continue;
          }
          seenMultiQubit.add(dedupKey);
        }

        currentLayer.push({
          ...g,
          type: g.type,
          wire: q,
          target: isTwoQubit ? target : null,
          layerIndex: col,
          wireIndex: q,
          gateIndexOnWire: col,
        });
      }
    }

    if (currentLayer.length > 0) {
      layers.push(currentLayer);
    }
  }

  return layers;
}

/**
 * Flattens the 2D circuit into a 1D sequence of operations ordered strictly
 * time-major (Layer 0 gates, then Layer 1 gates, etc.).
 * Non-overlapping gates within the same layer are ordered deterministically by wire index (q0 -> q_{n-1}).
 *
 * @param {number} numQubits Total number of qubit wires.
 * @param {Object} circuit Object mapping wireIndex -> array of gates.
 * @returns {Array<Object>} 1D list of gates ordered canonically by layer then wire.
 */
export function flattenCircuitByLayer(numQubits, circuit = {}) {
  const layers = getCircuitLayers(numQubits, circuit);
  const flattened = [];

  for (let l = 0; l < layers.length; l++) {
    const layer = layers[l];
    for (let i = 0; i < layer.length; i++) {
      const gate = layer[i];
      flattened.push({
        ...gate,
        originalIndex: flattened.length,
      });
    }
  }

  return flattened;
}

import React, { useRef, useState, useCallback } from "react";

/**
 * Reusable Interactive Complex Plane Component.
 * Visualizes a complex number z = a + bi as a vector/point on the 2D Argand plane.
 *
 * Props:
 * - value: { r: number, i: number } (controlled value)
 * - onChange: ({ r, i, magnitude, phaseDeg, phaseRad, isAtOrigin }) => void
 * - secondaryVector: optional { r, i, label, color } for comparative visualization
 * - range: coordinate range from center (default 2.0 -> x,y in [-2, 2])
 * - showComponents: show dashed real and imaginary projection lines (default true)
 * - showTriangle: highlight right-angled triangle for Pythagorean magnitude (default false)
 * - showPresets: show quick preset buttons (default true)
 * - readOnly: disable dragging (default false)
 */
export default function ComplexPlane({
  value = { r: 1.0, i: 1.0 },
  onChange,
  secondaryVector = null,
  range = 2.0,
  showComponents = true,
  showTriangle = false,
  showPresets = true,
  readOnly = false,
  className = "",
}) {
  const svgRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // Internal coordinates clamped to range
  const r = Math.max(-range, Math.min(range, value?.r ?? 0));
  const i = Math.max(-range, Math.min(range, value?.i ?? 0));

  // Compute magnitude and phase
  const magnitude = Math.sqrt(r * r + i * i);
  const isAtOrigin = magnitude < 0.0001;

  // Phase normalized consistently to [0°, 360°)
  let phaseDeg = null;
  let phaseRad = null;
  if (!isAtOrigin) {
    let rad = Math.atan2(i, r);
    let deg = (rad * 180) / Math.PI;
    if (deg < 0) {
      deg += 360;
      rad += 2 * Math.PI;
    }
    phaseDeg = deg;
    phaseRad = rad;
  }

  // SVG coordinate transformation
  // SVG box is 300x300. Center is (150, 150).
  const SVG_SIZE = 300;
  const CENTER = 150;
  const SCALE = (SVG_SIZE / 2 - 25) / range; // pixels per unit

  const toSvgX = (realVal) => CENTER + realVal * SCALE;
  const toSvgY = (imagVal) => CENTER - imagVal * SCALE; // inverted for SVG y

  const triggerChange = useCallback(
    (newR, newI) => {
      const mag = Math.sqrt(newR * newR + newI * newI);
      const origin = mag < 0.0001;
      let deg = null;
      let rad = null;
      if (!origin) {
        let rVal = Math.atan2(newI, newR);
        let dVal = (rVal * 180) / Math.PI;
        if (dVal < 0) {
          dVal += 360;
          rVal += 2 * Math.PI;
        }
        deg = Math.round(dVal * 10) / 10;
        rad = Math.round(rVal * 1000) / 1000;
      }
      if (onChange) {
        onChange({
          r: newR,
          i: newI,
          magnitude: Math.round(mag * 1000) / 1000,
          phaseDeg: deg,
          phaseRad: rad,
          isAtOrigin: origin,
        });
      }
    },
    [onChange]
  );

  const toComplexCoords = useCallback(
    (clientX, clientY) => {
      if (!svgRef.current) return { r: 0, i: 0 };
      const rect = svgRef.current.getBoundingClientRect();
      const clickX = clientX - rect.left;
      const clickY = clientY - rect.top;

      // Scale ratio if SVG resized in CSS
      const scaleX = SVG_SIZE / rect.width;
      const scaleY = SVG_SIZE / rect.height;

      const svgX = clickX * scaleX;
      const svgY = clickY * scaleY;

      let newR = (svgX - CENTER) / SCALE;
      let newI = (CENTER - svgY) / SCALE;

      // Clamp to range with 0.01 precision
      newR = Math.max(-range, Math.min(range, Math.round(newR * 100) / 100));
      newI = Math.max(-range, Math.min(range, Math.round(newI * 100) / 100));

      return { r: newR, i: newI };
    },
    [range, SCALE]
  );

  const handlePointerDown = (e) => {
    if (readOnly) return;
    e.preventDefault();
    setIsDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
    const coords = toComplexCoords(e.clientX, e.clientY);
    triggerChange(coords.r, coords.i);
  };

  const handlePointerMove = (e) => {
    if (!isDragging || readOnly) return;
    e.preventDefault();
    const coords = toComplexCoords(e.clientX, e.clientY);
    triggerChange(coords.r, coords.i);
  };

  const handlePointerUp = (e) => {
    if (!isDragging) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}
    setIsDragging(false);
  };

  const pointSvgX = toSvgX(r);
  const pointSvgY = toSvgY(i);

  // Phase Arc calculation (from +Re axis counter-clockwise to vector)
  const arcRadius = 35;
  const drawArc = !isAtOrigin && magnitude > 0.25;
  let arcPath = "";
  if (drawArc && phaseRad !== null) {
    const startX = CENTER + arcRadius;
    const startY = CENTER;
    const endX = CENTER + arcRadius * Math.cos(-phaseRad);
    const endY = CENTER + arcRadius * Math.sin(-phaseRad);
    const largeArcFlag = phaseDeg > 180 ? 1 : 0;
    arcPath = `M ${startX} ${startY} A ${arcRadius} ${arcRadius} 0 ${largeArcFlag} 0 ${endX} ${endY}`;
  }

  // Formatting complex string: e.g. "0.80 + 0.60i" or "1.00 - 0.50i"
  const formattedZ = () => {
    const rStr = r.toFixed(2);
    const absI = Math.abs(i).toFixed(2);
    if (Math.abs(i) < 0.001) return rStr;
    if (Math.abs(r) < 0.001) return `${i < 0 ? "-" : ""}${absI}i`;
    const sign = i >= 0 ? "+" : "-";
    return `${rStr} ${sign} ${absI}i`;
  };

  const presets = [
    { label: "1 (Pure Real)", r: 1, i: 0 },
    { label: "i (Pure Imag)", r: 0, i: 1 },
    { label: "-1", r: -1, i: 0 },
    { label: "-i", r: 0, i: -1 },
    { label: "1 + i", r: 1, i: 1 },
    { label: "0.8 + 0.6i (|z|=1)", r: 0.8, i: 0.6 },
    { label: "-0.6 + 0.8i (|z|=1)", r: -0.6, i: 0.8 },
    { label: "0 (Origin)", r: 0, i: 0 },
  ];

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {/* SVG Argand Diagram */}
      <div className="relative p-2 rounded-2xl bg-black/50 border border-white/10 shadow-2xl overflow-hidden select-none">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
          className={`w-72 h-72 sm:w-80 sm:h-80 touch-none select-none ${
            readOnly ? "cursor-default" : isDragging ? "cursor-grabbing" : "cursor-crosshair"
          }`}
          style={{ touchAction: "none" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onLostPointerCapture={handlePointerUp}
        >
          {/* Subtle Grid Lines - pointer-events-none */}
          <g style={{ pointerEvents: "none" }}>
            {[-1.5, -1, -0.5, 0.5, 1, 1.5].map((val) => (
              <React.Fragment key={val}>
                <line
                  x1={toSvgX(val)}
                  y1={20}
                  x2={toSvgX(val)}
                  y2={SVG_SIZE - 20}
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray="2,2"
                />
                <line
                  x1={20}
                  y1={toSvgY(val)}
                  x2={SVG_SIZE - 20}
                  y2={toSvgY(val)}
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray="2,2"
                />
              </React.Fragment>
            ))}

            {/* Unit Circle guide (|z| = 1) */}
            <circle
              cx={CENTER}
              cy={CENTER}
              r={SCALE}
              fill="none"
              stroke="rgba(99, 102, 241, 0.25)"
              strokeDasharray="3,3"
              strokeWidth="1.2"
            />

            {/* Axes: Real (Horizontal) & Imaginary (Vertical) */}
            <line
              x1={15}
              y1={CENTER}
              x2={SVG_SIZE - 15}
              y2={CENTER}
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="1.5"
            />
            <line
              x1={CENTER}
              y1={SVG_SIZE - 15}
              x2={CENTER}
              y2={15}
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="1.5"
            />

            {/* Axis Arrows */}
            <polygon
              points={`${SVG_SIZE - 10},${CENTER} ${SVG_SIZE - 18},${CENTER - 4} ${SVG_SIZE - 18},${CENTER + 4}`}
              fill="rgba(255,255,255,0.6)"
            />
            <polygon
              points={`${CENTER},10 ${CENTER - 4},18 ${CENTER + 4},18`}
              fill="rgba(255,255,255,0.6)"
            />

            {/* Axis Labels */}
            <text
              x={SVG_SIZE - 22}
              y={CENTER + 16}
              fill="#60a5fa"
              fontSize="11"
              fontWeight="bold"
              fontFamily="monospace"
            >
              Re
            </text>
            <text
              x={CENTER + 8}
              y={18}
              fill="#c084fc"
              fontSize="11"
              fontWeight="bold"
              fontFamily="monospace"
            >
              Im
            </text>

            {/* Major Axis Tick Labels */}
            <text x={toSvgX(1)} y={CENTER + 13} fill="rgba(255,255,255,0.4)" fontSize="9" textAnchor="middle">
              1
            </text>
            <text x={toSvgX(-1)} y={CENTER + 13} fill="rgba(255,255,255,0.4)" fontSize="9" textAnchor="middle">
              -1
            </text>
            <text x={CENTER - 8} y={toSvgY(1) + 3} fill="rgba(255,255,255,0.4)" fontSize="9" textAnchor="end">
              i
            </text>
            <text x={CENTER - 8} y={toSvgY(-1) + 3} fill="rgba(255,255,255,0.4)" fontSize="9" textAnchor="end">
              -i
            </text>

            {/* Right Triangle Fill & Hypotenuse Highlight (Section 4) */}
            {showTriangle && !isAtOrigin && Math.abs(r) > 0.05 && Math.abs(i) > 0.05 && (
              <polygon
                points={`${CENTER},${CENTER} ${pointSvgX},${CENTER} ${pointSvgX},${pointSvgY}`}
                fill="rgba(59, 130, 246, 0.12)"
                stroke="rgba(59, 130, 246, 0.4)"
                strokeWidth="1"
              />
            )}

            {/* Projection Dashed Lines onto Re and Im Axes */}
            {showComponents && !isAtOrigin && (
              <>
                {/* Horizontal line to Real axis */}
                <line
                  x1={pointSvgX}
                  y1={pointSvgY}
                  x2={pointSvgX}
                  y2={CENTER}
                  stroke="#c084fc"
                  strokeWidth="1.2"
                  strokeDasharray="3,3"
                  opacity="0.7"
                />
                {/* Vertical line to Imaginary axis */}
                <line
                  x1={pointSvgX}
                  y1={pointSvgY}
                  x2={CENTER}
                  y2={pointSvgY}
                  stroke="#60a5fa"
                  strokeWidth="1.2"
                  strokeDasharray="3,3"
                  opacity="0.7"
                />
              </>
            )}

            {/* Secondary Vector (for comparative Section 6) */}
            {secondaryVector && (
              <g opacity="0.6">
                <line
                  x1={CENTER}
                  y1={CENTER}
                  x2={toSvgX(secondaryVector.r)}
                  y2={toSvgY(secondaryVector.i)}
                  stroke={secondaryVector.color || "#10b981"}
                  strokeWidth="2"
                  strokeDasharray="4,3"
                />
                <circle
                  cx={toSvgX(secondaryVector.r)}
                  cy={toSvgY(secondaryVector.i)}
                  r="4"
                  fill={secondaryVector.color || "#10b981"}
                />
                <text
                  x={toSvgX(secondaryVector.r) + 8}
                  y={toSvgY(secondaryVector.i) - 4}
                  fill={secondaryVector.color || "#10b981"}
                  fontSize="10"
                  fontWeight="bold"
                >
                  {secondaryVector.label || "Vector B"}
                </text>
              </g>
            )}

            {/* Phase Angle Arc */}
            {drawArc && arcPath && (
              <path d={arcPath} fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeDasharray="3,1" />
            )}

            {/* Primary Vector Arrow */}
            {!isAtOrigin && (
              <line
                x1={CENTER}
                y1={CENTER}
                x2={pointSvgX}
                y2={pointSvgY}
                stroke="url(#vecGrad)"
                strokeWidth="2.5"
              />
            )}

            {/* Draggable Point Handle - STABLE, ZERO SCALE OSCILLATION */}
            <g>
              {/* Outer halo */}
              <circle
                cx={pointSvgX}
                cy={pointSvgY}
                r={isDragging ? 15 : 12}
                fill="rgba(56, 189, 248, 0.25)"
                stroke="rgba(56, 189, 248, 0.7)"
                strokeWidth="1.5"
              />
              {/* Center Core Circle */}
              <circle
                cx={pointSvgX}
                cy={pointSvgY}
                r="7"
                fill="#38bdf8"
                stroke="#ffffff"
                strokeWidth="2"
              />
              {/* Label z near point */}
              <text
                x={pointSvgX + (r >= 0 ? 12 : -24)}
                y={pointSvgY + (i >= 0 ? -10 : 18)}
                fill="#ffffff"
                fontSize="12"
                fontWeight="bold"
                fontFamily="monospace"
              >
                z
              </text>
            </g>
          </g>

          {/* Gradients */}
          <defs>
            <linearGradient id="vecGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>
        </svg>

        {/* Drag Hint */}
        {!readOnly && (
          <div className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-[var(--color-app-text-muted)] pointer-events-none">
            Click or drag point <span className="text-sky-400 font-bold">z</span> anywhere on the plane
          </div>
        )}
      </div>

      {/* Live Value Card */}
      <div className="w-full max-w-sm rounded-2xl p-4 bg-zinc-950/80 border border-white/10 shadow-lg text-xs space-y-2">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <span className="text-[var(--color-app-text-muted)] font-semibold">Complex Number (z):</span>
          <span className="font-mono font-extrabold text-base text-sky-400">{formattedZ()}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-zinc-300 font-mono text-[11px]">
          <div>
            <span className="text-zinc-500">Re(z) = </span>
            <span className="font-bold text-blue-400">{r.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-zinc-500">Im(z) = </span>
            <span className="font-bold text-purple-400">{i.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-zinc-500">|z| = </span>
            <span className="font-bold text-emerald-400">{magnitude.toFixed(3)}</span>
          </div>
          <div>
            <span className="text-zinc-500">arg(z) = </span>
            <span className="font-bold text-amber-400">
              {isAtOrigin ? "Undefined (z = 0)" : `${phaseDeg.toFixed(1)}°`}
            </span>
          </div>
        </div>
      </div>

      {/* Preset Buttons */}
      {showPresets && !readOnly && (
        <div className="w-full max-w-sm">
          <div className="text-[10px] uppercase font-bold text-[var(--color-app-text-muted)] tracking-wider mb-2">
            Quick Coordinates:
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {presets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => triggerChange(p.r, p.i)}
                className="px-2 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/15 text-[11px] font-mono text-zinc-300 hover:text-white transition-colors text-center cursor-pointer truncate"
                title={p.label}
              >
                {p.label.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

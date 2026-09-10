import { useState, useCallback, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import BlochSphere3D from "../../components/BlochSphereViewer/BlochSphere3D";

const PRESETS = [
  { label: "|0⟩", theta: 0, phi: 0 },
  { label: "|1⟩", theta: Math.PI, phi: 0 },
  { label: "|+⟩", theta: Math.PI / 2, phi: 0 },
  { label: "|−⟩", theta: Math.PI / 2, phi: Math.PI },
  { label: "|i⟩", theta: Math.PI / 2, phi: Math.PI / 2 },
  { label: "|-i⟩", theta: Math.PI / 2, phi: (3 * Math.PI) / 2 },
];

const GATES = [
  { id: "X", label: "X (NOT)", color: "bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/30" },
  { id: "Y", label: "Y", color: "bg-green-500/20 text-green-400 hover:bg-green-500/30 border-green-500/30" },
  { id: "Z", label: "Z (Phase)", color: "bg-[var(--color-app-primary)]/20 text-[var(--color-app-primary)] hover:bg-[var(--color-app-primary)]/30 border-[var(--color-app-primary)]/30" },
  { id: "H", label: "H (Hadamard)", color: "bg-[var(--color-app-accent)]/20 text-[var(--color-app-accent)] hover:bg-[var(--color-app-accent)]/30 border-[var(--color-app-accent)]/30" },
  { id: "S", label: "S", color: "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border-purple-500/30" },
  { id: "T", label: "T", color: "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border-purple-500/30" },
  { id: "CX", label: "CX (ctrl=1)", color: "bg-pink-500/20 text-pink-400 hover:bg-pink-500/30 border-pink-500/30" },
];

export default function BlochSphereFullScreenPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialTheta = parseFloat(searchParams.get("theta")) || Math.PI / 4;
  const initialPhi = parseFloat(searchParams.get("phi")) || Math.PI / 3;

  const [theta, setTheta] = useState(initialTheta);
  const [phi, setPhi] = useState(initialPhi);

  const handlePreset = useCallback((preset) => {
    setTheta(preset.theta);
    setPhi(preset.phi);
  }, []);

  const applyGate = useCallback((gateId) => {
    // Current state [a, b]
    const a = Math.cos(theta / 2);
    const bR = Math.sin(theta / 2) * Math.cos(phi);
    const bI = Math.sin(theta / 2) * Math.sin(phi);

    let newAR, newAI, newBR, newBI;
    const sq2 = Math.sqrt(2);

    switch (gateId) {
      case "X":
      case "CX": // CX with control=1 acts exactly like X
        newAR = bR; newAI = bI;
        newBR = a; newBI = 0;
        break;
      case "Y":
        newAR = bI; newAI = -bR;
        newBR = 0; newBI = a;
        break;
      case "Z":
        newAR = a; newAI = 0;
        newBR = -bR; newBI = -bI;
        break;
      case "H":
        newAR = (a + bR) / sq2; newAI = bI / sq2;
        newBR = (a - bR) / sq2; newBI = -bI / sq2;
        break;
      case "S":
        newAR = a; newAI = 0;
        newBR = -bI; newBI = bR;
        break;
      case "T":
        newAR = a; newAI = 0;
        newBR = (bR - bI) / sq2; newBI = (bR + bI) / sq2;
        break;
      default:
        return;
    }

    // Remove global phase to make alpha strictly real and positive
    let magA = Math.sqrt(newAR * newAR + newAI * newAI);
    let magB = Math.sqrt(newBR * newBR + newBI * newBI);
    
    const norm = Math.sqrt(magA * magA + magB * magB);
    magA /= norm; magB /= norm;

    let finalTheta = 2 * Math.acos(Math.max(0, Math.min(1, magA)));
    let finalPhi = 0;

    if (magA > 1e-6) {
      const phaseA = Math.atan2(newAI, newAR);
      const c = Math.cos(-phaseA);
      const s = Math.sin(-phaseA);
      const adjBR = newBR * c - newBI * s;
      const adjBI = newBR * s + newBI * c;
      finalPhi = Math.atan2(adjBI, adjBR);
    } else {
      finalTheta = Math.PI; // State |1>
    }

    if (finalPhi < 0) finalPhi += 2 * Math.PI;

    setTheta(finalTheta);
    setPhi(finalPhi);
  }, [theta, phi]);

  const { alpha, beta } = useMemo(() => {
    const a = Math.cos(theta / 2);
    const bReal = Math.sin(theta / 2) * Math.cos(phi);
    const bImag = Math.sin(theta / 2) * Math.sin(phi);
    return {
      alpha: a.toFixed(4),
      beta:
        Math.abs(bImag) < 0.0001
          ? bReal.toFixed(4)
          : `${bReal.toFixed(3)} + ${bImag.toFixed(3)}i`,
    };
  }, [theta, phi]);

  return (
    <div className="flex h-screen w-screen flex-col bg-[var(--color-app-base)] text-[var(--color-app-text-main)]">
      {/* Top Bar */}
      <div className="flex items-center justify-between bg-[var(--color-app-surface)] px-6 py-4 border-b border-[var(--color-app-border)]">
        <h1 className="text-xs font-bold flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--color-app-primary)] to-[var(--color-app-primary-hover)]">
            <svg className="h-4 w-4 text-[var(--color-app-base)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a15 15 0 010 20M2 12h20" />
            </svg>
          </div>
          Bloch Sphere Explorer
        </h1>
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-hover)] px-4 py-2 text-xs font-semibold text-[var(--color-app-text-light)] hover:bg-[var(--color-app-surface-alt)] hover:text-[var(--color-app-text-main)] transition"
        >
          ← Back
        </button>
      </div>
      <div className="app-gradient-line" />

      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        {/* Left Side: 3D Canvas */}
        <div className="flex-1 relative border-r border-[var(--color-app-border)] bg-[var(--color-app-base)] flex items-center justify-center p-8">
          <div className="absolute top-4 left-4 text-xs font-bold uppercase tracking-[0.15em] text-[var(--color-app-text-muted)]">
            Drag to rotate • Scroll to zoom
          </div>
          <div className="w-full h-full max-w-5xl max-h-5xl">
            <Canvas
              camera={{ position: [3, 2.5, 3], fov: 40 }}
              gl={{ antialias: true, alpha: true }}
              style={{ background: "transparent" }}
            >
              <ambientLight intensity={0.8} />
              <pointLight position={[5, 5, 5]} intensity={0.8} />
              <BlochSphere3D theta={theta} phi={phi} />
              <OrbitControls
                enablePan={false}
                minDistance={2}
                maxDistance={10}
                dampingFactor={0.1}
                enableDamping
              />
            </Canvas>
          </div>
        </div>

        {/* Right Side: Controls */}
        <div className="w-full lg:w-96 bg-[var(--color-app-surface)] p-6 overflow-y-auto flex flex-col gap-8 border-l border-[var(--color-app-border)]" data-lenis-prevent="true">
          
          {/* State readout */}
          <div className="rounded-lg app-glass p-5">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-[var(--color-app-accent)] border-b border-[var(--color-app-border)] pb-2">
              Qubit State
            </p>
            <p className="font-mono text-xs leading-relaxed">
              |ψ⟩ = <br/>
              <span className="text-[var(--color-app-primary)] font-bold">{alpha}</span>
              <span className="text-[var(--color-app-text-muted)]">|0⟩</span>
              {" + "}<br/>
              <span className="text-[var(--color-app-accent)] font-bold">{beta}</span>
              <span className="text-[var(--color-app-text-muted)]">|1⟩</span>
            </p>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--color-app-accent)] border-b border-[var(--color-app-border)] pb-2">Controls</h3>
            
            {/* Theta slider */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-semibold text-[var(--color-app-text-light)]">
                  θ (Polar angle)
                </label>
                <span className="font-mono text-xs text-[var(--color-app-accent)] font-semibold bg-[var(--color-app-accent)]/10 px-2 py-0.5 rounded-lg border border-[var(--color-app-accent)]/20">
                  {theta.toFixed(3)} rad ({((theta * 180) / Math.PI).toFixed(1)}°)
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={Math.PI}
                step="0.01"
                value={theta}
                onChange={(e) => setTheta(parseFloat(e.target.value))}
                className="bloch-slider w-full mt-2"
              />
              <div className="mt-2 flex justify-between text-xs text-[var(--color-app-text-muted)] font-mono">
                <span>0 (|0⟩)</span>
                <span>π/2</span>
                <span>π (|1⟩)</span>
              </div>
            </div>

            {/* Phi slider */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-semibold text-[var(--color-app-text-light)]">
                  φ (Azimuthal angle)
                </label>
                <span className="font-mono text-xs text-[var(--color-app-primary)] font-semibold bg-[var(--color-app-primary)]/10 px-2 py-0.5 rounded-lg border border-[var(--color-app-primary)]/20">
                  {phi.toFixed(3)} rad ({((phi * 180) / Math.PI).toFixed(1)}°)
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={2 * Math.PI}
                step="0.01"
                value={phi}
                onChange={(e) => setPhi(parseFloat(e.target.value))}
                className="bloch-slider w-full mt-2"
              />
              <div className="mt-2 flex justify-between text-xs text-[var(--color-app-text-muted)] font-mono">
                <span>0 (|+⟩)</span>
                <span>π</span>
                <span>2π</span>
              </div>
            </div>
          </div>

          {/* Presets */}
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-[var(--color-app-accent)] border-b border-[var(--color-app-border)] pb-2">
              Quick Presets
            </p>
            <div className="grid grid-cols-2 gap-3">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handlePreset(preset)}
                  className="rounded-lg border border-[var(--color-app-border-light)] bg-[var(--color-app-surface-hover)] px-3 py-2 font-mono text-xs text-[var(--color-app-text-light)] hover:bg-[var(--color-app-surface-alt)] hover:text-[var(--color-app-primary)] hover:border-[var(--color-app-primary)]/30 transition-colors font-bold"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quantum Gates */}
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-[var(--color-app-accent)] border-b border-[var(--color-app-border)] pb-2">
              Apply Quantum Gates
            </p>
            <div className="grid grid-cols-2 gap-3">
              {GATES.map((gate) => (
                <button
                  key={gate.id}
                  onClick={() => applyGate(gate.id)}
                  className={`rounded-lg border px-3 py-2 text-xs font-bold transition-transform active:scale-95 ${gate.color}`}
                  title={`Apply ${gate.label} gate`}
                >
                  {gate.label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

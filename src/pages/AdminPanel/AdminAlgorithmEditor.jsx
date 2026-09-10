import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { updateAlgorithm, getAlgorithmById } from "../../services/api";
import { useAlgorithmContext } from "../../context/AlgorithmContext";

export default function AdminAlgorithmEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refreshAlgorithms } = useAlgorithmContext();

  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await getAlgorithmById(id);
        setFormData(data);
      } catch (err) {
        setError("Failed to load algorithm data.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleParamAdd = () => {
    setFormData({
      ...formData,
      parameters: [
        ...formData.parameters,
        { name: "", type: "number", default: "", min: "", max: "", step: "" },
      ],
    });
  };

  const handleParamChange = (index, field, value) => {
    const newParams = [...formData.parameters];
    newParams[index][field] = value;
    setFormData({ ...formData, parameters: newParams });
  };

  const handleParamRemove = (index) => {
    const newParams = [...formData.parameters];
    newParams.splice(index, 1);
    setFormData({ ...formData, parameters: newParams });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const cleanParams = formData.parameters.map((p) => {
        const cp = { ...p };
        if (cp.type === "number") {
          if (cp.default) cp.default = Number(cp.default);
          if (cp.min) cp.min = Number(cp.min);
          if (cp.max) cp.max = Number(cp.max);
          if (cp.step) cp.step = Number(cp.step);
        } else if (cp.type === "select") {
          if (typeof cp.default === "string" && cp.default.includes(",")) {
            cp.options = cp.default.split(",").map((s) => s.trim());
            cp.default = cp.options[0];
          }
        }
        return cp;
      });

      await updateAlgorithm(id, { ...formData, parameters: cleanParams });
      await refreshAlgorithms();
      navigate(`/algorithm/${id}`);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update algorithm.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-[var(--color-app-text-main)]">Loading editor...</div>;
  if (!formData) return <div className="p-10 text-red-400">Algorithm not found.</div>;

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--color-app-base)]" data-lenis-prevent="true">
      <div className="mx-auto max-w-4xl py-10 px-6">
        <h1 className="text-2xl font-bold text-[var(--color-app-text-main)] mb-6">✏️ Edit Algorithm: {formData.name}</h1>

      {error && (
        <div className="bg-red-500/10 text-red-400 p-4 rounded-lg mb-6 border border-red-500/20">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[var(--color-app-text-muted)] mb-1">Name</label>
            <input
              required
              className="w-full bg-[var(--color-app-input-bg)] border border-[var(--color-app-input-border)] rounded-lg p-2.5 text-[var(--color-app-text-main)] text-sm"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--color-app-text-muted)] mb-1">Category</label>
            <select
              className="w-full bg-[var(--color-app-input-bg)] border border-[var(--color-app-input-border)] rounded-lg p-2.5 text-[var(--color-app-text-main)] text-sm"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="Search">Search</option>
              <option value="Factoring">Factoring</option>
              <option value="Simulation">Simulation</option>
              <option value="Cryptography">Cryptography</option>
              <option value="Transform">Transform</option>
              <option value="Error Correction">Error Correction</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-bold text-[var(--color-app-text-muted)] mb-1">Reference URL</label>
            <input
              className="w-full bg-[var(--color-app-input-bg)] border border-[var(--color-app-input-border)] rounded-lg p-2.5 text-[var(--color-app-text-main)] text-sm"
              value={formData.reference || ""}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--color-app-text-muted)] mb-1">Short Description</label>
          <input
            required
            className="w-full bg-[var(--color-app-input-bg)] border border-[var(--color-app-input-border)] rounded-lg p-2.5 text-[var(--color-app-text-main)] text-sm"
            value={formData.shortDescription}
            onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--color-app-text-muted)] mb-1">Full Description</label>
          <textarea
            required
            rows={3}
            className="w-full bg-[var(--color-app-input-bg)] border border-[var(--color-app-input-border)] rounded-lg p-2.5 text-[var(--color-app-text-main)] text-sm"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-[var(--color-app-text-muted)] mb-1">Formula (LaTeX)</label>
            <input
              className="w-full bg-[var(--color-app-input-bg)] border border-[var(--color-app-input-border)] rounded-lg p-2.5 text-[var(--color-app-text-main)] text-sm"
              value={formData.formula || ""}
              onChange={(e) => setFormData({ ...formData, formula: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--color-app-text-muted)] mb-1">Time Complexity</label>
            <input
              className="w-full bg-[var(--color-app-input-bg)] border border-[var(--color-app-input-border)] rounded-lg p-2.5 text-[var(--color-app-text-main)] text-sm"
              value={formData.timeComplexity || ""}
              onChange={(e) => setFormData({ ...formData, timeComplexity: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--color-app-text-muted)] mb-1">Space Complexity</label>
            <input
              className="w-full bg-[var(--color-app-input-bg)] border border-[var(--color-app-input-border)] rounded-lg p-2.5 text-[var(--color-app-text-main)] text-sm"
              value={formData.spaceComplexity || ""}
              onChange={(e) => setFormData({ ...formData, spaceComplexity: e.target.value })}
            />
          </div>
        </div>

        <div className="pt-4 border-t border-[var(--color-app-input-border)]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-[var(--color-app-text-main)]">Algorithm Parameters</h3>
            <button
              type="button"
              onClick={handleParamAdd}
              className="bg-blue-500/20 text-blue-400 text-xs px-3 py-1 rounded"
            >
              + Add Parameter
            </button>
          </div>

          {formData.parameters.map((param, index) => (
            <div key={index} className="flex gap-2 items-start mb-2 bg-[var(--color-app-input-bg)] p-3 rounded-lg border border-[var(--color-app-input-border)]">
              <input
                placeholder="Name"
                className="w-1/4 bg-[var(--color-app-input-bg)] border border-[var(--color-app-input-border)] rounded p-1.5 text-xs text-[var(--color-app-text-main)]"
                value={param.name}
                onChange={(e) => handleParamChange(index, "name", e.target.value)}
              />
              <select
                className="bg-[var(--color-app-input-bg)] border border-[var(--color-app-input-border)] rounded p-1.5 text-xs text-[var(--color-app-text-main)]"
                value={param.type}
                onChange={(e) => handleParamChange(index, "type", e.target.value)}
              >
                <option value="number">Number</option>
                <option value="text">Text</option>
                <option value="select">Select</option>
              </select>
              <input
                placeholder={param.type === "select" ? "Comma sep options" : "Default"}
                className="flex-1 bg-[var(--color-app-input-bg)] border border-[var(--color-app-input-border)] rounded p-1.5 text-xs text-[var(--color-app-text-main)]"
                value={param.type === "select" && param.options ? param.options.join(", ") : param.default || ""}
                onChange={(e) => handleParamChange(index, "default", e.target.value)}
              />
              {param.type === "number" && (
                <>
                  <input placeholder="Min" type="number" className="w-16 bg-[var(--color-app-input-bg)] border border-[var(--color-app-input-border)] rounded p-1.5 text-xs text-[var(--color-app-text-main)]" value={param.min || ""} onChange={(e) => handleParamChange(index, "min", e.target.value)} />
                  <input placeholder="Max" type="number" className="w-16 bg-[var(--color-app-input-bg)] border border-[var(--color-app-input-border)] rounded p-1.5 text-xs text-[var(--color-app-text-main)]" value={param.max || ""} onChange={(e) => handleParamChange(index, "max", e.target.value)} />
                </>
              )}
              <button
                type="button"
                onClick={() => handleParamRemove(index)}
                className="text-red-400 px-2 py-1 bg-red-500/10 rounded"
              >
                X
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-4 pt-6">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-6 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/algorithm/${id}`)}
            className="bg-gray-700 hover:bg-gray-600 text-white py-2.5 px-6 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
    </div>
  );
}

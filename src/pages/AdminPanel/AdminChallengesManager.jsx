import React, { useState, useEffect } from "react";
import { getChallenges, createChallenge, updateChallenge, deleteChallenge } from "../../services/api";
import { toast } from "sonner";

export default function AdminChallengesManager() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [editingChallenge, setEditingChallenge] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    desc: "",
    numQubits: 1,
    targetState: "[]", // String input to parse later
    targetStr: "",
    allowedGates: "X, H", // Comma separated
    order: 0
  });

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const data = await getChallenges();
      setChallenges(data);
    } catch (err) {
      toast.error("Failed to load challenges.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    try {
      // Parse targets
      let parsedTargetState = [];
      try {
        parsedTargetState = JSON.parse(formData.targetState);
        if (!Array.isArray(parsedTargetState)) throw new Error("Not an array");
      } catch (err) {
        toast.error("Invalid Target State JSON format.");
        return;
      }

      const payload = {
        title: formData.title,
        desc: formData.desc,
        numQubits: Number(formData.numQubits),
        targetState: parsedTargetState,
        targetStr: formData.targetStr,
        allowedGates: formData.allowedGates.split(",").map(g => g.trim().toUpperCase()),
        order: Number(formData.order)
      };

      if (isCreating) {
        await createChallenge(payload);
        toast.success("Challenge created successfully.");
      } else {
        await updateChallenge(editingChallenge._id, payload);
        toast.success("Challenge updated successfully.");
      }
      
      closeModal();
      fetchChallenges();
    } catch (err) {
      toast.error("Failed to save challenge.");
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this challenge?")) return;
    try {
      await deleteChallenge(id);
      toast.success("Challenge deleted.");
      fetchChallenges();
    } catch (err) {
      toast.error("Failed to delete challenge.");
    }
  };

  const openCreateModal = () => {
    setIsCreating(true);
    setFormData({
      title: "", desc: "", numQubits: 1, targetState: "[0, 1]", targetStr: "|1⟩", allowedGates: "X, H", order: challenges.length + 1
    });
  };

  const openEditModal = (ch) => {
    setEditingChallenge(ch);
    setIsCreating(false);
    setFormData({
      title: ch.title,
      desc: ch.desc,
      numQubits: ch.numQubits,
      targetState: JSON.stringify(ch.targetState),
      targetStr: ch.targetStr,
      allowedGates: ch.allowedGates.join(", "),
      order: ch.order
    });
  };

  const closeModal = () => {
    setIsCreating(false);
    setEditingChallenge(null);
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-app-text-main)]">Quantum Challenges</h2>
          <p className="text-sm text-[var(--color-app-text-muted)]">Manage the challenges displayed in the Playground.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchChallenges}
            className="px-4 py-2 rounded-lg bg-[var(--color-app-surface)] border border-[var(--color-app-border)] text-[var(--color-app-text-main)] font-semibold hover:bg-[var(--color-app-border)] transition-colors"
          >
            Refresh
          </button>
          <button 
            onClick={openCreateModal}
            className="px-4 py-2 rounded-lg bg-[var(--color-app-primary)] text-white font-bold hover:bg-[var(--color-app-primary-hover)] transition-colors shadow-lg shadow-blue-500/20"
          >
            + New Challenge
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[var(--color-app-text-muted)]">Loading challenges...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {challenges.map((ch) => (
            <div key={ch._id} className="app-glass p-5 rounded-xl border border-[var(--color-app-border)] shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono px-2 py-1 bg-[var(--color-app-surface)] border border-[var(--color-app-border-light)] rounded-md text-[var(--color-app-text-muted)]">
                    Order: {ch.order}
                  </span>
                  <span className="text-xs font-bold px-2 py-1 bg-purple-500/20 text-purple-400 rounded-md">
                    {ch.numQubits} Qubit{ch.numQubits > 1 ? 's' : ''}
                  </span>
                </div>
                <h3 className="font-bold text-[var(--color-app-text-main)] text-lg mb-1">{ch.title}</h3>
                <p className="text-xs text-[var(--color-app-text-light)] mb-4 line-clamp-2" title={ch.desc}>{ch.desc}</p>
                <div className="mb-4">
                  <div className="text-xs text-[var(--color-app-text-muted)]">Target:</div>
                  <div className="text-sm font-mono text-[var(--color-app-text-main)]">{ch.targetStr}</div>
                </div>
              </div>
              <div className="flex justify-between items-center border-t border-[var(--color-app-border-light)] pt-3">
                <button 
                  onClick={() => handleDelete(ch._id)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 font-semibold hover:bg-red-500 hover:text-white transition-colors"
                >
                  Delete
                </button>
                <button 
                  onClick={() => openEditModal(ch)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-[var(--color-app-primary)] text-[var(--color-app-primary)] font-semibold hover:bg-[var(--color-app-primary)] hover:text-white transition-colors"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {(isCreating || editingChallenge) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--color-app-base)] border border-[var(--color-app-border)] rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-[var(--color-app-border)]">
              <h2 className="text-xl font-bold text-[var(--color-app-text-main)]">
                {isCreating ? "Create New Challenge" : "Edit Challenge"}
              </h2>
              <button onClick={closeModal} className="text-[var(--color-app-text-muted)] hover:text-white text-xl">✕</button>
            </div>
            
            <div className="p-5 overflow-y-auto">
              <form onSubmit={handleCreateOrUpdate} className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-3 space-y-1">
                    <label className="text-xs font-semibold text-[var(--color-app-text-light)]">Title</label>
                    <input
                      className="w-full bg-[var(--color-app-surface)] border border-[var(--color-app-border)] rounded-lg p-2 text-sm text-[var(--color-app-text-main)] outline-none focus:border-[var(--color-app-primary)]"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-span-1 space-y-1">
                    <label className="text-xs font-semibold text-[var(--color-app-text-light)]">Order</label>
                    <input
                      type="number"
                      className="w-full bg-[var(--color-app-surface)] border border-[var(--color-app-border)] rounded-lg p-2 text-sm text-[var(--color-app-text-main)] outline-none focus:border-[var(--color-app-primary)]"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--color-app-text-light)]">Description</label>
                  <textarea
                    value={formData.desc}
                    onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                    className="w-full bg-[var(--color-app-surface)] border border-[var(--color-app-border)] rounded-lg p-3 text-sm text-[var(--color-app-text-main)] outline-none focus:border-[var(--color-app-primary)] min-h-[80px]"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--color-app-text-light)]">Num Qubits</label>
                    <input
                      type="number" min="1" max="5"
                      className="w-full bg-[var(--color-app-surface)] border border-[var(--color-app-border)] rounded-lg p-2 text-sm text-[var(--color-app-text-main)] outline-none focus:border-[var(--color-app-primary)]"
                      value={formData.numQubits}
                      onChange={(e) => setFormData({ ...formData, numQubits: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-semibold text-[var(--color-app-text-light)]">Allowed Gates (comma sep)</label>
                    <input
                      className="w-full bg-[var(--color-app-surface)] border border-[var(--color-app-border)] rounded-lg p-2 text-sm text-[var(--color-app-text-main)] outline-none focus:border-[var(--color-app-primary)]"
                      value={formData.allowedGates}
                      onChange={(e) => setFormData({ ...formData, allowedGates: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--color-app-text-light)]">Target String (UI)</label>
                    <input
                      className="w-full bg-[var(--color-app-surface)] border border-[var(--color-app-border)] rounded-lg p-2 text-sm text-[var(--color-app-text-main)] outline-none focus:border-[var(--color-app-primary)]"
                      value={formData.targetStr}
                      placeholder="e.g. |1⟩"
                      onChange={(e) => setFormData({ ...formData, targetStr: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--color-app-text-light)]">Target State Array (JSON)</label>
                    <input
                      className="w-full font-mono bg-[var(--color-app-surface)] border border-[var(--color-app-border)] rounded-lg p-2 text-sm text-[var(--color-app-text-main)] outline-none focus:border-[var(--color-app-primary)]"
                      value={formData.targetState}
                      placeholder="[0, 1]"
                      onChange={(e) => setFormData({ ...formData, targetState: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-[var(--color-app-border-light)] flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={closeModal}
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-[var(--color-app-text-muted)] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 rounded-lg text-sm font-bold bg-[var(--color-app-primary)] text-white hover:bg-[var(--color-app-primary-hover)] transition-colors shadow-lg shadow-blue-500/20"
                  >
                    {isCreating ? "Create Challenge" : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

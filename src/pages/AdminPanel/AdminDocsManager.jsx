import { useState, useEffect, useMemo } from "react";
import Navbar from "../../components/Navbar/Navbar";
import RichTextEditor from "../../components/RichTextEditor/RichTextEditor";
import { getDocs, createDoc, updateDoc, deleteDoc, reorderDocs } from "../../services/api";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableItem({ id, children, className }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : 'auto',
    position: isDragging ? 'relative' : 'static',
  };

  return (
    <div ref={setNodeRef} style={style} className={className}>
      <div className="flex items-start gap-2 w-full">
        <div {...attributes} {...listeners} className="cursor-grab text-[var(--color-app-text-muted)] hover:text-white mt-1.5 p-1 flex-shrink-0" style={{ touchAction: 'none' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM8 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM16 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM16 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM16 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/></svg>
        </div>
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function AdminDocsManager() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [isAddingNewSection, setIsAddingNewSection] = useState(false);
  
  const [formData, setFormData] = useState({
    section: "", subsection: "", title: "", content: ""
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchDocs();
  }, []);

  async function fetchDocs() {
    try {
      const data = await getDocs();
      setDocs(data);
    } catch (err) {
      console.error(err);
      alert("Failed to load docs");
    } finally {
      setLoading(false);
    }
  }

  const uniqueSections = [...new Set(docs.map(d => d.section))];

  const sectionGroups = useMemo(() => {
    const sortedDocs = [...docs].sort((a, b) => {
      if (a.sectionOrder !== b.sectionOrder) return (a.sectionOrder || 0) - (b.sectionOrder || 0);
      if ((a.subsectionOrder || 0) !== (b.subsectionOrder || 0)) return (a.subsectionOrder || 0) - (b.subsectionOrder || 0);
      return (a.order || 0) - (b.order || 0);
    });

    const groups = [];
    sortedDocs.forEach(doc => {
      let sGroup = groups.find(s => s.name === doc.section);
      if (!sGroup) {
        sGroup = { 
          name: doc.section, 
          id: `section_${btoa(unescape(encodeURIComponent(doc.section)))}`, 
          subsections: [] 
        };
        groups.push(sGroup);
      }
      
      let subName = doc.subsection || "";
      let subGroup = sGroup.subsections.find(s => s.name === subName);
      if (!subGroup) {
        subGroup = { 
          name: subName, 
          id: `subsec_${sGroup.id}_${btoa(unescape(encodeURIComponent(subName)))}`, 
          modules: [] 
        };
        sGroup.subsections.push(subGroup);
      }
      
      subGroup.modules.push({ ...doc, dragId: `mod_${doc._id}` });
    });
    return groups;
  }, [docs]);

  function handleEdit(item) {
    setEditingId(item._id);
    setFormData({
      section: item.section,
      subsection: item.subsection || "",
      title: item.title,
      content: item.content
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleCancel() {
    setEditingId(null);
    setIsAddingNewSection(false);
    setFormData({ section: "", subsection: "", title: "", content: "" });
  }

  function handleUseTemplate() {
    setFormData(prev => ({
      ...prev,
      content: `<h2>Introduction to [Topic]</h2>\n<p>This is a brief introduction to what you are explaining. Replace this text with your own explanation.</p>\n<h3>Example Scenario</h3>\n<p>Here is a practical example:</p>\n<pre class="ql-syntax" spellcheck="false"># Paste your Python/Qiskit code here\nimport qiskit\n</pre>\n<p><strong>Next Steps:</strong> You can explore more in the next module.</p>`
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const requiredFields = [
      { key: 'section', label: 'Section' },
      { key: 'title', label: 'Title' },
      { key: 'content', label: 'Content' }
    ];
    for (let field of requiredFields) {
      if (!formData[field.key] || formData[field.key] === '<p><br></p>') {
        alert(`Please fill the required field: ${field.label}`);
        return;
      }
    }

    try {
      if (editingId) {
        await updateDoc(editingId, formData);
        alert("Doc updated successfully");
      } else {
        await createDoc(formData);
        alert("Doc created successfully");
      }
      handleCancel();
      fetchDocs();
    } catch (err) {
      console.error(err);
      alert("Failed to save doc");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    try {
      await deleteDoc(id);
      fetchDocs();
    } catch (err) {
      console.error(err);
      alert("Failed to delete doc");
    }
  }

  async function saveNewOrder(allDocs) {
    const updates = allDocs.map(d => ({
      id: d._id,
      sectionOrder: d.sectionOrder || 0,
      subsectionOrder: d.subsectionOrder || 0,
      order: d.order || 0
    }));

    try {
      await reorderDocs(updates);
      // Wait for reorder to complete before fetching fresh to avoid glitch
    } catch (err) {
      console.error("Failed to reorder", err);
      alert("Failed to save new order");
    }
  }

  async function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    let updatedDocs = [...docs];

    // 1. Reorder Sections
    if (activeId.startsWith('section_') && overId.startsWith('section_')) {
      const activeGroup = sectionGroups.find(s => s.id === activeId);
      const overGroup = sectionGroups.find(s => s.id === overId);
      
      if (activeGroup && overGroup) {
        const sections = sectionGroups.map(s => s.name);
        const oldIndex = sections.indexOf(activeGroup.name);
        const newIndex = sections.indexOf(overGroup.name);
        const newSections = arrayMove(sections, oldIndex, newIndex);
        
        updatedDocs = updatedDocs.map(d => ({
          ...d,
          sectionOrder: newSections.indexOf(d.section)
        }));
      }
    }
    // 2. Reorder Subsections
    else if (activeId.startsWith('subsec_') && overId.startsWith('subsec_')) {
      const sGroup = sectionGroups.find(s => s.subsections.some(sub => sub.id === activeId) && s.subsections.some(sub => sub.id === overId));
      if (sGroup) {
        const activeSub = sGroup.subsections.find(sub => sub.id === activeId);
        const overSub = sGroup.subsections.find(sub => sub.id === overId);
        
        const subNames = sGroup.subsections.map(s => s.name);
        const oldIndex = subNames.indexOf(activeSub.name);
        const newIndex = subNames.indexOf(overSub.name);
        const newSubNames = arrayMove(subNames, oldIndex, newIndex);
        
        updatedDocs = updatedDocs.map(d => {
          if (d.section === sGroup.name) {
            return { ...d, subsectionOrder: newSubNames.indexOf(d.subsection || "") };
          }
          return d;
        });
      }
    }
    // 3. Reorder Modules
    else if (activeId.startsWith('mod_') && overId.startsWith('mod_')) {
      const activeDocId = activeId.replace('mod_', '');
      const overDocId = overId.replace('mod_', '');
      
      const activeDoc = updatedDocs.find(d => d._id === activeDocId);
      const overDoc = updatedDocs.find(d => d._id === overDocId);
      
      if (activeDoc && overDoc && activeDoc.section === overDoc.section && (activeDoc.subsection || "") === (overDoc.subsection || "")) {
        const groupDocs = updatedDocs.filter(d => d.section === activeDoc.section && (d.subsection || "") === (activeDoc.subsection || ""));
        groupDocs.sort((a, b) => (a.order || 0) - (b.order || 0));
        
        const oldIndex = groupDocs.findIndex(d => d._id === activeDocId);
        const newIndex = groupDocs.findIndex(d => d._id === overDocId);
        const newGroupDocs = arrayMove(groupDocs, oldIndex, newIndex);
        
        updatedDocs = updatedDocs.map(d => {
          const foundIndex = newGroupDocs.findIndex(ngd => ngd._id === d._id);
          if (foundIndex !== -1) {
            return { ...d, order: foundIndex };
          }
          return d;
        });
      }
    }

    if (updatedDocs !== docs) {
      setDocs(updatedDocs); // Optimistic UI update
      await saveNewOrder(updatedDocs);
    }
  }

  if (loading) return <div className="p-10 text-[var(--color-app-text-main)]">Loading...</div>;

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--color-app-base)] p-8" data-lenis-prevent="true">
      <div className="max-w-5xl mx-auto text-[var(--color-app-text-main)]">
        <h1 className="text-2xl font-bold mb-8">📚 Manage Docs</h1>

        <div className="bg-[var(--color-app-surface)] p-6 rounded-xl border border-[var(--color-app-border)] mb-8">
          <h2 className="text-lg font-bold mb-4">{editingId ? "Edit Document" : "Add New Document"}</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex gap-4 items-center">
              {isAddingNewSection ? (
                <div className="flex-1 flex gap-2">
                  <input 
                    type="text" placeholder="New Section Name" required
                    value={formData.section} onChange={e => setFormData(prev => ({...prev, section: e.target.value}))}
                    className="flex-1 p-3 bg-[var(--color-app-base)] border border-[var(--color-app-border)] rounded text-sm outline-none text-[var(--color-app-text-main)]"
                  />
                  <button type="button" onClick={() => setIsAddingNewSection(false)} className="px-3 bg-[var(--color-app-surface-hover)] text-[var(--color-app-text-muted)] rounded border border-[var(--color-app-border)] text-sm hover:text-white">Cancel</button>
                </div>
              ) : (
                <select 
                  value={formData.section} 
                  onChange={e => {
                    if (e.target.value === '__new__') {
                      setIsAddingNewSection(true);
                      setFormData(prev => ({...prev, section: ""}));
                    } else {
                      setFormData(prev => ({...prev, section: e.target.value}));
                    }
                  }}
                  required
                  className="flex-1 p-3 bg-[var(--color-app-base)] border border-[var(--color-app-border)] rounded text-sm outline-none text-[var(--color-app-text-main)] appearance-none cursor-pointer"
                >
                  <option value="" disabled>Select a Section</option>
                  {uniqueSections.map(sec => (
                    <option key={sec} value={sec}>{sec}</option>
                  ))}
                  <option value="__new__">+ Add New Section</option>
                </select>
              )}
              <input 
                type="text" placeholder="Subsection (Optional)"
                value={formData.subsection} onChange={e => setFormData(prev => ({...prev, subsection: e.target.value}))}
                className="flex-1 p-3 bg-[var(--color-app-base)] border border-[var(--color-app-border)] rounded text-sm outline-none text-[var(--color-app-text-main)]"
              />
              <input 
                type="text" placeholder="Title (e.g. Installation)" required
                value={formData.title} onChange={e => setFormData(prev => ({...prev, title: e.target.value}))}
                className="flex-1 p-3 bg-[var(--color-app-base)] border border-[var(--color-app-border)] rounded text-sm outline-none text-[var(--color-app-text-main)]"
              />
            </div>
            <div className="flex justify-end -mb-2">
              <button type="button" onClick={handleUseTemplate} className="text-xs bg-orange-600/20 text-orange-400 hover:text-orange-300 hover:bg-orange-600/30 px-3 py-1.5 rounded-full border border-orange-600/30 transition flex items-center gap-1">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                Start with Template
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs text-[var(--color-app-text-muted)] font-bold ml-2">Content Editor</span>
              <RichTextEditor 
                key={editingId || 'new_doc'}
                value={formData.content} 
                onChange={val => setFormData(prev => ({...prev, content: val}))} 
                placeholder="Write your documentation here... (LaTeX math is supported, just wrap in $$ $$)"
              />
            </div>
            <div className="flex gap-3 mt-4">
              <button type="submit" className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-2 rounded font-bold text-sm transition">
                {editingId ? "Update Doc" : "Add Doc"}
              </button>
              {editingId && (
                <button type="button" onClick={handleCancel} className="bg-[var(--color-app-surface-hover)] border border-[var(--color-app-border)] px-6 py-2 rounded font-bold text-sm text-[var(--color-app-text-main)]">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sectionGroups.map(s => s.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-6 pb-20">
              {sectionGroups.map(sGroup => (
                <SortableItem key={sGroup.id} id={sGroup.id} className="bg-[var(--color-app-surface)] border border-[var(--color-app-border)] p-4 rounded-xl">
                  <div className="w-full">
                    <h3 className="font-bold text-lg text-[var(--color-app-text-main)] mb-4 pb-2 border-b border-[var(--color-app-border)]">
                      📁 {sGroup.name}
                    </h3>
                  </div>
                  
                  <SortableContext items={sGroup.subsections.map(sub => sub.id)} strategy={verticalListSortingStrategy}>
                    <div className="flex flex-col gap-6">
                      {sGroup.subsections.map(sub => (
                        <SortableItem key={sub.id} id={sub.id} className={sub.name ? "pl-2 border-l-2 border-[var(--color-app-border)] ml-2" : ""}>
                          {sub.name && (
                            <div className="w-full">
                              <h4 className="font-semibold text-md text-[var(--color-app-text-muted)] mb-3 mt-1">
                                📂 {sub.name}
                              </h4>
                            </div>
                          )}
                          
                          <SortableContext items={sub.modules.map(m => m.dragId)} strategy={verticalListSortingStrategy}>
                            <div className="flex flex-col gap-2 w-full">
                              {sub.modules.map(item => (
                                <SortableItem key={item.dragId} id={item.dragId} className="bg-[var(--color-app-base)] border border-[var(--color-app-border-light)] p-3 rounded w-full">
                                  <div className="flex justify-between items-center w-full">
                                    <div className="flex items-center gap-3">
                                      <div>
                                        <h4 className="font-semibold text-sm text-[var(--color-app-text-main)]">{item.title}</h4>
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <button onClick={() => handleEdit(item)} className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded hover:bg-blue-500/30 transition">Edit</button>
                                      <button onClick={() => handleDelete(item._id)} className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded hover:bg-red-500/30 transition">Delete</button>
                                    </div>
                                  </div>
                                </SortableItem>
                              ))}
                            </div>
                          </SortableContext>
                        </SortableItem>
                      ))}
                    </div>
                  </SortableContext>
                </SortableItem>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

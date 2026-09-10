import { useState, useEffect } from "react";
import { getCourses, createCourse, updateCourse, deleteCourse } from "../../services/api";

export default function AdminCoursesManager() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    title: "", description: "", thumbnail: "", instructor: "Admin", lectures: []
  });
  
  // Temporary state for adding a new lecture in the form
  const [newLecture, setNewLecture] = useState({ title: "", videoUrl: "", duration: "" });

  useEffect(() => {
    fetchCourses();
  }, []);

  async function fetchCourses() {
    try {
      setLoading(true);
      const data = await getCourses();
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      alert("Failed to load courses");
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(item) {
    setEditingId(item._id);
    setFormData({
      title: item.title,
      description: item.description,
      thumbnail: item.thumbnail,
      instructor: item.instructor,
      lectures: item.lectures || []
    });
  }

  function handleCancel() {
    setEditingId(null);
    setFormData({ title: "", description: "", thumbnail: "", instructor: "Admin", lectures: [] });
    setNewLecture({ title: "", videoUrl: "", duration: "" });
  }

  function handleAddLecture() {
    if (!newLecture.title || !newLecture.videoUrl) {
      alert("Lecture title and video URL are required");
      return;
    }
    setFormData(prev => ({
      ...prev,
      lectures: [...prev.lectures, newLecture]
    }));
    setNewLecture({ title: "", videoUrl: "", duration: "" });
  }

  function handleRemoveLecture(index) {
    setFormData(prev => {
      const updated = [...prev.lectures];
      updated.splice(index, 1);
      return { ...prev, lectures: updated };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      alert("Please fill required fields (Title, Description)");
      return;
    }

    try {
      if (editingId) {
        await updateCourse(editingId, formData);
        alert("Course updated successfully!");
      } else {
        await createCourse(formData);
        alert("Course created successfully!");
      }
      handleCancel();
      fetchCourses();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to save course");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    try {
      await deleteCourse(id);
      fetchCourses();
    } catch (err) {
      console.error(err);
      alert("Failed to delete course");
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-extrabold mb-8 text-[var(--color-app-text-main)]">Manage Courses & Lectures</h1>

      <div className="app-glass p-8 rounded-xl border border-[var(--color-app-border)] mb-12 shadow-lg">
        <h2 className="text-xl font-bold mb-6 text-[var(--color-app-primary)]">
          {editingId ? "Edit Course" : "Create New Course"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-wider text-[var(--color-app-text-muted)]">Course Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-lg px-4 py-3 bg-[var(--color-app-base)] border border-[var(--color-app-border)] text-sm text-[var(--color-app-text-main)] outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-wider text-[var(--color-app-text-muted)]">Instructor</label>
              <input
                type="text"
                value={formData.instructor}
                onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                className="w-full rounded-lg px-4 py-3 bg-[var(--color-app-base)] border border-[var(--color-app-border)] text-sm text-[var(--color-app-text-main)] outline-none"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold mb-2 uppercase tracking-wider text-[var(--color-app-text-muted)]">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-lg px-4 py-3 bg-[var(--color-app-base)] border border-[var(--color-app-border)] text-sm text-[var(--color-app-text-main)] outline-none h-24"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold mb-2 uppercase tracking-wider text-[var(--color-app-text-muted)]">Thumbnail Image URL (optional)</label>
              <input
                type="text"
                value={formData.thumbnail}
                onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                className="w-full rounded-lg px-4 py-3 bg-[var(--color-app-base)] border border-[var(--color-app-border)] text-sm text-[var(--color-app-text-main)] outline-none"
              />
            </div>
          </div>

          <div className="border-t border-[var(--color-app-border)] pt-6 mt-6">
            <h3 className="text-lg font-bold mb-4 text-[var(--color-app-text-main)]">Lectures ({formData.lectures.length})</h3>
            
            {/* Existing Lectures List */}
            {formData.lectures.length > 0 && (
              <ul className="mb-6 space-y-2">
                {formData.lectures.map((lec, idx) => (
                  <li key={idx} className="flex justify-between items-center p-3 rounded-lg bg-[var(--color-app-base)] border border-[var(--color-app-border)]">
                    <div>
                      <span className="font-semibold text-sm text-[var(--color-app-text-main)]">{lec.title}</span>
                      <span className="text-xs text-[var(--color-app-text-muted)] ml-2">({lec.duration || "N/A"}) - {lec.videoUrl}</span>
                    </div>
                    <button type="button" onClick={() => handleRemoveLecture(idx)} className="text-red-500 hover:text-red-400 text-sm font-semibold transition-colors">
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Add New Lecture */}
            <div className="flex flex-col md:flex-row gap-4 items-end bg-[var(--color-app-surface)] p-4 rounded-xl border border-[var(--color-app-border)]">
              <div className="flex-1">
                <label className="block text-xs font-semibold mb-1 text-[var(--color-app-text-muted)]">Lecture Title</label>
                <input
                  type="text"
                  value={newLecture.title}
                  onChange={e => setNewLecture({...newLecture, title: e.target.value})}
                  className="w-full rounded-md px-3 py-2 bg-[var(--color-app-base)] border border-[var(--color-app-border)] text-sm text-[var(--color-app-text-main)] outline-none"
                  placeholder="e.g. Introduction to Qubits"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold mb-1 text-[var(--color-app-text-muted)]">Video URL (YouTube/MP4)</label>
                <input
                  type="text"
                  value={newLecture.videoUrl}
                  onChange={e => setNewLecture({...newLecture, videoUrl: e.target.value})}
                  className="w-full rounded-md px-3 py-2 bg-[var(--color-app-base)] border border-[var(--color-app-border)] text-sm text-[var(--color-app-text-main)] outline-none"
                  placeholder="https://youtube.com/..."
                />
              </div>
              <div className="w-24">
                <label className="block text-xs font-semibold mb-1 text-[var(--color-app-text-muted)]">Duration</label>
                <input
                  type="text"
                  value={newLecture.duration}
                  onChange={e => setNewLecture({...newLecture, duration: e.target.value})}
                  className="w-full rounded-md px-3 py-2 bg-[var(--color-app-base)] border border-[var(--color-app-border)] text-sm text-[var(--color-app-text-main)] outline-none"
                  placeholder="12:30"
                />
              </div>
              <button 
                type="button" 
                onClick={handleAddLecture}
                className="px-4 py-2 bg-[var(--color-app-primary)] text-white font-semibold rounded-md text-sm hover:bg-opacity-90 transition-all"
              >
                Add
              </button>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="submit" className="px-6 py-3 bg-[var(--color-app-primary)] text-white rounded-lg font-bold hover:shadow-lg hover:bg-opacity-90 transition-all">
              {editingId ? "Update Course" : "Create Course"}
            </button>
            {editingId && (
              <button type="button" onClick={handleCancel} className="px-6 py-3 border border-[var(--color-app-border)] text-[var(--color-app-text-main)] rounded-lg font-bold hover:bg-[var(--color-app-surface)] transition-all">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {loading ? (
        <div className="text-[var(--color-app-text-muted)] animate-pulse">Loading courses...</div>
      ) : courses.length === 0 ? (
        <div className="text-[var(--color-app-text-muted)]">No courses found. Create one above.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <div key={course._id} className="app-glass p-6 rounded-xl border border-[var(--color-app-border)] hover:border-[var(--color-app-primary)] transition-all">
              {course.thumbnail && (
                <img src={course.thumbnail} alt={course.title} className="w-full h-32 object-cover rounded-md mb-4" />
              )}
              <h3 className="font-bold text-lg text-[var(--color-app-text-main)] mb-2">{course.title}</h3>
              <p className="text-sm text-[var(--color-app-text-muted)] mb-4 line-clamp-2">{course.description}</p>
              <div className="text-xs font-semibold text-[var(--color-app-primary)] mb-4">
                {course.lectures?.length || 0} Lectures
              </div>
              <div className="flex gap-3">
                <button onClick={() => handleEdit(course)} className="px-4 py-2 bg-blue-500/10 text-blue-500 rounded-lg text-sm font-semibold hover:bg-blue-500/20 transition-colors">
                  Edit
                </button>
                <button onClick={() => handleDelete(course._id)} className="px-4 py-2 bg-red-500/10 text-red-500 rounded-lg text-sm font-semibold hover:bg-red-500/20 transition-colors">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

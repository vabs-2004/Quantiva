const Course = require("../models/Course");

// GET /api/courses
async function getAllCourses(req, res) {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
}

// GET /api/courses/:id
async function getCourseById(req, res) {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });
    res.json(course);
  } catch (error) {
    console.error("Error fetching course:", error);
    res.status(500).json({ error: "Failed to fetch course" });
  }
}

// POST /api/courses (Admin only)
async function createCourse(req, res) {
  try {
    const { title, description, thumbnail, instructor, lectures } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ error: "Title and description are required" });
    }

    const newCourse = new Course({
      title,
      description,
      thumbnail,
      instructor,
      lectures: lectures || []
    });

    await newCourse.save();
    res.status(201).json(newCourse);
  } catch (error) {
    console.error("Error creating course:", error);
    res.status(500).json({ error: "Failed to create course" });
  }
}

// PUT /api/courses/:id (Admin only)
async function updateCourse(req, res) {
  try {
    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedCourse) return res.status(404).json({ error: "Course not found" });
    res.json(updatedCourse);
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({ error: "Failed to update course" });
  }
}

// DELETE /api/courses/:id (Admin only)
async function deleteCourse(req, res) {
  try {
    const deletedCourse = await Course.findByIdAndDelete(req.params.id);
    if (!deletedCourse) return res.status(404).json({ error: "Course not found" });
    res.json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({ error: "Failed to delete course" });
  }
}

module.exports = {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
};

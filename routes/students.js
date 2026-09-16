const express = require('express');
const router = express.Router();
const Student = require('../models/Student');

// Helper to find student by either MongoDB _id or custom studentId
const findStudentByIdOrCustomId = async (idParam) => {
  if (idParam.match(/^[0-9a-fA-F]{24}$/)) {
    const student = await Student.findById(idParam);
    if (student) return student;
  }
  return await Student.findOne({ studentId: idParam.toUpperCase() });
};

// GET /api/students - List all students with search & filter support
router.get('/', async (req, res) => {
  try {
    const { search, course, semester, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    let query = {};

    // Live search query matching across studentId, name, email, and course
    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { studentId: regex },
        { name: regex },
        { email: regex },
        { course: regex },
        { mobile: regex }
      ];
    }

    if (course && course !== 'All') {
      query.course = course;
    }

    if (semester && semester !== 'All') {
      query.semester = Number(semester);
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const students = await Student.find(query).sort(sortOptions);
    res.json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve students',
      error: error.message
    });
  }
});

// GET /api/students/stats - Aggregated stats for dashboard widgets
router.get('/stats', async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    
    // Group by course
    const courseDistribution = await Student.aggregate([
      { $group: { _id: '$course', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Group by semester
    const semesterDistribution = await Student.aggregate([
      { $group: { _id: '$semester', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalStudents,
        totalCourses: courseDistribution.length,
        courseDistribution,
        semesterDistribution
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

// POST /api/students/seed - Populate sample records
router.post('/seed', async (req, res) => {
  try {
    const sampleStudents = [
      {
        studentId: 'STU-1001',
        name: 'Aarav Sharma',
        email: 'aarav.sharma@example.com',
        course: 'Computer Science & Engineering',
        semester: 6,
        mobile: '9876543210'
      },
      {
        studentId: 'STU-1002',
        name: 'Priya Patel',
        email: 'priya.patel@example.com',
        course: 'Data Science & AI',
        semester: 4,
        mobile: '9812345678'
      },
      {
        studentId: 'STU-1003',
        name: 'Rohan Mehta',
        email: 'rohan.mehta@example.com',
        course: 'Information Technology',
        semester: 2,
        mobile: '9765432109'
      },
      {
        studentId: 'STU-1004',
        name: 'Ananya Iyer',
        email: 'ananya.iyer@example.com',
        course: 'Electronics & Communication',
        semester: 8,
        mobile: '9988776655'
      },
      {
        studentId: 'STU-1005',
        name: 'Vikram Sengupta',
        email: 'vikram.s@example.com',
        course: 'Computer Science & Engineering',
        semester: 4,
        mobile: '9845123456'
      }
    ];

    let inserted = 0;
    for (const student of sampleStudents) {
      const exists = await Student.findOne({
        $or: [{ studentId: student.studentId }, { email: student.email }]
      });
      if (!exists) {
        await Student.create(student);
        inserted++;
      }
    }

    const allStudents = await Student.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      message: `Sample records processed. ${inserted} new students seeded.`,
      count: allStudents.length,
      data: allStudents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to seed sample data',
      error: error.message
    });
  }
});

// GET /api/students/:id - Get single student record
router.get('/:id', async (req, res) => {
  try {
    const student = await findStudentByIdOrCustomId(req.params.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: `Student not found with identifier '${req.params.id}'`
      });
    }
    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching student',
      error: error.message
    });
  }
});

// POST /api/students - Add a new student record
router.post('/', async (req, res) => {
  try {
    const { studentId, name, email, course, semester, mobile } = req.body;

    // Check for duplicate Student ID
    if (studentId) {
      const existingId = await Student.findOne({ studentId: studentId.trim().toUpperCase() });
      if (existingId) {
        return res.status(409).json({
          success: false,
          message: `Student ID '${studentId.toUpperCase()}' is already in use.`
        });
      }
    }

    // Check for duplicate Email
    if (email) {
      const existingEmail = await Student.findOne({ email: email.trim().toLowerCase() });
      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: `Email address '${email.toLowerCase()}' is already registered.`
        });
      }
    }

    const newStudent = new Student({
      studentId: studentId ? studentId.trim().toUpperCase() : undefined,
      name: name ? name.trim() : undefined,
      email: email ? email.trim().toLowerCase() : undefined,
      course: course ? course.trim() : undefined,
      semester: semester ? Number(semester) : undefined,
      mobile: mobile ? mobile.trim() : undefined
    });

    const savedStudent = await newStudent.save();
    res.status(201).json({
      success: true,
      message: 'Student record added successfully',
      data: savedStudent
    });
  } catch (error) {
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join('. '),
        errors: error.errors
      });
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'Field';
      return res.status(409).json({
        success: false,
        message: `${field} must be unique. Record already exists.`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create student record',
      error: error.message
    });
  }
});

// PUT /api/students/:id - Update student record
router.put('/:id', async (req, res) => {
  try {
    const student = await findStudentByIdOrCustomId(req.params.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: `Student not found with identifier '${req.params.id}'`
      });
    }

    const { studentId, name, email, course, semester, mobile } = req.body;

    // If changing studentId, verify uniqueness
    if (studentId && studentId.toUpperCase() !== student.studentId) {
      const conflict = await Student.findOne({
        studentId: studentId.trim().toUpperCase(),
        _id: { $ne: student._id }
      });
      if (conflict) {
        return res.status(409).json({
          success: false,
          message: `Student ID '${studentId.toUpperCase()}' is already assigned to another student.`
        });
      }
      student.studentId = studentId.trim().toUpperCase();
    }

    // If changing email, verify uniqueness
    if (email && email.toLowerCase() !== student.email) {
      const conflict = await Student.findOne({
        email: email.trim().toLowerCase(),
        _id: { $ne: student._id }
      });
      if (conflict) {
        return res.status(409).json({
          success: false,
          message: `Email '${email.toLowerCase()}' is already in use by another student.`
        });
      }
      student.email = email.trim().toLowerCase();
    }

    if (name) student.name = name.trim();
    if (course) student.course = course.trim();
    if (semester !== undefined) student.semester = Number(semester);
    if (mobile) student.mobile = mobile.trim();

    const updatedStudent = await student.save();

    res.json({
      success: true,
      message: 'Student record updated successfully',
      data: updatedStudent
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join('. '),
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update student record',
      error: error.message
    });
  }
});

// DELETE /api/students/:id - Delete student record
router.delete('/:id', async (req, res) => {
  try {
    const student = await findStudentByIdOrCustomId(req.params.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: `Student not found with identifier '${req.params.id}'`
      });
    }

    await Student.findByIdAndDelete(student._id);

    res.json({
      success: true,
      message: `Student '${student.name}' (${student.studentId}) deleted successfully.`,
      data: { id: student._id, studentId: student.studentId }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete student record',
      error: error.message
    });
  }
});

module.exports = router;

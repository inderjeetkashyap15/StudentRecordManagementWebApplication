/**
 * EduNexus - Student Record Management Application
 * AngularJS Student Controller
 */
app.controller('StudentController', ['$scope', '$http', '$timeout', 'ToastService', 'StudentDataService', function($scope, $http, $timeout, ToastService, StudentDataService) {
  // Data lists & loading states
  $scope.students = [];
  $scope.stats = {
    totalStudents: 0,
    totalCourses: 0,
    courseDistribution: [],
    semesterDistribution: []
  };
  $scope.isLoading = false;
  $scope.viewMode = 'table'; // 'table' or 'grid'

  // Search & Filter Models
  $scope.searchQuery = '';
  $scope.selectedCourse = 'All';
  $scope.selectedSemester = 'All';
  $scope.sortField = 'createdAt';
  $scope.sortReverse = true;

  // Available options
  $scope.coursesList = [
    'Computer Science & Engineering',
    'Data Science & AI',
    'Information Technology',
    'Electronics & Communication',
    'Electrical & Electronics',
    'Mechanical Engineering',
    'Business Analytics',
    'Biotechnology'
  ];

  $scope.semestersList = [1, 2, 3, 4, 5, 6, 7, 8];

  // Modals state
  $scope.modalState = {
    showForm: false,
    isEdit: false,
    showView: false,
    showDelete: false
  };

  // Form Model
  $scope.formData = {};
  $scope.currentViewStudent = null;
  $scope.studentToDelete = null;

  // Expose Toast Service
  $scope.toasts = ToastService.toasts;
  $scope.removeToast = ToastService.remove;

  // Fetch all students
  $scope.fetchStudents = function() {
    $scope.isLoading = true;
    const params = {
      search: $scope.searchQuery,
      course: $scope.selectedCourse,
      semester: $scope.selectedSemester
    };

    StudentDataService.getAll(params)
      .then(function(response) {
        if (response.data && response.data.success) {
          $scope.students = response.data.data;
        }
      })
      .catch(function(error) {
        console.error('Error fetching students:', error);
        ToastService.error('Failed to load student records.');
      })
      .finally(function() {
        $scope.isLoading = false;
      });
  };

  // Fetch dashboard statistics
  $scope.fetchStats = function() {
    StudentDataService.getStats()
      .then(function(response) {
        if (response.data && response.data.success) {
          $scope.stats = response.data.data;
        }
      })
      .catch(function(err) {
        console.warn('Could not load statistics:', err);
      });
  };

  // Instant multi-field client search & filter
  $scope.filterStudent = function(student) {
    if (!student) return false;

    // Filter by selected course dropdown
    if ($scope.selectedCourse && $scope.selectedCourse !== 'All') {
      if (student.course !== $scope.selectedCourse) return false;
    }

    // Filter by selected semester dropdown
    if ($scope.selectedSemester && $scope.selectedSemester !== 'All') {
      if (Number(student.semester) !== Number($scope.selectedSemester)) return false;
    }

    // Filter by search query
    if (!$scope.searchQuery || $scope.searchQuery.trim() === '') {
      return true;
    }

    const q = $scope.searchQuery.trim().toLowerCase();
    const id = (student.studentId || '').toLowerCase();
    const name = (student.name || '').toLowerCase();
    const email = (student.email || '').toLowerCase();
    const course = (student.course || '').toLowerCase();
    const mobile = (student.mobile || '');

    return id.includes(q) || name.includes(q) || email.includes(q) || course.includes(q) || mobile.includes(q);
  };

  // Live search handler
  $scope.onSearchChange = function() {
    // Client-side filtering applies instantly via filterStudent
  };

  // Clear live search
  $scope.clearSearch = function() {
    $scope.searchQuery = '';
  };

  // Reset all filters and list all students
  $scope.resetAndListAll = function() {
    $scope.searchQuery = '';
    $scope.selectedCourse = 'All';
    $scope.selectedSemester = 'All';
    $scope.fetchStudents();
    $scope.fetchStats();
    ToastService.info('Showing all student records');
  };

  // Open Add Student Modal
  $scope.openAddModal = function() {
    $scope.modalState.isEdit = false;
    $scope.formData = {
      studentId: '',
      name: '',
      email: '',
      course: $scope.coursesList[0],
      semester: 1,
      mobile: ''
    };
    if ($scope.studentForm) {
      $scope.studentForm.$setPristine();
      $scope.studentForm.$setUntouched();
    }
    $scope.modalState.showForm = true;
  };

  // Open Edit Student Modal
  $scope.openEditModal = function(student) {
    $scope.modalState.isEdit = true;
    $scope.formData = angular.copy(student);
    if ($scope.formData.semester) {
      $scope.formData.semester = Number($scope.formData.semester);
    }
    if ($scope.studentForm) {
      $scope.studentForm.$setPristine();
      $scope.studentForm.$setUntouched();
    }
    $scope.modalState.showForm = true;
  };

  // Close Form Modal
  $scope.closeFormModal = function() {
    $scope.modalState.showForm = false;
    $scope.formData = {};
  };

  // Submit Add or Edit Form
  $scope.saveStudent = function() {
    // Clean and trim inputs
    if ($scope.formData.name) $scope.formData.name = $scope.formData.name.trim();
    if ($scope.formData.studentId) $scope.formData.studentId = $scope.formData.studentId.trim().toUpperCase();
    if ($scope.formData.email) $scope.formData.email = $scope.formData.email.trim().toLowerCase();

    // Field-by-field validation with helpful feedback
    if (!$scope.formData.studentId) {
      ToastService.error('Please enter a Student ID.');
      return;
    }
    if (!$scope.formData.name) {
      ToastService.error('Please enter the Student Name.');
      return;
    }
    if (!$scope.formData.email) {
      ToastService.error('Please enter an Email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test($scope.formData.email)) {
      ToastService.error('Please enter a valid email address.');
      return;
    }
    if (!$scope.formData.course) {
      ToastService.error('Please select a Course.');
      return;
    }
    if (!$scope.formData.semester) {
      ToastService.error('Please select a Semester.');
      return;
    }
    if (!$scope.formData.mobile) {
      ToastService.error('Please enter a Mobile number.');
      return;
    }

    // Auto-clean mobile digits (supports +91, spaces, dashes)
    let cleanedMobile = String($scope.formData.mobile).replace(/\D/g, '');
    if (cleanedMobile.length > 10 && cleanedMobile.startsWith('91')) {
      cleanedMobile = cleanedMobile.slice(2);
    } else if (cleanedMobile.length > 10) {
      cleanedMobile = cleanedMobile.slice(-10);
    }

    if (cleanedMobile.length !== 10) {
      ToastService.error('Mobile number must be a 10-digit number (e.g. 9876543210).');
      return;
    }
    $scope.formData.mobile = cleanedMobile;

    if ($scope.modalState.isEdit) {
      // Update existing student
      const idToUpdate = $scope.formData._id || $scope.formData.studentId;
      StudentDataService.update(idToUpdate, $scope.formData)
        .then(function(res) {
          if (res.data && res.data.success) {
            ToastService.success(`Student '${$scope.formData.name}' updated successfully!`);
            $scope.closeFormModal();
            $scope.fetchStudents();
            $scope.fetchStats();
          }
        })
        .catch(function(err) {
          const msg = (err && err.data && err.data.message) ? err.data.message : 'Error updating student';
          ToastService.error(msg);
        });
    } else {
      // Create new student
      StudentDataService.create($scope.formData)
        .then(function(res) {
          if (res.data && res.data.success) {
            ToastService.success(`Student '${$scope.formData.name}' added successfully!`);
            $scope.closeFormModal();
            $scope.fetchStudents();
            $scope.fetchStats();
          }
        })
        .catch(function(err) {
          const msg = (err && err.data && err.data.message) ? err.data.message : 'Error adding student';
          ToastService.error(msg);
        });
    }
  };

  // Open View ID Card Modal
  $scope.openViewModal = function(student) {
    $scope.currentViewStudent = student;
    $scope.modalState.showView = true;
  };

  $scope.closeViewModal = function() {
    $scope.modalState.showView = false;
    $scope.currentViewStudent = null;
  };

  // Open Delete Confirmation Modal
  $scope.openDeleteModal = function(student) {
    $scope.studentToDelete = student;
    $scope.modalState.showDelete = true;
  };

  $scope.closeDeleteModal = function() {
    $scope.modalState.showDelete = false;
    $scope.studentToDelete = null;
  };

  // Confirm Delete Action
  $scope.confirmDelete = function() {
    if (!$scope.studentToDelete) return;
    const targetId = $scope.studentToDelete._id || $scope.studentToDelete.studentId;

    StudentDataService.delete(targetId, $scope.studentToDelete.studentId)
      .then(function(res) {
        if (res.data && res.data.success) {
          ToastService.success(res.data.message);
          $scope.closeDeleteModal();
          $scope.fetchStudents();
          $scope.fetchStats();
        }
      })
      .catch(function(err) {
        const msg = (err && err.data && err.data.message) ? err.data.message : 'Failed to delete student';
        ToastService.error(msg);
      });
  };

  // Seed Demo Records
  $scope.seedDemoData = function() {
    StudentDataService.seed()
      .then(function(res) {
        if (res.data && res.data.success) {
          ToastService.success(res.data.message);
          $scope.fetchStudents();
          $scope.fetchStats();
        }
      })
      .catch(function() {
        ToastService.error('Failed to load sample records.');
      });
  };

  // Sorting
  $scope.sortBy = function(field) {
    if ($scope.sortField === field) {
      $scope.sortReverse = !$scope.sortReverse;
    } else {
      $scope.sortField = field;
      $scope.sortReverse = false;
    }
  };

  // Copy ID to clipboard
  $scope.copyStudentId = function(studentId, $event) {
    if ($event) $event.stopPropagation();
    navigator.clipboard.writeText(studentId).then(function() {
      ToastService.info(`Copied ID '${studentId}' to clipboard`);
    }).catch(function() {
      ToastService.info(`Student ID: ${studentId}`);
    });
  };

  // Initialize
  $scope.fetchStudents();
  $scope.fetchStats();
}]);

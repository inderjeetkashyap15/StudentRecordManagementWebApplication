/**
 * EduNexus - Student Record Management Application
 * AngularJS Student Controller
 */
app.controller('StudentController', ['$scope', '$http', '$timeout', 'ToastService', function($scope, $http, $timeout, ToastService) {
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

  // Fetch all students from backend
  $scope.fetchStudents = function() {
    $scope.isLoading = true;
    let url = '/api/students?';
    const params = [];

    if ($scope.searchQuery && $scope.searchQuery.trim() !== '') {
      params.push('search=' + encodeURIComponent($scope.searchQuery.trim()));
    }
    if ($scope.selectedCourse && $scope.selectedCourse !== 'All') {
      params.push('course=' + encodeURIComponent($scope.selectedCourse));
    }
    if ($scope.selectedSemester && $scope.selectedSemester !== 'All') {
      params.push('semester=' + encodeURIComponent($scope.selectedSemester));
    }

    url += params.join('&');

    $http.get(url)
      .then(function(response) {
        if (response.data.success) {
          $scope.students = response.data.data;
        }
      })
      .catch(function(error) {
        console.error('Error fetching students:', error);
        ToastService.error('Failed to load student records from server.');
      })
      .finally(function() {
        $scope.isLoading = false;
      });
  };

  // Fetch dashboard statistics
  $scope.fetchStats = function() {
    $http.get('/api/students/stats')
      .then(function(response) {
        if (response.data.success) {
          $scope.stats = response.data.data;
        }
      })
      .catch(function(err) {
        console.warn('Could not load statistics:', err);
      });
  };

  // Live search debounced handler
  let searchTimeout = null;
  $scope.onSearchChange = function() {
    if (searchTimeout) {
      $timeout.cancel(searchTimeout);
    }
    searchTimeout = $timeout(function() {
      $scope.fetchStudents();
    }, 280);
  };

  // Clear live search
  $scope.clearSearch = function() {
    $scope.searchQuery = '';
    $scope.fetchStudents();
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
    if ($scope.studentForm.$invalid) {
      angular.forEach($scope.studentForm.$error, function(field) {
        angular.forEach(field, function(errorField) {
          errorField.$setTouched();
        });
      });
      ToastService.error('Please check required fields and fix validation errors.');
      return;
    }

    if ($scope.modalState.isEdit) {
      // Update existing student
      const idToUpdate = $scope.formData._id || $scope.formData.studentId;
      $http.put('/api/students/' + idToUpdate, $scope.formData)
        .then(function(res) {
          if (res.data.success) {
            ToastService.success(`Student '${res.data.data.name}' updated successfully!`);
            $scope.closeFormModal();
            $scope.fetchStudents();
            $scope.fetchStats();
          }
        })
        .catch(function(err) {
          const msg = (err.data && err.data.message) ? err.data.message : 'Error updating student';
          ToastService.error(msg);
        });
    } else {
      // Create new student
      $http.post('/api/students', $scope.formData)
        .then(function(res) {
          if (res.data.success) {
            ToastService.success(`Student '${res.data.data.name}' added successfully!`);
            $scope.closeFormModal();
            $scope.fetchStudents();
            $scope.fetchStats();
          }
        })
        .catch(function(err) {
          const msg = (err.data && err.data.message) ? err.data.message : 'Error adding student';
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

    $http.delete('/api/students/' + targetId)
      .then(function(res) {
        if (res.data.success) {
          ToastService.success(res.data.message);
          $scope.closeDeleteModal();
          $scope.fetchStudents();
          $scope.fetchStats();
        }
      })
      .catch(function(err) {
        const msg = (err.data && err.data.message) ? err.data.message : 'Failed to delete student';
        ToastService.error(msg);
      });
  };

  // Seed Demo Records
  $scope.seedDemoData = function() {
    $http.post('/api/students/seed')
      .then(function(res) {
        if (res.data.success) {
          ToastService.success(res.data.message);
          $scope.fetchStudents();
          $scope.fetchStats();
        }
      })
      .catch(function(err) {
        ToastService.error('Failed to seed demo data.');
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

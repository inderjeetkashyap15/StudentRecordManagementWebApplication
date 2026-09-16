/**
 * EduNexus - Student Record Management Application
 * AngularJS 1.8.x Main Module & Services
 */
const app = angular.module('studentApp', []);

// Global Toast Notification Service
app.factory('ToastService', ['$timeout', function($timeout) {
  const service = {
    toasts: []
  };

  service.show = function(message, type = 'info', duration = 3500) {
    const id = Date.now() + Math.random();
    const toast = { id, message, type };
    service.toasts.push(toast);

    $timeout(() => {
      service.remove(id);
    }, duration);
  };

  service.success = function(message) {
    service.show(message, 'success');
  };

  service.error = function(message) {
    service.show(message, 'error', 4500);
  };

  service.info = function(message) {
    service.show(message, 'info');
  };

  service.remove = function(id) {
    const index = service.toasts.findIndex(t => t.id === id);
    if (index !== -1) {
      service.toasts.splice(index, 1);
    }
  };

  return service;
}]);

// Filter to format 10-digit mobile number nicely
app.filter('formatMobile', function() {
  return function(input) {
    if (!input) return '';
    const cleaned = ('' + input).replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    return input;
  };
});

// Filter to generate consistent gradient for student initials
app.filter('avatarGradient', function() {
  const gradients = [
    'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
    'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
    'linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%)',
    'linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)'
  ];

  return function(name) {
    if (!name) return gradients[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  };
});

// Filter to extract 2-letter initials from name
app.filter('initials', function() {
  return function(name) {
    if (!name) return 'ST';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };
});

// Universal Data Service: Handles Node.js/Express backend locally AND LocalStorage on GitHub Pages
app.factory('StudentDataService', ['$http', '$q', function($http, $q) {
  const isStatic = window.location.hostname.endsWith('github.io') || window.location.protocol === 'file:';
  const STORAGE_KEY = 'edunexus_students_v1';

  const DEFAULT_STUDENTS = [
    {
      studentId: 'STU-1001',
      name: 'Aarav Sharma',
      email: 'aarav.sharma@example.com',
      course: 'Computer Science & Engineering',
      semester: 6,
      mobile: '9876543210',
      createdAt: '2026-09-16T06:00:00.000Z'
    },
    {
      studentId: 'STU-1002',
      name: 'Priya Patel',
      email: 'priya.patel@example.com',
      course: 'Data Science & AI',
      semester: 4,
      mobile: '9812345678',
      createdAt: '2026-09-16T06:00:00.000Z'
    },
    {
      studentId: 'STU-1003',
      name: 'Rohan Mehta',
      email: 'rohan.mehta@example.com',
      course: 'Information Technology',
      semester: 2,
      mobile: '9765432109',
      createdAt: '2026-09-16T06:00:00.000Z'
    },
    {
      studentId: 'STU-1004',
      name: 'Ananya Iyer',
      email: 'ananya.iyer@example.com',
      course: 'Electronics & Communication',
      semester: 8,
      mobile: '9988776655',
      createdAt: '2026-09-16T06:00:00.000Z'
    },
    {
      studentId: 'STU-1005',
      name: 'Vikram Sengupta',
      email: 'vikram.s@example.com',
      course: 'Computer Science & Engineering',
      semester: 4,
      mobile: '9845123456',
      createdAt: '2026-09-16T06:00:00.000Z'
    }
  ];

  function getLocalList() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch(e) {}
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_STUDENTS));
    return angular.copy(DEFAULT_STUDENTS);
  }

  function saveLocalList(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  return {
    isStatic: isStatic,

    getAll: function(params) {
      if (isStatic) {
        let list = getLocalList();
        if (params) {
          if (params.course && params.course !== 'All') {
            list = list.filter(s => s.course === params.course);
          }
          if (params.semester && params.semester !== 'All') {
            list = list.filter(s => Number(s.semester) === Number(params.semester));
          }
          if (params.search && params.search.trim()) {
            const q = params.search.trim().toLowerCase();
            list = list.filter(s => 
              (s.name && s.name.toLowerCase().includes(q)) ||
              (s.studentId && s.studentId.toLowerCase().includes(q)) ||
              (s.email && s.email.toLowerCase().includes(q)) ||
              (s.course && s.course.toLowerCase().includes(q)) ||
              (s.mobile && s.mobile.includes(q))
            );
          }
        }
        return $q.resolve({ data: { success: true, count: list.length, data: list } });
      }

      let query = '';
      if (params) {
        const parts = [];
        if (params.search) parts.push('search=' + encodeURIComponent(params.search));
        if (params.course && params.course !== 'All') parts.push('course=' + encodeURIComponent(params.course));
        if (params.semester && params.semester !== 'All') parts.push('semester=' + encodeURIComponent(params.semester));
        if (parts.length) query = '?' + parts.join('&');
      }
      return $http.get('/api/students' + query).catch(function() {
        let list = getLocalList();
        return { data: { success: true, count: list.length, data: list } };
      });
    },

    getStats: function() {
      if (isStatic) {
        const list = getLocalList();
        const courseMap = {};
        const semMap = {};
        list.forEach(s => {
          courseMap[s.course] = (courseMap[s.course] || 0) + 1;
          semMap[s.semester] = (semMap[s.semester] || 0) + 1;
        });
        const courseDistribution = Object.keys(courseMap).map(k => ({ _id: k, count: courseMap[k] }));
        const semesterDistribution = Object.keys(semMap).map(k => ({ _id: Number(k), count: semMap[k] }));
        return $q.resolve({
          data: {
            success: true,
            data: {
              totalStudents: list.length,
              totalCourses: courseDistribution.length,
              courseDistribution: courseDistribution,
              semesterDistribution: semesterDistribution
            }
          }
        });
      }
      return $http.get('/api/students/stats').catch(function() {
        const list = getLocalList();
        return {
          data: {
            success: true,
            data: { totalStudents: list.length, totalCourses: 4 }
          }
        };
      });
    },

    create: function(studentData) {
      if (isStatic) {
        const list = getLocalList();
        const dupId = list.find(s => s.studentId.toUpperCase() === studentData.studentId.toUpperCase());
        if (dupId) {
          return $q.reject({ data: { message: `Student ID '${studentData.studentId.toUpperCase()}' is already in use.` } });
        }
        const dupEmail = list.find(s => s.email.toLowerCase() === studentData.email.toLowerCase());
        if (dupEmail) {
          return $q.reject({ data: { message: `Email address '${studentData.email.toLowerCase()}' is already registered.` } });
        }
        const newRecord = angular.copy(studentData);
        newRecord._id = 'local_' + Date.now();
        newRecord.createdAt = new Date().toISOString();
        list.unshift(newRecord);
        saveLocalList(list);
        return $q.resolve({ data: { success: true, message: 'Student record added successfully', data: newRecord } });
      }
      return $http.post('/api/students', studentData);
    },

    update: function(id, studentData) {
      if (isStatic) {
        const list = getLocalList();
        const idx = list.findIndex(s => s._id === id || s.studentId.toUpperCase() === (studentData.studentId || '').toUpperCase());
        if (idx === -1) {
          return $q.reject({ data: { message: 'Student record not found.' } });
        }
        if (studentData.studentId && studentData.studentId.toUpperCase() !== list[idx].studentId.toUpperCase()) {
          const conflict = list.find((s, i) => i !== idx && s.studentId.toUpperCase() === studentData.studentId.toUpperCase());
          if (conflict) {
            return $q.reject({ data: { message: `Student ID '${studentData.studentId.toUpperCase()}' is already in use.` } });
          }
        }
        if (studentData.email && studentData.email.toLowerCase() !== list[idx].email.toLowerCase()) {
          const conflict = list.find((s, i) => i !== idx && s.email.toLowerCase() === studentData.email.toLowerCase());
          if (conflict) {
            return $q.reject({ data: { message: `Email '${studentData.email.toLowerCase()}' is already in use.` } });
          }
        }
        list[idx] = angular.extend({}, list[idx], studentData);
        saveLocalList(list);
        return $q.resolve({ data: { success: true, message: 'Student record updated successfully', data: list[idx] } });
      }
      return $http.put('/api/students/' + id, studentData);
    },

    delete: function(id, studentId) {
      if (isStatic) {
        let list = getLocalList();
        const target = list.find(s => s._id === id || s.studentId === studentId);
        const name = target ? target.name : 'Student';
        list = list.filter(s => s._id !== id && s.studentId !== studentId);
        saveLocalList(list);
        return $q.resolve({ data: { success: true, message: `Student '${name}' deleted successfully.` } });
      }
      return $http.delete('/api/students/' + id);
    },

    seed: function() {
      if (isStatic) {
        saveLocalList(DEFAULT_STUDENTS);
        return $q.resolve({ data: { success: true, message: 'Sample records loaded successfully!', count: DEFAULT_STUDENTS.length, data: DEFAULT_STUDENTS } });
      }
      return $http.post('/api/students/seed');
    }
  };
}]);

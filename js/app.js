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

import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStatusColor(status) {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    issued: 'bg-blue-100 text-blue-800',
    dispensed: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    sent_to_pharmacy: 'bg-purple-100 text-purple-800',
    preparing: 'bg-yellow-100 text-yellow-800',
    ready: 'bg-green-100 text-green-800',
    delivered: 'bg-gray-100 text-gray-800',
    paid: 'bg-green-100 text-green-800',
    unpaid: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getSeverityColor(severity) {
  const colors = {
    low: 'bg-green-100 text-green-800',
    moderate: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  };
  return colors[severity] || 'bg-gray-100 text-gray-800';
}

export function getUrgencyColor(urgency) {
  const colors = {
    routine: 'bg-green-100 text-green-800',
    soon: 'bg-yellow-100 text-yellow-800',
    urgent: 'bg-orange-100 text-orange-800',
    emergency: 'bg-red-100 text-red-800',
  };
  return colors[urgency] || 'bg-gray-100 text-gray-800';
}

export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
}

function defaultReminderTimes(timesPerDay) {
  const defaults = {
    1: ['08:00'],
    2: ['08:00', '20:00'],
    3: ['06:00', '14:00', '22:00'],
    4: ['06:00', '12:00', '18:00', '22:00'],
  };

  if (defaults[timesPerDay]) return defaults[timesPerDay];

  const safeTimes = Math.max(1, timesPerDay || 1);
  const step = Math.max(1, Math.round(24 / safeTimes));
  return Array.from({ length: safeTimes }, (_, idx) => {
    const hour = (6 + idx * step) % 24;
    return `${hour.toString().padStart(2, '0')}:00`;
  });
}

export function parseDurationDays(durationText) {
  if (durationText === null || durationText === undefined) return 1;
  const match = String(durationText).match(/\d+/);
  if (!match) return 1;
  const parsed = Number.parseInt(match[0], 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function deriveMedicationPlan({ frequencyText = '', durationText = '', reminderTimes = [] } = {}) {
  const frequency = String(frequencyText || '').toLowerCase();

  let timesPerDay = 1;

  const everyHoursMatch = frequency.match(/every\s*(\d+)\s*hour/);
  if (everyHoursMatch) {
    const everyHours = Number.parseInt(everyHoursMatch[1], 10);
    if (everyHours > 0) {
      timesPerDay = Math.max(1, Math.round(24 / everyHours));
    }
  } else {
    const explicitTimesMatch = frequency.match(/(\d+)\s*(x|times?)\s*(daily|per\s*day)/);
    if (explicitTimesMatch) {
      const explicitTimes = Number.parseInt(explicitTimesMatch[1], 10);
      if (explicitTimes > 0) timesPerDay = explicitTimes;
    } else if (frequency.includes('twice') || frequency.includes('bd')) {
      timesPerDay = 2;
    } else if (frequency.includes('thrice') || frequency.includes('tds')) {
      timesPerDay = 3;
    } else if (frequency.includes('four') || frequency.includes('qid')) {
      timesPerDay = 4;
    } else if (frequency.includes('once') || frequency.includes('od')) {
      timesPerDay = 1;
    }
  }

  const cleanReminderTimes = (Array.isArray(reminderTimes) ? reminderTimes : [])
    .map((time) => String(time || '').trim())
    .filter((time) => /^([01]?\d|2[0-3]):[0-5]\d$/.test(time));

  const normalizedReminderTimes = cleanReminderTimes.length > 0
    ? cleanReminderTimes.slice(0, Math.max(timesPerDay, cleanReminderTimes.length))
    : defaultReminderTimes(timesPerDay);

  const durationDays = parseDurationDays(durationText);
  const adjustedTimesPerDay = Math.max(timesPerDay, normalizedReminderTimes.length);
  const totalDoses = adjustedTimesPerDay * durationDays;

  return {
    timesPerDay: adjustedTimesPerDay,
    durationDays,
    reminderTimes: normalizedReminderTimes,
    totalDoses,
  };
}

export function handleApiError(error) {
  if (error.response) {
    // Handle FastAPI validation errors (422)
    if (error.response.status === 422 && error.response.data?.detail) {
      const detail = error.response.data.detail;
      // If detail is an array of validation errors, format them
      if (Array.isArray(detail)) {
        const messages = detail.map(err => {
          const field = err.loc?.join('.') || 'field';
          return `${field}: ${err.msg}`;
        });
        return messages.join(', ');
      }
      // If detail is a string, return it
      if (typeof detail === 'string') {
        return detail;
      }
    }
    // Handle other error responses
    return error.response.data?.detail || error.response.data?.message || 'An error occurred';
  } else if (error.request) {
    return 'No response from server. Please check your connection.';
  } else {
    return error.message || 'An unexpected error occurred';
  }
}

module.exports = {
  cancelAllScheduledNotificationsAsync: jest.fn().mockResolvedValue(undefined),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('mock-id'),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  SchedulableTriggerInputTypes: { WEEKLY: 'weekly' },
}

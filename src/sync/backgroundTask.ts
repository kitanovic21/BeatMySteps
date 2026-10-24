import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import { syncSteps } from './syncSteps';

const TASK_NAME = 'bms-sync-steps';

// Must be defined at module scope so the OS can run it without the UI.
if (Platform.OS !== 'web') {
  TaskManager.defineTask(TASK_NAME, async () => {
    try {
      await syncSteps();
      return BackgroundTask.BackgroundTaskResult.Success;
    } catch {
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}

export async function registerBackgroundSync() {
  if (Platform.OS === 'web') return;
  const status = await BackgroundTask.getStatusAsync();
  if (status !== BackgroundTask.BackgroundTaskStatus.Available) return;
  if (await TaskManager.isTaskRegisteredAsync(TASK_NAME)) return;
  // Minutes; the OS decides the actual schedule.
  await BackgroundTask.registerTaskAsync(TASK_NAME, { minimumInterval: 30 });
}

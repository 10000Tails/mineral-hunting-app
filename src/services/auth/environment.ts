import Constants, { ExecutionEnvironment } from 'expo-constants';

/**
 * Expo Go can't run Google Sign-In (it needs custom native code), and Apple only issues
 * tokens for this app's own bundle ID, so sign-in only works in a real build (TestFlight / EAS).
 */
export const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

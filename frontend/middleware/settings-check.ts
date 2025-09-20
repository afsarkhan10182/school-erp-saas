import { useSettingsChecker } from '~/utils/settings';

interface SettingsCheckOptions {
  setting: string;
  redirectPath: string;
  errorMessage: string;
  errorCode: string;
}

export default defineNuxtRouteMiddleware(async (to, from) => {
  // Only run on client side
  if (import.meta.server) {
    return;
  }

  // Get the settings check configuration from route meta
  const settingsCheck = to.meta?.settingsCheck as SettingsCheckOptions;

  if (!settingsCheck) {
    return; // No settings check required for this route
  }

  console.log(`🔍 Settings middleware checking: ${settingsCheck.setting} for route:`, to.path);

  try {
    const { isFeatureEnabled } = useSettingsChecker();

    // Check the specific setting using the generic checker
    const isEnabled = await isFeatureEnabled(settingsCheck.setting);

    console.log(`🔍 ${settingsCheck.setting} enabled result:`, isEnabled);

    if (!isEnabled) {
      console.log(
        `🚫 ${settingsCheck.setting} is disabled, redirecting to ${settingsCheck.redirectPath}`
      );

      return navigateTo({
        path: settingsCheck.redirectPath,
        query: {
          error: settingsCheck.errorCode,
          message: settingsCheck.errorMessage
        }
      });
    }

    console.log(`✅ ${settingsCheck.setting} is enabled, allowing access`);
  } catch (error) {
    console.error(`❌ Error checking ${settingsCheck.setting} setting:`, error);

    return navigateTo({
      path: settingsCheck.redirectPath,
      query: {
        error: `${settingsCheck.setting}_check_failed`,
        message: `Unable to verify ${settingsCheck.setting} setting. Please try again.`
      }
    });
  }
});

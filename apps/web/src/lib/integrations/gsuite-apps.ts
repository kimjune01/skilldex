/**
 * G Suite app download links and device detection utilities
 */

type DeviceType = 'ios' | 'android' | 'desktop';

/**
 * Detect device type for app download links
 */
function getDeviceType(): DeviceType {
  const userAgent = navigator.userAgent || navigator.vendor || (window as unknown as { opera?: string }).opera || '';

  // Check for iOS devices
  if (/iPad|iPhone|iPod/.test(userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream) {
    return 'ios';
  }

  // Check for Android devices
  if (/android/i.test(userAgent)) {
    return 'android';
  }

  return 'desktop';
}

/**
 * G Suite app download URLs
 */
const GSUITE_APP_LINKS: Record<string, { ios: string; android: string; desktop: string; name: string }> = {
  'google-drive': {
    ios: 'https://apps.apple.com/app/google-drive/id507874739',
    android: 'https://play.google.com/store/apps/details?id=com.google.android.apps.docs',
    desktop: 'https://www.google.com/drive/download/',
    name: 'Google Drive',
  },
  'google-docs': {
    ios: 'https://apps.apple.com/app/google-docs/id842842640',
    android: 'https://play.google.com/store/apps/details?id=com.google.android.apps.docs.editors.docs',
    desktop: 'https://docs.google.com',
    name: 'Google Docs',
  },
  'google-sheets': {
    ios: 'https://apps.apple.com/app/google-sheets/id842849113',
    android: 'https://play.google.com/store/apps/details?id=com.google.android.apps.docs.editors.sheets',
    desktop: 'https://sheets.google.com',
    name: 'Google Sheets',
  },
  'google-forms': {
    ios: 'https://apps.apple.com/app/google-forms/id1474429498',
    android: 'https://play.google.com/store/apps/details?id=com.google.android.apps.docs.editors.forms',
    desktop: 'https://forms.google.com',
    name: 'Google Forms',
  },
  'google-contacts': {
    ios: 'https://apps.apple.com/app/contacts/id1069512615',
    android: 'https://play.google.com/store/apps/details?id=com.google.android.contacts',
    desktop: 'https://contacts.google.com',
    name: 'Google Contacts',
  },
  'google-tasks': {
    ios: 'https://apps.apple.com/app/google-tasks/id1353634006',
    android: 'https://play.google.com/store/apps/details?id=com.google.android.apps.tasks',
    desktop: 'https://tasks.google.com',
    name: 'Google Tasks',
  },
  'gmail': {
    ios: 'https://apps.apple.com/app/gmail-email-by-google/id422689480',
    android: 'https://play.google.com/store/apps/details?id=com.google.android.gm',
    desktop: 'https://mail.google.com',
    name: 'Gmail',
  },
  'email': {
    ios: 'https://apps.apple.com/app/gmail-email-by-google/id422689480',
    android: 'https://play.google.com/store/apps/details?id=com.google.android.gm',
    desktop: 'https://mail.google.com',
    name: 'Gmail',
  },
  'google-calendar': {
    ios: 'https://apps.apple.com/app/google-calendar/id909319292',
    android: 'https://play.google.com/store/apps/details?id=com.google.android.calendar',
    desktop: 'https://calendar.google.com',
    name: 'Google Calendar',
  },
  'calendar': {
    ios: 'https://apps.apple.com/app/google-calendar/id909319292',
    android: 'https://play.google.com/store/apps/details?id=com.google.android.calendar',
    desktop: 'https://calendar.google.com',
    name: 'Google Calendar',
  },
};

export type AppDownloadInfo = {
  url: string;
  label: string;
  isMobile: boolean;
};

/**
 * Get the appropriate download link for a G Suite app based on device type
 */
export function getAppDownloadLink(toolId: string): AppDownloadInfo | null {
  const appInfo = GSUITE_APP_LINKS[toolId];
  if (!appInfo) return null;

  const deviceType = getDeviceType();
  const isMobile = deviceType === 'ios' || deviceType === 'android';

  return {
    url: appInfo[deviceType],
    label: isMobile ? 'Get the app' : 'Open in browser',
    isMobile,
  };
}

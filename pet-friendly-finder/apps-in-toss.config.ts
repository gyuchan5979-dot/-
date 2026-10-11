import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  // 앱인토스 콘솔에 등록한 앱 이름과 같아야 해요.
  appName: 'pet-friendly-finder',
  brand: {
    primaryColor: '#3182F6',
  },
  permissions: [{ name: 'geolocation', access: 'access' }],
  navigationBar: {
    withBackButton: true,
    withHomeButton: true,
    withTitle: true,
  },
  webBundleDir: 'dist',
});

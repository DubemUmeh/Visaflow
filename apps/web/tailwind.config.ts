import type { Config } from 'tailwindcss';
import baseConfig from '@visaflow/config/tailwind.config';

const config: Config = {
  ...baseConfig,
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
    '../../packages/config/src/**/*.{js,ts}',
  ],
};

export default config;

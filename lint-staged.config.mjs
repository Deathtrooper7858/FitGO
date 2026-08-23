export default {
  '*.{ts,tsx}': (files) =>
    files.map((file) => `eslint --fix --max-warnings 100 ${JSON.stringify(file)}`),
};

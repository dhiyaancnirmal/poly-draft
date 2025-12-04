module.exports = {
  plugins: {
    'postcss-import': {
      resolve(id, basedir) {
        // Handle node_modules imports
        if (id.startsWith('@') || !id.startsWith('.')) {
          return require.resolve(id);
        }
        return null;
      }
    },
    tailwindcss: {},
    autoprefixer: {},
  },
}

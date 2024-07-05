import { rollupPluginTevm } from "tevm/bundler/rollup-plugin";
import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/index.ts',
  output: {
    dir: 'dist',
    format: 'es'
  },
  plugins: [
    rollupPluginTevm(),
    typescript(),
  ]
};
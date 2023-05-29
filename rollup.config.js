'use strict';

import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
    input: 'src/wrapper.js',
    output: {
        file: 'dist/frost-ui-slider.js',
        format: 'umd',
        globals: {
            '@fr0st/query': 'fQuery',
            '@fr0st/ui': 'UI',
        },
        name: 'UI',
        sourcemap: true,
        extend: true,
    },
    external: [
        '@fr0st/query',
        '@fr0st/ui',
    ],
    plugins: [nodeResolve()],
};

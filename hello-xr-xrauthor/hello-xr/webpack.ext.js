const CopyPlugin = require("copy-webpack-plugin");
const path = require("path");

module.exports = 
{
    entry: path.resolve(__dirname, 'src/index-ext.ts'),
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'dist/ext')
    },
    resolve: {
        extensions: ['.ts']
    },
    module: {
        rules: [
            { test: /\.tsx?$/, loader: "ts-loader" }
        ]
    },
    mode: 'production',
    plugins: [
        new CopyPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, 'public'),
                    globOptions:{
                        ignore: ['**/test/**']
                    }
                }
            ]
        })
    ]

}
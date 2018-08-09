const path = require('path');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const htmlWebpackPlugin = new HtmlWebpackPlugin({
    template: path.join(__dirname, "examples/src/index.html"),
    filename: "./index.html",
    hash: true,
    chunks: ['index'],
    title: 'React Strap Table',
    myPageHeader: 'Simple Example',
});
const htmlWebpackPlugin2 = new HtmlWebpackPlugin({
    template: path.join(__dirname, "examples/src/advance.html"),
    filename: "./advance.html",
    hash: true,
    chunks: ['advance'],
    title: 'React Strap Table',
    myPageHeader: 'Advance Example',
});
module.exports = {
    entry: {
        index: path.join(__dirname, "examples/src/index.js"),
        advance: path.join(__dirname, "examples/src/advance.js")
    },
    output: {
        path: path.join(__dirname, "examples/dist"),
        filename: "[name].bundle.js"
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                use: "babel-loader",
                exclude: /node_modules/
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"]
            }
        ]
    },
    plugins: [htmlWebpackPlugin, htmlWebpackPlugin2],
    resolve: {
        extensions: [".js", ".jsx"]
    },
    devServer: {
        port: 3001
    }
};
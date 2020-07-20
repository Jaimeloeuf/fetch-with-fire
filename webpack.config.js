/**
 * Webpack configuration file for compiling relayer server into a single output file
 * @author JJ
 *
 * This config file is built with references to:
 * @link https://medium.com/code-oil/webpack-javascript-bundling-for-both-front-end-and-back-end-b95f1b429810
 * @link https://www.codementor.io/@lawwantsin/compiling-our-express-server-with-webpack-lds4xof0y
 */

const path = require("path");

module.exports = {
  mode: "production",
  target: "web",
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "./dist"),
    filename: "index.js",
    library: "fetch-with-fire",
    libraryTarget: "commonjs2",
  },
};

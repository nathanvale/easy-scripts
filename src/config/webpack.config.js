const path = require("path");
const webpack = require("webpack");
const CopyPlugin = require("copy-webpack-plugin");
const HtmlPlugin = require("html-webpack-plugin");
// eslint-disable-next-line
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer")
  .BundleAnalyzerPlugin;

const here = (p) => path.join(__dirname, p);
const { fromRoot, hasFile } = require("../utils");
const { packageManager } = require("../jsonate/");

const { hasProp: hasPkgProp } = packageManager();
const useBuiltinConfig =
  !hasFile(".babelrc") &&
  !hasFile(".babelrc.js") &&
  !hasFile("babel.config.js") &&
  !hasPkgProp("babel");
const babelPresets = useBuiltinConfig ? [here("../config/babelrc.js")] : [];
const getBasePath = () => {
  const index = process.argv.indexOf("--basepath");
  let value = null;
  // eslint-disable-next-line no-bitwise
  if (~index) {
    value = process.argv[index + 1];
  }
  return value || "";
};

const __SHORT_NAME__ = process.env.SHORT_NAME;
const __APP_NAME__ = process.env.APP_NAME;
const __BUILD_PATH__ = fromRoot("./dist");
const __BASEPATH__ = getBasePath();
const __TAL__ = process.env.TAL === "true";
const __LOCAL__ = !process.env.NODE_ENV || process.env.NODE_ENV === "local";
const __PROD__ = process.env.NODE_ENV === "production";
const __STUB_HOST__ = process.env.STUB_HOST || "localhost";
const __ANALYZE__ =
  process.argv.includes("--analyze") || process.argv.includes("-a");
const APP = "app";
const MONITORING = "monitoring";
module.exports = () => {
  let entry = {
    [APP]: [
      __TAL__
        ? fromRoot("./src/ts/index.tal.tsx")
        : fromRoot("./src/ts/index.tsx"),
    ],
  };

  if (__PROD__)
    entry = {
      ...entry,
      [MONITORING]: [fromRoot("./src/js/monitoring.js")],
    };

  return {
    mode: __PROD__ ? "production" : "development",
    externals: __TAL__
      ? {
          "styled-components": "styled",
          react: "React",
          "react-dom": "ReactDOM",
        }
      : {},
    entry,
    output: {
      path: __BUILD_PATH__,
      filename: __TAL__
        ? "assets/[name].tal.[hash].js"
        : "assets/[name].[hash].js",
      publicPath: __LOCAL__ ? "/" : `${__BASEPATH__}/`,
    },
    devtool: __LOCAL__ ? "eval-source-map" : false,
    devServer: {
      port: 8080,
      open: true,
      contentBase: __BUILD_PATH__,
      disableHostCheck: true,
      historyApiFallback: true,
      proxy: {
        changeOrigin: true,
        "/api": `http://${__STUB_HOST__}:3001`,
      },
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
      modules: [
        "src",
        "node_modules",
        fromRoot("node_modules/easy-scripts/node_modules"),
      ],
    },
    resolveLoader: {
      modules: [
        "node_modules",
        fromRoot("node_modules/easy-scripts/node_modules"),
      ],
    },
    module: {
      rules: [
        {
          // eslint-disable-next-line prefer-named-capture-group
          test: /\.(js|ts|tsx)$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              exclude: "/**/node_modules/**",
              presets: babelPresets,
              babelrc: !useBuiltinConfig,
            },
          },
        },
        {
          test: /\.svg$/,
          loader: "file-loader?name=assets/images/[name].svg",
          exclude: /src\/html\/assets\/fonts/,
        },
        {
          test: /\.jpg$/,
          loader: "file-loader?name=assets/images/[name].jpg",
        },
        {
          // eslint-disable-next-line prefer-named-capture-group
          test: /\.(ttf|otf|eot|svg|woff|woff2)$/,
          loader: "file-loader?name=assets/fonts/[name].[ext]",
          include: /src\/html\/assets\/fonts/,
        },
        {
          test: /\.css$/,
          use: [{ loader: "style-loader" }, { loader: "css-loader" }],
        },
      ],
    },
    plugins: (() => {
      const plugins = [
        new webpack.DefinePlugin({
          __BASEPATH__: JSON.stringify(__BASEPATH__),
          __APP_NAME__: JSON.stringify(__APP_NAME__),
          __LOCAL__,
        }),
        new HtmlPlugin({
          template: "./src/html/index.html",
          favicon: "./src/html/assets/images/favicon.ico",
          xhtml: true,
          chunksSortMode: "manual",
          chunks: [MONITORING, APP],
          templateParameters: {
            analytics: !__LOCAL__,
            appName: __APP_NAME__,
          },
        }),
      ];
      if (__ANALYZE__) {
        plugins.push(new BundleAnalyzerPlugin());
      }
      if (__PROD__) {
        plugins.push(new CopyPlugin(["config/*"]));

        if (__TAL__) {
          plugins.push(
            new HtmlPlugin({
              name: "metadata",
              namespace: __SHORT_NAME__,
              template: "tal.metadata-template.js",
              filename: path.resolve(
                __dirname,
                `dist/${__APP_NAME__}.metadata.json`
              ),
              inject: false,
            })
          );
        }
      }
      return plugins;
    })(),
  };
};

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

require("ts-node").register({
    transpileOnly: true,
    compilerOptions: {
        module: "commonjs",
    },
});

module.exports = require("./rules").default;
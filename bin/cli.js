#!/usr/bin/env node

"use strict";

const { getFileString } = require("../lib/bootstrap.js");

process.title = "hxindoc";

getFileString(process.argv);

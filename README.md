# Rivine Reference User Interface

[![Build Status](https://travis-ci.org/rivine/rivine-UI.svg?branch=master)](https://travis-ci.org/rivine/rivine-UI)
[![license:mit](https://img.shields.io/badge/license-mit-blue.svg)](https://opensource.org/licenses/MIT)

This is the a reference user interface application for [Rivine](https://github.com/rivine/rivine), it
is a desktop application based off the
[electron](https://github.com/atom/electron) framework. The ambition behind
this project is to provide an example User Interface for projects using the Rivine technology.

## Prerequisites

- [rivined](https://github.com/rivine/rivine)
- [node & npm 6.9.0 LTS](https://nodejs.org/download/)
Earlier node versions may work, but they do not have guaranteed support.
- `libxss` is a required dependency for Electron on Debian, it can be installed with `sudo apt-get install libxss1`.

## Run from source

0. Install dependencies mentioned above
1. Download or `git clone` the repository
2. npm install
3. npm start

## [Contributing](doc/Developers.md)

Read the document linked above to start getting knowledgable about the
application and its technologies.

Take a look at our [issues page](https://github.com/rivine/rivine-UI/issues)
for a high level view of what objectives we're working on.

Or if you're the type to jump right into code, just search through the project
(sans the `node_modules` folder) for the term `TODO:`. If you're on a UNIX
(Linux & OSX) system, run `grep -r 'TODO:' js plugins` in a terminal at the
root level of the project

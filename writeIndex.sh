#!/bin/bash
pandoc -f markdown -t html API.md > public/index.html

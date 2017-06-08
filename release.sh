#!/bin/bash

# error output terminates this script
set -e

# This script creates a Rivine-UI release for all 3 platforms: osx (darwin),
# linux, and windows. It takes 5 arguments, the first two arguments are the
# private and public key used to sign the release archives. The last three
# arguments are semver strings, the first of which being the ui version, second
# being the Rivine version, and third being the electron version.

#if [[ -z $1 || -z $2 ]]; then
#	echo "Usage: $0 privatekey publickey uiversion siaversion electronversion"
#	exit 1
#fi

# ensure we have a clean node_modules
rm -rf ./node_modules
npm install

# build the UI's js
rm -rf ./dist
npm run build-production

uiVersion=${3:-v0.1.0}
rivineVersion=${4:-v0.1.0}
electronVersion=${5:-v1.6.4}

# fourth argument is the public key file path.
#keyFile=`readlink -f $1`
#pubkeyFile=`readlink -f $2`


electronOSX="https://github.com/electron/electron/releases/download/${electronVersion}/electron-${electronVersion}-darwin-x64.zip"
electronLinux="https://github.com/electron/electron/releases/download/${electronVersion}/electron-${electronVersion}-linux-x64.zip"
electronWindows="https://github.com/electron/electron/releases/download/${electronVersion}/electron-${electronVersion}-win32-x64.zip"

rivineOSX="https://github.com/rivine/rivine/releases/download/${rivineVersion}/rivine-${rivineVersion}-darwin-amd64.zip"
rivineLinux="https://github.com/rivine/rivine/releases/download/${rivineVersion}/rivine-${rivineVersion}-linux-amd64.tar.gz"
rivineWindows="https://github.com/rivine/rivine/releases/download/${rivineVersion}/rivine-${rivineVersion}-windows-amd64.zip"

rm -rf release/
mkdir -p release/{osx,linux,win32}

# package copies all the required javascript, html, and assets into an electron package.
package() {
	src=$1
	dest=$2
	cp -r ${src}/{plugins,assets,css,dist,index.html,package.json,js} $dest
}

buildOSX() {
	cd release/osx
	wget $electronOSX
	unzip ./electron*
	mv Electron.app Rivine-UI.app
	mv Rivine-UI.app/Contents/MacOS/Electron Rivine-UI.app/Contents/MacOS/Rivine-UI
	# NOTE: this only works with GNU sed, other platforms (like OSX) may fail here
	gsed -i 's/>Electron</>Rivine-UI</' Rivine-UI.app/Contents/Info.plist
	gsed -i 's/>'"${electronVersion:1}"'</>'"${rivineVersion:1}"'</' Rivine-UI.app/Contents/Info.plist
	gsed -i 's/>com.github.electron\</>io.rivine.rivineui</' Rivine-UI.app/Contents/Info.plist
	gsed -i 's/>electron.icns</>icon.icns</' Rivine-UI.app/Contents/Info.plist
	cp ../../assets/icon.icns Rivine-UI.app/Contents/Resources/
	rm -r Rivine-UI.app/Contents/Resources/default_app.asar
	mkdir Rivine-UI.app/Contents/Resources/app
	(
		cd Rivine-UI.app/Contents/Resources/app
		wget $rivineOSX
		unzip ./rivine-*
		rm ./rivine*.zip
		mv ./rivine-* ./Sia
	)
	package "../../" "Rivine-UI.app/Contents/Resources/app"
	rm -r electron*.zip
	cp ../../LICENSE .
}

buildLinux() {
	cd release/linux
	wget $electronLinux
	unzip ./electron*
	mv electron Rivine-UI
	rm -r resources/default_app.asar
	mkdir resources/app
	(
		cd resources/app
		wget $rivineLinux
		tar -zxvf ./rivine-*
		rm ./rivine*.tar.gz
		mv ./rivine-* ./rivine
	)
	package "../../" "resources/app"
	rm -r electron*.zip
	cp ../../LICENSE .
}

buildWindows() {
	cd release/win32
	wget $electronWindows
	unzip ./electron*
	mv electron.exe Rivine-UI.exe
	wget https://github.com/electron/rcedit/releases/download/v0.1.0/rcedit.exe
	wine rcedit.exe Rivine-UI.exe --set-icon '../../assets/icon.ico'
	rm -f rcedit.exe
	rm resources/default_app.asar
	mkdir resources/app
	(
		cd resources/app
		wget $rivineWindows
		unzip ./rivine-*
		rm ./rivine*.zip
		mv ./rivine-* ./rivine
	)
	package "../../" "resources/app"
	rm -r electron*.zip
	cp ../../LICENSE .
}

# make osx release
( buildOSX )

# make linux release
( buildLinux )

# make windows release
( buildWindows )

# make signed zip archives for each release
for os in win32 linux osx; do
	(
		cd release/${os}
		zip -r ../Rivine-UI-${uiVersion}-${os}-amd64.zip .
		cd ..
		#openssl dgst -sha256 -sign $keyFile -out Sia-UI-${uiVersion}-${os}-x64.zip.sig Sia-UI-${uiVersion}-${os}-x64.zip
		#if [[ -n $pubkeyFile ]]; then
		#	openssl dgst -sha256 -verify $pubkeyFile -signature Sia-UI-${uiVersion}-${os}-x64.zip.sig Sia-UI-${uiVersion}-${os}-x64.zip
		#fi
		rm -rf release/${os}
	)
done

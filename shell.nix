{ pkgs ? import <nixpkgs> { config.allowUnfree = true; } }:

let
  playwrightLibs = with pkgs; [
    alsa-lib
    atk
    at-spi2-atk
    at-spi2-core
    cairo
    cups
    dbus
    expat
    flite
    fontconfig
    freetype
    gdk-pixbuf
    glibc
    glib
    graphene
    gst_all_1.gstreamer
    gst_all_1.gst-plugins-base
    gst_all_1.gst-plugins-good
    gst_all_1.gst-plugins-bad
    gtk3
    gtk4
    harfbuzz
    icu74
    lcms2
    libavif
    libdrm
    enchant2
    libevent
    libgbm
    libgcrypt
    libgpg-error
    libjpeg_turbo
    libmanette
    libpng
    libpsl
    libsecret
    libtasn1
    libvpx
    libwebp
    woff2
    libxml2
    libxslt
    libxkbcommon
    libepoxy
    mesa
    nghttp2
    nspr
    nss
    pango
    sqlite
    stdenv.cc.cc.lib
    systemd
    vulkan-loader
    wayland
    hyphen
    zlib
    xorg.libX11
    xorg.libXcomposite
    xorg.libXcursor
    xorg.libXdamage
    xorg.libXext
    xorg.libXfixes
    xorg.libXi
    xorg.libXrandr
    xorg.libXrender
    xorg.libXScrnSaver
    xorg.libXtst
    xorg.libxcb
    xorg.libxkbfile
  ];
in
pkgs.mkShell {
  packages = with pkgs; [ uv coreutils google-chrome ] ++ playwrightLibs;

  shellHook = ''
    export LD_LIBRARY_PATH="${pkgs.lib.makeLibraryPath playwrightLibs}:$LD_LIBRARY_PATH"
    export RI_CHROME_EXECUTABLE="${pkgs.google-chrome}/bin/google-chrome-stable"
  '';
}

# Source before podman commands if ~/.config is not owned by your user:
#   source scripts/podman-env.sh
export PATH="/opt/homebrew/bin:$PATH"
export XDG_CONFIG_HOME="${XDG_CONFIG_HOME:-$HOME/.podman-xdg}"
mkdir -p "$XDG_CONFIG_HOME"

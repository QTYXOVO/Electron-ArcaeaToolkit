const information = document.getElementById('info')
if (information) {
  information.innerText = `本应用正在使用 Chrome (v${window.electronAPI.versions.chrome()}), Node.js (v${window.electronAPI.versions.node()}), 和 Electron (v${window.electronAPI.versions.electron()})`
}
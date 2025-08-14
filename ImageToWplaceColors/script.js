// ------------------------
// Referencias del DOM base
// ------------------------
const fileInput = document.getElementById('fileInput');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const downloadBtn = document.getElementById('downloadBtn');

// Al inicio, canvas vacío
canvas.width = 0;
canvas.height = 0;
canvas.style.width = '0px';
canvas.style.height = '0px';


// ------------------------
// Controles creados dinámicamente
// ------------------------
const section2 = document.querySelector('.section_2') || canvas.parentElement;

// Contenedor de controles
const controls = document.createElement('div');
controls.style.display = 'flex';
controls.style.alignItems = 'center';
controls.style.gap = '10px';
controls.style.flexWrap = 'wrap';
controls.style.margin = '8px 0';

// Labels + inputs
const wLabel = document.createElement('label');
wLabel.textContent = 'Ancho:';
const widthInput = document.createElement('input');
widthInput.type = 'number';
widthInput.min = '1';
widthInput.style.width = '80px';

const hLabel = document.createElement('label');
hLabel.textContent = 'Alto:';
const heightInput = document.createElement('input');
heightInput.type = 'number';
heightInput.min = '1';
heightInput.style.width = '80px';

controls.appendChild(wLabel);
controls.appendChild(widthInput);
controls.appendChild(hLabel);
controls.appendChild(heightInput);

// Texto info (resolución y píxeles)
const infoText = document.createElement('p');
infoText.style.margin = '4px 0 10px';
infoText.style.fontWeight = 'bold';
infoText.style.color = 'black';

// Insertar controles e info encima del canvas
section2.insertBefore(controls, canvas);
section2.insertBefore(infoText, canvas);

// ------------------------
// Variables de estado
// ------------------------
let originalImage = null;
let aspectRatio = 1;

// ------------------------
// Paleta WPlace
// ------------------------
const colorList = [
  [0, 0, 0], [60, 60, 60], [120, 120, 120], [210, 210, 210], [255, 255, 255],
  [108, 0, 15], [255, 0, 0], [255, 119, 0], [255, 166, 0], [255, 220, 60],
  [255, 250, 189], [0, 188, 111], [0, 233, 133], [64, 255, 108], [0, 131, 113],
  [0, 177, 169], [0, 228, 195], [2, 81, 158], [0, 149, 228], [0, 250, 245],
  [108, 79, 244], [143, 178, 251], [132, 0, 151], [186, 46, 182], [237, 156, 246],
  [255, 0, 115], [255, 0, 119], [255, 135, 164], [111, 68, 50], [159, 102, 38],
  [255, 175, 115]
];

// ------------------------
// Utilidades
// ------------------------
function nearestColor(rgb) {
  let best = colorList[0];
  let bestDist = Infinity;
  const r = rgb[0], g = rgb[1], b = rgb[2];
  for (let i = 0; i < colorList.length; i++) {
    const c = colorList[i];
    const dr = r - c[0], dg = g - c[1], db = b - c[2];
    const d = dr*dr + dg*dg + db*db; // distancia euclídea^2
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return best;
}

function clamp(v) {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

function updateInfo(w, h) {
  infoText.textContent = `${w} × ${h} — ${w * h} píxeles`;
}

// ------------------------
// Carga de imagen
// ------------------------
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const img = new Image();
  img.onload = () => {
    originalImage = img;
    aspectRatio = img.width / img.height;

    // Inicializar inputs con dimensiones originales
    widthInput.value = img.width;
    heightInput.value = img.height;

    updateInfo(img.width, img.height);
    drawPreview(); // vista previa instantánea (sin dithering)
  };
  img.src = URL.createObjectURL(file);
});

// ------------------------
// Vista previa instantánea
// ------------------------
function drawPreview() {
  if (!originalImage) return;

  const w = Math.max(1, parseInt(widthInput.value) || 1);
  const h = Math.max(1, parseInt(heightInput.value) || 1);

  // Canvas temporal reducido
  const low = document.createElement('canvas');
  low.width = w;
  low.height = h;
  const lctx = low.getContext('2d');
  lctx.imageSmoothingEnabled = false;
  lctx.drawImage(originalImage, 0, 0, w, h);

  // Aplicar dithering
  let imgData = lctx.getImageData(0, 0, w, h);
  imgData = floydSteinbergWithPalette(imgData);
  lctx.putImageData(imgData, 0, 0);

  // Canvas visible
  ctx.imageSmoothingEnabled = false;
  canvas.width = w;
  canvas.height = h;
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(low, 0, 0, w, h);

  // Ajustar tamaño visual ahora que hay imagen
  canvas.style.width = '50vw';
  canvas.style.height = 'auto';

  updateInfo(w, h);
}


// Mantener proporciones al cambiar ancho
widthInput.addEventListener('input', () => {
  if (!originalImage) return;
  const newW = Math.max(1, parseInt(widthInput.value) || 1);
  const newH = Math.max(1, Math.round(newW / aspectRatio));
  heightInput.value = newH;
  drawPreview();
});

// Mantener proporciones al cambiar alto
heightInput.addEventListener('input', () => {
  if (!originalImage) return;
  const newH = Math.max(1, parseInt(heightInput.value) || 1);
  const newW = Math.max(1, Math.round(newH * aspectRatio));
  widthInput.value = newW;
  drawPreview();
});

// ------------------------
// Dithering con paleta (al descargar)
// ------------------------
function floydSteinbergWithPalette(imageData) {
  const { data, width: w, height: h } = imageData;

  // Trabajamos sobre un buffer float para precisión
  const buf = new Float32Array(data.length);
  for (let i = 0; i < data.length; i++) buf[i] = data[i];

  // Recorremos y distribuimos el error
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;

      const oldR = buf[idx];
      const oldG = buf[idx + 1];
      const oldB = buf[idx + 2];

      const [nr, ng, nb] = nearestColor([oldR, oldG, oldB]);
      buf[idx]     = nr;
      buf[idx + 1] = ng;
      buf[idx + 2] = nb;

      const errR = oldR - nr;
      const errG = oldG - ng;
      const errB = oldB - nb;

      // (x+1, y) 7/16
      distribute(x + 1, y,   errR, errG, errB, 7 / 16);
      // (x-1, y+1) 3/16
      distribute(x - 1, y + 1, errR, errG, errB, 3 / 16);
      // (x, y+1) 5/16
      distribute(x,     y + 1, errR, errG, errB, 5 / 16);
      // (x+1, y+1) 1/16
      distribute(x + 1, y + 1, errR, errG, errB, 1 / 16);
    }
  }

  // Copiar de vuelta con clamp
  for (let i = 0; i < data.length; i += 4) {
    data[i]     = clamp(Math.round(buf[i]));
    data[i + 1] = clamp(Math.round(buf[i + 1]));
    data[i + 2] = clamp(Math.round(buf[i + 2]));
    // alpha tal cual
  }

  function distribute(x, y, er, eg, eb, wgt) {
    if (x < 0 || x >= w || y < 0 || y >= h) return;
    const j = (y * w + x) * 4;
    buf[j]     += er * wgt;
    buf[j + 1] += eg * wgt;
    buf[j + 2] += eb * wgt;
  }

  return imageData;
}

// ------------------------
// Descargar con dithering
// ------------------------
downloadBtn.addEventListener('click', () => {
  if (!originalImage) return;

  const w = Math.max(1, parseInt(widthInput.value) || 1);
  const h = Math.max(1, parseInt(heightInput.value) || 1);

  // Canvas a resolución final (sin suavizado)
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const octx = out.getContext('2d');
  octx.imageSmoothingEnabled = false;
  octx.drawImage(originalImage, 0, 0, w, h);

  // Dithering con paleta WPlace
  let imgData = octx.getImageData(0, 0, w, h);
  imgData = floydSteinbergWithPalette(imgData);
  octx.putImageData(imgData, 0, 0);

  // Descargar PNG
  const link = document.createElement('a');
  link.download = 'pixel_art.png';
  link.href = out.toDataURL('image/png');
  link.click();
});

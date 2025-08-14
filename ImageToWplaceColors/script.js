// Paleta de colores
const colorList = [
  [0, 0, 0], [60, 60, 60], [120, 120, 120], [210, 210, 210], [255, 255, 255],
  [108, 0, 15], [255, 0, 0], [255, 119, 0], [255, 166, 0], [255, 220, 60],
  [255, 250, 189], [0, 188, 111], [0, 233, 133], [64, 255, 108], [0, 131, 113],
  [0, 177, 169], [0, 228, 195], [2, 81, 158], [0, 149, 228], [0, 250, 245],
  [108, 79, 244], [143, 178, 251], [132, 0, 151], [186, 46, 182], [237, 156, 246],
  [255, 0, 115], [255, 0, 119], [255, 135, 164], [111, 68, 50], [159, 102, 38],
  [255, 175, 115]
];

// Función para encontrar el color más cercano en la paleta
function nearestColor(color) {
  let minDiff = Infinity;
  let nearest = colorList[0];
  for (let c of colorList) {
    const diff = Math.pow(color[0] - c[0], 2) +
                 Math.pow(color[1] - c[1], 2) +
                 Math.pow(color[2] - c[2], 2);
    if (diff < minDiff) {
      minDiff = diff;
      nearest = c;
    }
  }
  return nearest;
}

// Adaptar la imagen usando Floyd–Steinberg dithering
function adaptImage(img) {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);
  
  let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let data = imageData.data;
  const w = canvas.width;
  const h = canvas.height;

  // Convertimos a matriz para manipular más fácilmente
  let pixels = [];
  for (let y = 0; y < h; y++) {
    let row = [];
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      row.push([data[i], data[i+1], data[i+2]]);
    }
    pixels.push(row);
  }

  // Aplicar Floyd–Steinberg
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let oldPixel = pixels[y][x];
      let newPixel = nearestColor(oldPixel);
      pixels[y][x] = newPixel;

      let err = [
        oldPixel[0] - newPixel[0],
        oldPixel[1] - newPixel[1],
        oldPixel[2] - newPixel[2]
      ];

      // Distribución de error
      if (x + 1 < w) {
        pixels[y][x+1] = pixels[y][x+1].map((v, i) => v + err[i] * 7 / 16);
      }
      if (y + 1 < h && x > 0) {
        pixels[y+1][x-1] = pixels[y+1][x-1].map((v, i) => v + err[i] * 3 / 16);
      }
      if (y + 1 < h) {
        pixels[y+1][x] = pixels[y+1][x].map((v, i) => v + err[i] * 5 / 16);
      }
      if (y + 1 < h && x + 1 < w) {
        pixels[y+1][x+1] = pixels[y+1][x+1].map((v, i) => v + err[i] * 1 / 16);
      }
    }
  }

  // Pasar la matriz de nuevo al ImageData
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      data[i] = Math.min(255, Math.max(0, Math.round(pixels[y][x][0])));
      data[i+1] = Math.min(255, Math.max(0, Math.round(pixels[y][x][1])));
      data[i+2] = Math.min(255, Math.max(0, Math.round(pixels[y][x][2])));
    }
  }

  ctx.putImageData(imageData, 0, 0);
  canvas.style.width = "75%";
  canvas.style.height = "auto";
}

// Cargar imagen
document.getElementById('fileInput').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => {
    adaptImage(img);
    resizeCanvasForDisplay();
  };
  img.src = URL.createObjectURL(file);
});

// Escalar canvas visualmente
function resizeCanvasForDisplay() {
  const canvas = document.getElementById('canvas');
  canvas.style.width = "75%";
  canvas.style.height = "auto";
}

// Descargar imagen
function downloadImage() {
  const canvas = document.getElementById('canvas');
  const link = document.createElement('a');
  link.download = 'output_image.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

document.getElementById('downloadBtn').addEventListener('click', downloadImage);

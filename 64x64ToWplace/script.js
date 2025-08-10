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

// Buscar color más cercano
function nearestColor(color) {
  let minDiff = Infinity;
  let nearest = colorList[0];
  for (let c of colorList) {
    const diff = (Math.abs(color[0] - c[0]) +
                  Math.abs(color[1] - c[1]) +
                  Math.abs(color[2] - c[2])) / 3;
    if (diff < minDiff) {
      minDiff = diff;
      nearest = c;
    }
  }
  return nearest;
}

// Adaptar la imagen al usar la paleta
function adaptImage(img) {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i+1], b = data[i+2];
    const [nr, ng, nb] = nearestColor([r, g, b]);
    data[i] = nr;
    data[i+1] = ng;
    data[i+2] = nb;
  }

  ctx.putImageData(imageData, 0, 0);

  // mostrar el canvas
  canvas.style.height = "auto";
  canvas.style.width = "75%"; // aplicar aquí también por si quieres forzarlo
}



// Manejar carga de archivo
document.getElementById('fileInput').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => {
    adaptImage(img); // procesa y pinta en tamaño real
    resizeCanvasForDisplay(); // escala solo visualmente
  };
  img.src = URL.createObjectURL(file);
});

// Escalar canvas visualmente pero mantener resolución interna
function resizeCanvasForDisplay() {
  const canvas = document.getElementById('canvas');
  canvas.style.width = "75%";  // siempre 50% del ancho de la página o contenedor
  canvas.style.height = "auto"; // mantiene proporción
}

// Descargar imagen en tamaño original
function downloadImage() {
  const canvas = document.getElementById('canvas');
  const link = document.createElement('a');
  link.download = 'output_image.png';
  link.href = canvas.toDataURL('image/png'); // esto usa la resolución real
  link.click();
}

// Conectar el botón de descarga
document.getElementById('downloadBtn').addEventListener('click', downloadImage);

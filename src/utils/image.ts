/**
 * Utilitário para processamento e otimização de imagens (brasões, logotipos)
 * Converte arquivos para Base64 otimizado para persistência SQLite e impressão A4 de alta resolução.
 */
export function processImageFileToBase64(
  file: File,
  maxDimension: number = 400
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo de imagem.'));
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (file.type === 'image/svg+xml') {
        resolve(result);
        return;
      }

      const img = new Image();
      img.onerror = () => reject(new Error('Formato de imagem inválido ou corrompido.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/png'));
        } else {
          resolve(result);
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  });
}

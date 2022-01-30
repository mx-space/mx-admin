// @see https://stackoverflow.com/questions/2541481/get-average-color-of-image-via-javascript
// @ts-nocheck

export function getDominantColor(imageObject: HTMLImageElement) {
  const canvas = document.createElement('canvas'),
    ctx = canvas.getContext('2d')

  canvas.width = 1
  canvas.height = 1

  //draw the image to one pixel and let the browser find the dominant color
  ctx.drawImage(imageObject, 0, 0, 1, 1)

  //get pixel color
  const i = ctx.getImageData(0, 0, 1, 1).data

  return (
    '#' + ((1 << 24) + (i[0] << 16) + (i[1] << 8) + i[2]).toString(16).slice(1)
  )
}

// @see: https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
export function rgbToHex(red: number, green: number, blue: number) {
  const rgb = (red << 16) | (green << 8) | (blue << 0)
  return '#' + (0x1000000 + rgb).toString(16).slice(1)
}

export function rgbObjectToHex(rgb: { r: number; g: number; b: number }) {
  return rgbToHex(rgb.r, rgb.g, rgb.b)
}

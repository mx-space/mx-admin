// @see https://stackoverflow.com/questions/2541481/get-average-color-of-image-via-javascript

import { encode } from 'blurhash'

export function getDominantColor(imageObject: HTMLImageElement) {
  const canvas = document.createElement('canvas'),
    ctx = canvas.getContext('2d')!

  canvas.width = 1
  canvas.height = 1

  // draw the image to one pixel and let the browser find the dominant color
  ctx.drawImage(imageObject, 0, 0, 1, 1)

  // get pixel color
  const i = ctx.getImageData(0, 0, 1, 1).data

  return `#${((1 << 24) + (i[0] << 16) + (i[1] << 8) + i[2]).toString(16).slice(1)}`
}

// @see: https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
export function rgbToHex(red: number, green: number, blue: number) {
  const rgb = (red << 16) | (green << 8) | (blue << 0)
  return `#${(0x1000000 + rgb).toString(16).slice(1)}`
}

export function rgbObjectToHex(rgb: { r: number; g: number; b: number }) {
  return rgbToHex(rgb.r, rgb.g, rgb.b)
}

export function getBlurHash(imageObject: HTMLImageElement) {
  const canvas = document.createElement('canvas'),
    ctx = canvas.getContext('2d')!

  canvas.width = imageObject.naturalWidth
  canvas.height = imageObject.naturalHeight

  ctx.drawImage(imageObject, 0, 0)

  const imageData = ctx.getImageData(0, 0, 32, 32)
  const pixels = new Uint8ClampedArray(imageData.data)
  const componentX = 4
  const componentY = 4

  return encode(pixels, 32, 32, componentX, componentY)
}

const getImageData = (image: HTMLImageElement) => {
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  const context = canvas.getContext('2d')!
  context.drawImage(image, 0, 0)
  return context.getImageData(0, 0, image.width, image.height)
}

export const encodeImageToBlurhash = (image: HTMLImageElement) => {
  const imageData = getImageData(image)
  return encode(imageData.data, imageData.width, imageData.height, 4, 4)
}

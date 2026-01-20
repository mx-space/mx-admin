// @see https://stackoverflow.com/questions/2541481/get-average-color-of-image-via-javascript

import { encode } from 'blurhash'

export function getDominantColor(imageObject: HTMLImageElement) {
  const canvas = document.createElement('canvas'),
    ctx = canvas.getContext('2d')!

  canvas.width = 1
  canvas.height = 1

  ctx.drawImage(imageObject, 0, 0, 1, 1)

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

export const encodeImageToBlurhashWebgl = (image: HTMLImageElement) => {
  const canvas = document.createElement('canvas')
  const gl = (canvas.getContext('webgl') ||
    canvas.getContext('experimental-webgl')) as WebGLRenderingContext

  if (!gl) {
    throw new Error('WebGL not supported')
  }

  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight

  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

  const framebuffer = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    texture,
    0,
  )

  const pixels = new Uint8Array(image.naturalWidth * image.naturalHeight * 4)
  gl.readPixels(
    0,
    0,
    image.naturalWidth,
    image.naturalHeight,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    pixels,
  )

  const resizedCanvas = document.createElement('canvas')
  resizedCanvas.width = 32
  resizedCanvas.height = 32
  const resizedCtx = resizedCanvas.getContext('2d')!
  const imageData = new ImageData(
    new Uint8ClampedArray(pixels),
    image.naturalWidth,
    image.naturalHeight,
  )
  resizedCtx.putImageData(imageData, 0, 0)
  resizedCtx.drawImage(resizedCanvas, 0, 0, 32, 32)
  const resizedImageData = resizedCtx.getImageData(0, 0, 32, 32)

  return encode(resizedImageData.data, 32, 32, 4, 4)
}

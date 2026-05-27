import { useEffect, useMemo, useState } from 'react'
import { decode } from 'blurhash'

import { cn } from '~/utils/cn'

import { isPreviewColor } from '../utils/format'

const PREVIEW_SIZE = 32

interface FileThumbnailProps {
  src: string
  alt: string
  blurhash?: null | string
  dominantColor?: string
  className?: string
}

export function FileThumbnail(props: FileThumbnailProps) {
  const [loaded, setLoaded] = useState(false)
  const placeholder = useMemo(
    () =>
      props.blurhash
        ? decodeBlurhashToDataUrl(props.blurhash, PREVIEW_SIZE)
        : null,
    [props.blurhash],
  )
  const backgroundColor = isPreviewColor(props.dominantColor)
    ? props.dominantColor
    : undefined

  useEffect(() => {
    setLoaded(false)
  }, [props.src])

  return (
    <span
      className="relative block h-full w-full overflow-hidden bg-neutral-100 dark:bg-neutral-900"
      style={backgroundColor ? { backgroundColor } : undefined}
    >
      {placeholder ? (
        <img
          alt=""
          aria-hidden="true"
          className={cn(
            'absolute inset-0 h-full w-full scale-110 object-cover blur-md transition-opacity duration-300',
            loaded ? 'opacity-0' : 'opacity-100',
          )}
          decoding="async"
          src={placeholder}
        />
      ) : (
        <span
          aria-hidden="true"
          className={cn(
            'absolute inset-0 bg-neutral-100 transition-opacity duration-300 dark:bg-neutral-900',
            loaded ? 'opacity-0' : 'opacity-100',
          )}
        />
      )}
      <img
        alt={props.alt}
        className={cn(
          'relative z-[1] transition-opacity duration-300',
          props.className,
          loaded ? 'opacity-100' : 'opacity-0',
        )}
        decoding="async"
        loading="lazy"
        onError={() => setLoaded(true)}
        onLoad={() => setLoaded(true)}
        src={props.src}
      />
    </span>
  )
}

function decodeBlurhashToDataUrl(hash: string, size: number): null | string {
  try {
    if (typeof document === 'undefined') return null
    const pixels = decode(hash, size, size)
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const context = canvas.getContext('2d')
    if (!context) return null
    const imageData = context.createImageData(size, size)
    imageData.data.set(pixels)
    context.putImageData(imageData, 0, 0)
    return canvas.toDataURL()
  } catch {
    return null
  }
}

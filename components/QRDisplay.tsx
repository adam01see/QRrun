'use client'

import { useEffect, useState } from 'react'

interface QRDisplayProps {
  url: string
  size?: number
}

export default function QRDisplay({ url, size = 200 }: QRDisplayProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    import('qrcode').then((QRCode) => {
      QRCode.toDataURL(url, {
        width: size,
        margin: 2,
        color: { dark: '#ffffff', light: '#18181b' },
      }).then(setDataUrl)
    })
  }, [url, size])

  if (!dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className="bg-zinc-800 rounded-xl animate-pulse"
      />
    )
  }

  return (
    <img
      src={dataUrl}
      alt="Your QR code"
      width={size}
      height={size}
      className="rounded-xl"
    />
  )
}

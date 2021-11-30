/* eslint-disable no-undef */

import { useRef, useMemo, useEffect, useState } from 'react'
import { GPU } from 'gpu.js'
import styled from 'styled-components'

const HistCanvas = styled.canvas`
  position: fixed;
  bottom 10px;
  left: 10px;
  opacity: 0.25;
  z-index: 100;

  :hover {
    opacity: 1;
  }
`

function rgbToLuminance(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  let maxVal = 0
  let minVal = 0

  maxVal = Math.max(r, g, b)
  minVal = Math.min(r, g, b)

  return (maxVal + minVal) / 2;
}

function drawHist(ctx, data) {
  const lum = Array(256).fill(0)
  const r = Array(256).fill(0)
  const g = Array(256).fill(0)
  const b = Array(256).fill(0)

  for (let i = 0; i < data.length; i += 4) {
    const rgb = [data[i], data[i+1], data[i+2]]
    const l = Math.round(rgbToLuminance(...rgb) * 256)
    lum[l] += 1
    r[rgb[0]] += 1
    g[rgb[1]] += 1
    b[rgb[2]] += 1
  }

  ctx.beginPath();
  ctx.rect(0,0,WIDTH,HEIGHT);
  ctx.fillStyle = 'black'
  ctx.fill();

  const barWidth = WIDTH/lum.length

  const max = Math.max(...lum)

  function drawBar(i, bar, color) {
    const barHeight = (bar/max)*HEIGHT
    
    const x = barWidth * i
    const y = HEIGHT - barHeight
    ctx.beginPath();
    ctx.rect(x, y, barWidth, barHeight);
    ctx.fillStyle = color
    ctx.fill();
  }

  for (let i = 0; i < lum.length; i++) {
    // drawBar(i, lum[i], 'white')
    drawBar(i, r[i], 'rgba(255,0,0,0.75)')
    drawBar(i, g[i], 'rgba(0,255,0,0.75)')
    drawBar(i, b[i], 'rgba(0,0,255,0.75)')
  }
}


const WIDTH = 200
const HEIGHT = 100

export function Image({
  saturation,
  lightness,
  hue,
  src,
  // zoom,
  red,
  green,
  blue,
  disabled,
  color1
}) {
  const ref = useRef(null)
  const histRef = useRef(null)
  const [loaded, setLoaded] = useState(false)
  const imageRef = useRef(document.createElement('img'))
  const [[height, width], setDimensions] = useState([])
  const [zoom, setZoom] = useState(1)

  useEffect(() => {
    function updateZoom() {
      const widthZoom = (window.innerWidth - 350) / width
      const heightZoom = (window.innerHeight - 150) / height
      setZoom(Math.min(widthZoom, heightZoom))
    }
    updateZoom()
    window.addEventListener('resize', updateZoom)
    return () => {
      window.removeEventListener('resize', updateZoom)
    }
  }, [width, height])

  useEffect(() => {
    const img = imageRef.current
    img.src = src
    img.onload = () => {
      setDimensions([img.height, img.width])
      setLoaded(true)
    };
  }, [src])

  const gpu = useMemo(
    () => {
      const g = new GPU()
      return g
    },
    []
  )

  useEffect(() => {
    if (!ref.current || !histRef.current || !loaded) return

    const kernel = gpu.createKernel(`function (image) {

      function lerp(start, end, amt) {
        return (1 - amt) * start + amt * end
      }

      function invlerp(start, end, amt) {
        amt = clamp(start, amt, end)
        let range = 0
        range = (end - start)
        if (range === 0) {
          return start
        }
        return (amt - start) / range
      }

      function rgbToHsl(r, g, b, a) {
        r /= 255;
        g /= 255;
        b /= 255;
        a /= 255;

        let maxVal = 0
        let minVal = 0

        maxVal = max(r, g)
        maxVal = max(maxVal, b)
        minVal = min(r, g)
        minVal = min(minVal, b);

        let h = (maxVal + minVal) / 2
        let s = h
        let l = h

        if (maxVal === minVal) {
          h = s = 0; // achromatic
        }

        else {
          var d = maxVal - minVal;
          s = l > 0.5 ? d / (2 - maxVal - minVal) : d / (maxVal + minVal);

          if (maxVal === r) h = (g - b) / d + (g < b ? 6 : 0);
          else if (maxVal === g) h = (b - r) / d + 2;
          else h = (r - g) / d + 4;

          h /= 6;
        }

        return [h, s, l, a];
      }

      function hue2rgb(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      }

      function hslToRgb(h, s, l, a) {
        let r = 0
        let g = 0
        let b = 0

        if (s === 0) {
          r = g = b = l; // achromatic
        } else {
          var q = 0
          q = l < 0.5 ? l * (1 + s) : l + s - l * s;
          var p = 0
          p = 2 * l - q;
          r = hue2rgb(p, q, h + 1 / 3);
          g = hue2rgb(p, q, h);
          b = hue2rgb(p, q, h - 1 / 3);
        }

        return [(r * 255), (g * 255), (b * 255), (a * 255)];
      }

      let rgb = image[this.thread.y][this.thread.x];

      const { saturation, lightness, hue, red, green, blue, disabled, color1 } = this.constants

      if (disabled) {
        this.color(rgb[0], rgb[1], rgb[2], rgb[3]);
      } else {
        rgb[0] = lerp(invlerp(0.5, 1, red), invlerp(0, 0.5, red), rgb[0])
        rgb[1] = lerp(invlerp(0.5, 1, red), invlerp(0, 0.5, green), rgb[1])
        rgb[2] = lerp(invlerp(0.5, 1, red), invlerp(0, 0.5, blue), rgb[2])

        let hsl = rgbToHsl(rgb[0], rgb[1], rgb[2], rgb[3])

        if (hsl[1] >= 220/360 && hsl[1] < 270/360) {
          hsl[1] = (hsl[1] + lerp(-0.5, 0.5, color1) + 1) % 1 
        }

        hsl[0] = (hsl[0] + (hue-0.5)) % 1
        hsl[1] = lerp(invlerp(0.5, 3, saturation), invlerp(0, 0.5, saturation), hsl[1])
        hsl[2] = lerp(invlerp(0.5, 300, lightness), invlerp(0, 0.5, lightness), hsl[2])

        rgb = hslToRgb(hsl[0], hsl[1], hsl[2], hsl[3])
        this.color(rgb[0], rgb[1], rgb[2], rgb[3]);
      }
    }`, {
      canvas: ref.current,
      graphical: true,
      output: [width,height],
      constants: {
        saturation,
        lightness,
        hue,
        red,
        green,
        blue,
        disabled,
        color1
      }
    })

    kernel(imageRef.current);
    // setPixels()

    const pixels = kernel.getPixels()
    const id = setTimeout(() => {
      drawHist(histRef.current.getContext('2d'), pixels)
    }, 0)
    
    return () => {
      clearTimeout(id)
    }
  }, [gpu, saturation, loaded, lightness, hue, height, width, red, green, blue, disabled, color1])

  return (
    <>
      {/* <Histogram
        data={pixels}
      /> */}

      <HistCanvas
        ref={histRef}
        height={HEIGHT}
        width={WIDTH}
      />
      <canvas
        height={height}
        width={width}
        ref={ref}
        style={{
          transform: `scale(${zoom})`
        }}
      />
    </>
  )
}
/* eslint-disable no-undef */

import { useRef, useMemo, useEffect, useState } from 'react'
import { GPU } from 'gpu.js'

export function Image({
  saturation,
  lightness,
  hue,
  src,
  zoom,
  red,
  green,
  blue
}) {
  const ref = useRef(null)
  const [loaded, setLoaded] = useState(false)
  const imageRef = useRef(document.createElement('img'))
  const [[height, width], setDimensions] = useState([])

  useEffect(() => {
    const img = imageRef.current
    img.src = src
    img.onload = () => {
      setLoaded(true)
      setDimensions([img.height, img.width])
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
    if (!ref.current || !loaded) return

    const kernel = gpu.createKernel(function (image) {

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

      const { saturation, lightness, hue, red, green, blue } = this.constants

      const pixel = image[this.thread.y][this.thread.x];
      let hsl = rgbToHsl(pixel[0], pixel[1], pixel[2], pixel[3])

      // MODIFY IMAGE HERE

      // hsl[0] = lerp(invlerp(0.5, 1, hue), invlerp(0, 0.5, hue), hsl[0])
      hsl[0] = (hsl[0] + (hue-0.5)) % 1
      hsl[1] = lerp(invlerp(0.5, 1, saturation), invlerp(0, 0.5, saturation), hsl[1])
      hsl[2] = lerp(invlerp(0.5, 1, lightness), invlerp(0, 0.5, lightness), hsl[2])

      // END MODIFY
      let rgb = hslToRgb(hsl[0], hsl[1], hsl[2], hsl[3])
      
      rgb[0] = lerp(invlerp(0.5, 1, red), invlerp(0, 0.5, red), rgb[0])
      rgb[1] = lerp(invlerp(0.5, 1, red), invlerp(0, 0.5, green), rgb[1])
      rgb[2] = lerp(invlerp(0.5, 1, red), invlerp(0, 0.5, blue), rgb[2])

      this.color(rgb[0], rgb[1], rgb[2], rgb[3]);
    }, {
      canvas: ref.current,
      graphical: true,
      output: [width,height],
      constants: {
        saturation,
        lightness,
        hue,
        red,
        green,
        blue
      }
    })

    kernel(imageRef.current);
  }, [gpu, saturation, loaded, lightness, hue, height, width, red, green, blue])


  return (
    <canvas
      height={height}
      width={width}
      ref={ref}
      style={{
        transform: `scale(${zoom})`
      }}
    />
  )
}
import { useState } from 'react'

export function useSliderState(name: string) {
  const [value, setValue] = useState(0.5)

  return {
    value,
    setValue,
    name
  }
}

export function Slider({
  value,
  setValue,
  name
}: ReturnType<typeof useSliderState>) {
  return (
    <>
      <label>{name}</label>
      <input
        type='range'
        min={0}
        max={1}
        step={0.001}
        value={value}
        onChange={e => setValue(+e.target.value)}
        onDoubleClick={() => setValue(0.5)}
      /> 
    </>
  )
}
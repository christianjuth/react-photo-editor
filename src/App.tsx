import { useEffect, useState } from 'react';
import { use100vh } from 'react-div-100vh';
import styled from 'styled-components';
import { Image } from './components/Image';
import { Slider, useSliderState } from './components/Slider';

const Page = styled.div`
  display: flex;
  flex-direction: row;
`

const ImageWrap = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0,0,0,0.2);
  overflow: hidden;
`

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  width: 200px;
  padding: 20px;
`

function App() {
  const pageHeight = use100vh() ?? 0
  const [disabled, setDisabled] = useState(false)

  const { value: hue, ...hueState } = useSliderState('Hue')
  const { value: saturation, ...saturationState } = useSliderState('Saturation')
  const { value: lightness, ...lightnessState } = useSliderState('Lightness')
  const { value: red, ...redState } = useSliderState('Red')
  const { value: green, ...greenState } = useSliderState('Green')
  const { value: blue, ...blueState } = useSliderState('Blue')

  const { value: color1, ...color1State } = useSliderState('Blue')

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === '\\') {
        setDisabled(b => !b)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.addEventListener('keydown', handleKeyDown)
    }
  }, [])

  useEffect(() => {
    setDisabled(false)
  }, [hue, saturation, lightness, red, green, blue])

  return (
    <Page style={{height: pageHeight}}>
      {(
        <>
          <ImageWrap>
            <Image 
              saturation={saturation}
              lightness={lightness}
              hue={hue}
              red={red}
              green={green}
              blue={blue}
              src={'/landscape2.jpeg'}
              // zoom={0.75}
              disabled={disabled}
              color1={color1}
            />
          </ImageWrap>
          <Sidebar>
            <h3>Basics</h3>
            <Slider 
              value={hue}
              {...hueState}
            />
            <Slider 
              value={saturation}
              {...saturationState}
            />
            <Slider 
              value={lightness}
              {...lightnessState}
            />

            <h3>RGB Channels</h3>
            <Slider 
              value={red}
              {...redState}
            />
            <Slider 
              value={green}
              {...greenState}
            />
            <Slider 
              value={blue}
              {...blueState}
            />

            <h3>Hue shifting</h3>
            <Slider
              value={color1}
              {...color1State}
            />
            
          </Sidebar>
        </>
      )}
    </Page>
  );
}

export default App;

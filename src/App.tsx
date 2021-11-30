import { useState } from "react";
import { Image } from './components/Image';
import styled from 'styled-components'
import { use100vh } from 'react-div-100vh'
import { Slider, useSliderState } from './components/Slider'

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

  const { value: hue, ...hueState } = useSliderState('Hue')
  const { value: saturation, ...saturationState } = useSliderState('Saturation')
  const { value: lightness, ...lightnessState } = useSliderState('Lightness')
  const { value: red, ...redState } = useSliderState('Red')
  const { value: green, ...greenState } = useSliderState('Green')
  const { value: blue, ...blueState } = useSliderState('Blue')

  return (
    <Page style={{minHeight: pageHeight}}>
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
              src={'/image1.jpeg'}
              zoom={0.75}
            />
          </ImageWrap>
          <Sidebar>
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
            
          </Sidebar>
        </>
      )}
    </Page>
  );
}

export default App;

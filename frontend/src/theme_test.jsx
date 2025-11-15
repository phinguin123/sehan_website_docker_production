// theme.js

// 1. import `extendTheme` function
import { extendTheme } from '@chakra-ui/react'
import './index.css'

// 2. Add your color mode config
const config = {
  initialColorMode: 'light',
  useSystemColorMode: false,
}


const fonts = {
	body: `Pretendard, Noto Sans KR, HakgyoansimDunggeunmisoTTF-R, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`,
	heading: `Pretendard, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`
}


const colors = {
	yellow: { 
	  400: '#FEE500',
	  //500: '#d1ca5c',
     	
	}
}


// 3. extend the theme
const theme = extendTheme({ config, colors, fonts })

export default theme

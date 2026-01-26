import {Button, Image} from '@chakra-ui/react'
import kakao_logo from '@/assets/images/kakaolink_btn_small.png'
import {useEffect, useState} from 'react';

const KakaoLogin = () =>
{
	const [popup, setPopup] = useState()
    // oauth 요청 URL
    const kakaoURL = `https://kauth.kakao.com/oauth/authorize?client_id=${import.meta.env.VITE_KAKAO_CLIENT_ID}&redirect_uri=${import.meta.env.VITE_KAKAO_REDIRECT_URI}&response_type=code`
    const handleLogin = ()=>{
	window.open(kakaoURL, "카카오","popup=yes")
    	setPopup(true)
	}

	useEffect(() =>{
	  if(!popup){
	    console.log("popup isn't there")
	    return;
	  }
	  console.log("popup is there")
	  setPopup(true)
	  
	  if(!popup){
		console.log("popup has closed")
	  }
	  
	}, [popup])
	/*
	useEffect(() => {
		if (!popup) {
		  return;
		}
		console.log("opened popup")
		
		const currentUrl = popup.location.href
		const searchParams = new URL(currentUrl).searchParams
		const code = searchParams.get('code')
		console.log(`this is code1 ${code}`)
		if(code){
			setPopup(false)
			console.log(`This is code ${code}`)
			console.log("closed popup")
		}
	}, [popup])
	*/
    return(
    <>
    <Button leftIcon={<Image src={kakao_logo} />} colorScheme='yellow' width='200px' onClick={handleLogin}>카카오 로그인</Button>
    </>
    )
}
export default KakaoLogin

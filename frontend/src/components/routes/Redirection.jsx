import axios from 'axios'
import {useEffect} from 'react'
import {setCookie} from '@/components/common/Cookie'

let runOnceFlag = true;

const Redirection = () => {
  const code = new URL(document.location.toString()).searchParams.get('code');

  useEffect(() => {
    // console.log(process.env.REACT_APP_URL);
	
	if(runOnceFlag){
	  console.log("inside redirection file")
	  runOnceFlag = false;
	  const cookie_lifetime = 4233600 // 7 weeks

	  axios.post(`${import.meta.env.VITE_API_BASE_URL}/oauth/kakao`, {code}, {withCredentials: true}).then((r) => {
	    console.log("data in redirection", r.data);
		
		setCookie('jwt_access_token', r.data.jwt_access_token, { path: '/', sameSite: 'lax', maxAge: cookie_lifetime });
		setCookie('jwt_refresh_token', r.data.jwt_refresh_token, { path: '/', sameSite: 'lax', maxAge: cookie_lifetime });
		console.log("jwt token:",r.data.name)
		if(r.data.name === null){
			window.opener.location.href=`${import.meta.env.VITE_CLIENT_BASE_URL}/set-name`
		}
		else{
			window.opener.location.href=`${import.meta.env.VITE_CLIENT_BASE_URL}/`
		}
		window.close()
		// 토큰을 받아서 localStorage같은 곳에 저장하는 코드를 여기에 쓴다.
		//localStorage.setItem('name', r.data.user_name); // 일단 이름만 저장했다.
	  })
	.catch(error => {
		console.error("Error in post request:",error);
	});

	}
  }, [code]);

  return <div>로그인 중입니다.</div>;
};

export default Redirection;

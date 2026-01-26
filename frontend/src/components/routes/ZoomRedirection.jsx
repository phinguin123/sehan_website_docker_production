import instance from '@/apis/axiosInstance'
import {useEffect} from 'react'
import { useNavigate } from 'react-router-dom'

let runOnceFlag = true;

const ZoomRedirection = () => {
  const code = new URL(document.location.toString()).searchParams.get('code');
  const navigate = useNavigate()

  useEffect(() => {
    // console.log(process.env.REACT_APP_URL);
	
	if(runOnceFlag){
	  console.log("inside zoom redirection file")
	  runOnceFlag = false;

	  instance.post(`${import.meta.env.VITE_API_BASE_URL}/oauth/zoom`, {code}, {withCredentials: true}).then((r) => {
	    console.log("data in zoom redirection", r.data);

		window.close()
	  })
	.catch(error => {
		console.error("Error in zoom redirection request:",error);
	});

	}

	navigate('/secure-sehan-admin')
  }, [code]);

  return <div>줌 토큰 발행 중입니다.</div>;
};

export default ZoomRedirection;

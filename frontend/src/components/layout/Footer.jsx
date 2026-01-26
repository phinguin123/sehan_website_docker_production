import react from 'react'
import styled from 'styled-components'

const StyledLi = styled.li`
  & {
    display: inline-block;
  }

  &:first-child p:before{
    display: none;
  }

`

const StyledP = styled.p`
  & {
    padding: 0 10px;
    position: relative;
    margin-bottom: 0;
    font-size: 12px;
  }

  &:before {
    content: '';
    width: 1px;
    height: 11px;
    background: #777;
    position: absolute;
    left: 0;
    top: 6px;
  }
`

function Footer(){
  return(
    <footer style={{padding:"40px 20px"}}>
      <ul>
        <StyledLi>
          <StyledP>서울특별시 강남구 삼성로85길 38, 607호(대치동, 대치동 우정에쉐르1)</StyledP>
        </StyledLi>
        <StyledLi>
          <StyledP>(주)퓨처스컨설팅그룹 대표: 강승재</StyledP>
        </StyledLi>
        <StyledLi>
          <StyledP>사업자번호 102-19-50832</StyledP>
        </StyledLi>
      </ul>
      <ul>
        <StyledLi>
          <StyledP>고객센터 02-3453-3422</StyledP>
        </StyledLi>
        <StyledLi>
          <StyledP>이메일 sehann@sehann.com</StyledP>
        </StyledLi>
      </ul>
    </footer>
  )
}

export default Footer
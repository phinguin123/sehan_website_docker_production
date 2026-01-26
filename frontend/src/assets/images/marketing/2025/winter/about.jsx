import React, { useEffect, useState, useCallback } from 'react';

import { AssessmentSegmentedBars } from '@/components/common/2025/winter/AssessmentBarsSlim';
import { PaperTopicsList } from '@/components/2025/winter/PaperTopicsList';
import VerticalConnector from '@/components/2025/winter/VerticalConnector';

import Zoom from 'react-medium-image-zoom'
import 'react-medium-image-zoom/dist/styles.css'

import kakaoIcon from '@/assets/kakaotalk-icon.png'; // Example path
import youtubeIcon from '@/assets/youtube-icon.png';
import naverIcon from '@/assets/naver-blog-icon.png';

import promoImage from './web-zer0ne-first-page-v01@4x.webp'
import promoImage2 from './2025_winter_promotion_image_part2.webp'
import promoImage3 from './2025_winter_promotion_part3@4x.webp'
import promoImage4 from './web-zer0ne-banner1.webp'
import promoAboutPhinguin from './2025_winter_promotion_about_phinguin@2x.webp'
import notionIcon from './notion-icon.svg'

import useEmblaCarousel from 'embla-carousel-react'
import part1 from './2025_winter_promotion_textbook_slide1@4x.webp'
import part2 from './2025_winter_promotion_textbook_slide2@4x.webp'
import part3 from './2025_winter_promotion_textbook_slide3@4x.webp'
import reviewTitle from './review_title@4x.webp'
import boyReview1 from './boy_review1@4x.webp'
import boyReview2 from './boy_review2@4x.webp'
import boyReview3 from './boy_review3@4x.webp'

const slides = [
  { src: part1, alt: "교재 이미지 1" },
  { src: part2, alt: "교재 이미지 2" },
  { src: part3, alt: "교재 이미지 3" },
]
  /*
  This is a React component for the main page template.
  
  To fix the error, I've moved all the CSS styles directly
  into this file within a <style> tag. This component is now
  self-contained and should preview correctly.
  
  All inline JavaScript (like onclick, href="javascript:...") has been
  removed to create a clean, static template. You can now add
  your own React-based event handlers and state.
*/

// All the CSS from the original file is now in this string
const styles = `
  #container{height:100%;}
  .contents{margin:0 0 0 0;min-height:100%;}
  .contents_inner{position:relative;}
  .head_wrap{height: 4.5rem;}
  div,p,ul,li, h1, h2, h3, h4, h5 {margin:0;padding:0;list-style:none}

  .po_r {position:relative}
  .po_a {position:absolute}
  .al_c {text-align:center}
  .t_ln {text-decoration:underline}
  .mt_20 {margin-top:20px}
  .mb_20 {margin-bottom:20px}
  .fl_l {float:left}
  .lyr_side{position:absolute;right:10%;top:50%;width:24%}
  .top--add--btn {top:50%;right:10%;display:block;position:absolute;}
  .cla_add--Img {right:-33px;top:0}
  .cla_add--Img img {width:55%}
  .icoNew {position:absolute; left:2%; top:-36%; width:10% !important;}

  .top_flag{background:#000; text-align: center;padding: 0.3rem 0;}
  .lst_flag > p{display: block; text-align: center;color: #a65dff;padding: 0rem 0;font-size: 1.2rem;font-weight: bold;margin-bottom: 0.5rem;}
  .lst_flag > p > p{margin-bottom: 0.5rem;}
  .topBannerFlo{display: inline-block;background: #0ba062;padding: 0.3rem 1rem;font-weight: 500;color: #fff;border-radius: 10rem;font-size: 0.8rem;}
  .topBanner_sub{color: #fff;font-size: 0.9rem;}
  .topBg{background: #f8f8f8;}
  .m_img_top_banner{display: block;}

  .cont1Bg {background: #8842dd;padding-bottom: 2rem;}
  .cont01_tit_review_wrap{width: 70%;margin: 0 auto 1.5rem;background: #491985; padding: 1rem 0;border-radius: 10rem;}
  .cont01_tit_review_box{margin: 0 auto;}
  .cont01_tit_review_box > li{display: flex;align-items: center;justify-content: center;}
  .cont01_tit_review_box > li .cont01_tit_review_txt{color: #fff;margin-right: 1.2rem; font-weight: bold;}
  .cont01_tit_review_box > li .cont01_str_name{color: #8c8c8c;font-size: 0.8rem;}

  .cont01_tit_vod_wrap .bx-default-pager{display: flex;align-items: center;justify-content: center;gap: 1rem;margin-top: 1.5rem;}
  .cont01_tit_vod_wrap .bx-default-pager{}
  .cont01_tit_vod_wrap .bx-default-pager .bx-pager-item > a{display: block; width: 1.5rem;height: 1.5rem;border-radius: 100%;text-indent: -9999em;background: #541d96;}
  .cont01_tit_vod_wrap .bx-default-pager .bx-pager-item > a.active{background: #15c37a;}

  .cont01_tit_vod_wrap{width: 92%;margin: 0 auto;}
  .cont01_tit_vod_wrap .cont01_tit_vod_box{}

  .cont2Bg {background: #381b3d;}
  .cont2Bg .bx_cmtfliking .bx_cmtfliking_inner {width: 80%;margin: 0 auto;}
  .cont3Bg {background: #303030;}
  .cont3Bg .bx_cmtfliking .bx_cmtfliking_inner {border: 1px solid #646464;}
  .cont3Bg .bx_cmtfliking_inner li div {color: #fff;}
  .cont3Bg .bx_cmtfliking_inner .imp {color: #fca78a;}
  .cont3Bg .bx_cmtfliking_inner .author {color: #bababa;}
  .eventArea01 .pageDone {position:absolute;right:0;top:32%;width:30%; z-index:1;}

  .section {position:relative}
  .section img {width:100%}
  .cont3Bg {padding: 0 0 0rem; background: #0eb670;}

  .tabWrap {padding: 0 3%;}
  .tabWrap__list {display: flex; display: -ms-flex; display: -webkit-flex;}
  .tabWrap__list--item {flex: 1; -ms-flex: 1; -webkit-flex: 1;}
  .tabWrap__list--item:first-child {border-left: 0;}
  .tabWrap__list--link{position: relative;}
  .tabWrap__list--link .tabWrap_flo{position: absolute;left: 50%;top: 60%;transform: translateX(-50%);font-weight: bold;color: #6c6b6b;}
  .tabWrap__list--link .tabWrap_flo.on{position: absolute;left: 50%;top: 60%;transform: translateX(-50%);font-weight: bold;color: #48e6a4;}
  .tabWrap__list--link img {width: 100%;}
  .tabWrap--panel {background: #fff;}
  .cont4Bg{background: #292929;padding-bottom: 3rem;}
  .cont401_wrap{width: 94%;margin: 1rem auto 0; background: #e5cfff;padding-bottom: 2rem;}
  .cont04_btns{display: block;width: 70%;margin: 0 auto;}
  .cont04_btn02{margin-top: 1rem;}
  .cont4_period{width: 85%;padding: 1rem; text-align: center;color: #fff;font-weight: bold; background: #343434;border-radius: 5rem;margin: 1rem auto;}
  .cont4_txt_wrap{padding: 1.5rem;}
  .lec_section{background: #fff;}

  .cont4Bg .info{background: #efefef;padding: 2rem 1rem 2rem 1rem;}
  .info__list{}
  .info__title{display: block; margin-bottom: 1rem;font-size: 1.2rem;}
  .info__list > li{position: relative;padding-left: 0.7rem;margin-bottom: 0.5rem;}
  .info__list > li:last-child{margin-bottom: 0;}
  .info__list > li::after{content: '-';position: absolute;left: 0;top: 0;}
  .info__list--item.im-color{font-weight: bold;color: #4e0d9e !important;}
  .noticeWrap .im-color{font-weight: bold;color: #4e0d9e !important;}

  /* 이벤트 공통 */
  .eventArea01{background: #fff7e3;padding-bottom: 2rem;}
  .eventArea--title__area{border-bottom: 1px solid rgba(0, 0, 0, 0.2);position: relative;}
  .eventArea__info__inner{width: 100%;border-bottom: 1px solid rgba(0, 0, 0, 0.2);padding: 3rem 0 1rem;}
  .goods--case{width: 100%; display: flex;align-items: flex-start;justify-content: space-between;flex-wrap: wrap;margin-bottom: 2rem;display: -webkit-flex; -webkit-flex-wrap: wrap;}
  .eventArea__info__wrap{width: 100%;border-top: 3px solid rgba(0, 0, 0, 0.05);border-bottom: 3px solid rgba(0, 0, 0, 0.05);}
  .eventArea__info__box{margin: 0 auto; padding: 0 1rem;position: relative;}

  .evt_flo{position: absolute;right: 10%;top: -5%;width: 20%;}
  .goods--case .goods__img{display: flex; justify-content: center;  width: 100%; height: 100%; padding: 6vw; box-sizing: border-box;}
  .goods--case .goods__img > img{display: inline-block; width: auto; max-width: 100%; max-height: 100%;object-fit: contain;}
  .pageDone{width: 30%;position: absolute;right:0;bottom: -15%;}
  .goods__count{position: absolute;right: 0;top: 0;z-index: 3;font-size: calc(100% - 0.5vw);padding: 0 !important; width: 25%; min-width: 32px;}
  .goods__count::after {content: '';display: block;padding-bottom: 100%;}
  .goods__count span {position: absolute;top:0;right:0;bottom:0;left:0;display: flex;justify-content: center;align-items: center;font-size: calc(100% + 0.5vw);}
  .count01{background: #000;color: #fff;text-align: center;padding: 1rem 0.5rem;}
  .count02{background: #1d4ed8;color: #fff;text-align: center;}
  .eventArea__info--item{margin-bottom: 1.5rem;}
  .info--tit{font-size: calc(100% + 0.7vw);font-weight: bold;display: flex;align-items: center;margin-bottom: 0.5rem;letter-spacing: -1px;position: relative;padding-left: 1rem;display: -webkit-flex;}
  .info--tit::before{content: '';display: block;width: 0.5rem;height: 0.5rem;background: #1d4ed8;position: absolute;left: 0;top: 50%;transform: translateY(-50%);z-index: 3;}
  @media only screen and (min-width :720px) {
    .goods--imgArea02{position: relative;background: #fff;width: 100%;height: 40vw; display: flex;align-items: center;justify-content: center;}
      .goods--imgArea02 > img{width: 100%;}
      .goods--case .goods__img{display: flex;justify-content: center;width: 100%;height: 100%;padding: 3vw;box-sizing: border-box;}
  }

  @keyframes flick01{
    0%{opacity: 0;}
    100%{opacity: 1;}
  }

  .evt_flo0102, .evt_flo0202, .evt_flo0302{position: relative;}

  .evt_flo0102_magam{position: absolute;left: 50%;top: 25%;transform: translateX(-50%);
    -webkit-animation: flick01 .3s ease infinite alternate;
    animation: flick01 1s ease infinite alternate;
  }
  .evt_flo0102_magam{position: absolute;left: 50%;top: 25%;transform: translateX(-50%);
    -webkit-animation: flick01 .3s ease infinite alternate;
    animation: flick01 1s ease infinite alternate;
  }
  .evt_flo0102_magam{position: absolute;left: 50%;top: 25%;transform: translateX(-50%);
    -webkit-animation: flick01 .3s ease infinite alternate;
    animation: flick01 1s ease infinite alternate;
  }

  /* 이벤트 기간*/
  .info--content{padding-left: 1rem;font-size: calc(100% + 0.7vw);letter-spacing: -1px;}
  .info--content > strong{color: #1d4ed8;text-decoration : underline;text-underline-position : under;}

  /* 참여 방법 */
  .step--txt_item{position: relative; display: flex;align-items: center;justify-content: center; margin-bottom: 1rem;display: -webkit-flex;-webkit-justify-content:center;-webkit-box-pack:center;}
  .step--txt_item:last-child{margin-bottom: 0;}
  .step--color{position: absolute;left: 0;top: 0; z-index: 3; display: block;background: #1d4ed8;font-weight: normal; border: 1px solid #1d4ed8;color: #fff;width: 18%;height: 100%; text-align: center;display: flex;align-items: center;justify-content: center; display: -webkit-flex;-webkit-justify-content:center;-webkit-box-pack:center;}
  .step--txt{display: inline-block; border: 1px solid #000;border-left: none;width: 100%;padding: 1rem 1rem 1rem 22%;letter-spacing: -1px;display: flex;align-items: flex-start;justify-content: center;flex-direction: column;line-height:1.5rem; display: -webkit-flex;-webkit-justify-content:center;-webkit-box-pack:center;-webkit-flex-direction: column;}
  .step--txt em{color: #1d4ed8;font-weight: bold;}

  /* 이벤트 혜택 */

  /* 상품 1개 일 때  */
  .case01{margin-bottom: 2rem;display: block;}
  .goods--imgArea01{background: rgba(0, 0, 0, 0.05);position: relative;padding: 1rem;}
  .goods--imgArea01 .goods__count{width: 12% !important;}
  .goods__name01{background: #fff;text-align: center;padding: 1.2rem 0;}

  /* 상품 2개 일 때 */
  .goods_item02{width: 47%;}
  .goods--imgArea02{position: relative;background: #fff;width: 100%;height: 40vw; display: flex;align-items: center;justify-content: center;}
  .goods--imgArea02 > img{width: 100%;}
  .goods__count01{position: absolute;right: 0;top: 0;z-index: 3;background: #000;color: #fff;text-align: center;padding: 1.2rem 0.7rem;font-size: calc(100% + 0.7vw);}
  .goods__name02{text-align: center;background: rgba(0, 0, 0, 0.05); display: flex;align-items: center;justify-content: center;flex-direction: column;height: 5rem;line-height:1.5rem;display: -webkit-flex;-webkit-justify-content:center;-webkit-box-pack:center;-webkit-flex-direction: column;}

  /* 상품 3개 일 때 */
  .case03 li:nth-child(1){margin: 0 26.5% 1.5rem;}
  .goods--bottom{width: 100%; display: flex;align-items: center;justify-content: space-between; margin-top: 2rem;}
  .goods_item03{width: 47%;margin:0 auto;}
  .goods_item03:last-child{width: 47%;}
  .goods__name03{text-align: center;display: flex;flex-direction: column;align-items: center;justify-content: center; background: rgba(0, 0, 0, 0.05);height: 5rem;display: -webkit-flex;-webkit-flex-direction: column;-webkit-justify-content: center;-webkit-box-pack: center;}
  .goods--imgArea03{position: relative;background: #fff;width: 100%;height: 40vw; display: flex;align-items: center;justify-content: center;}
  .goods--imgArea03 > img{width: 100%;}
  .goods__count01{position: absolute;right: 0;top: 0;z-index: 3;background: #000;color: #fff;text-align: center;padding: 1.2rem 0.7rem;font-size: calc(100% + 0.7vw);}


  /* 단과강좌 할인 */
  .case05{width: 100%; display: flex;display: -webkit-flex;align-items: center;justify-content: space-between; margin-bottom: 2rem;}
  .eventArea__info--step__plus_img{width: 12%;margin: 0 auto;}
  .goods_item05{width: 42%;}
  .goods--imgArea05{position: relative;background: rgba(0, 0, 0, 0.05);width: 100%; display: flex;align-items: center;justify-content: center;}
  .goods--imgArea05 > img{width: 100%;}
  .goods--imgArea05 .goods__img02{}
  .goods__name05{text-align: center;background: #fff; display: flex;align-items: center;justify-content: center;flex-direction: column;height: 5rem;line-height:1.5rem;display: -webkit-flex;-webkit-justify-content:center;-webkit-box-pack:center;-webkit-flex-direction: column;}

  /* 수능일까지 수강기간 연장 */
  .info--extension{margin-bottom: 2rem;}

  /* 이벤트 참여하기 버튼 */
  .eventArea__join_btn__box{margin: 2rem 0;padding: 0rem 1rem;}
  .eventArea__btn{display: block; text-align: center;padding: 1.5rem 0;border-radius: 3rem;font-size: calc(100% + 0.7vw);font-weight: bold;color:#fff;}
  .eventArea__btn span {display:inline-block; font-family:serif; margin-left:1rem; font-size:calc(70% + 0.7vw);}
  .eventArea__join_btn{background: #ed585c;display: block;}
  .eventArea__done_btn{background: #99898a;cursor: default;pointer-events: none;}

  /* 이벤트 유의사항 */
  .noticeWrap {width:auto; margin: 3% 3%;}
  .noticeWrap__title {display:block; margin: 0 auto; padding:0.8rem 0 0.7rem; background: rgba(0, 0, 0, 0.1); font-size:calc(100% + 0.9vw); font-weight:normal; text-align:center; cursor:pointer;}
  .noticeWrap__title--txt {display:inline-block; position:relative; padding:0 1rem 0 0; font-weight:normal; color:#000;}
  .noticeWrap__title--txt:before {position:absolute; right:0; top:50%; z-index: 3; font-size:0.8rem; content:"▼"; transform:translateY(-50%); -moz-transform:translateY(-50%); -webkit-transform:translateY(-50%);}
  .noticeWrap.on .noticeWrap__title--txt:before {content:"▲";}
  .noticeWrap__inner {display:none; margin:0; padding:1rem; background:#fff;border: 1px solid none;}
  .noticeWrap__list {position:relative;}
  .noticeWrap__list--item {position:relative; padding:0 0 0 0.7rem; margin-bottom:0.2rem; font-size:calc(70% + 0.7vw); line-height:calc(100% + 1.2vw); color:#3f3f3f; word-break:keep-all; word-wrap:break-word;}
  .noticeWrap__list--item.im-color {font-weight: bold;color: #7723db;}
  .noticeWrap__list--item:before {position:absolute; left:0; top:0; z-index: 3; content:"-";}
  .noticeWrap__list--color-red {color:#ff586c;}
  .noticeWrap__list--link {display:inline-block; font-weight:bold; color:#5331ff !important; text-decoration: underline !important;}

  /* 이벤트 프로모션 */
  .promotion__case01{margin: 4rem 1rem 2rem;position: relative;border: 2px solid #1d4ed8;}
  .promotion__case01_flo{width: 60%; position: absolute;left: 50%;top: -4%;bottom: 97%; transform: translate(-50%, 0%);z-index: 3;}
  .promotion__case01__info{background: #fafaf9;padding: 1.5rem;}
  .promotion__case01__info > li {font-size: calc(100% + 0.1vw);text-indent: -0.7rem;padding: 0 0 0 0.7rem;margin-bottom: 0.5rem;}
  .promotion__case01__info > li:last-child{margin-bottom: 0;}
  .promotion__case01__info .case01__im_color{font-weight: bold;}

  /* */
  .tll_wrap{ padding: 2.1rem 1.4rem 0; border-bottom:1px solid #e4e4e4; background-color:#fff; }
  .tll_wrap .tll-top{ overflow:hidden; }
  .tll_wrap .tll-top > span{ float:left; color:#8d8d8d; }
  .tll_wrap .tll-top a{ float:right; }
  .tll_wrap .tll-tit{ margin-top:0.6rem; }
  .tll_wrap .tll-tit .img{ display:inline-block; width:1.2rem; height:1.2rem; margin-right:-1px; vertical-align: top; }
  .tll_wrap .tll-tit .img img{ width:100%; }
  .tll_wrap .tll-tit .lect{/* margin-left:0.6rem;*/ font-size:1.2rem; }
  .tll_wrap .tll-price{ margin-top:0.6rem; }
  .tll_wrap .tll-price li{ padding-bottom:0.2rem; font-weight:bold; color:#000; }
  .tll_wrap .tll-price li .clr1{ color: #1677cb; }
  .tll_wrap .tll-price li .clr2{ color: #f34d51; text-decoration:line-through; }
  .tll_wrap .tll-price li em{ font-style:normal;  }
  .tll_wrap .tll-price .bg1{ padding-left:1.2rem; background:url("https://img.megastudy.net/mobile/smart_new/ico_arw1.png") no-repeat 0 center; background-size:1rem;  }
  .tll_wrap .tll-btn{ overflow:hidden; }
  .tll_wrap .tll-btn .tlls1{ float:left; margin-top: 1.7rem; }
  .tll_wrap .tll-btn .tlls1 .btn_box1{ padding:0.4rem 0.2rem; letter-spacing:-1px;  }
  .tll_wrap .tll-btn .tlls1 .btn_box11{ padding:0.4rem 1.6rem 0.4rem 0.4rem; letter-spacing:-1px; }
  .tll_wrap .tll-btn .tlls2{ float:right; }
  .tll_wrap .tll-btn .tlls2 a{ width:4rem; height:4rem; background-position:1rem center;  }
  .tll_wrap .tll-mv_list{ overflow:hidden; margin-top:0.4rem; display:none;  }
  .tll_wrap .tll-mv_list li{ padding:0.4rem; background:#a1a4ac; border-bottom:1px solid #babcc2; color:#fff; font-weight:bold;  }
  .tll_wrap .tll_more{ overflow:hidden; padding: 2rem 1.1rem 0; }
  .tll_wrap .tll_more .tec_more{ float:right; display:inline-block; width:1.9rem; height:1.9rem;}
  .tll_wrap .tll_more .tec_more img{ width:100%; }

  .tll_wrap .cpop-btn{ overflow:hidden; padding:1rem 0; margin:1rem 0 0 ; text-align:right; }
  .tll_wrap .cpop-btn > div:nth-child(1){ float:left; padding-top: 0.5rem }
  .tll_wrap .cpop-btn > div:nth-child(2){ float:right; }

  .tll_wrap .cpop-btn  .clr2 i{ color:#1677cb; }
  .tll_wrap .cpop-btn  .clr1{ color: #f34d51; }
  .tll_wrap .cpop-btn  .bg1{ padding-left:1.2rem; background:url("https://img.megastudy.net/mobile/smart_new/ico_arw1.png") no-repeat 0 center; background-size:1rem; }

  .tll_wrap .cpop-btn .btn_box1{  }
  .tll_wrap .cpop-btn .cani{ margin-right:0.5rem; }
  .tll_wrap .cpop-btn .payi{ float:right; background:#1677cb; color:#fff; border-color:#1677cb; }

  /* Additional styles from the footer that are part of the template */
  .pc-more_btn {
    padding: 2rem 1rem;
    background: #f0f0f0;
    text-align: center;
  }
  .pc-more_btn .btn_box1 {
    display: inline-block;
    padding: 1rem 2rem;
    font-size: 1rem;
    font-weight: bold;
    color: #3f3f3f;
    border: 2px solid #b5b8bf;
    border-radius: 12px;
    background: -webkit-gradient(linear,left top,left bottom,from(#fff),to(#eaebef));
    background-color: #f9fafb;
    -webkit-box-shadow: 0 2px 1px rgba(0,0,0,.06), inset 0 0 3px #fff;
    box-shadow: 0 2px 1px rgba(0,0,0,.06), inset 0 0 3px #fff;
    text-decoration: none;
  }

  /* embla carousel */

  .embla {
    overflow: hidden;
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
  }
  .embla__container {
    display: flex;
    touch-action: pan-y;
  }
  .embla__slide {
    flex: 0 0 100%;
    min-width: 0;
    position: relative;
  }
  .embla__slide img {
    display: block;
    width: 100%;
    height: auto;
    max-height: 80vh;
    object-fit: contain;
  }
  .embla__dots {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.75rem;
    margin-top: 1.5rem;
    padding: 1rem 0;
  }
  .embla__dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background-color: #d1d5db;
    border: none;
    cursor: pointer;
    padding: 0;
    transition: all 0.3s ease;
  }
  .embla__dot:hover {
    background-color: #9ca3af;
    transform: scale(1.2);
  }
  .embla__dot--selected {
    background-color: #325491;
    width: 14px;
    height: 14px;
  }


  /* 1. This is your main container */
  .fabArea {
    /* These are your original styles: */
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 1000;
    
    /* --- New styles to stack the buttons --- */
    display: flex;
    flex-direction: column; /* Stacks children vertically */
    gap: 12px; /* This adds spacing BETWEEN the circles */
    
    /* HIDDEN STATE (Default) */
    opacity: 0;
    transform: translateY(20px); /* Pushed down slightly */
    pointer-events: none; /* CRITICAL: Prevents clicking while invisible */
    transition: all 0.4s ease-in-out; /* Smooth animation */
  }

  /* VISIBLE STATE (Triggered by React) */
  .fabArea.fade-in {
    opacity: 1;
    transform: translateY(0); /* Slides up to original position */
    pointer-events: auto; /* Re-enable clicking */
  }

  /* 2. This styles each individual circle button (the <a> tag) */
  .fabArea__btn {
    width: 56px;  /* Standard FAB size (width and height MUST be equal) */
    height: 56px;
    border-radius: 50%; /* This is the key to making it a circle */
    
    overflow: hidden;
    
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15); /* Nice "floating" shadow */
    
    transition: all 0.2s ease-in-out; /* Smooth hover effect */
  }

  /* 3. Adds a nice hover effect */
  .fabArea__btn:hover {
    transform: translateY(-2px); /* Lifts the button slightly */
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
  }

  /* 4. This styles the icon image INSIDE the button */
  .fabArea__btn img {
    width: 100%;  /* Adjust size as needed (e.g., ~50% of the button size) */
    height: 100%;
    object-fit: cover; /* Prevents the icon from stretching */
  }
`;

export default function AboutPhinguin() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const autoplayRef = React.useRef(null)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return

    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)

    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
    }
  }, [emblaApi, onSelect])

  // Auto-scroll functionality
  useEffect(() => {
    if (!emblaApi) return

    const startAutoplay = () => {
      autoplayRef.current = setInterval(() => {
        emblaApi.scrollNext()
      }, 3000) // 3 seconds
    }

    const stopAutoplay = () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current)
        autoplayRef.current = null
      }
    }

    // Pause on user interaction
    const onPointerDown = () => stopAutoplay()
    const onPointerUp = () => {
      // Resume after a short delay
      setTimeout(() => {
        if (!autoplayRef.current) {
          startAutoplay()
        }
      }, 3000) // Resume after 3 seconds of inactivity
    }

    startAutoplay()

    // Listen to user interactions
    emblaApi.on('pointerDown', onPointerDown)
    emblaApi.on('pointerUp', onPointerUp)

    return () => {
      stopAutoplay()
      emblaApi.off('pointerDown', onPointerDown)
      emblaApi.off('pointerUp', onPointerUp)
    }
  }, [emblaApi])

  const scrollTo = useCallback(
    (index) => {
      if (emblaApi) {
        // Pause autoplay when user clicks a dot
        if (autoplayRef.current) {
          clearInterval(autoplayRef.current)
          autoplayRef.current = null
        }
        emblaApi.scrollTo(index)
        // Resume autoplay after 3 seconds
        setTimeout(() => {
          if (!autoplayRef.current && emblaApi) {
            autoplayRef.current = setInterval(() => {
              emblaApi.scrollNext()
            }, 2000)
          }
        }, 3000)
      }
    },
    [emblaApi]
  )

  // Scroll-triggered visibility for FAB buttons
  useEffect(() => {
    const toggleVisibility = () => {
      // Show button after scrolling down 300 pixels (usually past the hero image)
      if (window.scrollY > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener("scroll", toggleVisibility)
    
    // Check initial scroll position
    toggleVisibility()

    // Clean up the event listener when component unmounts
    return () => window.removeEventListener("scroll", toggleVisibility)
  }, [])

  return (
    <>
      {/*
        The <style> tag below injects all the CSS from your original file
        into the document, making this component self-contained.
      */}
      <style>{styles}</style>

      <section>
        <div id="container">
          <div className="contents">
            <div className={`fabArea ${isVisible ? 'fade-in' : ''}`}>
              {/* Kakao Button */}
              <a 
                href="http://pf.kakao.com/_lqlBxd" 
                className="fabArea__btn" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Kakao Link"
              >
                <img src={kakaoIcon} alt="Kakao" />
              </a>

              {/* YouTube Button */}
              <a 
                href="https://www.youtube.com/@ib7776" 
                className="fabArea__btn" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="YouTube Link"
              >
                <img src={youtubeIcon} alt="YouTube" />
              </a>

              {/* Naver Blog Button */}
              <a 
                href="https://blog.naver.com/sehanibmt/224029889875" 
                className="fabArea__btn" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Naver Blog Link"
              >
                <img src={naverIcon} alt="Naver Blog" />
              </a>
            </div>
            <div className="contents_inner">
              <div className="section topBg">
                <img
                  src={promoImage}
                  alt=""
                />

                {/* <a href="#" className="m_img_top_banner">
                  <img
                    src="https://img.megastudy.net/teacher_v2/t_promotion/202412_pr/1209_math_hwj/m_img_top_banner_20241217.jpg"
                    alt=""
                  />
                </a> */}
              </div>

              {/* <div className="section cont1Bg">
                <img
                  src="https://img.megastudy.net/teacher_v2/t_promotion/202412_pr/1209_math_hwj/m_img_cont01_tit.jpg"
                  alt=""
                />
                <div className="cont01_tit_review_wrap">
                  <ul className="cont01_tit_review_box">
                    <li>
                      <p className="cont01_tit_review_txt">수능 수학의 바이블</p>
                      <p className="cont01_str_name">수강생 정*준</p>
                    </li>
                    <li>
                      <p className="cont01_tit_review_txt">수험생의 수학 교과서</p>
                      <p className="cont01_str_name">수강생 유*연</p>
                    </li>
                    <li>
                      <p className="cont01_tit_review_txt">실전 개념의 대명사</p>
                      <p className="cont01_str_name">수강생 이*준</p>
                    </li>
                  </ul>
                </div>
                <div className="cont01_tit_vod_wrap">
                  <ul className="cont01_tit_vod_box">
                    <li>
                      <a href="#">
                        <img
                          src="https://img.megastudy.net/teacher_v2/t_promotion/202412_pr/1209_math_hwj/m_img_cont01_slide01.jpg"
                          alt=""
                        />
                      </a>
                    </li>
                    <li>
                      <a href="#">
                        <img
                          src="https://img.megastudy.net/teacher_v2/t_promotion/202412_pr/1209_math_hwj/m_img_cont01_slide02.jpg"
                          alt=""
                        />
                      </a>
                    </li>
                    <li>
                      <a href="#">
                        <img
                          src="https://img.megastudy.net/teacher_v2/t_promotion/202412_pr/1209_math_hwj/m_img_cont01_slide03.jpg"
                          alt=""
                        />
                      </a>
                    </li>
                  </ul>
                </div>
              </div> */}

              {/* <div className="section cont2Bg">
                <img
                  src="https://img.megastudy.net/teacher_v2/t_promotion/202412_pr/1209_math_hwj/m_img_cont02_tit.jpg"
                  alt=""
                />
                <img
                  src="https://img.megastudy.net/teacher_v2/t_promotion/202412_pr/1209_math_hwj/m_img_cont02_vod.jpg"
                  useMap="#m_img_cont02_vod"
                  alt=""
                />
                <map name="m_img_cont02_vod">
                  <area
                    shape="rect"
                    coords="11,0,414,212"
                    href="#"
                    alt=""
                  />
                </map>
                <img
                  src="https://img.megastudy.net/teacher_v2/t_promotion/202412_pr/1209_math_hwj/m_img_cont0201.jpg"
                  alt=""
                />
              </div> */}

              {/* <div className="section cont3Bg">
                <img
                  src="https://img.megastudy.net/teacher_v2/t_promotion/202412_pr/1209_math_hwj/m_img_cont03_banner_241227.jpg"
                  alt=""
                />
                <img
                  src="https://img.megastudy.net/teacher_v2/t_promotion/202412_pr/1209_math_hwj/m_img_cont03_tit.jpg"
                  alt=""
                />
                <img
                  src="https://img.megastudy.net/teacher_v2/t_promotion/202412_pr/1209_math_hwj/m_img_cont0301.jpg"
                  alt=""
                />
              </div> */}
              {/* <div className="section cont4Bg">
                <img
                  src="https://img.megastudy.net/teacher_v2/t_promotion/202412_pr/1209_math_hwj/m_img_cont04_tit.jpg"
                  alt=""
                />
                <div className="tabWrap" id="tabWrap">

                  <img
                    src="https://img.megastudy.net/teacher_v2/t_promotion/202412_pr/1209_math_hwj/m_img_cont04_lec_txt_251021.jpg"
                    alt="실전개념, 뉴런"
                  />
                  <div className="section lec_section">
                    <div className="cont4_txt_wrap">
                      <img
                        src="https://img.megastudy.net/teacher_v2/t_promotion/202412_pr/1209_math_hwj/m_img_cont04_tab01_txt.png"
                        alt=""
                      />
                    </div>
                    <div>
                      <div className="wrap_tlecture">
                        <div className="box_set">
                          <div className="box_cont">
                            <div className="study_list">
                              <div className="tll_wrap">
                                <div className="tll_more">
                                  <span className="ic--edugroup">
                                    <span className="ico_txt t6 bold">N</span>
                                    <span className="ico_txt t1 bold">완</span>
                                  </span>
                                  <span className="tec_bxmore">
                                    <a href="#" className="tec_more">
                                      <img
                                        src="https://img.megastudy.net/mobile/smart_new/btn_ico-more.png"
                                        alt="더보기"
                                      />
                                    </a>
                                  </span>
                                </div>

                                <div className="tll-top">
                                  <span>
                                    <i className="bold">현우진</i>
                                    <span className="go123">[고3·2·N수]</span>
                                    수능(개념완성)
                                    <a href="#" className="txt--cmttotal">
                                      수강평 <span className="bold">382</span>개
                                    </a>
                                  </span>
                                </div>

                                <div className="tll-tit">
                                  <span className="lect bold ">
                                    <a href="#">
                                      2026 현우진의 뉴런 - 수학I (공통)
                                    </a>
                                  </span>
                                </div>

                                <ul className="tll-price">
                                  <li>
                                    강좌 <b className="clr1">134,000</b>원
                                  </li>
                                  <li>
                                    교재 <b className="clr1">2</b>권
                                  </li>
                                </ul>

                                <div className="tll-btn">
                                  <div className="tlls1">
                                    <div className="mo--edu__option">
                                      <a href="#" className="option__menu">
                                        OT/강의
                                        <br />
                                        맛보기
                                        <br />
                                        <span className="ic_arr"></span>
                                      </a>
                                      <a href="#" className="option__menu">
                                        교재
                                        <br />
                                        맛보기
                                        <br />
                                        <span className="ic_arr"></span>
                                      </a>
                                    </div>
                                  </div>

                                  <div className="tlls2">
                                    <a href="#" className="btn_circle1">
                                      장바구니
                                    </a>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="study_list">
                              <div className="tll_wrap">
                                <div className="tll_more">
                                  <span className="ic--edugroup">
                                    <span className="ico_txt t6 bold">N</span>
                                    <span className="ico_txt t1 bold">완</span>
                                  </span>
                                  <span className="tec_bxmore">
                                    <a href="#" className="tec_more">
                                      <img
                                        src="https://img.megastudy.net/mobile/smart_new/btn_ico-more.png"
                                        alt="더보기"
                                      />
                                    </a>
                                  </span>
                                </div>
                                <div className="tll-top">
                                  <span>
                                    <i className="bold">현우진</i>
                                    <span className="go123">[고3·2·N수]</span>
                                    수능(개념완성)
                                    <a href="#" className="txt--cmttotal">
                                      수강평 <span className="bold">371</span>개
                                    </a>
                                  </span>
                                </div>
                                <div className="tll-tit">
                                  <span className="lect bold ">
                                    <a href="#">
                                      2026 현우진의 뉴런 - 수학II (공통)
                                    </a>
                                  </span>
                                </div>
                                <ul className="tll-price">
                                  <li>
                                    강좌 <b className="clr1">148,000</b>원
                                  </li>
                                  <li>
                                    교재 <b className="clr1">2</b>권
                                  </li>
                                </ul>
                                <div className="tll-btn">
                                  <div className="tlls1">
                                    <div className="mo--edu__option">
                                      <a href="#" className="option__menu">
                                        OT/강의
                                        <br />
                                        맛보기
                                        <br />
                                        <span className="ic_arr"></span>
                                      </a>
                                      <a href="#" className="option__menu">
                                        교재
                                        <br />
                                        맛보기
                                        <br />
                                        <span className="ic_arr"></span>
                                      </a>
                                    </div>
                                  </div>
                                  <div className="tlls2">
                                    <a href="#" className="btn_circle1">
                                      장바구니
                                    </a>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="study_list">
                              <div className="tll_wrap">
                                <div className="tll_more">
                                  <span className="ic--edugroup">
                                    <span className="ico_txt t6 bold">N</span>
                                    <span className="ico_txt t1 bold">완</span>
                                  </span>
                                  <span className="tec_bxmore">
                                    <a href="#" className="tec_more">
                                      <img
                                        src="https://img.megastudy.net/mobile/smart_new/btn_ico-more.png"
                                        alt="더보기"
                                      />
                                    </a>
                                  </span>
                                </div>
                                <div className="tll-top">
                                  <span>
                                    <i className="bold">현우진</i>
                                    <span className="go123">[고3·2·N수]</span>
                                    수능(개념완성)
                                    <a href="#" className="txt--cmttotal">
                                      수강평 <span className="bold">245</span>개
                                    </a>
                                  </span>
                                </div>
                                <div className="tll-tit">
                                  <span className="lect bold ">
                                    <a href="#">
                                      2026 현우진의 뉴런 - 미적분 (선택)
                                    </a>
                                  </span>
                                </div>
                                <ul className="tll-price">
                                  <li>
                                    강좌 <b className="clr1">148,000</b>원
                                  </li>
                                  <li>
                                    교재 <b className="clr1">2</b>권
                                  </li>
                                </ul>
                                <div className="tll-btn">
                                  <div className="tlls1">
                                    <div className="mo--edu__option">
                                      <a href="#" className="option__menu">
                                        OT/강의
                                        <br />
                                        맛보기
                                        <br />
                                        <span className="ic_arr"></span>
                                      </a>
                                      <a href="#" className="option__menu">
                                        교재
                                        <br />
                                        맛보기
                                        <br />
                                        <span className="ic_arr"></span>
                                      </a>
                                    </div>
                                  </div>
                                  <div className="tlls2">
                                    <a href="#" className="btn_circle1">
                                      장바구니
                                    </a>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="info">
                    <strong className="info__title">※ 이벤트 유의사항 ※</strong>
                    <ul className="info__list">
                      <li className="info__list--item">
                        기하 과목은 2026 뉴런 강좌와 교재가 없으며, 2023 뉴런
                        강좌와 교재로 수강하시기 바랍니다.
                      </li>
                      <li className="info__list--item">
                        뉴런 본교재는 강좌 수강신청 후 구매가 가능하며, 부교재
                        시냅스는 교재만 별도 구매가 가능합니다.
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="cont401_wrap">
                  <img
                    src="https://img.megastudy.net/teacher_v2/t_promotion/202412_pr/1209_math_hwj/m_img_cont0401.jpg"
                    alt=""
                  />
                  <a
                    href="/mobile/smart/t_promotion/2024/1114_mmath_hwj/main.asp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cont04_btns cont04_btn01"
                  >
                    <img
                      src="https://img.megastudy.net/teacher_v2/t_promotion/202412_pr/1209_math_hwj/m_img_cont04_btn01.jpg"
                      alt=""
                    />
                  </a>
                </div>
              </div> */}
              <div className="section" style={{ padding: '3rem 0', paddingTop: '0', background: '#f8f8f8' }}>
                <div className="space-y-12">
                  {/* Vertical Connector before Paper 1 */}
                  <VerticalConnector dots={6} />

                  <img
                    src={promoImage2}
                    alt=""
                    style={{ marginTop: '1rem' }}
                  />

                  <div className="sub-section" style={{ padding: '0 1rem', background: '#f8f8f8' }}>
                    {/* Assessment Segmented Bars Component */}
                    <AssessmentSegmentedBars />

                    {/* Paper 1 */}
                    <PaperTopicsList
                      title="Paper 1"
                      headerColor="#325491"
                      topics={[
                        "Computer Hardware",
                        "Data Representation",
                        "Operating System",
                        "Network Architecture",
                        "Data Transmission",
                        "Databases",
                        "Machine Learning",
                      ]}
                    />

                    {/* Paper 2 */}
                    <PaperTopicsList
                      title="Paper 2"
                      headerColor="#E3AEC3"
                      topics={[
                        "Basic Programming",
                        "Data Structures",
                        "Programming Algorithms",
                        "OOP of Single Class",
                        "OOP of Multiple Classes",
                        "Abstract Data Types",
                      ]}
                    />

                  </div>

                  

                  {/* Internal Assessment */}
                  {/* <PaperTopicsList
                    title="Internal Assessment"
                    headerColor="#9A8ECB"
                    topics={[
                      "A: Problem Specification",
                      "B: Planning",
                      "C: System overview",
                      "D: Development",
                      "E: Evaluation",
                    ]}
                  /> */}
                  
                  <img
                    src={promoImage3}
                    alt=""
                    style={{ paddingTop: '3rem' }}
                  />

                  <div 
                    id="divSlideTab" 
                    className="slideTab__panel w-full mx-auto"
                  >
                    <div className="slideWrap slideWrap-book">
                      {/* 6. 여기가 Embla Carousel의 핵심입니다. */}
                      <div className="embla" ref={emblaRef}>
                        <div className="embla__container">
                          {slides.map((slide, index) => (
                            <div className="embla__slide" key={index}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              
                              {/* The Image (Zoomable) */}
                              <Zoom>
                                <img
                                  src={slide.src}
                                  alt={slide.alt}
                                  style={{ 
                                    width: '100%', 
                                    height: 'auto',
                                    cursor: 'zoom-in' // Changes mouse cursor to a magnifying glass
                                  }}
                                  loading={index === 0 ? 'eager' : 'lazy'}
                                />
                              </Zoom>
                          
                              {/* THE NEW KOREAN TEXT HINT */}
                              <p style={{ 
                                marginTop: '8px',       // Space between image and text
                                fontSize: '13px',       // Small, subtle size
                                color: '#888',          // Grey color so it's not distracting
                                display: 'flex',        // To align icon and text
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                🔍 클릭하여 확대보기
                              </p>
                          
                            </div>
                          </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Navigation Dots */}
                      <div className="embla__dots">
                        {slides.map((_, index) => (
                          <button
                            key={index}
                            className={`embla__dot ${index === selectedIndex ? 'embla__dot--selected' : ''}`}
                            type="button"
                            onClick={() => scrollTo(index)}
                            aria-label={`Go to slide ${index + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Main Promo Image */}
                    <img src={promoImage4} alt="Course Promo"/>

                    {/* The Notion Link Button */}
                    <a
                      href="https://thundering-chard-261.notion.site/2025-Winter-Sehan-IB-Computer-Science-2a278f6b808b8072b818c35eed287b3c?source=copy_link"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center', // Centers the content
                        gap: '8px', // Space between icon and text
                        padding: '10px 20px',
                        backgroundColor: '#F8F8F8', // Light grey background (or use your brand color)
                        borderRadius: '8px',
                        textDecoration: 'none',
                        color: '#333',
                        fontWeight: '600'
                      }}
                    >
                      {/* Restrict Icon Size */}
                      <img src={notionIcon} alt="Notion" style={{ width: '20px', height: '20px' }} />
                      <span>상세 커리큘럼 확인하기</span>
                    </a>
                  </div>

                  <img
                    src={reviewTitle}
                    alt=""
                  />

                  <img
                    src={boyReview3}
                    alt=""
                  />

                  <img
                    src={boyReview2}
                    alt=""
                  />

                  <img
                    src={boyReview1}
                    alt=""
                  />

                  <img
                    src={promoAboutPhinguin}
                    alt=""
                    style={{ paddingTop: '3rem' }}
                  />

                  

                  
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
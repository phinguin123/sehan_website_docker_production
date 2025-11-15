import React, { useLayoutEffect, useRef, useCallback, useState } from 'react';
import * as d3 from 'd3';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import useWindowDimensions from '../hooks/useWindowDimensions'
//import useWindowDimensions from '../../lib/hooks/useWindowDimensions';
//import Legend from './Legend';
//import media from '../../lib/styles/media';


const media = {
  mobileS: 320,
  mobileM: 380,
  mobileL: 480,
  tablet: 768,
  laptop: 1024,
  laptopM: 1200,
  laptopL: 1440,
  desktop: 1920,
}


const Canvas = styled.div`
  display: grid;
  place-items: center;
  border-radius: 15px;
  margin: 0 auto;
  padding: 0;
  background-color: #ffffff;
  h2 {
    width: 100%;
    text-align: center;
    position: relative;
    top: 1.5rem;
    font-family: hannaPro, sans-serif;
    font-size: 24px;
    color: #2a2a2a;
  }
  .x-axis {
    font-size: 12px;
    stroke-width: 0;
  }
  .y-axis {
    font-family: hannaAir, sans-serif;
    font-size: 12px;
    stroke-width: 0;
  }
`;

const Tooltip = styled.div`
  opacity: 0;
  position: relative;
  height: 2rem;
  border-radius: 5px;
  font-size: 12px;
  z-index: 200;
  font-family: hannaAir, sans-serif;
  font-weight: bold;
  line-height: 1rem;
  // padding-top: 0.5rem;
  // padding-left: 0.5rem;
  // padding-right: 1rem;
  // background-color: white;
  span {
    position: relative;
  }
`;

const ChartWrapper = styled.div`
  display: flex;
  position: relative;
  // top: -1rem;
  @media (max-width: ${media.laptop}px) {
    flex-direction: column;
  }
  .bar {
    transition: opacity 200ms;
    &:hover {
      opacity: 0.3;
    }
  }
`;

const BarChart = ({ data, title, type }) => {
  const dataLength = data && data.length;

  const laptopWidth = media.laptop;
  const { windowHeight, windowWidth } = useWindowDimensions();
  const [width, setWidth] = useState(
    windowWidth < laptopWidth ? windowWidth * 0.8 : 2000
  );
  const [height, setHeight] = useState(
    windowWidth < laptopWidth ? windowWidth * 0.6 : 1200
  );
  //console.log("width, height",width,height)
  const ref = useRef();
  const tooltipRef = useRef();

  const margin = {
    top: 20,
    right: 20,
    bottom: 10,
    left: 70,
  };

  const createBarChart = useCallback(
    (graphWidth, graphHeight) => {
      const svg = d3.select(ref.current);
      const tooltip = d3.select(tooltipRef.current);
      // const yMaxValue = 
      const yMaxValue = 7
      const yScale = d3
        .scaleLinear()
        .domain([0, yMaxValue+0.5])
        .range([graphHeight, 0]);
      //console.log("yScale:",margin.bottom,graphHeight)

      const xScale = d3
        .scaleBand()
        .range([margin.left, graphWidth])
        .domain(data.map((d) => d.title))
        .paddingOuter(0)
        .paddingInner(0.4);

      const color = d3.scaleLinear().domain([0, yMaxValue]).range([0, 1]);

      const yAxis = d3.axisLeft(yScale).ticks(7);
      svg.select('.y-axis').call(yAxis);

      const xAxis = d3
        .axisBottom(xScale)
        .ticks(dataLength)
        .tickSizeInner(0)
        .tickSizeOuter(0);
      svg.select('.x-axis').call(xAxis);
      
      const mouseover = (event, d) => {
        // if (windowWidth < laptopWidth) {
        //   return;
        // }
        console.log(graphWidth)
        tooltip
          .html(
            `<span>${d.count}점</span>`
          )
          .style('left', `${xScale(d.title) + xScale.bandwidth() - graphWidth*0.67 - ((margin.left - 10)/xScale.bandwidth())}px`)
          .style('top', `${yScale(d.count)}px`)
          .transition()
          .duration(200)
          .style('opacity', 1);
      };

      const mouseleave = () => {
        // if (windowWidth < laptopWidth) {
        //   return;
        // }
        tooltip.style('opacity', 0);
      };

      svg.select('.y-axis').call(yAxis);

      svg
        .selectAll('.bar')
        .data(data)
        .join('rect')
        .attr('class', 'bar')
        .attr('y', graphHeight)
        .attr('x', (d) => xScale(d.title))
        .attr('width', xScale.bandwidth())
        .on('mouseover', mouseover)
        .on('mouseleave', mouseleave)
        .transition()
        .duration(500)
        .attr('y', ({ count }) => yScale(count))
        .attr('height', ({ count }) => graphHeight - yScale(count))
        .attr('fill', ({ count }) => d3.interpolateYlGn(color(count)));
    },
    [data, dataLength, margin.left, margin.top, laptopWidth, windowWidth]
  );

  // resize graph based on Window size
  useLayoutEffect(() => {
    setWidth(windowWidth < laptopWidth ? windowWidth * 0.8 : 700);
    setHeight(windowWidth < laptopWidth ? windowWidth * 0.6 : 400);

    const graphWidth = width - margin.left - margin.right;
    const graphHeight = height - margin.top - margin.bottom;

    createBarChart(graphWidth, graphHeight);
  }, [
    windowHeight,
    windowWidth,
    createBarChart,
    margin.left,
    margin.right,
    margin.top,
    margin.bottom,
    dataLength,
    height, laptopWidth, width,
  ]);

  return (
    <Canvas>
      {/* <h2> {title} </h2> */}
      {/* {windowWidth >= laptopWidth ? (
        <Tooltip ref={tooltipRef} />
      ) : (
        <div style={{ height: '3rem' }} />
      )} */}
      <Tooltip ref={tooltipRef} />
      <ChartWrapper>
        <svg ref={ref} width={width} height={height}>
          <g
            className="x-axis"
            transform={`translate(0, ${height - 20})`}
          />
          <g
            className="y-axis"
            transform={`translate(${margin.left - 10}, 0)`}
          />
        </svg>
      </ChartWrapper>
    </Canvas>
  );
};

BarChart.propTypes = {
  title: PropTypes.string.isRequired,
  data: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      img: PropTypes.string.isRequired,
      shortBio: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      count: PropTypes.number.isRequired,
    })
  ).isRequired,
};

export default BarChart;
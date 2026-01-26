import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const D3BarChart = ({ data, barColor }) => {
  const chartRef = useRef(null); // Ref for the SVG element
  const containerRef = useRef(null); // Ref for the parent div
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
        // console.log("graph width height", width, height) // Log actual width/height
      }
    };
    // console.log("inside first useeffect")
    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  useEffect(() => {
    // Clear any existing elements from the SVG
    d3.select(chartRef.current).selectAll("*").remove();

    console.log("dimension", dimensions);
    console.log("data", data);
    console.log("chartref", chartRef.current);

    if (
      data.length === 0 ||
      !chartRef.current ||
      dimensions.width <= 0 ||
      dimensions.height <= 0
    )
      return;

    // console.log("Rendering D3 chart with dimensions:", dimensions.width, dimensions.height) // Confirm dimensions before rendering

    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    const svg = d3
      .select(chartRef.current)
      .attr("width", dimensions.width) // Set SVG width based on calculated dimensions
      .attr("height", dimensions.height); // Set SVG height based on calculated dimensions

    // --- NEW: Create a 'g' element to apply transformations to ---
    const chartGroup = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`); // Apply initial margin transform here

    // chartGroup.attr("filter", "url(#glass-distortion)");

    // Now, all subsequent chart elements (axes, bars, grid) should be appended to 'chartGroup'

    const x = d3.scaleBand().range([0, width]).padding(0.2);

    const y = d3.scaleLinear().range([height, 0]);

    x.domain(data.map((d) => d.date));
    y.domain([0, 7]);

    // Append X-axis to chartGroup
    chartGroup
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickSize(0))
      .selectAll(".domain")
      .attr("stroke", "none");

    chartGroup
      .selectAll(".tick text") // Select the tick labels on X-axis
      .style("font-size", "14px")
      .style("font-family", "Pretendard-Regular");

    // Append Y-axis to chartGroup
    chartGroup
      .append("g")
      .call(d3.axisLeft(y).ticks(7).tickSize(0))
      .attr("transform", `translate(-10, 0)`) // Move Y-axis labels slightly left
      .selectAll(".domain")
      .attr("stroke", "none");

    chartGroup
      .selectAll(".tick text") // Select the tick labels on Y-axis
      .style("font-size", "14px")
      .style("font-family", "Pretendard-Regular");

    // Add horizontal grid lines to chartGroup
    chartGroup
      .selectAll("line.horizontalGrid")
      .data(y.ticks(7))
      .enter()
      .append("line")
      .attr("class", "horizontalGrid")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", (d) => y(d))
      .attr("y2", (d) => y(d))
      .attr("fill", "none")
      .attr("stroke", "#e5e7eb")
      .attr("stroke-width", 1)
      .attr("shape-rendering", "crispEdges");

    // Add bars to chartGroup
    chartGroup
      .selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d.date))
      .attr("width", x.bandwidth())
      .attr("y", (d) => y(d.marks))
      .attr("height", (d) => height - y(d.marks))
      .attr("fill", barColor);

    // Add hover effect and tooltip (unchanged, as tooltips are not part of the zoom transform)
    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("background-color", "white")
      .style("border", "solid")
      .style("border-width", "1px")
      .style("border-radius", "5px")
      .style("padding", "10px")
      .style("pointer-events", "none"); // Ensure tooltip doesn't interfere with mouse events on bars

    chartGroup
      .selectAll(".bar") // Apply mouse events to bars within chartGroup
      .on("mouseover", (event, d) => {
        // console.log("on the bar")
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip
          .html(`점수: ${d.marks}`)
          .style("left", event.clientX + window.scrollX + 10 + "px")
          .style("top", event.clientY + window.scrollY - 28 + "px")
          .style("font-family", "Pretendard-Regular");
      })
      .on("mouseout", () => {
        tooltip
          .transition()
          .duration(0) // Fast hide
          .style("opacity", 0);
      });

    // --- D3 Zoom Implementation ---
    // const zoom = d3
    //   .zoom()
    //   .scaleExtent([1, 10]) // Adjust scale extent as needed
    //   .translateExtent([
    //     [0, 0],
    //     [dimensions.width, dimensions.height],
    //   ]) // Limits pan within svg bounds
    //   .extent([
    //     [0, 0],
    //     [dimensions.width, dimensions.height],
    //   ]) // For touch events
    //   .on("zoom", function (event) {
    //     // Use event object from d3-zoom v3+
    //     // Apply the transform to the 'chartGroup', not the 'svg'
    //     chartGroup.attr("transform", event.transform);
    //   });

    // // Apply the zoom behavior to the SVG element
    // svg.call(zoom);
  }, [data, dimensions, barColor]); // Re-run effect if data, dimensions, or barColor changes

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
      {/* Set SVG width/height directly based on state for better Safari compatibility */}
      <svg ref={chartRef} width="100%" height={dimensions.height}></svg>
    </div>
  );
};

export default D3BarChart;

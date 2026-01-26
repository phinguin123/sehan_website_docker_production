import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
// import "./style.css";
import { useLocation } from "react-router-dom";

export default function Pie({
  percent_value,
  fgColor,
  bgColor,
  gradientColor,
}) {
  const location = useLocation();
  const svgRef = useRef(null); // Reference to the SVG element

  const percent = useRef(percent_value);
  const oldPercent = useRef(0);
  const chartColor = useRef(fgColor);
  const w = 270,
    h = 290;
  const outerRadius = w / 2 - 10;
  const innerRadius = outerRadius - 28;
  const color = ["#ec1561", "#2a3a46", "#202b33"];

  useEffect(() => {
    const svg = d3
      .select(svgRef.current)
      .attr("width", "100%")
      .attr("height", "100%");

    svg.selectAll("*").remove();
    svg
      .attr("viewBox", `0 0 335 320`) // Using viewBox to make the SVG responsive
      .attr("preserveAspectRatio", "xMidYMid meet"); // Preserve aspect ratio
    const g = svg
      .append("g")
      .attr("transform", `translate(${w / 1.6},${h / 2})`);

    const colorTest = d3.interpolateRainbow;

    const gradientId = "circumferenceGradient" + gradientColor;
    // define gradient
    const gradient = g
      .append("defs")
      .append("linearGradient")
      .attr("id", gradientId)
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "100%");

    gradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", fgColor) // Start color (red)
      .attr("stop-opacity", 1);

    gradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", gradientColor) // End color (blue)
      .attr("stop-opacity", 1);

    const arc = d3
      .arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .startAngle(0)
      .endAngle(2 * Math.PI);

    const arcLine = d3
      .arc()
      .innerRadius(innerRadius - 1)
      .outerRadius(outerRadius + 1)
      .startAngle(0)
      .cornerRadius(20);

    // arcLine = d3.circle

    const arcDummy = d3
      .arc()
      .innerRadius((outerRadius - innerRadius) / 2 + innerRadius)
      .outerRadius((outerRadius - innerRadius) / 2 + innerRadius)
      .startAngle(0);

    // Background
    g.append("path").attr("d", arc).style("fill", bgColor);

    // Foreground arc
    const pathForeground = g
      .append("path")
      .datum({ endAngle: 0 })
      .attr("d", arcLine)
      .style("fill", "url(#" + gradientId + ")");

    function test() {
      const path = svg.select("path").remove();

      svg
        .selectAll("path")
        .data(quads(samples(path.node(), 8)))
        .enter()
        .append("path")
        .style("fill", function (d) {
          return colorTest(d.t);
        })
        .style("stroke", function (d) {
          return colorTest(d.t);
        })
        .attr("d", function (d) {
          return lineJoin(d[0], d[1], d[2], d[3], 32);
        });

      svg.selectAll("path").attr("transform", `translate(200,180)`);

      // Sample the SVG path uniformly with the specified precision.
      function samples(path, precision) {
        var n = path.getTotalLength(),
          t = [0],
          i = 0,
          dt = precision;
        while ((i += dt) < n) t.push(i);
        t.push(n);
        return t.map(function (t) {
          var p = path.getPointAtLength(t),
            a = [p.x, p.y];
          a.t = t / n;
          return a;
        });
      }

      // Compute quads of adjacent points [p0, p1, p2, p3].
      function quads(points) {
        return d3.range(points.length - 1).map(function (i) {
          var a = [points[i - 1], points[i], points[i + 1], points[i + 2]];
          a.t = (points[i].t + points[i + 1].t) / 2;
          return a;
        });
      }

      // Compute stroke outline for segment p12.
      function lineJoin(p0, p1, p2, p3, width) {
        var u12 = perp(p1, p2),
          r = width / 2,
          a = [p1[0] + u12[0] * r, p1[1] + u12[1] * r],
          b = [p2[0] + u12[0] * r, p2[1] + u12[1] * r],
          c = [p2[0] - u12[0] * r, p2[1] - u12[1] * r],
          d = [p1[0] - u12[0] * r, p1[1] - u12[1] * r];

        if (p0) {
          // clip ad and dc using average of u01 and u12
          var u01 = perp(p0, p1),
            e = [p1[0] + u01[0] + u12[0], p1[1] + u01[1] + u12[1]];
          a = lineIntersect(p1, e, a, b);
          d = lineIntersect(p1, e, d, c);
        }

        if (p3) {
          // clip ab and dc using average of u12 and u23
          var u23 = perp(p2, p3),
            e = [p2[0] + u23[0] + u12[0], p2[1] + u23[1] + u12[1]];
          b = lineIntersect(p2, e, a, b);
          c = lineIntersect(p2, e, d, c);
        }

        return "M" + a + "L" + b + " " + c + " " + d + "Z";
      }

      // Compute intersection of two infinite lines ab and cd.
      function lineIntersect(a, b, c, d) {
        var x1 = c[0],
          x3 = a[0],
          x21 = d[0] - x1,
          x43 = b[0] - x3,
          y1 = c[1],
          y3 = a[1],
          y21 = d[1] - y1,
          y43 = b[1] - y3,
          ua = (x43 * (y1 - y3) - y43 * (x1 - x3)) / (y43 * x21 - x43 * y21);
        return [x1 + ua * x21, y1 + ua * y21];
      }

      // Compute unit vector perpendicular to p01.
      function perp(p0, p1) {
        var u01x = p0[1] - p1[1],
          u01y = p1[0] - p0[0],
          u01d = Math.sqrt(u01x * u01x + u01y * u01y);
        return [u01x / u01d, u01y / u01d];
      }
    }

    // Dummy arc for circle position
    const pathDummy = g
      .append("path")
      .datum({ endAngle: 0 })
      .attr("d", arcDummy)
      .style("fill", color[0]);

    // Circle at the end of the arc
    // const endCircle = g.append('circle')
    //   .attr('r', 12)
    //   .attr('transform', `translate(0,${-outerRadius + 15})`)
    //   .style('stroke', color[0])
    //   .style('stroke-width', 8)
    //   .style('fill', color[2]);

    // Text in the middle
    const middleTextCount = g
      .append("text")
      .datum(0)
      .text((d) => `${d}%`)
      .attr("class", "middleText")
      .attr("text-anchor", "middle")
      .attr("dy", 25)
      .attr("dx", 0)
      .style("fill", "#fff")
      .style("font-size", "70px")
      .style("text-shadow","rgb(135 135 135 / 40%) 0px 2px 12px");
    // .style('stroke', 'black')
    // .style('stroke-width', '3px')
    //  .style('paint-order', 'stroke');

    // Arc animation transition
    const arcTweenOld = (transition, percent, oldValue) => {
      transition.attrTween("d", function (d) {
        const newAngle = (percent / 100) * (2 * Math.PI);
        const interpolate = d3.interpolate(d.endAngle, newAngle);

        const interpolateCount = d3.interpolate(oldValue, percent);
        // console.log("interpoalte value",interpolate(d));
        //test()
        return function (t) {
          d.endAngle = interpolate(t);
          //console.log(d.endAngle);
          const pathForegroundCircle = arcLine(d);
          //console.log("angle",d.endAngle);
          //console.log("interpoalte",Math.floor(interpolateCount(t)));
          middleTextCount
            .text(Math.floor(interpolateCount(t)))
            .style("font-size", "calc(40px + 1.5vw)")
          //const pathDummyCircle = arcDummy(d);
          //const coordinate = pathDummyCircle.split(',')[6] + ',' +pathDummyCircle.split(',')[7].split('A')[0];
          //endCircle.attr('transform', `translate(${coordinate})`);
          return pathForegroundCircle;
        };
      });
    };

    // Start the animation
    const animate = () => {
      pathForeground
        .transition()
        .duration(750)
        .ease(d3.easeCubic)
        .call(arcTweenOld, percent.current, oldPercent.current);

      //test();

      //   oldPercent.current = percent.current;
      //   percent.current = (Math.random() * 60) + 20;
      //   setPercent(newPercent);
      //   console.log("old new",oldValue,newPercent);
      //   console.log(Math.random());
      //setTimeout(animate, 3000);
    };
    //test()
    animate();
    //test()
    // Trigger initial animation
    // setTimeout(animate, 0);
    return () => {
      svg.selectAll("*").remove();
    };
  }, [percent, oldPercent]);

  return <svg ref={svgRef} />;
}
